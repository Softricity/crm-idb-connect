CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "academic_level_enum" AS ENUM ('Class Xth/SSC', 'Class XIIth/HSC', 'Graduation', 'Post Graduation');

-- CreateEnum
CREATE TYPE "category_enum" AS ENUM ('GENERAL', 'OBC', 'SC', 'ST', 'EWS');

-- CreateEnum
CREATE TYPE "gender_enum" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "marital_status_enum" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "marking_scheme_enum" AS ENUM ('PERCENTAGE', 'CGPA OUT OF 10', 'CGPA OUT OF 4');

-- CreateEnum
CREATE TYPE "result_status_enum" AS ENUM ('DECLARED', 'AWAITED');

-- CreateEnum
CREATE TYPE "timeline_event" AS ENUM ('LEAD_CREATED', 'LEAD_NAME_CHANGED', 'LEAD_PHONE_CHANGED', 'LEAD_EMAIL_CHANGED', 'LEAD_PURPOSE_CHANGED', 'LEAD_OWNER_CHANGED', 'LEAD_STATUS_CHANGED', 'LEAD_NOTE_ADDED', 'LEAD_NOTE_DELETED', 'LEAD_NOTE_UPDATED', 'LEAD_FOLLOWUP_ADDED', 'LEAD_FOLLOWUP_DELETED', 'LEAD_FOLLOWUP_UPDATED', 'LEAD_FOLLOWUP_DATE_EXTENDED', 'LEAD_FOLLOWUP_COMPLETED', 'LEAD_FOLLOWUP_COMMENT_ADDED', 'LEAD_FOLLOWUP_COMMENT_DELETED', 'LEAD_FOLLOWUP_COMMENT_UPDATED');

