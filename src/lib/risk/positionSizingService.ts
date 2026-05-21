import { Prisma } from "@prisma/client";

// 为避免 JS number 精度问题，金额、价格、比例、杠杆不接受 number，
// 前端统一以 string 传入；服务内部统一转换为 Prisma.Decimal。
export type DecimalInput = Prisma.Decimal | string;

export type OperationType =
  | "SPOT"
  | "SPOT_GRID"
  | "FUTURES"
  | "FUTURES_GRID"
  | "DCA"
  | "STABLE_EARN"
  | "OTHER";

export type TradeDirection = "BUY" | "SELL" | "LONG" | "SHORT" | "NONE";

export type MarginMode = "NONE" | "ISOLATED" | "CROSS";

export interface PositionSizingInput {
  totalCapital: DecimalInput;
  plannedAmount: DecimalInput;
  leverage?: DecimalInput | null;
  entryPrice: DecimalInput;
  stopLossPrice?: DecimalInput | null;
  takeProfitPrice?: DecimalInput | null;
  hasStopLoss?: boolean;
  direction: TradeDirection;
  operationType?: OperationType;
}

export interface PriceValidationInput {
  direction: TradeDirection;
  entryPrice: DecimalInput;
  stopLossPrice?: DecimalInput | null;
  takeProfitPrice?: DecimalInput | null;
  hasStopLoss?: boolean;
}

export interface PriceValidationResult {
  hasValidStopLoss: boolean;
  errors: string[];
}

export interface PositionSizingResult {
  isValid: boolean;
  errors: string[];
  positionValue: Prisma.Decimal | null;
  lossAmountAtStop: Prisma.Decimal | null;
  profitAmountAtTakeProfit: Prisma.Decimal | null;
  riskRewardRatio: Prisma.Decimal | null;
  lossPercentOfTotalCapital: Prisma.Decimal | null;
  suggestion: string;
}

const ZERO = new Prisma.Decimal(0);
const ONE = new Prisma.Decimal(1);
const TWO = new Prisma.Decimal(2);
const HUNDRED = new Prisma.Decimal(100);

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

function isFuturesOperation(operationType?: OperationType): boolean {
  return operationType === "FUTURES" || operationType === "FUTURES_GRID";
}

export function validateTradePrices(
  input: PriceValidationInput,
): PriceValidationResult {
  const errors: string[] = [];
  const entryPrice = toDecimal(input.entryPrice);
  const stopLossPrice = toOptionalDecimal(input.stopLossPrice);
  const takeProfitPrice = toOptionalDecimal(input.takeProfitPrice);

  if (entryPrice.lte(ZERO)) {
    errors.push("入场价必须大于 0。");
  }

  if (input.hasStopLoss === false) {
    errors.push("hasStopLoss=false，视为没有设置有效止损。");
  }

  if (input.hasStopLoss !== false && stopLossPrice === null) {
    errors.push("未提供有效止损价，无法计算真实最大亏损。");
  }

  if (stopLossPrice !== null && stopLossPrice.lte(ZERO)) {
    errors.push("止损价必须大于 0。");
  }

  if (takeProfitPrice !== null && takeProfitPrice.lte(ZERO)) {
    errors.push("止盈价必须大于 0。");
  }

  if (stopLossPrice !== null && entryPrice.gt(ZERO)) {
    if (
      (input.direction === "LONG" || input.direction === "BUY") &&
      stopLossPrice.gte(entryPrice)
    ) {
      errors.push("LONG / BUY 的止损价应低于入场价。");
    }

    if (input.direction === "SHORT" && stopLossPrice.lte(entryPrice)) {
      errors.push("SHORT 的止损价应高于入场价。");
    }
  }

  if (takeProfitPrice !== null && entryPrice.gt(ZERO)) {
    if (
      (input.direction === "LONG" || input.direction === "BUY") &&
      takeProfitPrice.lte(entryPrice)
    ) {
      errors.push("LONG / BUY 的止盈价应高于入场价。");
    }

    if (input.direction === "SHORT" && takeProfitPrice.gte(entryPrice)) {
      errors.push("SHORT 的止盈价应低于入场价。");
    }
  }

  if (input.direction === "NONE") {
    errors.push("交易方向为 NONE，无法进行仓位计算。");
  }

  const hasBlockingValidationError = errors.some(
    (error) =>
      error.includes("入场价") ||
      error.includes("交易方向") ||
      error.includes("止损"),
  );

  const hasValidStopLoss =
    input.hasStopLoss !== false &&
    entryPrice.gt(ZERO) &&
    stopLossPrice !== null &&
    stopLossPrice.gt(ZERO) &&
    !hasBlockingValidationError;

  return {
    hasValidStopLoss,
    errors,
  };
}

