import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/src/lib/prisma";

import {
  generatePositionSizing,
  generateRiskCheck,
  generateReview,
  generateTradeRecord,
  updateTradeRecord,
} from "../actions";

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

type TradePlanDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
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

function formatDateTimeLocal(value: Date | null | undefined): string {
  if (!value) {
    return "";
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
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

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded border border-zinc-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function InfoGrid({
  items,
}: {
  items: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <dl className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded border border-zinc-100 p-3">
          <dt className="text-xs font-medium text-zinc-500">{item.label}</dt>
          <dd className="mt-1 text-sm text-zinc-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ActionButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="h-9 rounded border border-zinc-300 px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
    >
      {children}
    </button>
  );
}

export default async function TradePlanDetailPage({
  params,
  searchParams,
}: TradePlanDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const error = Array.isArray(resolvedSearchParams.error)
    ? resolvedSearchParams.error[0]
    : resolvedSearchParams.error;

  const tradePlan = await prisma.tradePlan.findUnique({
    where: { id },
    include: {
      riskChecks: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      positionSizings: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      tradeRecord: {
        include: {
          review: true,
        },
      },
    },
  });

  if (!tradePlan) {
    notFound();
  }

  const latestRiskCheck = tradePlan.riskChecks[0];
  const latestPositionSizing = tradePlan.positionSizings[0];
  const tradeRecord = tradePlan.tradeRecord;
  const review = tradeRecord?.review;
  const isPositionTooHeavy = isGreaterThanTwo(
    latestPositionSizing?.lossPercentOfTotalCapital,
  );
  const hasLowRiskRewardRatio = isLessThanOne(
    latestPositionSizing?.riskRewardRatio,
  );

  return (
    <main className="min-h-screen bg-zinc-50 px-5 py-8 text-zinc-950 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded border border-zinc-200 bg-white p-5">
          <Link
            href="/trade-plans"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
          >
            返回交易计划列表
          </Link>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-normal">
                交易计划详情
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                {tradePlan.coinSymbol} ·{" "}
                {getOptionLabel(
                  operationTypeOptions,
                  tradePlan.operationType,
                )}{" "}
                · {getOptionLabel(statusOptions, tradePlan.status)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={generateRiskCheck.bind(null, tradePlan.id)}>
                <ActionButton>生成风险检查</ActionButton>
              </form>
              <form action={generatePositionSizing.bind(null, tradePlan.id)}>
                <ActionButton>生成仓位计算</ActionButton>
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
                <form action={generateTradeRecord.bind(null, tradePlan.id)}>
                  <ActionButton>生成交易记录</ActionButton>
                </form>
              )}
              {!tradeRecord ? (
                <button
                  type="button"
                  disabled
                  className="h-9 rounded border border-zinc-200 px-3 text-sm font-medium text-zinc-400"
                >
                  请先生成交易记录
                </button>
              ) : review ? (
                <button
                  type="button"
                  disabled
                  className="h-9 rounded border border-zinc-200 px-3 text-sm font-medium text-zinc-400"
                >
                  已生成复盘
                </button>
              ) : (
                <form action={generateReview.bind(null, tradeRecord.id)}>
                  <ActionButton>生成复盘</ActionButton>
                </form>
              )}
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <DetailSection title="交易计划基础信息">
          <InfoGrid
            items={[
              { label: "币种", value: tradePlan.coinSymbol },
              {
                label: "操作类型",
                value: getOptionLabel(
                  operationTypeOptions,
                  tradePlan.operationType,
                ),
              },
              {
                label: "方向",
                value: getOptionLabel(directionOptions, tradePlan.direction),
              },
              {
                label: "计划投入金额",
                value: formatOptionalValue(tradePlan.plannedAmount),
              },
              {
                label: "当前总资金",
                value: formatOptionalValue(tradePlan.totalCapital),
              },
              {
                label: "当前价格",
                value: formatOptionalValue(tradePlan.currentPrice),
              },
              {
                label: "入场价",
                value: formatOptionalValue(tradePlan.entryPrice),
              },
              {
                label: "止损价",
                value: formatOptionalValue(tradePlan.stopLossPrice),
              },
              {
                label: "止盈价",
                value: formatOptionalValue(tradePlan.takeProfitPrice),
              },
              {
                label: "杠杆倍数",
                value: formatOptionalValue(tradePlan.leverage),
              },
              {
                label: "保证金模式",
                value: getOptionLabel(marginModeOptions, tradePlan.marginMode),
              },
              {
                label: "最大可接受亏损",
                value: formatOptionalValue(tradePlan.maxAcceptableLoss),
              },
              {
                label: "是否有重大宏观事件",
                value: formatBoolean(tradePlan.hasMacroEvent),
              },
              {
                label: "是否追涨",
                value: formatBoolean(tradePlan.isChasingPrice),
              },
              {
                label: "是否设置止损",
                value: formatBoolean(tradePlan.hasStopLoss),
              },
              {
                label: "当前情绪状态",
                value: getOptionLabel(
                  emotionStateOptions,
                  tradePlan.emotionState,
                ),
              },
              {
                label: "计划状态",
                value: getOptionLabel(statusOptions, tradePlan.status),
              },
              { label: "创建时间", value: formatDate(tradePlan.createdAt) },
              { label: "更新时间", value: formatDate(tradePlan.updatedAt) },
            ]}
          />
          <div className="mt-4 rounded border border-zinc-100 p-3">
            <div className="text-xs font-medium text-zinc-500">入场理由</div>
            <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-900">
              {tradePlan.reason}
            </div>
          </div>
        </DetailSection>

        <DetailSection title="风险检查 RiskCheck">
          {latestRiskCheck ? (
            <div className="grid gap-4">
              {latestRiskCheck.level === "EXTREME" ? (
                <div className="rounded border border-red-700 bg-red-100 px-3 py-2 text-sm font-semibold text-red-900">
                  不建议操作
                </div>
              ) : null}
              <InfoGrid
                items={[
                  { label: "风险分", value: latestRiskCheck.score },
                  {
                    label: "风险等级",
                    value: getOptionLabel(
                      riskLevelOptions,
                      latestRiskCheck.level,
                    ),
                  },
                  {
                    label: "创建时间",
                    value: formatDate(latestRiskCheck.createdAt),
                  },
                ]}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded border border-zinc-100 p-3">
                  <div className="text-xs font-medium text-zinc-500">
                    风险原因
                  </div>
                  <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-900">
                    {formatReasons(latestRiskCheck.reasons)}
                  </div>
                </div>
                <div className="rounded border border-zinc-100 p-3">
                  <div className="text-xs font-medium text-zinc-500">
                    系统建议
                  </div>
                  <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-900">
                    {formatOptionalValue(latestRiskCheck.suggestion)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-zinc-600">尚未生成风险检查</p>
              <form action={generateRiskCheck.bind(null, tradePlan.id)}>
                <ActionButton>生成风险检查</ActionButton>
              </form>
            </div>
          )}
        </DetailSection>

        <DetailSection title="仓位计算 PositionSizing">
          {latestPositionSizing ? (
            <div className="grid gap-4">
              <div className="flex flex-wrap gap-2">
                {isPositionTooHeavy ? (
                  <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                    止损亏损超过总资金 2%，仓位可能过重。
                  </div>
                ) : null}
                {hasLowRiskRewardRatio ? (
                  <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                    盈亏比偏低。
                  </div>
                ) : null}
              </div>
              <InfoGrid
                items={[
                  {
                    label: "实际仓位价值",
                    value: formatOptionalValue(
                      latestPositionSizing.positionValue,
                    ),
                  },
                  {
                    label: "止损亏损金额",
                    value: formatOptionalValue(
                      latestPositionSizing.lossAmountAtStop,
                    ),
                  },
                  {
                    label: "止盈盈利金额",
                    value: formatOptionalValue(
                      latestPositionSizing.profitAmountAtTakeProfit,
                    ),
                  },
                  {
                    label: "盈亏比",
                    value: formatOptionalValue(
                      latestPositionSizing.riskRewardRatio,
                    ),
                  },
                  {
                    label: "止损亏损占总资金比例",
                    value: formatOptionalValue(
                      latestPositionSizing.lossPercentOfTotalCapital,
                    ),
                  },
                  {
                    label: "是否有效",
                    value: formatBoolean(latestPositionSizing.isValid),
                  },
                  {
                    label: "创建时间",
                    value: formatDate(latestPositionSizing.createdAt),
                  },
                ]}
              />
              <div className="rounded border border-zinc-100 p-3">
                <div className="text-xs font-medium text-zinc-500">
                  仓位建议
                </div>
                <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-900">
                  {formatOptionalValue(latestPositionSizing.suggestion)}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-zinc-600">尚未生成仓位计算</p>
              <form action={generatePositionSizing.bind(null, tradePlan.id)}>
                <ActionButton>生成仓位计算</ActionButton>
              </form>
            </div>
          )}
        </DetailSection>

        <DetailSection title="交易记录 TradeRecord">
          {tradeRecord ? (
            <div className="grid gap-6">
              <InfoGrid
                items={[
                  {
                    label: "入场时间",
                    value: formatDate(tradeRecord.entryTime),
                  },
                  {
                    label: "出场时间",
                    value: formatOptionalDate(tradeRecord.exitTime),
                  },
                  {
                    label: "入场价",
                    value: formatOptionalValue(tradeRecord.entryPrice),
                  },
                  {
                    label: "出场价",
                    value: formatOptionalValue(tradeRecord.exitPrice),
                  },
                  {
                    label: "投入金额",
                    value: formatOptionalValue(tradeRecord.amount),
                  },
                  {
                    label: "杠杆倍数",
                    value: formatOptionalValue(tradeRecord.leverage),
                  },
                  {
                    label: "盈亏金额",
                    value: formatOptionalValue(tradeRecord.profitLossAmount),
                  },
                  {
                    label: "盈亏比例",
                    value: formatOptionalValue(tradeRecord.profitLossPercent),
                  },
                  {
                    label: "是否遵守计划",
                    value: formatBoolean(tradeRecord.followedPlan),
                  },
                  {
                    label: "出场原因",
                    value: formatOptionalValue(tradeRecord.exitReason),
                  },
                  {
                    label: "创建时间",
                    value: formatDate(tradeRecord.createdAt),
                  },
                  {
                    label: "更新时间",
                    value: formatDate(tradeRecord.updatedAt),
                  },
                ]}
              />

              <form
                action={updateTradeRecord.bind(null, tradeRecord.id)}
                className="grid gap-4 rounded border border-zinc-200 p-4"
              >
                <h3 className="text-base font-semibold text-zinc-950">
                  编辑交易记录
                </h3>
                <p className="text-sm text-zinc-500">
                  盈亏金额和盈亏比例需要手动填写，系统暂不自动计算手续费、滑点、资金费率和分批成交影响。
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-zinc-700">
                    入场时间
                    <input
                      name="entryTime"
                      type="datetime-local"
                      defaultValue={formatDateTimeLocal(
                        tradeRecord.entryTime,
                      )}
                      className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-zinc-700">
                    出场时间
                    <input
                      name="exitTime"
                      type="datetime-local"
                      defaultValue={formatDateTimeLocal(tradeRecord.exitTime)}
                      className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                    />
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <label className="grid gap-2 text-sm font-medium text-zinc-700">
                    入场价
                    <input
                      name="entryPrice"
                      inputMode="decimal"
                      defaultValue={tradeRecord.entryPrice.toString()}
                      className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-zinc-700">
                    出场价
                    <input
                      name="exitPrice"
                      inputMode="decimal"
                      defaultValue={tradeRecord.exitPrice?.toString() ?? ""}
                      className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-zinc-700">
                    投入金额
                    <input
                      name="amount"
                      inputMode="decimal"
                      defaultValue={tradeRecord.amount.toString()}
                      className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-zinc-700">
                    杠杆倍数
                    <input
                      name="leverage"
                      inputMode="decimal"
                      defaultValue={tradeRecord.leverage.toString()}
                      className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                      required
                    />
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-zinc-700">
                    盈亏金额
                    <input
                      name="profitLossAmount"
                      inputMode="decimal"
                      defaultValue={
                        tradeRecord.profitLossAmount?.toString() ?? ""
                      }
                      className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-zinc-700">
                    盈亏比例
                    <input
                      name="profitLossPercent"
                      inputMode="decimal"
                      defaultValue={
                        tradeRecord.profitLossPercent?.toString() ?? ""
                      }
                      className="h-10 rounded border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-900"
                      required
                    />
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                  <input
                    name="followedPlan"
                    type="checkbox"
                    defaultChecked={tradeRecord.followedPlan}
                  />
                  是否遵守计划
                </label>
                <label className="grid gap-2 text-sm font-medium text-zinc-700">
                  出场原因
                  <textarea
                    name="exitReason"
                    rows={3}
                    defaultValue={tradeRecord.exitReason ?? ""}
                    className="rounded border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-900"
                    required
                  />
                </label>
                <div>
                  <ActionButton>保存交易记录</ActionButton>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-zinc-600">尚未生成交易记录</p>
              <form action={generateTradeRecord.bind(null, tradePlan.id)}>
                <ActionButton>生成交易记录</ActionButton>
              </form>
            </div>
          )}
        </DetailSection>

        <DetailSection title="复盘 Review">
          {review ? (
            <InfoGrid
              items={[
                {
                  label: "是否遵守计划复盘",
                  value: formatOptionalValue(review.followedPlanReview),
                },
                {
                  label: "情绪状态复盘",
                  value: formatOptionalValue(review.emotionReview),
                },
                {
                  label: "错误总结",
                  value: formatOptionalValue(review.mistake),
                },
                {
                  label: "经验教训",
                  value: formatOptionalValue(review.lesson),
                },
                {
                  label: "下次改进",
                  value: formatOptionalValue(review.nextAction),
                },
                { label: "创建时间", value: formatDate(review.createdAt) },
                { label: "更新时间", value: formatDate(review.updatedAt) },
              ]}
            />
          ) : tradeRecord ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-zinc-600">尚未生成复盘</p>
              <form action={generateReview.bind(null, tradeRecord.id)}>
                <ActionButton>生成复盘</ActionButton>
              </form>
            </div>
          ) : (
            <p className="text-sm text-zinc-600">
              请先生成交易记录，再生成复盘。
            </p>
          )}
        </DetailSection>
      </div>
    </main>
  );
}
