DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'IntegrationProvider'
      AND e.enumlabel = 'MAILSUITE'
  ) THEN
    ALTER TYPE "IntegrationProvider" ADD VALUE 'MAILSUITE';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'IntegrationProvider'
      AND e.enumlabel = 'SENDER'
  ) THEN
    ALTER TYPE "IntegrationProvider" ADD VALUE 'SENDER';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'IntegrationProvider'
      AND e.enumlabel = 'BREVO'
  ) THEN
    ALTER TYPE "IntegrationProvider" ADD VALUE 'BREVO';
  END IF;
END
$$;
