/*
  Warnings:

  - A unique constraint covering the columns `[metaAccountId,metaCampaignId]` on the table `campaigns` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,accountId]` on the table `meta_accounts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `metaCampaignId` to the `campaigns` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `campaigns` ADD COLUMN `metaCampaignId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `campaigns_metaAccountId_metaCampaignId_key` ON `campaigns`(`metaAccountId`, `metaCampaignId`);

-- CreateIndex
CREATE UNIQUE INDEX `meta_accounts_userId_accountId_key` ON `meta_accounts`(`userId`, `accountId`);
