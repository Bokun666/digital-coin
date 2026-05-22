-- CreateTable
CREATE TABLE `UserConclusion` (
    `id` VARCHAR(191) NOT NULL,
    `symbol` VARCHAR(32) NOT NULL,
    `marketSnapshotId` VARCHAR(191) NULL,
    `userBias` ENUM('BULLISH', 'BEARISH', 'NEUTRAL', 'RANGE', 'VOLATILE', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    `userConfidence` INTEGER NOT NULL,
    `userReason` TEXT NOT NULL,
    `intendedStrategy` ENUM('DCA', 'SPOT_GRID', 'FUTURES_GRID', 'FUTURES_TRAIN', 'ALTCOIN', 'MINING_COIN', 'STABLE_EARN', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `plannedParameters` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserConclusion_symbol_idx`(`symbol`),
    INDEX `UserConclusion_marketSnapshotId_idx`(`marketSnapshotId`),
    INDEX `UserConclusion_userBias_idx`(`userBias`),
    INDEX `UserConclusion_intendedStrategy_idx`(`intendedStrategy`),
    INDEX `UserConclusion_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserConclusion` ADD CONSTRAINT `UserConclusion_marketSnapshotId_fkey` FOREIGN KEY (`marketSnapshotId`) REFERENCES `MarketSnapshot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
