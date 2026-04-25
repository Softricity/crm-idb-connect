-- AlterEnum
ALTER TYPE "InquiryStatus" ADD VALUE 'APPROVED';

-- AlterTable
ALTER TABLE "agent_inquiries" ADD COLUMN     "accreditation_details" TEXT,
ADD COLUMN     "associations" TEXT,
ADD COLUMN     "company_address" TEXT,
ADD COLUMN     "contact_person" TEXT,
ADD COLUMN     "moe_approvals" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "category_id" UUID;

-- CreateTable
CREATE TABLE "agent_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_university_access" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL,
    "university_id" TEXT NOT NULL,
    "commission_percent" DECIMAL(5,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_university_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_inquiry_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inquiry_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_inquiry_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_categories_name_key" ON "agent_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "category_university_access_category_id_university_id_key" ON "category_university_access"("category_id", "university_id");

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "agent_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_university_access" ADD CONSTRAINT "category_university_access_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "agent_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_university_access" ADD CONSTRAINT "category_university_access_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_inquiry_documents" ADD CONSTRAINT "agent_inquiry_documents_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "agent_inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

