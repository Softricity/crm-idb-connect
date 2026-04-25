-- Departmental lead flow foundation (additive)

CREATE TABLE "departments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

CREATE TABLE "partner_departments" (
  "partner_id" UUID NOT NULL,
  "department_id" UUID NOT NULL,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "partner_departments_pkey" PRIMARY KEY ("partner_id", "department_id")
);

CREATE INDEX "idx_partner_departments_department_active" ON "partner_departments"("department_id", "is_active");
CREATE INDEX "idx_partner_departments_partner_active" ON "partner_departments"("partner_id", "is_active");

CREATE TABLE "department_order" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "department_id" UUID NOT NULL,
  "order_index" INTEGER NOT NULL,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "department_order_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "department_order_department_id_key" ON "department_order"("department_id");
CREATE UNIQUE INDEX "department_order_order_index_key" ON "department_order"("order_index");
CREATE INDEX "idx_department_order_active_order" ON "department_order"("is_active", "order_index");

CREATE TABLE "department_statuses" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "department_id" UUID NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "order_index" INTEGER NOT NULL,
  "is_terminal" BOOLEAN NOT NULL DEFAULT false,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "department_statuses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "department_statuses_department_id_key_key" ON "department_statuses"("department_id", "key");
CREATE UNIQUE INDEX "department_statuses_department_id_order_index_key" ON "department_statuses"("department_id", "order_index");
CREATE INDEX "idx_department_status_department_active" ON "department_statuses"("department_id", "is_active");

CREATE TABLE "department_assignment_cursors" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "branch_id" UUID NOT NULL,
  "department_id" UUID NOT NULL,
  "last_partner_id" UUID,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "department_assignment_cursors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "department_assignment_cursors_branch_id_department_id_key" ON "department_assignment_cursors"("branch_id", "department_id");
CREATE INDEX "idx_department_assignment_cursor_last_partner" ON "department_assignment_cursors"("last_partner_id");

ALTER TABLE "leads"
  ADD COLUMN "current_department_id" UUID,
  ADD COLUMN "past_departments" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN "past_owners" JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX "idx_leads_branch_department" ON "leads"("branch_id", "current_department_id");
CREATE INDEX "idx_leads_department" ON "leads"("current_department_id");

DO $$
BEGIN
  ALTER TYPE "timeline_event" ADD VALUE 'LEAD_DEPARTMENT_CHANGED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "partner_departments"
  ADD CONSTRAINT "partner_departments_partner_id_fkey"
    FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT "partner_departments_department_id_fkey"
    FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "department_order"
  ADD CONSTRAINT "department_order_department_id_fkey"
    FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "department_statuses"
  ADD CONSTRAINT "department_statuses_department_id_fkey"
    FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "department_assignment_cursors"
  ADD CONSTRAINT "department_assignment_cursors_branch_id_fkey"
    FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT "department_assignment_cursors_department_id_fkey"
    FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT "department_assignment_cursors_last_partner_id_fkey"
    FOREIGN KEY ("last_partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "leads"
  ADD CONSTRAINT "leads_current_department_id_fkey"
    FOREIGN KEY ("current_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
