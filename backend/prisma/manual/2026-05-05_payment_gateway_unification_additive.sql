-- Additive, no-data-loss migration for payment gateway unification
-- Safe to run on existing databases where prisma migrate dev shadow replay fails.

BEGIN;

-- 1) Add enum value: IntegrationProvider.KHALTI
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'IntegrationProvider' AND e.enumlabel = 'KHALTI'
  ) THEN
    ALTER TYPE "IntegrationProvider" ADD VALUE 'KHALTI';
  END IF;
END $$;

-- 2) Add timeline_event values (if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'timeline_event' AND e.enumlabel = 'ONLINE_PAYMENT_INITIATED'
  ) THEN
    ALTER TYPE "timeline_event" ADD VALUE 'ONLINE_PAYMENT_INITIATED';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'timeline_event' AND e.enumlabel = 'ONLINE_PAYMENT_VERIFIED'
  ) THEN
    ALTER TYPE "timeline_event" ADD VALUE 'ONLINE_PAYMENT_VERIFIED';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'timeline_event' AND e.enumlabel = 'ONLINE_PAYMENT_FAILED'
  ) THEN
    ALTER TYPE "timeline_event" ADD VALUE 'ONLINE_PAYMENT_FAILED';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'timeline_event' AND e.enumlabel = 'ONLINE_PAYMENT_CANCELED'
  ) THEN
    ALTER TYPE "timeline_event" ADD VALUE 'ONLINE_PAYMENT_CANCELED';
  END IF;
END $$;

-- 3) Create new enums if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentGateway') THEN
    CREATE TYPE "PaymentGateway" AS ENUM ('RAZORPAY', 'KHALTI');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentTxStatus') THEN
    CREATE TYPE "PaymentTxStatus" AS ENUM ('INITIATED','PENDING','COMPLETED','FAILED','CANCELED','EXPIRED','REFUNDED');
  END IF;
END $$;

-- 4) Create payment_transactions table if missing
CREATE TABLE IF NOT EXISTS "payment_transactions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "lead_id" UUID NOT NULL,
  "gateway" "PaymentGateway" NOT NULL,
  "status" "PaymentTxStatus" NOT NULL DEFAULT 'INITIATED',
  "amount" BIGINT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "order_ref" TEXT,
  "gateway_payment_id" TEXT,
  "gateway_transaction_id" TEXT,
  "pidx" TEXT,
  "callback_payload" JSONB,
  "verify_payload" JSONB,
  "meta" JSONB DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- 5) FK + indexes (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_transactions_lead_id_fkey'
  ) THEN
    ALTER TABLE "payment_transactions"
      ADD CONSTRAINT "payment_transactions_lead_id_fkey"
      FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_payment_tx_lead" ON "payment_transactions"("lead_id");
CREATE INDEX IF NOT EXISTS "idx_payment_tx_gateway_status" ON "payment_transactions"("gateway","status");

COMMIT;

