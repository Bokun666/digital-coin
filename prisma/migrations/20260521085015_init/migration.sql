-- CreateTable
CREATE TABLE `WatchCoin` (
    `id` VARCHAR(191) NOT NULL,
    `symbol` VARCHAR(32) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `category` ENUM('MAINSTREAM', 'ALTCOIN', 'MEME', 'MINING', 'AI', 'RWA', 'DEPIN', 'STABLECOIN', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `watchReason` TEXT NOT NULL,
    `supportPrice` DECIMAL(36, 18) NULL,
    `resistancePrice` DECIMAL(36, 18) NULL,
    `riskTags` TEXT NULL,
    `status` ENUM('WATCHING', 'INTERESTED', 'HOLDING', 'ABANDONED') NOT NULL DEFAULT 'WATCHING',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WatchCoin_category_idx`(`category`),
    INDEX `WatchCoin_status_idx`(`status`),
    UNIQUE INDEX `WatchCoin_symbol_key`(`symbol`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TradePlan` (
    `id` VARCHAR(191) NOT NULL,
    `coinSymbol` VARCHAR(32) NOT NULL,
    `watchCoinId` VARCHAR(191) NULL,
    `operationType` ENUM('SPOT', 'SPOT_GRID', 'FUTURES', 'FUTURES_GRID', 'DCA', 'STABLE_EARN', 'OTHER') NOT NULL,
    `direction` ENUM('BUY', 'SELL', 'LONG', 'SHORT', 'NONE') NOT NULL,
    `plannedAmount` DECIMAL(36, 18) NOT NULL,
    `totalCapital` DECIMAL(36, 18) NOT NULL,
    `currentPrice` DECIMAL(36, 18) NULL,
    `entryPrice` DECIMAL(36, 18) NOT NULL,
    `stopLossPrice` DECIMAL(36, 18) NULL,
    `takeProfitPrice` DECIMAL(36, 18) NULL,
    `leverage` DECIMAL(10, 4) NOT NULL DEFAULT 1,
    `marginMode` ENUM('NONE', 'ISOLATED', 'CROSS') NOT NULL DEFAULT 'NONE',
    `reason` TEXT NOT NULL,
    `maxAcceptableLoss` DECIMAL(36, 18) NULL,
    `hasMacroEvent` BOOLEAN NOT NULL DEFAULT false,
    `isChasingPrice` BOOLEAN NOT NULL DEFAULT false,
    `hasStopLoss` BOOLEAN NOT NULL DEFAULT false,
    `emotionState` ENUM('CALM', 'ANXIOUS', 'FOMO', 'REVENGE', 'IMPULSIVE', 'FEAR', 'GREED', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    `status` ENUM('DRAFT', 'PASSED', 'MEDIUM_RISK', 'HIGH_RISK', 'EXTREME_RISK', 'EXECUTED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TradePlan_coinSymbol_idx`(`coinSymbol`),
    INDEX `TradePlan_watchCoinId_idx`(`watchCoinId`),
    INDEX `TradePlan_operationType_idx`(`operationType`),
    INDEX `TradePlan_direction_idx`(`direction`),
    INDEX `TradePlan_status_idx`(`status`),
    INDEX `TradePlan_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RiskCheck` (
    `id` VARCHAR(191) NOT NULL,
    `tradePlanId` VARCHAR(191) NOT NULL,
    `inputSnapshot` JSON NULL,
    `score` INTEGER NOT NULL,
    `level` ENUM('LOW', 'MEDIUM', 'HIGH', 'EXTREME') NOT NULL,
    `reasons` JSON NOT NULL,
    `suggestion` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RiskCheck_tradePlanId_idx`(`tradePlanId`),
    INDEX `RiskCheck_level_idx`(`level`),
    INDEX `RiskCheck_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PositionSizing` (
    `id` VARCHAR(191) NOT NULL,
    `tradePlanId` VARCHAR(191) NOT NULL,
    `inputSnapshot` JSON NULL,
    `isValid` BOOLEAN NOT NULL DEFAULT true,
    `validationErrors` JSON NULL,
    `positionValue` DECIMAL(36, 18) NULL,
    `lossAmountAtStop` DECIMAL(36, 18) NULL,
    `profitAmountAtTakeProfit` DECIMAL(36, 18) NULL,
    `riskRewardRatio` DECIMAL(18, 8) NULL,
    `lossPercentOfTotalCapital` DECIMAL(18, 8) NULL,
    `suggestion` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PositionSizing_tradePlanId_idx`(`tradePlanId`),
    INDEX `PositionSizing_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TradeRecord` (
    `id` VARCHAR(191) NOT NULL,
    `tradePlanId` VARCHAR(191) NULL,
    `coinSymbol` VARCHAR(32) NOT NULL,
    `operationType` ENUM('SPOT', 'SPOT_GRID', 'FUTURES', 'FUTURES_GRID', 'DCA', 'STABLE_EARN', 'OTHER') NOT NULL,
    `direction` ENUM('BUY', 'SELL', 'LONG', 'SHORT', 'NONE') NOT NULL,
    `entryTime` DATETIME(3) NOT NULL,
    `exitTime` DATETIME(3) NULL,
    `entryPrice` DECIMAL(36, 18) NOT NULL,
    `exitPrice` DECIMAL(36, 18) NULL,
    `amount` DECIMAL(36, 18) NOT NULL,
    `leverage` DECIMAL(10, 4) NOT NULL DEFAULT 1,
    `profitLossAmount` DECIMAL(36, 18) NULL,
    `profitLossPercent` DECIMAL(18, 8) NULL,
    `followedPlan` BOOLEAN NOT NULL DEFAULT false,
    `exitReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TradeRecord_tradePlanId_key`(`tradePlanId`),
    INDEX `TradeRecord_coinSymbol_idx`(`coinSymbol`),
    INDEX `TradeRecord_operationType_idx`(`operationType`),
    INDEX `TradeRecord_direction_idx`(`direction`),
    INDEX `TradeRecord_entryTime_idx`(`entryTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Review` (
    `id` VARCHAR(191) NOT NULL,
    `tradeRecordId` VARCHAR(191) NOT NULL,
    `followedPlanReview` TEXT NULL,
    `emotionReview` TEXT NULL,
    `mistake` TEXT NULL,
    `lesson` TEXT NULL,
    `nextAction` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Review_tradeRecordId_key`(`tradeRecordId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AssetSnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `snapshotDate` DATETIME(3) NOT NULL,
    `totalAssetCny` DECIMAL(36, 18) NOT NULL DEFAULT 0,
    `totalAssetUsdt` DECIMAL(36, 18) NOT NULL DEFAULT 0,
    `stablecoinAmount` DECIMAL(36, 18) NOT NULL DEFAULT 0,
    `spotAmount` DECIMAL(36, 18) NOT NULL DEFAULT 0,
    `futuresMargin` DECIMAL(36, 18) NOT NULL DEFAULT 0,
    `earnAmount` DECIMAL(36, 18) NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AssetSnapshot_snapshotDate_idx`(`snapshotDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TradePlan` ADD CONSTRAINT `TradePlan_watchCoinId_fkey` FOREIGN KEY (`watchCoinId`) REFERENCES `WatchCoin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RiskCheck` ADD CONSTRAINT `RiskCheck_tradePlanId_fkey` FOREIGN KEY (`tradePlanId`) REFERENCES `TradePlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PositionSizing` ADD CONSTRAINT `PositionSizing_tradePlanId_fkey` FOREIGN KEY (`tradePlanId`) REFERENCES `TradePlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TradeRecord` ADD CONSTRAINT `TradeRecord_tradePlanId_fkey` FOREIGN KEY (`tradePlanId`) REFERENCES `TradePlan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_tradeRecordId_fkey` FOREIGN KEY (`tradeRecordId`) REFERENCES `TradeRecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
