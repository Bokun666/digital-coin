import Link from "next/link";

import { prisma } from "@/src/lib/prisma";

import { createMarketSnapshot, deleteMarketSnapshot } from "./actions";

export const dynamic = "force-dynamic";

type MarketSnapshotsPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
  }>;
};

const marketRegimeOptions = [
  { value: "UNKNOWN", label: "未知" },
  { value: "BULL", label: "牛市" },
  { value: "BEAR", label: "熊市" },
  { value: "RANGE", label: "震荡" },
  { value: "CRASH", label: "暴跌" },
  { value: "RECOVERY", label: "修复" },
  { value: "HIGH_VOLATILITY", label: "高波动" },
  { value: "LOW_VOLATILITY", label: "低波动" },
];

function getOptionLabel(
  options: Array<{ value: string; label: string }>,
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

function formatDate(value: Date): string {
  return value.toLocaleString("zh-CN", {
    hour12: false,
  });
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

export default async function MarketSnapshotsPage({
  searchParams,
}: MarketSnapshotsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const error = Array.isArray(resolvedSearchParams.error)
    ? resolvedSearchParams.error[0]
    : resolvedSearchParams.error;

  const snapshots = await prisma.marketSnapshot.findMany({
    orderBy: {
      snapshotTime: "desc",
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
              市场快照
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
              手动记录某个时间点的市场状态，为后续 AI
              分析和用户判断对比提供输入上下文。
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
          <h2 className="text-lg font-semibold">新增市场快照</h2>
          <form action={createMarketSnapshot} className="mt-5 grid gap-4">
            <div className="grid gap-4 md:grid-cols-4">
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                币种
                <input
                  name="symbol"
                  placeholder="BTC"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                快照时间
                <input
                  name="snapshotTime"
                  type="datetime-local"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                市场环境
                <select
                  name="marketRegime"
                  defaultValue="UNKNOWN"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                >
                  {marketRegimeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                当前价格
                <input
                  name="currentPrice"
                  inputMode="decimal"
                  placeholder="可选"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                K线摘要
                <textarea
                  name="klineSummary"
                  rows={4}
                  maxLength={2000}
                  className="rounded border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-900"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                宏观摘要
                <textarea
                  name="macroSummary"
                  rows={4}
                  maxLength={2000}
                  className="rounded border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-900"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                合约数据摘要
                <textarea
                  name="contractSummary"
                  rows={4}
                  maxLength={2000}
                  className="rounded border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-900"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                链上数据摘要
                <textarea
                  name="onChainSummary"
                  rows={4}
                  maxLength={2000}
                  className="rounded border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-900"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                新闻摘要
                <textarea
                  name="newsSummary"
                  rows={4}
                  maxLength={2000}
                  className="rounded border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-900"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                数据来源
                <textarea
                  name="dataSources"
                  rows={4}
                  maxLength={1000}
                  placeholder="例如 TradingView、Coinglass、新闻链接或手动观察来源"
                  className="rounded border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-900"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                截图路径
                <input
                  name="screenshotPath"
                  maxLength={1000}
                  placeholder="可选，本次只保存文本路径"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                备注
                <textarea
                  name="notes"
                  rows={3}
                  maxLength={1000}
                  placeholder="可选，记录判断背景或补充说明"
                  className="rounded border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-900"
                />
              </label>
            </div>

            <p className="text-xs text-zinc-500">
              摘要最多 2000 字，数据来源、截图路径和备注最多 1000
              字。截图路径仅保存文本，不上传文件。
            </p>

            <div>
              <button
                type="submit"
                className="h-10 rounded bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
              >
                添加市场快照
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px] border-collapse text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-100 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">币种</th>
                  <th className="px-4 py-3 font-medium">快照时间</th>
                  <th className="px-4 py-3 font-medium">市场环境</th>
                  <th className="px-4 py-3 font-medium">当前价格</th>
                  <th className="px-4 py-3 font-medium">K线摘要</th>
                  <th className="px-4 py-3 font-medium">宏观摘要</th>
                  <th className="px-4 py-3 font-medium">合约摘要</th>
                  <th className="px-4 py-3 font-medium">链上摘要</th>
                  <th className="px-4 py-3 font-medium">新闻摘要</th>
                  <th className="px-4 py-3 font-medium">数据来源</th>
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
                      colSpan={13}
                    >
                      暂无市场快照
                    </td>
                  </tr>
                ) : (
                  snapshots.map((snapshot) => (
                    <tr
                      key={snapshot.id}
                      className="border-b border-zinc-100 last:border-0"
                    >
                      <td className="px-4 py-4 font-semibold">
                        {snapshot.symbol}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-zinc-600">
                        {formatDate(snapshot.snapshotTime)}
                      </td>
                      <td className="px-4 py-4">
                        {getOptionLabel(
                          marketRegimeOptions,
                          snapshot.marketRegime,
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {formatDecimal(snapshot.currentPrice)}
                      </td>
                      <td className="max-w-xs px-4 py-4 text-zinc-700">
                        {formatOptionalValue(snapshot.klineSummary)}
                      </td>
                      <td className="max-w-xs px-4 py-4 text-zinc-700">
                        {formatOptionalValue(snapshot.macroSummary)}
                      </td>
                      <td className="max-w-xs px-4 py-4 text-zinc-700">
                        {formatOptionalValue(snapshot.contractSummary)}
                      </td>
                      <td className="max-w-xs px-4 py-4 text-zinc-700">
                        {formatOptionalValue(snapshot.onChainSummary)}
                      </td>
                      <td className="max-w-xs px-4 py-4 text-zinc-700">
                        {formatOptionalValue(snapshot.newsSummary)}
                      </td>
                      <td className="max-w-xs px-4 py-4 text-zinc-700">
                        {formatOptionalValue(snapshot.dataSources)}
                      </td>
                      <td className="max-w-xs px-4 py-4 text-zinc-700">
                        {formatOptionalValue(snapshot.notes)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-zinc-600">
                        {formatDate(snapshot.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <form
                          action={deleteMarketSnapshot.bind(null, snapshot.id)}
                        >
                          <button
                            type="submit"
                            className="h-9 rounded border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50"
                          >
                            删除
                          </button>
                        </form>
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
