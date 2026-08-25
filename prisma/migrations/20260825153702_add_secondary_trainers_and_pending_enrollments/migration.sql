-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EnrollmentStatus" ADD VALUE 'PENDING';
ALTER TYPE "EnrollmentStatus" ADD VALUE 'REJECTED';

-- CreateTable
CREATE TABLE "course_trainers" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SECONDARY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_trainers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_invitations" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'TRAINER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_trainers_courseId_trainerId_key" ON "course_trainers"("courseId", "trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "course_invitations_courseId_email_key" ON "course_invitations"("courseId", "email");

-- AddForeignKey
ALTER TABLE "course_trainers" ADD CONSTRAINT "course_trainers_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_trainers" ADD CONSTRAINT "course_trainers_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_invitations" ADD CONSTRAINT "course_invitations_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
