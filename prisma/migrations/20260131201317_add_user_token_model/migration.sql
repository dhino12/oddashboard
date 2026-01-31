-- CreateTable
CREATE TABLE `user_token` (
    `key` VARCHAR(50) NOT NULL,
    `token` TEXT NOT NULL,
    `expires_at` BIGINT NOT NULL,
    `username` VARCHAR(80) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `monitoring_events` (
    `id` VARCHAR(100) NOT NULL,
    `source` VARCHAR(80) NOT NULL,
    `entity` VARCHAR(80) NOT NULL,
    `status` VARCHAR(80) NOT NULL,
    `occurred_at` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_window`(`source`, `entity`, `occurred_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `monitoring_state` (
    `source` VARCHAR(80) NOT NULL,
    `entity` VARCHAR(80) NOT NULL,
    `last_status` VARCHAR(80) NOT NULL,
    `last_changed_at` BIGINT NOT NULL,

    UNIQUE INDEX `monitoring_state_entity_key`(`entity`),
    PRIMARY KEY (`source`, `entity`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `incidents` (
    `id` VARCHAR(100) NOT NULL,
    `source` VARCHAR(80) NOT NULL,
    `entity` VARCHAR(80) NOT NULL,
    `status` ENUM('OPEN', 'SUCCESS', 'CLOSED', 'FAILURE', 'RESOLVED') NOT NULL,
    `reason` MEDIUMTEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolved_at` DATETIME(3) NULL,

    UNIQUE INDEX `uniq_open_incident`(`source`, `entity`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
