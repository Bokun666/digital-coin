import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 px-5 py-10 text-zinc-950 sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="border-b border-zinc-200 pb-8">
          <p className="text-sm font-medium text-zinc-500">DigitalCoin</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal">
            手动交易辅助与风控复盘系统
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
            用于记录自选币、交易计划、风险检查、仓位计算、交易记录和复盘。
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/watchlist"
            className="rounded border border-zinc-200 bg-white p-5 transition hover:border-zinc-400"
          >
            <div className="text-sm font-medium text-zinc-500">/watchlist</div>
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
              记录每次交易前的入场理由、止损止盈、仓位和风险要素。
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
