# DigitalCoin

DigitalCoin 是一个加密货币交易辅助、AI 分析、策略生成、风控复盘与因子权重演化系统。

当前阶段：Phase 1 手动录入版 MVP。

## 当前功能

- 自选币管理
- 交易计划模型
- 风险检查模型
- 仓位计算模型
- 交易记录模型
- 复盘模型

## 安全边界

- 不自动下单
- 不自动转账
- 不自动提现
- 不保存钱包私钥
- 不保存助记词
- 不接入带提现权限的 API Key
- GPT 只能做分析，不能直接执行交易

## 技术栈

- Next.js
- TypeScript
- React
- Prisma
- MySQL/MariaDB
- pnpm

## 本地启动

1. 安装依赖：

   ```bash
   pnpm install
   ```

2. 配置 `.env.local`：

   ```env
   DATABASE_URL="mysql://user:password@localhost:3306/digital_coin"
   ```

3. 生成 Prisma Client：

   ```bash
   pnpm prisma generate
   ```

4. 执行数据库迁移：

   ```bash
   pnpm prisma migrate dev
   ```

5. 启动开发服务：

   ```bash
   pnpm dev
   ```

## 数据库说明

项目使用 MySQL/MariaDB，Prisma datasource provider 保持为 `mysql`，运行时通过 `@prisma/adapter-mariadb` 初始化 Prisma Client。请只在本地环境文件中配置真实数据库连接，不要提交真实密码或密钥。
