-- Data-safe additive migration for support requester polymorphism.
-- Keeps legacy partner_id for backward compatibility.

BEGIN;

CREATE TYPE IF NOT EXISTS "TicketRequesterType" AS ENUM ('PARTNER','AGENT','AGENT_TEAM_MEMBER');

ALTER TABLE "support_tickets"
  ALTER COLUMN "partner_id" DROP NOT NULL;

ALTER TABLE "support_tickets"
  ADD COLUMN IF NOT EXISTS "requester_type" "TicketRequesterType",
  ADD COLUMN IF NOT EXISTS "requester_partner_id" uuid,
  ADD COLUMN IF NOT EXISTS "requester_agent_id" uuid,
  ADD COLUMN IF NOT EXISTS "requester_team_member_id" uuid,
  ADD COLUMN IF NOT EXISTS "requester_parent_agent_id" uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'support_tickets_requester_partner_fk'
  ) THEN
    ALTER TABLE "support_tickets"
      ADD CONSTRAINT "support_tickets_requester_partner_fk"
      FOREIGN KEY ("requester_partner_id") REFERENCES "partners"("id") ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'support_tickets_requester_agent_fk'
  ) THEN
    ALTER TABLE "support_tickets"
      ADD CONSTRAINT "support_tickets_requester_agent_fk"
      FOREIGN KEY ("requester_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'support_tickets_requester_team_member_fk'
  ) THEN
    ALTER TABLE "support_tickets"
      ADD CONSTRAINT "support_tickets_requester_team_member_fk"
      FOREIGN KEY ("requester_team_member_id") REFERENCES "agent_team_members"("id") ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'support_tickets_requester_parent_agent_fk'
  ) THEN
    ALTER TABLE "support_tickets"
      ADD CONSTRAINT "support_tickets_requester_parent_agent_fk"
      FOREIGN KEY ("requester_parent_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL;
  END IF;
END $$;

UPDATE "support_tickets"
SET
  "requester_type" = 'PARTNER',
  "requester_partner_id" = "partner_id"
WHERE
  "requester_type" IS NULL
  AND "partner_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_support_tickets_req_partner"
  ON "support_tickets" ("requester_type", "requester_partner_id");

CREATE INDEX IF NOT EXISTS "idx_support_tickets_req_agent"
  ON "support_tickets" ("requester_type", "requester_agent_id");

CREATE INDEX IF NOT EXISTS "idx_support_tickets_req_team_member"
  ON "support_tickets" ("requester_type", "requester_team_member_id");

CREATE INDEX IF NOT EXISTS "idx_support_tickets_req_parent_agent"
  ON "support_tickets" ("requester_parent_agent_id");

CREATE INDEX IF NOT EXISTS "idx_support_tickets_status_created"
  ON "support_tickets" ("status", "created_at" DESC);

COMMIT;
