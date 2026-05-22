import Link from "next/link";

import { prisma } from "@/src/lib/prisma";

import {
  createTradePlan,
  deleteTradePlan,
  generatePositionSizing,
  generateRiskCheck,
  generateTradeRecord,
} from "./actions";

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

const marginModeOptions = [
  { value: "NONE", label: "无" },
  { value: "ISOLATED", label: "逐仓" },
  { value: "CROSS", label: "全仓" },
];

const emotionStateOptions = [
  { value: "CALM", label: "冷静" },
  { value: "ANXIOUS", label: "焦虑" },
  { value: "FOMO", label: "FOMO" },
  { value: "REVENGE", label: "报复交易" },
  { value: "IMPULSIVE", label: "冲动" },
  { value: "FEAR", label: "恐惧" },
  { value: "GREED", label: "贪婪" },
  { value: "UNKNOWN", label: "未知" },
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

const riskLevelOptions = [
  { value: "LOW", label: "低风险" },
  { value: "MEDIUM", label: "中风险" },
  { value: "HIGH", label: "高风险" },
  { value: "EXTREME", label: "极高风险" },
];

type TradePlansPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
  }>;
};

function getOptionLabel(
  options: Array<{ value: string; label: string }>,
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

function formatOptionalValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function formatBoolean(value: boolean): string {
  return value ? "是" : "否";
}

function formatDate(value: Date): string {
  return value.toLocaleString("zh-CN", {
    hour12: false,
  });
}

function formatOptionalDate(value: Date | null | undefined): string {
  return value ? formatDate(value) : "-";
}

function formatReasons(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join("；");
  }

  return JSON.stringify(value);
}

