import Link from "next/link";

import { prisma } from "@/src/lib/prisma";

export const dynamic = "force-dynamic";

const operationTypeOptions = [
  { value: "SPOT", label: "现货" },
  { value: "SPOT_GRID", label: "现货网格" },
  { value: "FUTURES", label: "合约" },
  { value: "FUTURES_GRID", label: "合约网格" },
  { value: "DCA", label: "定投" },
  { value: "STABLE_EARN", label: "稳定币理财" },
  { value: "OTHER", label: "其他" },
];

const directionOptions = [
  { value: "BUY", label: "买入" },
  { value: "SELL", label: "卖出" },
  { value: "LONG", label: "做多" },
  { value: "SHORT", label: "做空" },
  { value: "NONE", label: "无方向" },
];

const statusOptions = [
  { value: "DRAFT", label: "草稿" },
  { value: "PASSED", label: "已通过" },
  { value: "MEDIUM_RISK", label: "中风险" },
  { value: "HIGH_RISK", label: "高风险" },
  { value: "EXTREME_RISK", label: "极高风险" },
  { value: "EXECUTED", label: "已执行" },
  { value: "CANCELLED", label: "已取消" },
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

export default async function Home() {
  const [
    watchCoinCount,
    tradePlanCount,
    highRiskTradePlanCount,
    executedTradePlanCount,
    riskCheckCount,
    positionSizingCount,
    tradeRecordCount,
    reviewCount,
    recentTradePlans,
    recentTradeRecords,
    recentReviews,
  ] = await Promise.all([
    prisma.watchCoin.count(),
    prisma.tradePlan.count(),
    prisma.tradePlan.count({
      where: {
        status: {
          in: ["HIGH_RISK", "EXTREME_RISK"],
        },
      },
    }),
    prisma.tradePlan.count({
      where: {
        status: "EXECUTED",
      },
    }),
    prisma.riskCheck.count(),
    prisma.positionSizing.count(),
    prisma.tradeRecord.count(),
    prisma.review.count(),
    prisma.tradePlan.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.tradeRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        tradeRecord: true,
      },
    }),
  ]);

  const stats = [
    { label: "自选币数量", value: watchCoinCount },
    { label: "交易计划数量", value: tradePlanCount },
    { label: "高风险计划数量", value: highRiskTradePlanCount },
    { label: "已执行计划数量", value: executedTradePlanCount },
    { label: "风险检查数量", value: riskCheckCount },
    { label: "仓位计算数量", value: positionSizingCount },
    { label: "交易记录数量", value: tradeRecordCount },
    { label: "复盘数量", value: reviewCount },
  ];

  return (
    <main className="min-h-screen bg-zinc-50 px-5 py-10 text-zinc-950 sm:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="border-b border-zinc-200 pb-8">
          <p className="text-sm font-medium text-zinc-500">DigitalCoin</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal">
            交易辅助、风控复盘与策略进化系统
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
            汇总自选币、交易计划、风险检查、仓位计算、交易记录和复盘状态。
          </p>
        </header>

        <section>
          <h2 className="text-lg font-semibold">核心统计</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded border border-zinc-200 bg-white p-5"
              >
                <div className="text-sm font-medium text-zinc-500">
                  {stat.label}
                </div>
                <div className="mt-3 text-3xl font-semibold text-zinc-950">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold">模块入口</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Link
              href="/watchlist"
              className="rounded border border-zinc-200 bg-white p-5 transition hover:border-zinc-400"
            >
              <div className="text-sm font-medium text-zinc-500">
                /watchlist
              </div>
              <div className="mt-3 text-xl font-semibold">自选币</div>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                管理关注币种、关键价位、风险标签和观察状态。
              </p>
            </Link>

            <Link
              href="/trade-plans"
              className="rounded border border-zinc-200 bg-white p-5 transition hover:border-zinc-400"
            >
              <div className="text-sm font-medium text-zinc-500">
                /trade-plans
              </div>
              <div className="mt-3 text-xl font-semibold">交易计划</div>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                记录交易计划、风险检查、仓位计算、交易记录和复盘。
              </p>
            </Link>
          </div>
        </section>

        <section className="rounded border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">最近交易计划</h2>
            <Link
              href="/trade-plans"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
            >
              查看全部
            </Link>
          </div>
          {recentTradePlans.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">暂无交易计划</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="py-3 pr-4 font-medium">币种</th>
                    <th className="px-4 py-3 font-medium">操作类型</th>
                    <th className="px-4 py-3 font-medium">方向</th>
                    <th className="px-4 py-3 font-medium">状态</th>
                    <th className="px-4 py-3 font-medium">创建时间</th>
                    <th className="py-3 pl-4 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTradePlans.map((plan) => (
                    <tr
                      key={plan.id}
                      className="border-b border-zinc-100 last:border-0"
                    >
                      <td className="py-3 pr-4 font-semibold">
                        {plan.coinSymbol}
                      </td>
                      <td className="px-4 py-3">
                        {getOptionLabel(
                          operationTypeOptions,
                          plan.operationType,
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {getOptionLabel(directionOptions, plan.direction)}
                      </td>
                      <td className="px-4 py-3">
                        {getOptionLabel(statusOptions, plan.status)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                        {formatDate(plan.createdAt)}
                      </td>
                      <td className="py-3 pl-4">
                        <Link
                          href={`/trade-plans/${plan.id}`}
                          className="text-sm font-medium text-zinc-700 hover:text-zinc-950"
                        >
                          查看详情
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold">最近交易记录</h2>
          {recentTradeRecords.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">暂无交易记录</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="py-3 pr-4 font-medium">币种</th>
                    <th className="px-4 py-3 font-medium">操作类型</th>
                    <th className="px-4 py-3 font-medium">方向</th>
                    <th className="px-4 py-3 font-medium">盈亏金额</th>
                    <th className="px-4 py-3 font-medium">盈亏比例</th>
                    <th className="py-3 pl-4 font-medium">创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTradeRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-zinc-100 last:border-0"
                    >
                      <td className="py-3 pr-4 font-semibold">
                        {record.coinSymbol}
                      </td>
                      <td className="px-4 py-3">
                        {getOptionLabel(
                          operationTypeOptions,
                          record.operationType,
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {getOptionLabel(directionOptions, record.direction)}
                      </td>
                      <td className="px-4 py-3">
                        {formatDecimal(record.profitLossAmount)}
                      </td>
                      <td className="px-4 py-3">
                        {formatDecimal(record.profitLossPercent)}
                      </td>
                      <td className="whitespace-nowrap py-3 pl-4 text-zinc-600">
                        {formatDate(record.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold">最近复盘</h2>
          {recentReviews.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">暂无复盘记录</p>
          ) : (
            <div className="mt-4 grid gap-4">
              {recentReviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded border border-zinc-100 p-4"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="font-semibold text-zinc-950">
                      {review.tradeRecord.coinSymbol}
                    </div>
                    <div className="text-sm text-zinc-500">
                      {formatDate(review.createdAt)}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 text-sm leading-6 text-zinc-700 md:grid-cols-2">
                    <div>
                      <div className="text-xs font-medium text-zinc-500">
                        错误总结
                      </div>
                      <div className="mt-1">
                        {formatOptionalValue(review.mistake)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-zinc-500">
                        经验教训
                      </div>
                      <div className="mt-1">
                        {formatOptionalValue(review.lesson)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
