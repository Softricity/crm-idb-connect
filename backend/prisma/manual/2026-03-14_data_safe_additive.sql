-- Data-safe additive migration blueprint for contract/team/inquiry/university-access features
-- IMPORTANT: review in staging first; execute inside a transaction on production windows.

BEGIN;

CREATE TABLE IF NOT EXISTS "agent_university_access" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "agent_id" uuid NOT NULL,
  "university_id" text NOT NULL,
  "granted_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "agent_university_access_agent_fk" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE,
  CONSTRAINT "agent_university_access_university_fk" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "agent_university_access_agent_university_uq" ON "agent_university_access"("agent_id","university_id");

CREATE TYPE IF NOT EXISTS "AgentContractStatus" AS ENUM ('PENDING','SIGNED','APPROVED','REJECTED');

CREATE TABLE IF NOT EXISTS "agent_contracts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "agent_id" uuid NOT NULL,
  "title" text NOT NULL,
  "content" text NOT NULL,
  "is_signed" boolean NOT NULL DEFAULT false,
  "signature_url" text,
  "signed_at" timestamptz,
  "status" "AgentContractStatus" NOT NULL DEFAULT 'PENDING',
  "approved_by" uuid,
  "approved_at" timestamptz,
  "rejection_note" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "agent_contracts_agent_fk" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE
);

ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "contract_approved" boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "agent_team_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "agent_id" uuid NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "mobile" text NOT NULL UNIQUE,
  "password" text NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "agent_team_members_agent_fk" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE
);

ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "agent_team_member_id" uuid;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'leads_agent_team_member_fk'
  ) THEN
    ALTER TABLE "leads"
      ADD CONSTRAINT "leads_agent_team_member_fk"
      FOREIGN KEY ("agent_team_member_id") REFERENCES "agent_team_members"("id");
  END IF;
END $$;

CREATE TYPE IF NOT EXISTS "InquiryStatus" AS ENUM ('NEW','CONTACTED','CONVERTED','REJECTED');

CREATE TABLE IF NOT EXISTS "agent_inquiries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "email" text NOT NULL,
  "mobile" text NOT NULL,
  "company_name" text,
  "website" text,
  "country" text,
  "city" text,
  "experience_years" integer,
  "student_volume" text,
  "message" text,
  "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

COMMIT;
