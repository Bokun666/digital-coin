"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/src/lib/prisma";

const NOTES_MAX_LENGTH = 1000;

function getText(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function redirectWithError(message: string): never {
  redirect(`/assets?error=${encodeURIComponent(message)}`);
}

function parseRequiredDate(value: string, fieldName: string): Date {
  if (!value) {
    throw new Error(`${fieldName} 不能为空。`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} 格式不正确。`);
  }

  return date;
}

function parseRequiredDecimal(
  value: string,
  fieldName: string,
): Prisma.Decimal {
  if (!value) {
    throw new Error(`${fieldName} 不能为空。`);
  }

  try {
    return new Prisma.Decimal(value);
  } catch {
    throw new Error(`${fieldName} 必须是合法数字。`);
  }
}

function assertGreaterThanOrEqualZero(
  value: Prisma.Decimal,
  fieldName: string,
) {
  if (value.lt(0)) {
    throw new Error(`${fieldName} 必须大于等于 0。`);
  }
}

function parseAssetAmount(formData: FormData, key: string, fieldName: string) {
  const value = parseRequiredDecimal(getText(formData, key), fieldName);

  assertGreaterThanOrEqualZero(value, fieldName);

  return value;
}

function normalizeAssetSnapshotForm(formData: FormData) {
  const snapshotDate = parseRequiredDate(
    getText(formData, "snapshotDate"),
    "快照时间",
  );
  const notes = getText(formData, "notes");

  if (notes.length > NOTES_MAX_LENGTH) {
    throw new Error("备注不能超过 1000 字。");
  }

  return {
    snapshotDate,
    totalAssetCny: parseAssetAmount(
      formData,
      "totalAssetCny",
      "总资产 CNY",
    ),
    totalAssetUsdt: parseAssetAmount(
      formData,
      "totalAssetUsdt",
      "总资产 USDT",
    ),
    stablecoinAmount: parseAssetAmount(
      formData,
      "stablecoinAmount",
      "稳定币金额",
    ),
    spotAmount: parseAssetAmount(formData, "spotAmount", "现货金额"),
    futuresMargin: parseAssetAmount(
      formData,
      "futuresMargin",
      "合约保证金",
    ),
    earnAmount: parseAssetAmount(formData, "earnAmount", "理财金额"),
    notes: notes || null,
  };
}

function getDatabaseErrorMessage(error: unknown): string {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    return "资产快照不存在或已被删除。";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "操作失败，请稍后重试。";
}

export async function createAssetSnapshot(formData: FormData) {
  try {
    await prisma.assetSnapshot.create({
      data: normalizeAssetSnapshotForm(formData),
    });
  } catch (error) {
    redirectWithError(getDatabaseErrorMessage(error));
  }

  revalidatePath("/assets");
  revalidatePath("/");
  redirect("/assets");
}

export async function updateAssetSnapshot(id: string, formData: FormData) {
  if (!id.trim()) {
    redirectWithError("缺少资产快照 ID。");
  }

  try {
    const snapshot = await prisma.assetSnapshot.findUnique({
      where: { id },
    });

    if (!snapshot) {
      throw new Error("资产快照不存在或已被删除。");
    }

    await prisma.assetSnapshot.update({
      where: { id: snapshot.id },
      data: normalizeAssetSnapshotForm(formData),
    });
  } catch (error) {
    redirectWithError(getDatabaseErrorMessage(error));
  }

  revalidatePath("/assets");
  revalidatePath("/");
  redirect("/assets");
}

export async function deleteAssetSnapshot(id: string) {
  if (!id.trim()) {
    redirectWithError("缺少资产快照 ID。");
  }

  try {
    await prisma.assetSnapshot.delete({
      where: { id },
    });
  } catch (error) {
    redirectWithError(getDatabaseErrorMessage(error));
  }

  revalidatePath("/assets");
  revalidatePath("/");
  redirect("/assets");
}
