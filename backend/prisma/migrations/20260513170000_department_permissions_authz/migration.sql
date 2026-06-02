-- CreateTable
CREATE TABLE "department_permissions" (
    "department_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "department_permissions_pkey" PRIMARY KEY ("department_id","permission_id")
);

-- CreateIndex
CREATE INDEX "idx_department_permission_department_active" ON "department_permissions"("department_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_department_permission_permission_active" ON "department_permissions"("permission_id", "is_active");

-- AddForeignKey
ALTER TABLE "department_permissions" ADD CONSTRAINT "department_permissions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_permissions" ADD CONSTRAINT "department_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
