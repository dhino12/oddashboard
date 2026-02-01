/*
  Warnings:

  - A unique constraint covering the columns `[source,entity]` on the table `incidents` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `uniq_open_incident` ON `incidents`;

-- CreateIndex
CREATE UNIQUE INDEX `uniq_open_incident` ON `incidents`(`source`, `entity`);
