# Risk Services

第一阶段只做本地手动录入、风险评分和仓位计算，不接交易所 API，不自动交易。

金额、价格、比例、杠杆输入建议使用字符串或 Prisma Decimal，避免普通 float 精度问题。前端统一以 string 传入；服务输出中的 Decimal 展示前可调用 `.toString()`。

```ts
import { calculatePositionSizing } from "@/src/lib/risk/positionSizingService";
import { calculateRiskCheck } from "@/src/lib/risk/riskCheckService";

const positionSizing = calculatePositionSizing({
  totalCapital: "10000",
  plannedAmount: "500",
  leverage: "2",
  entryPrice: "100",
  stopLossPrice: "95",
  takeProfitPrice: "110",
  direction: "LONG",
  operationType: "FUTURES",
});

const riskCheck = calculateRiskCheck({
  operationType: "FUTURES",
  direction: "LONG",
  plannedAmount: "500",
  totalCapital: "10000",
  entryPrice: "100",
  stopLossPrice: "95",
  takeProfitPrice: "110",
  leverage: "2",
  marginMode: "ISOLATED",
  hasStopLoss: true,
  hasMacroEvent: false,
  isChasingPrice: false,
  emotionState: "CALM",
});
```

Prisma 7.8 使用 MySQL datasource，连接串由 `prisma.config.ts` 从环境变量读取。该配置会读取本地 `.env.local`，不要把数据库密码写进源码或提交到 GitHub。

第一阶段 Prisma migrate 只包含核心闭环模型：`WatchCoin`、`TradePlan`、`RiskCheck`、`PositionSizing`、`TradeRecord`、`Review`、`AssetSnapshot`。AI、Strategy、Factor 相关模型先保留在 docs，等基础闭环跑通后再加。

后续页面设计中，普通现货 `SELL` 不建议走 `TradePlan + PositionSizing`，更适合直接记录到 `TradeRecord`；如需做空，应使用合约方向 `SHORT`。

本地 `.env.local` 示例：

```env
DATABASE_URL="mysql://root:root@localhost:3306/digital_coin"
```

初始化和迁移命令：

```bash
pnpm approve-builds
pnpm exec prisma generate
pnpm exec prisma migrate dev --name init
```

`pnpm approve-builds` 时只应在确认来源后批准官方 Prisma 相关 build scripts，例如 `prisma`、`@prisma/client` 和 `@prisma/engines`。