function getRiskLevelClass(level: string): string {
  if (level === "EXTREME") {
    return "border-red-700 bg-red-100 text-red-900";
  }

  if (level === "HIGH") {
    return "border-red-300 bg-red-50 text-red-700";
  }

  if (level === "MEDIUM") {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }

  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

function isGreaterThanTwo(value: unknown): boolean {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  return Number(value) > 2;
}

function isLessThanOne(value: unknown): boolean {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  return Number(value) < 1;
}

export default async function TradePlansPage({
  searchParams,
}: TradePlansPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const error = Array.isArray(resolvedSearchParams.error)
    ? resolvedSearchParams.error[0]
    : resolvedSearchParams.error;

  const tradePlans = await prisma.tradePlan.findMany({
    include: {
      positionSizings: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      riskChecks: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      tradeRecord: true,
    },
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
              交易计划
            </h1>
          </div>
          <div className="rounded border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
            当前共 {tradePlans.length} 条
          </div>
        </header>

        {error ? (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="rounded border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold">新增交易计划</h2>
          <form action={createTradePlan} className="mt-5 grid gap-4">
            <div className="grid gap-4 md:grid-cols-4">
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                币种
                <input
                  name="coinSymbol"
                  placeholder="BTC"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                操作类型
                <select
                  name="operationType"
                  defaultValue="SPOT"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                  required
                >
                  {operationTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                方向
                <select
                  name="direction"
                  defaultValue="BUY"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                  required
                >
                  {directionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                当前情绪状态
                <select
                  name="emotionState"
                  defaultValue="CALM"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                  required
                >
                  {emotionStateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                计划投入金额
                <input
                  name="plannedAmount"
                  inputMode="decimal"
                  placeholder="1000"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                当前总资金
                <input
                  name="totalCapital"
                  inputMode="decimal"
                  placeholder="10000"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                  required
                />
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
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                计划入场价
                <input
                  name="entryPrice"
                  inputMode="decimal"
                  placeholder="65000"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                止损价
                <input
                  name="stopLossPrice"
                  inputMode="decimal"
                  placeholder="可选"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                止盈价
                <input
                  name="takeProfitPrice"
                  inputMode="decimal"
                  placeholder="可选"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                杠杆倍数
                <input
                  name="leverage"
                  inputMode="decimal"
                  placeholder="默认 1"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                保证金模式
                <select
                  name="marginMode"
                  defaultValue="NONE"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                  required
                >
                  {marginModeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                最大可接受亏损
                <input
                  name="maxAcceptableLoss"
                  inputMode="decimal"
                  placeholder="可选"
                  className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                />
              </label>
              <fieldset className="grid gap-3 rounded border border-zinc-200 px-4 py-3">
                <legend className="px-1 text-sm font-medium text-zinc-700">
                  风险要素
                </legend>
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input name="hasMacroEvent" type="checkbox" />
                  是否有重大宏观事件
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input name="isChasingPrice" type="checkbox" />
                  是否追涨
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input name="hasStopLoss" type="checkbox" />
                  是否设置止损
                </label>
              </fieldset>
            </div>

            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              入场理由
              <textarea
                name="reason"
                rows={3}
                placeholder="例如：突破关键阻力后回踩确认，风险回报比可接受"
                className="rounded border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-900"
                required
              />
            </label>

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
            <table className="w-full min-w-[3400px] border-collapse text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-100 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">币种</th>
                  <th className="px-4 py-3 font-medium">操作类型</th>
                  <th className="px-4 py-3 font-medium">方向</th>
                  <th className="px-4 py-3 font-medium">计划投入金额</th>
                  <th className="px-4 py-3 font-medium">入场价</th>
                  <th className="px-4 py-3 font-medium">止损价</th>
                  <th className="px-4 py-3 font-medium">止盈价</th>
                  <th className="px-4 py-3 font-medium">杠杆倍数</th>
                  <th className="px-4 py-3 font-medium">保证金模式</th>
                  <th className="px-4 py-3 font-medium">情绪状态</th>
                  <th className="px-4 py-3 font-medium">是否追涨</th>
                  <th className="px-4 py-3 font-medium">宏观事件</th>
                  <th className="px-4 py-3 font-medium">设置止损</th>
                  <th className="px-4 py-3 font-medium">最近风险分</th>
                  <th className="px-4 py-3 font-medium">最近风险等级</th>
                  <th className="px-4 py-3 font-medium">风险原因</th>
                  <th className="px-4 py-3 font-medium">系统建议</th>
                  <th className="px-4 py-3 font-medium">最近仓位价值</th>
                  <th className="px-4 py-3 font-medium">止损亏损金额</th>
                  <th className="px-4 py-3 font-medium">止盈盈利金额</th>
                  <th className="px-4 py-3 font-medium">盈亏比</th>
                  <th className="px-4 py-3 font-medium">
                    止损亏损占总资金比例
                  </th>
                  <th className="px-4 py-3 font-medium">仓位建议</th>
                  <th className="px-4 py-3 font-medium">交易记录状态</th>
                  <th className="px-4 py-3 font-medium">记录入场时间</th>
                  <th className="px-4 py-3 font-medium">记录出场时间</th>
                  <th className="px-4 py-3 font-medium">记录入场价</th>
                  <th className="px-4 py-3 font-medium">记录出场价</th>
                  <th className="px-4 py-3 font-medium">记录投入金额</th>
                  <th className="px-4 py-3 font-medium">记录杠杆倍数</th>
                  <th className="px-4 py-3 font-medium">盈亏金额</th>
                  <th className="px-4 py-3 font-medium">盈亏比例</th>
                  <th className="px-4 py-3 font-medium">是否遵守计划</th>
                  <th className="px-4 py-3 font-medium">出场原因</th>
                  <th className="px-4 py-3 font-medium">计划状态</th>
                  <th className="px-4 py-3 font-medium">创建时间</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {tradePlans.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-zinc-500"
                      colSpan={37}
                    >
                      暂无交易计划
                    </td>
                  </tr>
                ) : (
                  tradePlans.map((plan) => {
                    const latestRiskCheck = plan.riskChecks[0];
                    const latestPositionSizing = plan.positionSizings[0];
                    const tradeRecord = plan.tradeRecord;
                    const isPositionTooHeavy = isGreaterThanTwo(
                      latestPositionSizing?.lossPercentOfTotalCapital,
                    );
                    const hasLowRiskRewardRatio = isLessThanOne(
                      latestPositionSizing?.riskRewardRatio,
                    );

                    return (
                      <tr
                        key={plan.id}
                        className="border-b border-zinc-100 last:border-0"
                      >
                        <td className="px-4 py-4 font-semibold text-zinc-950">
                          {plan.coinSymbol}
                        </td>
                        <td className="px-4 py-4">
                          {getOptionLabel(
                            operationTypeOptions,
                            plan.operationType,
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {getOptionLabel(directionOptions, plan.direction)}
                        </td>
                        <td className="px-4 py-4">
                          {formatOptionalValue(plan.plannedAmount)}
                        </td>
                        <td className="px-4 py-4">
                          {formatOptionalValue(plan.entryPrice)}
                        </td>
                        <td className="px-4 py-4">
                          {formatOptionalValue(plan.stopLossPrice)}
                        </td>
                        <td className="px-4 py-4">
                          {formatOptionalValue(plan.takeProfitPrice)}
                        </td>
                        <td className="px-4 py-4">
                          {formatOptionalValue(plan.leverage)}
                        </td>
                        <td className="px-4 py-4">
                          {getOptionLabel(marginModeOptions, plan.marginMode)}
                        </td>
                        <td className="px-4 py-4">
                          {getOptionLabel(
                            emotionStateOptions,
                            plan.emotionState,
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {formatBoolean(plan.isChasingPrice)}
                        </td>
                        <td className="px-4 py-4">
                          {formatBoolean(plan.hasMacroEvent)}
                        </td>
                        <td className="px-4 py-4">
                          {formatBoolean(plan.hasStopLoss)}
                        </td>
                        <td className="px-4 py-4">
                          {latestRiskCheck ? latestRiskCheck.score : "未检查"}
                        </td>
                        <td className="px-4 py-4">
                          {latestRiskCheck ? (
                            <span
                              className={`inline-flex rounded border px-2 py-1 text-xs font-medium ${getRiskLevelClass(
                                latestRiskCheck.level,
                              )}`}
                            >
                              {getOptionLabel(
                                riskLevelOptions,
                                latestRiskCheck.level,
                              )}
                              {latestRiskCheck.level === "EXTREME"
                                ? "，不建议操作"
                                : ""}
                            </span>
                          ) : (
                            "未检查"
                          )}
                        </td>
                        <td className="max-w-md px-4 py-4 text-zinc-700">
                          {latestRiskCheck
                            ? formatReasons(latestRiskCheck.reasons)
                            : "未检查"}
                        </td>
                        <td className="max-w-md px-4 py-4 text-zinc-700">
                          {latestRiskCheck ? (
                            <div className="grid gap-2">
                              {latestRiskCheck.level === "EXTREME" ? (
                                <div className="inline-flex w-fit rounded border border-red-700 bg-red-100 px-2 py-1 text-xs font-semibold text-red-900">
                                  不建议操作
                                </div>
                              ) : null}
                              <div>
                                {formatOptionalValue(
                                  latestRiskCheck.suggestion,
                                )}
                              </div>
                            </div>
                          ) : (
                            "未检查"
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {latestPositionSizing
                            ? formatOptionalValue(
                                latestPositionSizing.positionValue,
                              )
                            : "未计算"}
                        </td>
                        <td className="px-4 py-4">
                          {latestPositionSizing
                            ? formatOptionalValue(
                                latestPositionSizing.lossAmountAtStop,
                              )
                            : "未计算"}
                        </td>
                        <td className="px-4 py-4">
                          {latestPositionSizing
                            ? formatOptionalValue(
                                latestPositionSizing.profitAmountAtTakeProfit,
                              )
                            : "未计算"}
                        </td>
                        <td className="px-4 py-4">
                          {latestPositionSizing ? (
                            <div className="grid gap-2">
                              <span>
                                {formatOptionalValue(
                                  latestPositionSizing.riskRewardRatio,
                                )}
                              </span>
                              {hasLowRiskRewardRatio ? (
                                <span className="inline-flex w-fit rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
                                  盈亏比偏低
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            "未计算"
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {latestPositionSizing ? (
                            <div className="grid gap-2">
                              <span>
                                {formatOptionalValue(
                                  latestPositionSizing.lossPercentOfTotalCapital,
                                )}
                              </span>
                              {isPositionTooHeavy ? (
                                <span className="inline-flex w-fit rounded border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                                  止损亏损超过总资金 2%，仓位可能过重。
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            "未计算"
                          )}
                        </td>
                        <td className="max-w-md px-4 py-4 text-zinc-700">
                          {latestPositionSizing ? (
                            <div className="grid gap-2">
                              {isPositionTooHeavy ? (
                                <div className="inline-flex w-fit rounded border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                                  仓位过重
                                </div>
                              ) : null}
                              <div>
                                {formatOptionalValue(
                                  latestPositionSizing.suggestion,
                                )}
                              </div>
                            </div>
                          ) : (
                            "未计算"
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {tradeRecord ? (
                            <span className="inline-flex rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                              已生成
                            </span>
                          ) : (
                            <span className="inline-flex rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-600">
                              未生成
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-zinc-600">
                          {tradeRecord
                            ? formatDate(tradeRecord.entryTime)
                            : "未生成交易记录"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-zinc-600">
                          {tradeRecord
                            ? formatOptionalDate(tradeRecord.exitTime)
                            : "未生成交易记录"}
                        </td>
                        <td className="px-4 py-4">
                          {tradeRecord
                            ? formatOptionalValue(tradeRecord.entryPrice)
                            : "未生成交易记录"}
                        </td>
                        <td className="px-4 py-4">
                          {tradeRecord
                            ? formatOptionalValue(tradeRecord.exitPrice)
                            : "未生成交易记录"}
                        </td>
                        <td className="px-4 py-4">
                          {tradeRecord
                            ? formatOptionalValue(tradeRecord.amount)
                            : "未生成交易记录"}
                        </td>
                        <td className="px-4 py-4">
                          {tradeRecord
                            ? formatOptionalValue(tradeRecord.leverage)
                            : "未生成交易记录"}
                        </td>
                        <td className="px-4 py-4">
                          {tradeRecord
                            ? formatOptionalValue(
                                tradeRecord.profitLossAmount,
                              )
                            : "未生成交易记录"}
                        </td>
                        <td className="px-4 py-4">
                          {tradeRecord
                            ? formatOptionalValue(
                                tradeRecord.profitLossPercent,
                              )
                            : "未生成交易记录"}
                        </td>
                        <td className="px-4 py-4">
                          {tradeRecord
                            ? formatBoolean(tradeRecord.followedPlan)
                            : "未生成交易记录"}
                        </td>
                        <td className="max-w-md px-4 py-4 text-zinc-700">
                          {tradeRecord
                            ? formatOptionalValue(tradeRecord.exitReason)
                            : "未生成交易记录"}
                        </td>
                        <td className="px-4 py-4">
                          {getOptionLabel(statusOptions, plan.status)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-zinc-600">
                          {formatDate(plan.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-2">
                            <form
                              action={generateRiskCheck.bind(null, plan.id)}
                            >
                              <button
                                type="submit"
                                className="h-9 rounded border border-zinc-300 px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                              >
                                生成风险检查
                              </button>
                            </form>
                            <form
                              action={generatePositionSizing.bind(
                                null,
                                plan.id,
                              )}
                            >
                              <button
                                type="submit"
                                className="h-9 rounded border border-zinc-300 px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                              >
                                生成仓位计算
                              </button>
                            </form>
                            {tradeRecord ? (
                              <button
                                type="button"
                                disabled
                                className="h-9 rounded border border-zinc-200 px-3 text-sm font-medium text-zinc-400"
                              >
                                已生成交易记录
                              </button>
                            ) : (
                              <form
                                action={generateTradeRecord.bind(
                                  null,
                                  plan.id,
                                )}
                              >
                                <button
                                  type="submit"
                                  className="h-9 rounded border border-zinc-300 px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                                >
                                  生成交易记录
                                </button>
                              </form>
                            )}
                            <form action={deleteTradePlan.bind(null, plan.id)}>
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
