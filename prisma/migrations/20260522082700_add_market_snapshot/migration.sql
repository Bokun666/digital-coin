-- CreateTable
CREATE TABLE `MarketSnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `symbol` VARCHAR(32) NOT NULL,
    `snapshotTime` DATETIME(3) NOT NULL,
    `marketRegime` ENUM('BULL', 'BEAR', 'RANGE', 'CRASH', 'RECOVERY', 'HIGH_VOLATILITY', 'LOW_VOLATILITY', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    `currentPrice` DECIMAL(36, 18) NULL,
    `klineSummary` TEXT NULL,
    `macroSummary` TEXT NULL,
    `contractSummary` TEXT NULL,
    `onChainSummary` TEXT NULL,
    `newsSummary` TEXT NULL,
    `dataSources` TEXT NULL,
    `screenshotPath` TEXT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MarketSnapshot_symbol_idx`(`symbol`),
    INDEX `MarketSnapshot_snapshotTime_idx`(`snapshotTime`),
    INDEX `MarketSnapshot_marketRegime_idx`(`marketRegime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
