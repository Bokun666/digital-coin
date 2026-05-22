"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/src/lib/prisma";

const SUMMARY_MAX_LENGTH = 2000;
const SHORT_TEXT_MAX_LENGTH = 1000;

const marketRegimeValues = [
  "BULL",
  "BEAR",
  "RANGE",
  "CRASH",
  "RECOVERY",
  "HIGH_VOLATILITY",
  "LOW_VOLATILITY",
  "UNKNOWN",
] as const;

type MarketRegimeValue = (typeof marketRegimeValues)[number];

function getText(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function redirectWithError(message: string): never {
  redirect(`/market-snapshots?error=${encodeURIComponent(message)}`);
}

function parseRequiredDate(value: string, fieldName: string): Date {
  if (!value) {
    throw new Error(`${fieldName}不能为空。`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName}格式不正确。`);
  }

  return date;
}

function parseOptionalDecimal(
  value: string,
  fieldName: string,
): Prisma.Decimal | null {
  if (!value) {
    return null;
  }

  try {
    const decimal = new Prisma.Decimal(value);

    if (decimal.lt(0)) {
      throw new Error(`${fieldName}必须大于等于 0。`);
    }

    return decimal;
  } catch (error) {
    if (error instanceof Error && error.message === `${fieldName}必须大于等于 0。`) {
      throw error;
    }

    throw new Error(`${fieldName}必须是合法数字。`);
  }
}

function parseMarketRegime(value: string): MarketRegimeValue {
  const regime = value || "UNKNOWN";

  if (!marketRegimeValues.includes(regime as MarketRegimeValue)) {
    throw new Error("市场环境不是合法枚举值。");
  }

  return regime as MarketRegimeValue;
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

function normalizeMarketSnapshotForm(formData: FormData) {
  const symbol = getText(formData, "symbol").toUpperCase();

  if (!symbol) {
    throw new Error("币种不能为空。");
  }

  return {
    symbol,
    snapshotTime: parseRequiredDate(getText(formData, "snapshotTime"), "快照时间"),
    marketRegime: parseMarketRegime(getText(formData, "marketRegime")),
    currentPrice: parseOptionalDecimal(getText(formData, "currentPrice"), "当前价格"),
    klineSummary: normalizeOptionalText(
      getText(formData, "klineSummary"),
      "K线摘要",
      SUMMARY_MAX_LENGTH,
    ),
    macroSummary: normalizeOptionalText(
      getText(formData, "macroSummary"),
      "宏观摘要",
      SUMMARY_MAX_LENGTH,
    ),
    contractSummary: normalizeOptionalText(
      getText(formData, "contractSummary"),
      "合约数据摘要",
      SUMMARY_MAX_LENGTH,
    ),
    onChainSummary: normalizeOptionalText(
      getText(formData, "onChainSummary"),
      "链上数据摘要",
      SUMMARY_MAX_LENGTH,
    ),
    newsSummary: normalizeOptionalText(
      getText(formData, "newsSummary"),
      "新闻摘要",
      SUMMARY_MAX_LENGTH,
    ),
    dataSources: normalizeOptionalText(
      getText(formData, "dataSources"),
      "数据来源",
      SHORT_TEXT_MAX_LENGTH,
    ),
    screenshotPath: normalizeOptionalText(
      getText(formData, "screenshotPath"),
      "截图路径",
      SHORT_TEXT_MAX_LENGTH,
    ),
    notes: normalizeOptionalText(
      getText(formData, "notes"),
      "备注",
      SHORT_TEXT_MAX_LENGTH,
    ),
  };
}

function getDatabaseErrorMessage(error: unknown): string {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    return "市场快照不存在或已被删除。";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "操作失败，请稍后重试。";
}

export async function createMarketSnapshot(formData: FormData) {
  try {
    await prisma.marketSnapshot.create({
      data: normalizeMarketSnapshotForm(formData),
    });
  } catch (error) {
    redirectWithError(getDatabaseErrorMessage(error));
  }

  revalidatePath("/market-snapshots");
  revalidatePath("/");
  redirect("/market-snapshots");
}

export async function deleteMarketSnapshot(id: string) {
  if (!id.trim()) {
    redirectWithError("缺少市场快照 ID。");
  }

  try {
    await prisma.marketSnapshot.delete({
      where: { id },
    });
  } catch (error) {
    redirectWithError(getDatabaseErrorMessage(error));
  }

  revalidatePath("/market-snapshots");
  revalidatePath("/");
  redirect("/market-snapshots");
}
