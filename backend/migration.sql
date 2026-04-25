-- DropForeignKey
ALTER TABLE "department_assignment_cursors" DROP CONSTRAINT "department_assignment_cursors_branch_id_fkey";

-- DropForeignKey
ALTER TABLE "department_assignment_cursors" DROP CONSTRAINT "department_assignment_cursors_department_id_fkey";

-- DropForeignKey
ALTER TABLE "department_assignment_cursors" DROP CONSTRAINT "department_assignment_cursors_last_partner_id_fkey";

-- DropForeignKey
ALTER TABLE "department_order" DROP CONSTRAINT "department_order_department_id_fkey";

-- DropForeignKey
ALTER TABLE "department_statuses" DROP CONSTRAINT "department_statuses_department_id_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_current_department_id_fkey";

-- DropForeignKey
ALTER TABLE "partner_departments" DROP CONSTRAINT "partner_departments_department_id_fkey";

-- DropForeignKey
ALTER TABLE "partner_departments" DROP CONSTRAINT "partner_departments_partner_id_fkey";

-- AlterTable
ALTER TABLE "agent_contracts" ALTER COLUMN "agent_id" DROP NOT NULL;

-- DropTable
DROP TABLE "legacy_agents_agent_role_backup";

-- DropTable
DROP TABLE "legacy_universities_allowed_countries_backup";

-- AddForeignKey
ALTER TABLE "partner_departments" ADD CONSTRAINT "partner_departments_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_departments" ADD CONSTRAINT "partner_departments_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_order" ADD CONSTRAINT "department_order_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_statuses" ADD CONSTRAINT "department_statuses_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_assignment_cursors" ADD CONSTRAINT "department_assignment_cursors_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_assignment_cursors" ADD CONSTRAINT "department_assignment_cursors_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_assignment_cursors" ADD CONSTRAINT "department_assignment_cursors_last_partner_id_fkey" FOREIGN KEY ("last_partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_current_department_id_fkey" FOREIGN KEY ("current_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

