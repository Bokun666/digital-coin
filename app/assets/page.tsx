import Link from "next/link";

import { prisma } from "@/src/lib/prisma";

import {
  createAssetSnapshot,
  deleteAssetSnapshot,
  updateAssetSnapshot,
} from "./actions";

export const dynamic = "force-dynamic";

type AssetsPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
  }>;
};

function formatDate(value: Date): string {
  return value.toLocaleString("zh-CN", {
    hour12: false,
  });
}

function formatDateTimeLocal(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatOptionalValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function formatDecimal(value: unknown): string {
  return formatOptionalValue(value);
}

export default async function AssetsPage({ searchParams }: AssetsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const error = Array.isArray(resolvedSearchParams.error)
    ? resolvedSearchParams.error[0]
    : resolvedSearchParams.error;

  const snapshots = await prisma.assetSnapshot.findMany({
    orderBy: {
      snapshotDate: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-zinc-50 px-5 py-8 text-zinc-950 sm:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
            >
              返回首页
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal">
              资产快照
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
              手动记录某个时间点的资产结构，用于观察资金变化和交易风险。
            </p>
          </div>
          <div className="rounded border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
            当前共 {snapshots.length} 条
          </div>
        </header>

        {error ? (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="rounded border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold">新增资产快照</h2>
          <form action={createAssetSnapshot} className="mt-5 grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                快照时间
                <input
                  name="snapshotDate"
                  type="datetime-local"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                总资产 CNY
                <input
                  name="totalAssetCny"
                  inputMode="decimal"
                  placeholder="0"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                总资产 USDT
                <input
                  name="totalAssetUsdt"
                  inputMode="decimal"
                  placeholder="0"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                稳定币金额
                <input
                  name="stablecoinAmount"
                  inputMode="decimal"
                  placeholder="0"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                现货金额
                <input
                  name="spotAmount"
                  inputMode="decimal"
                  placeholder="0"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                合约保证金
                <input
                  name="futuresMargin"
                  inputMode="decimal"
                  placeholder="0"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                理财金额
                <input
                  name="earnAmount"
                  inputMode="decimal"
                  placeholder="0"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                  required
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              备注
              <textarea
                name="notes"
                rows={3}
                maxLength={1000}
                placeholder="可选，例如资金来源、仓位变化、风险备注"
                className="rounded border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-900"
              />
              <span className="text-xs font-normal text-zinc-500">
                备注最多 1000 字。
              </span>
            </label>

            <div>
              <button
                type="submit"
                className="h-10 rounded bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
              >
                添加资产快照
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-100 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">快照时间</th>
                  <th className="px-4 py-3 font-medium">总资产 CNY</th>
                  <th className="px-4 py-3 font-medium">总资产 USDT</th>
                  <th className="px-4 py-3 font-medium">稳定币金额</th>
                  <th className="px-4 py-3 font-medium">现货金额</th>
                  <th className="px-4 py-3 font-medium">合约保证金</th>
                  <th className="px-4 py-3 font-medium">理财金额</th>
                  <th className="px-4 py-3 font-medium">备注</th>
                  <th className="px-4 py-3 font-medium">创建时间</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-zinc-500"
                      colSpan={10}
                    >
                      暂无资产快照
                    </td>
                  </tr>
                ) : (
                  snapshots.map((snapshot) => (
                    <tr
                      key={snapshot.id}
                      className="border-b border-zinc-100 last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-4 text-zinc-600">
                        {formatDate(snapshot.snapshotDate)}
                      </td>
                      <td className="px-4 py-4">
                        {formatDecimal(snapshot.totalAssetCny)}
                      </td>
                      <td className="px-4 py-4">
                        {formatDecimal(snapshot.totalAssetUsdt)}
                      </td>
                      <td className="px-4 py-4">
                        {formatDecimal(snapshot.stablecoinAmount)}
                      </td>
                      <td className="px-4 py-4">
                        {formatDecimal(snapshot.spotAmount)}
                      </td>
                      <td className="px-4 py-4">
                        {formatDecimal(snapshot.futuresMargin)}
                      </td>
                      <td className="px-4 py-4">
                        {formatDecimal(snapshot.earnAmount)}
                      </td>
                      <td className="max-w-sm px-4 py-4 text-zinc-700">
                        {formatOptionalValue(snapshot.notes)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-zinc-600">
                        {formatDate(snapshot.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-2">
                          <form
                            action={updateAssetSnapshot.bind(
                              null,
                              snapshot.id,
                            )}
                            className="grid min-w-[680px] gap-3 rounded border border-zinc-200 p-3"
                          >
                            <div className="grid gap-3 md:grid-cols-3">
                              <label className="grid gap-1 text-xs font-medium text-zinc-600">
                                快照时间
                                <input
                                  name="snapshotDate"
                                  type="datetime-local"
                                  defaultValue={formatDateTimeLocal(
                                    snapshot.snapshotDate,
                                  )}
                                  className="h-9 rounded border border-zinc-300 px-2 text-sm text-zinc-950 outline-none focus:border-zinc-900"
                                  required
                                />
                              </label>
                              <label className="grid gap-1 text-xs font-medium text-zinc-600">
                                总资产 CNY
                                <input
                                  name="totalAssetCny"
                                  inputMode="decimal"
                                  defaultValue={snapshot.totalAssetCny.toString()}
                                  className="h-9 rounded border border-zinc-300 px-2 text-sm text-zinc-950 outline-none focus:border-zinc-900"
                                  required
                                />
                              </label>
                              <label className="grid gap-1 text-xs font-medium text-zinc-600">
                                总资产 USDT
                                <input
                                  name="totalAssetUsdt"
                                  inputMode="decimal"
                                  defaultValue={snapshot.totalAssetUsdt.toString()}
                                  className="h-9 rounded border border-zinc-300 px-2 text-sm text-zinc-950 outline-none focus:border-zinc-900"
                                  required
                                />
                              </label>
                            </div>
                            <div className="grid gap-3 md:grid-cols-4">
                              <label className="grid gap-1 text-xs font-medium text-zinc-600">
                                稳定币金额
                                <input
                                  name="stablecoinAmount"
                                  inputMode="decimal"
                                  defaultValue={snapshot.stablecoinAmount.toString()}
                                  className="h-9 rounded border border-zinc-300 px-2 text-sm text-zinc-950 outline-none focus:border-zinc-900"
                                  required
                                />
                              </label>
                              <label className="grid gap-1 text-xs font-medium text-zinc-600">
                                现货金额
                                <input
                                  name="spotAmount"
                                  inputMode="decimal"
                                  defaultValue={snapshot.spotAmount.toString()}
                                  className="h-9 rounded border border-zinc-300 px-2 text-sm text-zinc-950 outline-none focus:border-zinc-900"
                                  required
                                />
                              </label>
                              <label className="grid gap-1 text-xs font-medium text-zinc-600">
                                合约保证金
                                <input
                                  name="futuresMargin"
                                  inputMode="decimal"
                                  defaultValue={snapshot.futuresMargin.toString()}
                                  className="h-9 rounded border border-zinc-300 px-2 text-sm text-zinc-950 outline-none focus:border-zinc-900"
                                  required
                                />
                              </label>
                              <label className="grid gap-1 text-xs font-medium text-zinc-600">
                                理财金额
                                <input
                                  name="earnAmount"
                                  inputMode="decimal"
                                  defaultValue={snapshot.earnAmount.toString()}
                                  className="h-9 rounded border border-zinc-300 px-2 text-sm text-zinc-950 outline-none focus:border-zinc-900"
                                  required
                                />
                              </label>
                            </div>
                            <label className="grid gap-1 text-xs font-medium text-zinc-600">
                              备注
                              <textarea
                                name="notes"
                                rows={2}
                                maxLength={1000}
                                defaultValue={snapshot.notes ?? ""}
                                className="rounded border border-zinc-300 px-2 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-900"
                              />
                              <span className="font-normal text-zinc-500">
                                备注最多 1000 字。
                              </span>
                            </label>
                            <div>
                              <button
                                type="submit"
                                className="h-9 rounded border border-zinc-300 px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                              >
                                保存修改
                              </button>
                            </div>
                          </form>
                          <form
                            action={deleteAssetSnapshot.bind(
                              null,
                              snapshot.id,
                            )}
                          >
                            <button
                              type="submit"
                              className="h-9 rounded border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50"
                            >
                              删除
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
