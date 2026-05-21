"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/src/lib/prisma";

const COIN_CATEGORIES = [
  "MAINSTREAM",
  "ALTCOIN",
  "MEME",
  "MINING",
  "AI",
  "RWA",
  "DEPIN",
  "STABLECOIN",
  "OTHER",
] as const;

const WATCH_STATUSES = [
  "WATCHING",
  "INTERESTED",
  "HOLDING",
  "ABANDONED",
] as const;

type CoinCategory = (typeof COIN_CATEGORIES)[number];
type WatchStatus = (typeof WATCH_STATUSES)[number];

function getText(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function isCoinCategory(value: string): value is CoinCategory {
  return (COIN_CATEGORIES as readonly string[]).includes(value);
}

function isWatchStatus(value: string): value is WatchStatus {
  return (WATCH_STATUSES as readonly string[]).includes(value);
}

function parseOptionalDecimal(
  value: string,
  fieldName: string,
): Prisma.Decimal | null {
  if (!value) {
    return null;
  }

  try {
    return new Prisma.Decimal(value);
  } catch {
    throw new Error(`${fieldName} 必须是合法数字。`);
  }
}

function redirectWithError(message: string): never {
  redirect(`/watchlist?error=${encodeURIComponent(message)}`);
}

function normalizeWatchCoinForm(formData: FormData) {
  const symbol = getText(formData, "symbol").toUpperCase();
  const name = getText(formData, "name");
  const category = getText(formData, "category");
  const status = getText(formData, "status");
  const watchReason = getText(formData, "watchReason");
  const riskTags = getText(formData, "riskTags");
  const notes = getText(formData, "notes");
  const supportPrice = parseOptionalDecimal(
    getText(formData, "supportPrice"),
    "支撑价",
  );
  const resistancePrice = parseOptionalDecimal(
    getText(formData, "resistancePrice"),
    "压力价",
  );

  if (!symbol) {
    throw new Error("symbol 不能为空。");
  }

  if (!name) {
    throw new Error("name 不能为空。");
  }

  if (!isCoinCategory(category)) {
    throw new Error("category 不是合法枚举值。");
  }

  if (!isWatchStatus(status)) {
    throw new Error("status 不是合法枚举值。");
  }

  return {
    symbol,
    name,
    category,
    status,
    watchReason,
    riskTags: riskTags || null,
    notes: notes || null,
    supportPrice,
    resistancePrice,
  };
}

function getDatabaseErrorMessage(error: unknown): string {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "自选币 symbol 已存在，请不要重复添加。";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "操作失败，请稍后重试。";
}

export async function createWatchCoin(formData: FormData) {
  try {
    const data = normalizeWatchCoinForm(formData);

    await prisma.watchCoin.create({ data });
  } catch (error) {
    redirectWithError(getDatabaseErrorMessage(error));
  }

  revalidatePath("/watchlist");
  redirect("/watchlist");
}

export async function updateWatchCoin(id: string, formData: FormData) {
  if (!id.trim()) {
    redirectWithError("缺少自选币 ID。");
  }

  try {
    const data = normalizeWatchCoinForm(formData);

    await prisma.watchCoin.update({
      where: { id },
      data,
    });
  } catch (error) {
    redirectWithError(getDatabaseErrorMessage(error));
  }

  revalidatePath("/watchlist");
  redirect("/watchlist");
}

export async function deleteWatchCoin(id: string) {
  if (!id.trim()) {
    redirectWithError("缺少自选币 ID。");
  }

  try {
    await prisma.watchCoin.delete({
      where: { id },
    });
  } catch (error) {
    redirectWithError(getDatabaseErrorMessage(error));
  }

  revalidatePath("/watchlist");
  redirect("/watchlist");
}
