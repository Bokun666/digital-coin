import { Prisma } from "@prisma/client";

import {
  calculatePositionSizing,
  type DecimalInput,
  type MarginMode,
  type OperationType,
  type PositionSizingResult,
  type TradeDirection,
  validateTradePrices,
} from "./positionSizingService";

export type EmotionState =
  | "CALM"
  | "ANXIOUS"
  | "FOMO"
  | "REVENGE"
  | "IMPULSIVE"
  | "FEAR"
  | "GREED"
  | "UNKNOWN";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";

export interface RiskCheckTradePlan {
  operationType: OperationType;
  direction: TradeDirection;
  plannedAmount: DecimalInput;
  totalCapital: DecimalInput;
  entryPrice: DecimalInput;
  stopLossPrice?: DecimalInput | null;
  takeProfitPrice?: DecimalInput | null;
  leverage?: DecimalInput | null;
  marginMode: MarginMode;
  hasStopLoss: boolean;
  hasMacroEvent: boolean;
  isChasingPrice: boolean;
  emotionState: EmotionState;
}

export interface RiskCheckOptions {
  // positionSizing 必须由当前 tradePlan 参数计算得到，不能传入其他交易计划的结果，
  // 否则风险评分会失真。
  positionSizing?: PositionSizingResult;
}

export interface RiskCheckResult {
  score: number;
  level: RiskLevel;
  reasons: string[];
  suggestion: string;
  shouldContinue: boolean;
  positionSizing: PositionSizingResult;
}

const ZERO = new Prisma.Decimal(0);
const ONE = new Prisma.Decimal(1);
const TWO = new Prisma.Decimal(2);

// 调用 service 前必须完成表单校验，禁止传入空字符串或非法数字。
// 后续页面层应使用 Zod 校验 Decimal 字段。
function toDecimal(value: DecimalInput): Prisma.Decimal {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
}

function toOptionalDecimal(value?: DecimalInput | null): Prisma.Decimal | null {
  if (value === null || value === undefined) {
    return null;
  }

  return toDecimal(value);
}

function isFuturesOperation(operationType: OperationType): boolean {
  return operationType === "FUTURES" || operationType === "FUTURES_GRID";
}

function toRiskLevel(score: number): RiskLevel {
  if (score <= 30) {
    return "LOW";
  }

  if (score <= 60) {
    return "MEDIUM";
  }

  if (score <= 80) {
    return "HIGH";
  }

  return "EXTREME";
}

