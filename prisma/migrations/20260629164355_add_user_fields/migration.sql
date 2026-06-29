-- CreateEnum
CREATE TYPE "College" AS ENUM ('VIT_VELLORE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "college" "College",
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "pfp" TEXT,
ALTER COLUMN "hostel" DROP NOT NULL,
ALTER COLUMN "floor" DROP NOT NULL;
