"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/src/lib/prisma";

const TEXT_MAX_LENGTH = 2000;

const marketBiasValues = [
  "BULLISH",
  "BEARISH",
  "NEUTRAL",
  "RANGE",
  "VOLATILE",
  "UNKNOWN",
] as const;

const strategyTypeValues = [
  "DCA",
  "SPOT_GRID",
  "FUTURES_GRID",
  "FUTURES_TRAIN",
  "ALTCOIN",
  "MINING_COIN",
  "STABLE_EARN",
  "OTHER",
] as const;

type MarketBiasValue = (typeof marketBiasValues)[number];
type StrategyTypeValue = (typeof strategyTypeValues)[number];

function getText(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function redirectWithError(message: string): never {
  redirect(`/user-conclusions?error=${encodeURIComponent(message)}`);
}

function parseMarketBias(value: string): MarketBiasValue {
  const bias = value || "UNKNOWN";

  if (!marketBiasValues.includes(bias as MarketBiasValue)) {
    throw new Error("用户方向判断不是合法枚举值。");
  }

  return bias as MarketBiasValue;
}

function parseStrategyType(value: string): StrategyTypeValue {
  const strategyType = value || "OTHER";

  if (!strategyTypeValues.includes(strategyType as StrategyTypeValue)) {
    throw new Error("计划策略不是合法枚举值。");
  }

  return strategyType as StrategyTypeValue;
}

function parseConfidence(value: string): number {
  if (!value) {
    throw new Error("用户置信度不能为空。");
  }

  const confidence = Number(value);

  if (!Number.isInteger(confidence)) {
    throw new Error("用户置信度必须是整数。");
  }

  if (confidence < 0 || confidence > 100) {
    throw new Error("用户置信度必须在 0 到 100 之间。");
  }

  return confidence;
}

function normalizeRequiredText(
  value: string,
  fieldName: string,
  maxLength: number,
): string {
  if (!value) {
    throw new Error(`${fieldName}不能为空。`);
  }

  if (value.length > maxLength) {
    throw new Error(`${fieldName}不能超过 ${maxLength} 字。`);
  }

  return value;
}

function normalizeOptionalText(
  value: string,
  fieldName: string,
  maxLength: number,
): string | null {
  if (value.length > maxLength) {
    throw new Error(`${fieldName}不能超过 ${maxLength} 字。`);
  }

  return value || null;
}

async function normalizeUserConclusionForm(formData: FormData) {
  const symbol = getText(formData, "symbol").toUpperCase();
  const marketSnapshotId = getText(formData, "marketSnapshotId");

  if (!symbol) {
    throw new Error("币种不能为空。");
  }

  if (marketSnapshotId) {
    const marketSnapshot = await prisma.marketSnapshot.findUnique({
      where: { id: marketSnapshotId },
    });

    if (!marketSnapshot) {
      throw new Error("关联的市场快照不存在或已被删除。");
    }
  }

  return {
    symbol,
    marketSnapshotId: marketSnapshotId || null,
    userBias: parseMarketBias(getText(formData, "userBias")),
    userConfidence: parseConfidence(getText(formData, "userConfidence")),
    userReason: normalizeRequiredText(
      getText(formData, "userReason"),
      "用户判断理由",
      TEXT_MAX_LENGTH,
    ),
    intendedStrategy: parseStrategyType(getText(formData, "intendedStrategy")),
    plannedParameters: normalizeOptionalText(
      getText(formData, "plannedParameters"),
      "用户计划参数",
      TEXT_MAX_LENGTH,
    ),
  };
}

function getDatabaseErrorMessage(error: unknown): string {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    return "用户判断不存在或已被删除。";
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  ) {
    return "关联的市场快照不存在或已被删除。";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "操作失败，请稍后重试。";
}

export async function createUserConclusion(formData: FormData) {
  try {
    await prisma.userConclusion.create({
      data: await normalizeUserConclusionForm(formData),
    });
  } catch (error) {
    redirectWithError(getDatabaseErrorMessage(error));
  }

  revalidatePath("/user-conclusions");
  revalidatePath("/");
  redirect("/user-conclusions");
}

export async function deleteUserConclusion(id: string) {
  if (!id.trim()) {
    redirectWithError("缺少用户判断 ID。");
  }

  try {
    await prisma.userConclusion.delete({
      where: { id },
    });
  } catch (error) {
    redirectWithError(getDatabaseErrorMessage(error));
  }

  revalidatePath("/user-conclusions");
  revalidatePath("/");
  redirect("/user-conclusions");
}
