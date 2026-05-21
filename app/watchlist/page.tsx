import Link from "next/link";

import { prisma } from "@/src/lib/prisma";

import { createWatchCoin, deleteWatchCoin } from "./actions";

const categoryOptions = [
  { value: "MAINSTREAM", label: "主流币" },
  { value: "ALTCOIN", label: "山寨币" },
  { value: "MEME", label: "Meme" },
  { value: "MINING", label: "矿币" },
  { value: "AI", label: "AI" },
  { value: "RWA", label: "RWA" },
  { value: "DEPIN", label: "DePIN" },
  { value: "STABLECOIN", label: "稳定币" },
  { value: "OTHER", label: "其他" },
];

const statusOptions = [
  { value: "WATCHING", label: "观察中" },
  { value: "INTERESTED", label: "感兴趣" },
  { value: "HOLDING", label: "持有中" },
  { value: "ABANDONED", label: "已放弃" },
];

type WatchlistPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
  }>;
};

function formatOptionalValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "object" && "toString" in value) {
    return value.toString();
  }

  return String(value);
}

function formatDate(value: Date): string {
  return value.toLocaleString("zh-CN", {
    hour12: false,
  });
}

export default async function WatchlistPage({
  searchParams,
}: WatchlistPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const error = Array.isArray(resolvedSearchParams.error)
    ? resolvedSearchParams.error[0]
    : resolvedSearchParams.error;

  const watchCoins = await prisma.watchCoin.findMany({
    orderBy: {
      createdAt: "desc",
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
              自选币
            </h1>
          </div>
          <div className="rounded border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
            共 {watchCoins.length} 个
          </div>
        </header>

        {error ? (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="rounded border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold">新增自选币</h2>
          <form action={createWatchCoin} className="mt-5 grid gap-4">
            <div className="grid gap-4 md:grid-cols-4">
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                Symbol
                <input
                  name="symbol"
                  placeholder="BTC"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                名称
                <input
                  name="name"
                  placeholder="Bitcoin"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                分类
                <select
                  name="category"
                  defaultValue="OTHER"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                  required
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                状态
                <select
                  name="status"
                  defaultValue="WATCHING"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                  required
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                支撑价
                <input
                  name="supportPrice"
                  inputMode="decimal"
                  placeholder="可选"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                压力价
                <input
                  name="resistancePrice"
                  inputMode="decimal"
                  placeholder="可选"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              关注原因
              <textarea
                name="watchReason"
                rows={3}
                placeholder="例如：主流资产、长期观察、关键支撑位附近"
                className="rounded border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-900"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                风险标签
                <textarea
                  name="riskTags"
                  rows={3}
                  placeholder="可选"
                  className="rounded border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-900"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                备注
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="可选"
                  className="rounded border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-900"
                />
              </label>
            </div>

            <div>
              <button
                type="submit"
                className="h-10 rounded bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
              >
                添加
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-100 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Symbol</th>
                  <th className="px-4 py-3 font-medium">名称</th>
                  <th className="px-4 py-3 font-medium">分类</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">关注原因</th>
                  <th className="px-4 py-3 font-medium">支撑价</th>
                  <th className="px-4 py-3 font-medium">压力价</th>
                  <th className="px-4 py-3 font-medium">风险标签</th>
                  <th className="px-4 py-3 font-medium">备注</th>
                  <th className="px-4 py-3 font-medium">创建时间</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {watchCoins.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-zinc-500" colSpan={11}>
                      暂无自选币
                    </td>
                  </tr>
                ) : (
                  watchCoins.map((coin) => (
                    <tr
                      key={coin.id}
                      className="border-b border-zinc-100 last:border-0"
                    >
                      <td className="px-4 py-4 font-semibold text-zinc-950">
                        {coin.symbol}
                      </td>
                      <td className="px-4 py-4">{coin.name}</td>
                      <td className="px-4 py-4">{coin.category}</td>
                      <td className="px-4 py-4">{coin.status}</td>
                      <td className="max-w-xs px-4 py-4 text-zinc-700">
                        {formatOptionalValue(coin.watchReason)}
                      </td>
                      <td className="px-4 py-4">
                        {formatOptionalValue(coin.supportPrice)}
                      </td>
                      <td className="px-4 py-4">
                        {formatOptionalValue(coin.resistancePrice)}
                      </td>
                      <td className="max-w-xs px-4 py-4 text-zinc-700">
                        {formatOptionalValue(coin.riskTags)}
                      </td>
                      <td className="max-w-xs px-4 py-4 text-zinc-700">
                        {formatOptionalValue(coin.notes)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-zinc-600">
                        {formatDate(coin.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <form action={deleteWatchCoin.bind(null, coin.id)}>
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