export function calculatePositionSizing(
  input: PositionSizingInput,
): PositionSizingResult {
  const totalCapital = toDecimal(input.totalCapital);
  const plannedAmount = toDecimal(input.plannedAmount);
  const leverage = toOptionalDecimal(input.leverage) ?? ONE;
  const entryPrice = toDecimal(input.entryPrice);
  const stopLossPrice = toOptionalDecimal(input.stopLossPrice);
  const takeProfitPrice = toOptionalDecimal(input.takeProfitPrice);
  const errors: string[] = [];

  if (input.direction === "SELL" && !isFuturesOperation(input.operationType)) {
    return {
      isValid: false,
      errors: ["SELL 第一版按普通卖出记录处理，不参与合约仓位计算。"],
      positionValue: null,
      lossAmountAtStop: null,
      profitAmountAtTakeProfit: null,
      riskRewardRatio: null,
      lossPercentOfTotalCapital: null,
      suggestion: "普通卖出请记录到 TradeRecord；如需做空，请使用 SHORT。",
    };
  }

  if (totalCapital.lte(ZERO)) {
    errors.push("总资金必须大于 0。");
  }

  if (plannedAmount.lte(ZERO)) {
    errors.push("投入金额必须大于 0。");
  }

  if (leverage.lte(ZERO)) {
    errors.push("杠杆倍数必须大于 0。");
  }

  if (!isFuturesOperation(input.operationType) && !leverage.eq(ONE)) {
    errors.push("非合约操作不允许使用杠杆；现货、定投、稳定币理财应使用 leverage=1。");
  }

  if (
    !isFuturesOperation(input.operationType) &&
    (input.direction === "LONG" || input.direction === "SHORT")
  ) {
    errors.push("非合约操作应使用 BUY 或 SELL；LONG / SHORT 仅用于合约。");
  }

  if (
    isFuturesOperation(input.operationType) &&
    input.direction !== "LONG" &&
    input.direction !== "SHORT"
  ) {
    errors.push("合约仓位计算需要使用 LONG 或 SHORT 方向。");
  }

  const priceValidation = validateTradePrices({
    direction: input.direction,
    entryPrice,
    stopLossPrice,
    takeProfitPrice,
    hasStopLoss: input.hasStopLoss,
  });

  errors.push(...priceValidation.errors);

  const canCalculatePositionValue = plannedAmount.gt(ZERO) && leverage.gt(ZERO);
  const positionValue = canCalculatePositionValue
    ? plannedAmount.mul(leverage)
    : null;

  const canCalculateLoss =
    positionValue !== null &&
    entryPrice.gt(ZERO) &&
    stopLossPrice !== null &&
    priceValidation.hasValidStopLoss;

  const lossAmountAtStop = canCalculateLoss
    ? entryPrice.minus(stopLossPrice).abs().div(entryPrice).mul(positionValue)
    : null;

  const canCalculateProfit =
    positionValue !== null &&
    entryPrice.gt(ZERO) &&
    takeProfitPrice !== null &&
    !errors.some((error) => error.includes("止盈"));

  const profitAmountAtTakeProfit = canCalculateProfit
    ? takeProfitPrice.minus(entryPrice).abs().div(entryPrice).mul(positionValue)
    : null;

  const riskRewardRatio =
    lossAmountAtStop !== null &&
    !lossAmountAtStop.isZero() &&
    profitAmountAtTakeProfit !== null
      ? profitAmountAtTakeProfit.div(lossAmountAtStop)
      : null;

  const lossPercentOfTotalCapital =
    lossAmountAtStop !== null && totalCapital.gt(ZERO)
      ? lossAmountAtStop.div(totalCapital).mul(HUNDRED)
      : null;

  const suggestion = buildPositionSuggestion({
    errors,
    lossPercentOfTotalCapital,
    riskRewardRatio,
    hasTakeProfitPrice: takeProfitPrice !== null,
  });

  return {
    isValid: errors.length === 0,
    errors,
    positionValue,
    lossAmountAtStop,
    profitAmountAtTakeProfit,
    riskRewardRatio,
    lossPercentOfTotalCapital,
    suggestion,
  };
}

function buildPositionSuggestion(input: {
  errors: string[];
  lossPercentOfTotalCapital: Prisma.Decimal | null;
  riskRewardRatio: Prisma.Decimal | null;
  hasTakeProfitPrice: boolean;
}): string {
  if (input.errors.length > 0) {
    return `无法完成有效仓位计算：${input.errors.join(" ")}`;
  }

  const suggestions: string[] = [];

  if (input.lossPercentOfTotalCapital === null) {
    suggestions.push("无法计算真实止损亏损占总资金比例。");
  } else if (input.lossPercentOfTotalCapital.gt(TWO)) {
    suggestions.push("止损亏损超过总资金 2%，建议降低投入金额或杠杆。");
  } else {
    suggestions.push("止损亏损占总资金比例在 2% 以内。");
  }

  if (!input.hasTakeProfitPrice) {
    suggestions.push("未填写止盈价，无法计算预期盈利。");
  }

  if (input.riskRewardRatio === null) {
    suggestions.push("无法计算有效盈亏比。");
  } else if (input.riskRewardRatio.lt(ONE)) {
    suggestions.push("盈亏比小于 1，收益风险比偏低。");
  } else if (input.riskRewardRatio.lt(TWO)) {
    suggestions.push("盈亏比介于 1 到 2，建议谨慎控制仓位。");
  } else {
    suggestions.push("盈亏比不低于 2，但仍需结合风险检查和用户手动确认。");
  }

  return suggestions.join(" ");
}