-- CreateTable
CREATE TABLE "announcement_reads" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "announcement_id" UUID,
    "partner_id" UUID,
    "read_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "target_audience" TEXT NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN DEFAULT true,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_addresses" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "application_id" UUID NOT NULL,
    "is_permanent_same_as_correspondence" BOOLEAN,
    "correspondence_address_line_1" TEXT,
    "correspondence_address_line_2" TEXT,
    "correspondence_city" TEXT,
    "correspondence_district" TEXT,
    "correspondence_state" TEXT,
    "correspondence_country" TEXT,
    "correspondence_pincode" TEXT,
    "permanent_address_line_1" TEXT,
    "permanent_address_line_2" TEXT,
    "permanent_city" TEXT,
    "permanent_district" TEXT,
    "permanent_state" TEXT,
    "permanent_country" TEXT,
    "permanent_pincode" TEXT,

    CONSTRAINT "application_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_declarations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "application_id" UUID NOT NULL,
    "declaration_agreed" BOOLEAN,
    "declaration_applicant_name" TEXT,
    "declaration_parent_name" TEXT,
    "declaration_date" DATE,
    "declaration_place" TEXT,

    CONSTRAINT "application_declarations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_documents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "application_id" UUID NOT NULL,
    "passport_photo_url" TEXT,
    "class_x_marksheet_url" TEXT,
    "class_xii_marksheet_url" TEXT,
    "graduation_marksheet_url" TEXT,
    "aadhaar_card_url" TEXT,
    "entrance_exam_scorecard_url" TEXT,
    "work_experience_certificates_url" TEXT,
    "passport_url" TEXT,

    CONSTRAINT "application_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_family_details" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "application_id" UUID NOT NULL,
    "father_title" TEXT,
    "father_name" TEXT,
    "father_email" TEXT,
    "father_mobile" TEXT,
    "father_occupation" TEXT,
    "mother_title" TEXT,
    "mother_name" TEXT,
    "mother_email" TEXT,
    "mother_mobile" TEXT,
    "mother_occupation" TEXT,
    "guardian_title" TEXT,
    "guardian_name" TEXT,
    "guardian_email" TEXT,
    "guardian_mobile" TEXT,
    "guardian_occupation" TEXT,
    "guardian_relationship" TEXT,
    "family_annual_income" TEXT,

    CONSTRAINT "application_family_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_identifications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "application_id" UUID NOT NULL,
    "aadhaar_number" TEXT,
    "pan_card_number" TEXT,
    "passport_number" TEXT,
    "passport_issuing_country" TEXT,
    "passport_valid_upto" DATE,

    CONSTRAINT "application_identifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_preferences" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "application_id" UUID NOT NULL,
    "hostel_facility_required" BOOLEAN,
    "hostel_type" TEXT,
    "travel_accommodation_required" BOOLEAN,
    "has_given_exam" BOOLEAN,
    "has_work_experience" BOOLEAN,

    CONSTRAINT "application_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "lead_id" UUID NOT NULL,
    "program_discipline" TEXT,
    "program_course" TEXT,
    "title" TEXT,
    "dob" DATE,
    "gender" "gender_enum",
    "marital_status" "marital_status_enum",
    "category" "category_enum",
    "religion" TEXT,
    "nationality" TEXT,
    "blood_group" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followup_comments" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "text" TEXT,
    "followup_id" UUID,
    "created_by" UUID,

    CONSTRAINT "followup_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "title" TEXT,
    "lead_id" UUID,
    "completed" BOOLEAN,
    "created_by" UUID,
    "due_date" TIMESTAMPTZ(6),

    CONSTRAINT "followups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "alternate_mobile" TEXT,
    "type" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "preferred_country" TEXT,
    "status" TEXT NOT NULL,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "assigned_to" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "reason" TEXT,
    "password" TEXT DEFAULT '',
    "is_flagged" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "text" TEXT,
    "lead_id" UUID,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offline_payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payment_mode" TEXT,
    "currency" TEXT NOT NULL,
    "amount" BIGINT,
    "payment_type" TEXT NOT NULL,
    "reference_id" TEXT,
    "receiver" UUID,
    "lead_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT,
    "file" TEXT,

    CONSTRAINT "offline_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "remarks" TEXT,
    "agency_name" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id" UUID NOT NULL,
    "event_type" "timeline_event" NOT NULL,
    "old_state" TEXT,
    "new_state" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "announcement_reads_announcement_id_partner_id_key" ON "announcement_reads"("announcement_id", "partner_id");

-- CreateIndex
CREATE UNIQUE INDEX "leads_email_key" ON "leads"("email");

-- CreateIndex
CREATE UNIQUE INDEX "leads_mobile_key" ON "leads"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "partners_email_key" ON "partners"("email");

-- CreateIndex
CREATE UNIQUE INDEX "partners_mobile_key" ON "partners"("mobile");

-- CreateIndex
CREATE INDEX "idx_timeline_created_at" ON "timeline"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_timeline_created_by" ON "timeline"("created_by");

-- CreateIndex
CREATE INDEX "idx_timeline_event_type" ON "timeline"("event_type");

-- CreateIndex
CREATE INDEX "idx_timeline_lead_id" ON "timeline"("lead_id");

-- AddForeignKey
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_addresses" ADD CONSTRAINT "application_addresses_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_declarations" ADD CONSTRAINT "application_declarations_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_family_details" ADD CONSTRAINT "application_family_details_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_identifications" ADD CONSTRAINT "application_identifications_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_preferences" ADD CONSTRAINT "application_preferences_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "followup_comments" ADD CONSTRAINT "followup_comments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "followup_comments" ADD CONSTRAINT "followup_comments_followup_id_fkey" FOREIGN KEY ("followup_id") REFERENCES "followups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "followups" ADD CONSTRAINT "followups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "followups" ADD CONSTRAINT "followups_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "offline_payments" ADD CONSTRAINT "offline_payments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "offline_payments" ADD CONSTRAINT "offline_payments_receiver_fkey" FOREIGN KEY ("receiver") REFERENCES "partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "timeline" ADD CONSTRAINT "timeline_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "timeline" ADD CONSTRAINT "timeline_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

