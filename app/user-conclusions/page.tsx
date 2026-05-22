import Link from "next/link";

import { prisma } from "@/src/lib/prisma";

import { createUserConclusion, deleteUserConclusion } from "./actions";

export const dynamic = "force-dynamic";

type UserConclusionsPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
  }>;
};

const marketBiasOptions = [
  { value: "UNKNOWN", label: "未知" },
  { value: "BULLISH", label: "偏多" },
  { value: "BEARISH", label: "偏空" },
  { value: "NEUTRAL", label: "中性" },
  { value: "RANGE", label: "震荡" },
  { value: "VOLATILE", label: "高波动" },
];

const strategyTypeOptions = [
  { value: "OTHER", label: "其他" },
  { value: "DCA", label: "定投策略" },
  { value: "SPOT_GRID", label: "现货网格策略" },
  { value: "FUTURES_GRID", label: "合约网格策略" },
  { value: "FUTURES_TRAIN", label: "合约训练策略" },
  { value: "ALTCOIN", label: "山寨币机会策略" },
  { value: "MINING_COIN", label: "新矿币机会策略" },
  { value: "STABLE_EARN", label: "稳定币理财策略" },
];

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

function getMarketBiasLabel(value: string): string {
  return getOptionLabel(marketBiasOptions, value);
}

function getStrategyTypeLabel(value: string): string {
  return getOptionLabel(strategyTypeOptions, value);
}

function getMarketRegimeLabel(value: string): string {
  return getOptionLabel(marketRegimeOptions, value);
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

export default async function UserConclusionsPage({
  searchParams,
}: UserConclusionsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const error = Array.isArray(resolvedSearchParams.error)
    ? resolvedSearchParams.error[0]
    : resolvedSearchParams.error;

  const [userConclusions, marketSnapshots] = await Promise.all([
    prisma.userConclusion.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        marketSnapshot: true,
      },
    }),
    prisma.marketSnapshot.findMany({
      orderBy: { snapshotTime: "desc" },
      take: 50,
    }),
  ]);

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
              用户判断
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
              在 AI
              分析前，先记录自己的市场方向、置信度、判断理由和计划策略，用于后续和
              AI 判断对比。
            </p>
          </div>
          <div className="rounded border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
            当前共 {userConclusions.length} 条
          </div>
        </header>

        {error ? (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="rounded border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold">新增用户判断</h2>
          <form action={createUserConclusion} className="mt-5 grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
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
                用户方向判断
                <select
                  name="userBias"
                  defaultValue="UNKNOWN"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                >
                  {marketBiasOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                用户置信度
                <input
                  name="userConfidence"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  placeholder="0-100"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                关联市场快照
                <select
                  name="marketSnapshotId"
                  defaultValue=""
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                >
                  <option value="">不关联市场快照</option>
                  {marketSnapshots.map((snapshot) => (
                    <option key={snapshot.id} value={snapshot.id}>
                      {snapshot.symbol} · {formatDate(snapshot.snapshotTime)} ·{" "}
                      {getMarketRegimeLabel(snapshot.marketRegime)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                计划策略
                <select
                  name="intendedStrategy"
                  defaultValue="OTHER"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                >
                  {strategyTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              用户判断理由
              <textarea
                name="userReason"
                rows={5}
                maxLength={2000}
                placeholder="记录你自己的方向判断、关键依据和不确定性。"
                className="rounded border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-900"
                required
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              用户计划参数
              <textarea
                name="plannedParameters"
                rows={4}
                maxLength={2000}
                placeholder="可选，例如网格区间、投入金额、止损条件、计划观察点等。"
                className="rounded border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-900"
              />
            </label>

            <p className="text-xs text-zinc-500">
              用户判断理由和计划参数最多 2000 字。本模块只保存你的手动判断，不生成
              AI 分析。
            </p>

            <div>
              <button
                type="submit"
                className="h-10 rounded bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
              >
                添加用户判断
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-100 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">币种</th>
                  <th className="px-4 py-3 font-medium">关联市场快照</th>
                  <th className="px-4 py-3 font-medium">用户方向判断</th>
                  <th className="px-4 py-3 font-medium">用户置信度</th>
                  <th className="px-4 py-3 font-medium">用户判断理由</th>
                  <th className="px-4 py-3 font-medium">计划策略</th>
                  <th className="px-4 py-3 font-medium">计划参数</th>
                  <th className="px-4 py-3 font-medium">创建时间</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {userConclusions.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-zinc-500"
                      colSpan={9}
                    >
                      暂无用户判断
                    </td>
                  </tr>
                ) : (
                  userConclusions.map((conclusion) => (
                    <tr
                      key={conclusion.id}
                      className="border-b border-zinc-100 last:border-0"
                    >
                      <td className="px-4 py-4 font-semibold">
                        {conclusion.symbol}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-zinc-600">
                        {conclusion.marketSnapshot
                          ? `${formatDate(
                              conclusion.marketSnapshot.snapshotTime,
                            )} · ${getMarketRegimeLabel(
                              conclusion.marketSnapshot.marketRegime,
                            )}`
                          : "-"}
                      </td>
                      <td className="px-4 py-4">
                        {getMarketBiasLabel(conclusion.userBias)}
                      </td>
                      <td className="px-4 py-4">
                        {conclusion.userConfidence}
                      </td>
                      <td className="max-w-sm px-4 py-4 text-zinc-700">
                        {conclusion.userReason}
                      </td>
                      <td className="px-4 py-4">
                        {getStrategyTypeLabel(conclusion.intendedStrategy)}
                      </td>
                      <td className="max-w-sm px-4 py-4 text-zinc-700">
                        {formatOptionalValue(conclusion.plannedParameters)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-zinc-600">
                        {formatDate(conclusion.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <form
                          action={deleteUserConclusion.bind(
                            null,
                            conclusion.id,
                          )}
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
