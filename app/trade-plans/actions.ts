"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/src/lib/prisma";

const OPERATION_TYPES = [
  "SPOT",
  "SPOT_GRID",
  "FUTURES",
  "FUTURES_GRID",
  "DCA",
  "STABLE_EARN",
  "OTHER",
] as const;

const TRADE_DIRECTIONS = ["BUY", "SELL", "LONG", "SHORT", "NONE"] as const;
const MARGIN_MODES = ["NONE", "ISOLATED", "CROSS"] as const;
const EMOTION_STATES = [
  "CALM",
  "ANXIOUS",
  "FOMO",
  "REVENGE",
  "IMPULSIVE",
  "FEAR",
  "GREED",
  "UNKNOWN",
] as const;

type OperationType = (typeof OPERATION_TYPES)[number];
type TradeDirection = (typeof TRADE_DIRECTIONS)[number];
type MarginMode = (typeof MARGIN_MODES)[number];
type EmotionState = (typeof EMOTION_STATES)[number];

function getText(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getCheckbox(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

function isOperationType(value: string): value is OperationType {
  return (OPERATION_TYPES as readonly string[]).includes(value);
}

function isTradeDirection(value: string): value is TradeDirection {
  return (TRADE_DIRECTIONS as readonly string[]).includes(value);
}

function isMarginMode(value: string): value is MarginMode {
  return (MARGIN_MODES as readonly string[]).includes(value);
}

function isEmotionState(value: string): value is EmotionState {
  return (EMOTION_STATES as readonly string[]).includes(value);
}

function parseRequiredDecimal(
  value: string,
  fieldName: string,
): Prisma.Decimal {
  if (!value) {
    throw new Error(`${fieldName} 不能为空。`);
  }

  return parseDecimal(value, fieldName);
}

function parseOptionalDecimal(
  value: string,
  fieldName: string,
): Prisma.Decimal | null {
  if (!value) {
    return null;
  }

  return parseDecimal(value, fieldName);
}

function parseDecimal(value: string, fieldName: string): Prisma.Decimal {
  try {
    return new Prisma.Decimal(value);
  } catch {
    throw new Error(`${fieldName} 必须是合法数字。`);
  }
}

function assertGreaterThanZero(value: Prisma.Decimal, fieldName: string) {
  if (value.lte(0)) {
    throw new Error(`${fieldName} 必须大于 0。`);
  }
}

function assertGreaterThanOrEqualOne(value: Prisma.Decimal, fieldName: string) {
  if (value.lt(1)) {
    throw new Error(`${fieldName} 必须大于等于 1。`);
  }
}

function redirectWithError(message: string): never {
  redirect(`/trade-plans?error=${encodeURIComponent(message)}`);
}

function normalizeTradePlanForm(formData: FormData) {
  const coinSymbol = getText(formData, "coinSymbol").toUpperCase();
  const operationType = getText(formData, "operationType");
  const direction = getText(formData, "direction");
  const marginModeInput = getText(formData, "marginMode");
  const emotionStateInput = getText(formData, "emotionState") || "CALM";
  const reason = getText(formData, "reason");
  const hasStopLoss = getCheckbox(formData, "hasStopLoss");

  if (!coinSymbol) {
    throw new Error("coinSymbol 不能为空。");
  }

  if (!reason) {
    throw new Error("reason 不能为空。");
  }

  if (!isOperationType(operationType)) {
    throw new Error("operationType 不是合法枚举值。");
  }

  if (!isTradeDirection(direction)) {
    throw new Error("direction 不是合法枚举值。");
  }

  if (!isMarginMode(marginModeInput)) {
    throw new Error("marginMode 不是合法枚举值。");
  }

  if (!isEmotionState(emotionStateInput)) {
    throw new Error("emotionState 不是合法枚举值。");
  }

  const plannedAmount = parseRequiredDecimal(
    getText(formData, "plannedAmount"),
    "计划投入金额",
  );
  const totalCapital = parseRequiredDecimal(
    getText(formData, "totalCapital"),
    "当前总资金",
  );
  const entryPrice = parseRequiredDecimal(
    getText(formData, "entryPrice"),
    "计划入场价",
  );
  const currentPrice = parseOptionalDecimal(
    getText(formData, "currentPrice"),
    "当前价格",
  );
  const stopLossPrice = parseOptionalDecimal(
    getText(formData, "stopLossPrice"),
    "止损价",
  );
  const takeProfitPrice = parseOptionalDecimal(
    getText(formData, "takeProfitPrice"),
    "止盈价",
  );
  const maxAcceptableLoss = parseOptionalDecimal(
    getText(formData, "maxAcceptableLoss"),
    "最大可接受亏损",
  );
  const leverage = parseOptionalDecimal(getText(formData, "leverage"), "杠杆倍数")
    ?? new Prisma.Decimal(1);

  assertGreaterThanZero(plannedAmount, "计划投入金额");
  assertGreaterThanZero(totalCapital, "当前总资金");
  assertGreaterThanZero(entryPrice, "计划入场价");
  assertGreaterThanOrEqualOne(leverage, "杠杆倍数");

  if (hasStopLoss) {
    if (!stopLossPrice) {
      throw new Error("勾选设置止损时，止损价必须填写。");
    }

    assertGreaterThanZero(stopLossPrice, "止损价");
  }

  const isFutures =
    operationType === "FUTURES" || operationType === "FUTURES_GRID";
  const marginMode = isFutures ? marginModeInput : "NONE";

  if (isFutures) {
    if (direction !== "LONG" && direction !== "SHORT") {
      throw new Error("期货计划的方向必须是 LONG 或 SHORT。");
    }

    if (marginMode === "NONE") {
      throw new Error("期货计划的保证金模式不能是 NONE。");
    }
  }

  return {
    coinSymbol,
    operationType,
    direction,
    plannedAmount,
    totalCapital,
    currentPrice,
    entryPrice,
    stopLossPrice: hasStopLoss ? stopLossPrice : null,
    takeProfitPrice,
    leverage,
    marginMode,
    reason,
    maxAcceptableLoss,
    hasMacroEvent: getCheckbox(formData, "hasMacroEvent"),
    isChasingPrice: getCheckbox(formData, "isChasingPrice"),
    hasStopLoss,
    emotionState: emotionStateInput,
    status: "DRAFT" as const,
  };
}

function getDatabaseErrorMessage(error: unknown): string {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  ) {
    return "删除交易计划失败：存在关联数据或外键约束，请先处理关联记录。";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "操作失败，请稍后重试。";
}

export async function createTradePlan(formData: FormData) {
  try {
    const data = normalizeTradePlanForm(formData);

    await prisma.tradePlan.create({ data });
  } catch (error) {
    redirectWithError(getDatabaseErrorMessage(error));
  }

  revalidatePath("/trade-plans");
  redirect("/trade-plans");
}

export async function deleteTradePlan(id: string) {
  if (!id.trim()) {
    redirectWithError("缺少交易计划 ID。");
  }

  try {
    await prisma.tradePlan.delete({
      where: { id },
    });
  } catch (error) {
    redirectWithError(getDatabaseErrorMessage(error));
  }

  revalidatePath("/trade-plans");
  redirect("/trade-plans");
}
