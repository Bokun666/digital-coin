import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 px-5 py-10 text-zinc-950 sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="border-b border-zinc-200 pb-8">
          <p className="text-sm font-medium text-zinc-500">DigitalCoin</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal">
            交易辅助与风控复盘系统
          </h1>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/watchlist"
            className="rounded border border-zinc-200 bg-white p-5 transition hover:border-zinc-400"
          >
            <div className="text-sm font-medium text-zinc-500">/watchlist</div>
            <div className="mt-3 text-xl font-semibold">自选币</div>
          </Link>
        </section>
      </div>
    </main>
  );
}
