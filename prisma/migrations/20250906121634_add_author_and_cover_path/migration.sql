-- AlterTable
ALTER TABLE `Book` ADD COLUMN `author` VARCHAR(191) NULL,
    ADD COLUMN `coverPath` VARCHAR(191) NULL,
    MODIFY `description` TEXT NULL,
    MODIFY `pdfPath` VARCHAR(191) NULL,
    MODIFY `genre` VARCHAR(191) NULL;