export function calculateRiskCheck(
  tradePlan: RiskCheckTradePlan,
  options: RiskCheckOptions = {},
): RiskCheckResult {
  const reasons: string[] = [];
  const suggestionParts: string[] = [];
  let score = 0;

  const leverage = toOptionalDecimal(tradePlan.leverage) ?? ONE;
  const totalCapital = toDecimal(tradePlan.totalCapital);
  const entryPrice = toDecimal(tradePlan.entryPrice);
  const stopLossPrice = toOptionalDecimal(tradePlan.stopLossPrice);
  const takeProfitPrice = toOptionalDecimal(tradePlan.takeProfitPrice);
  const isFutures = isFuturesOperation(tradePlan.operationType);

  const priceValidation = validateTradePrices({
    direction: tradePlan.direction,
    entryPrice,
    stopLossPrice,
    takeProfitPrice,
    hasStopLoss: tradePlan.hasStopLoss,
  });

  if (!priceValidation.hasValidStopLoss) {
    score += 25;
    reasons.push("没有有效止损。");
    reasons.push(...priceValidation.errors);
    suggestionParts.push("请先补充有效止损价，再考虑是否执行计划。");
  }

  if (isFutures && leverage.gt(new Prisma.Decimal(3))) {
    score += 20;
    reasons.push("合约交易杠杆大于 3 倍。");
    suggestionParts.push("建议降低杠杆，第一阶段优先低杠杆训练。");
  }

  if (isFutures && tradePlan.marginMode === "CROSS") {
    score += 25;
    reasons.push("合约交易使用全仓保证金。");
    suggestionParts.push("合约交易优先使用逐仓，避免全仓风险扩散。");
  }

  if (isFutures && tradePlan.marginMode === "NONE") {
    score += 10;
    reasons.push("合约交易需要显式记录保证金模式。");
    suggestionParts.push("合约或合约网格计划必须确认 leverage 和 marginMode。");
  }

  if (!isFutures && !leverage.eq(ONE)) {
    score += 10;
    reasons.push("非合约操作不允许使用杠杆。");
    suggestionParts.push("现货、定投、稳定币理财应使用 leverage=1，marginMode=NONE。");
  }

  if (
    !isFutures &&
    (tradePlan.direction === "LONG" || tradePlan.direction === "SHORT")
  ) {
    reasons.push("非合约交易方向应使用 BUY 或 SELL，LONG / SHORT 仅用于合约或合约网格。");
    suggestionParts.push("请将非合约计划方向改为 BUY 或 SELL。");
  }

  if (["FOMO", "REVENGE", "IMPULSIVE"].includes(tradePlan.emotionState)) {
    score += 25;
    reasons.push(`当前情绪状态为 ${tradePlan.emotionState}。`);
    suggestionParts.push("建议暂停操作，等情绪恢复冷静后再重新评估。");
  }

  if (tradePlan.emotionState === "GREED") {
    score += 15;
    reasons.push("当前情绪状态为 GREED。");
    suggestionParts.push("贪婪状态下容易扩大仓位，建议先降低仓位或暂停操作。");
  }

  if (tradePlan.hasMacroEvent) {
    score += 15;
    reasons.push("临近或存在重大宏观事件。");
    suggestionParts.push("重大宏观事件前不建议重仓。");
  }

  if (tradePlan.isChasingPrice) {
    score += 15;
    reasons.push("计划存在追涨行为。");
    suggestionParts.push("追涨时应降低仓位，并重新确认入场理由是否仍成立。");
  }

  const positionSizing =
    options.positionSizing ??
    calculatePositionSizing({
      totalCapital: tradePlan.totalCapital,
      plannedAmount: tradePlan.plannedAmount,
      leverage,
      entryPrice,
      stopLossPrice,
      takeProfitPrice,
      hasStopLoss: tradePlan.hasStopLoss,
      direction: tradePlan.direction,
      operationType: tradePlan.operationType,
    });

  if (!positionSizing.isValid) {
    reasons.push(...positionSizing.errors);
    suggestionParts.push("请先修正交易计划，再重新进行风险检查和仓位计算。");
  }

  if (priceValidation.hasValidStopLoss) {
    if (
      positionSizing.lossPercentOfTotalCapital !== null &&
      positionSizing.lossPercentOfTotalCapital.gt(TWO)
    ) {
      score += 20;
      reasons.push("按止损价计算，真实止损亏损超过总资金 2%。");
      suggestionParts.push("建议降低投入金额、降低杠杆或重新设置止损。");
    }

    if (positionSizing.lossPercentOfTotalCapital === null) {
      reasons.push("无法根据当前计划计算真实止损亏损占比。");
      suggestionParts.push("请检查总资金、入场价、止损价和方向是否完整有效。");
    }
  } else {
    reasons.push("没有有效止损价，无法知道这笔交易的真实最大亏损。");
    suggestionParts.push("不知道最大亏损的计划不建议执行。");
  }

  if (totalCapital.lte(ZERO)) {
    reasons.push("总资金必须大于 0，否则无法进行有效风险评估。");
  }

  const hasInvalidPlan = !positionSizing.isValid || totalCapital.lte(ZERO);

  if (hasInvalidPlan) {
    score = Math.max(score, 61);
  }

  score = Math.min(score, 100);

  const level = toRiskLevel(score);
  const uniqueReasons = uniqueStrings(reasons);
  const uniqueSuggestionParts = uniqueStrings(suggestionParts);

  if (uniqueReasons.length === 0) {
    uniqueReasons.push("未触发第一版主要风险项。");
  }

  const suggestion = buildRiskSuggestion(level, uniqueSuggestionParts);
  const shouldContinue =
    level !== "EXTREME" && totalCapital.gt(ZERO) && positionSizing.isValid;

  return {
    score,
    level,
    reasons: uniqueReasons,
    suggestion,
    shouldContinue,
    positionSizing,
  };
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildRiskSuggestion(
  level: RiskLevel,
  suggestionParts: string[],
): string {
  const baseSuggestion =
    level === "EXTREME"
      ? "不建议操作。该计划可能存在过度杠杆、无止损、追涨或情绪化交易问题。"
      : level === "HIGH"
        ? "高风险计划，建议先降低仓位或修改计划后重新检查。"
        : level === "MEDIUM"
          ? "中风险计划，可以继续评估，但建议谨慎控制仓位。"
          : "低风险不代表无风险，仍需用户手动确认后再执行。";

  if (suggestionParts.length === 0) {
    return baseSuggestion;
  }

  return `${baseSuggestion} ${suggestionParts.join(" ")}`;
}
