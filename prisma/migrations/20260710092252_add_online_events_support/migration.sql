-- AlterTable
ALTER TABLE "events" ADD COLUMN     "is_online" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "hostel_name" DROP NOT NULL,
ALTER COLUMN "floor" DROP NOT NULL;
