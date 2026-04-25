-- Departmental lead flow backfill (additive, idempotent)
-- Run in staging first with row-count verification.

BEGIN;

-- 1) Seed baseline departments
INSERT INTO departments (name, code, is_active)
VALUES
  ('Counselling', 'COUNSELLING', true),
  ('Admissions', 'ADMISSIONS', true),
  ('Visa', 'VISA', true)
ON CONFLICT (code)
DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 2) Seed pipeline order
WITH dept AS (
  SELECT id, code
  FROM departments
  WHERE code IN ('COUNSELLING', 'ADMISSIONS', 'VISA')
), ordered AS (
  SELECT id, code,
    CASE code
      WHEN 'COUNSELLING' THEN 1
      WHEN 'ADMISSIONS' THEN 2
      WHEN 'VISA' THEN 3
      ELSE 999
    END AS order_index,
    CASE WHEN code = 'COUNSELLING' THEN true ELSE false END AS is_default
  FROM dept
)
INSERT INTO department_order (department_id, order_index, is_default, is_active)
SELECT id, order_index, is_default, true
FROM ordered
ON CONFLICT (department_id)
DO UPDATE SET
  order_index = EXCLUDED.order_index,
  is_default = EXCLUDED.is_default,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 3) Seed per-department statuses (compatible with existing lead statuses)
WITH dept AS (
  SELECT id
  FROM departments
  WHERE code IN ('COUNSELLING', 'ADMISSIONS', 'VISA')
), status_seed AS (
  SELECT
    d.id AS department_id,
    s.key,
    s.label,
    s.order_index,
    s.is_terminal,
    s.is_default
  FROM dept d
  CROSS JOIN (
    VALUES
      ('new', 'New', 1, false, true),
      ('contacted', 'Contacted', 2, false, false),
      ('interested', 'Interested', 3, false, false),
      ('engaged', 'Engaged', 4, false, false),
      ('hot', 'Hot', 5, false, false),
      ('inprocess', 'In Process', 6, false, false),
      ('assigned', 'Assigned', 7, false, false),
      ('cold', 'Cold', 8, false, false),
      ('converted', 'Converted', 9, true, false),
      ('rejected', 'Rejected', 10, true, false)
  ) AS s(key, label, order_index, is_terminal, is_default)
)
INSERT INTO department_statuses (department_id, key, label, order_index, is_terminal, is_default, is_active)
SELECT department_id, key, label, order_index, is_terminal, is_default, true
FROM status_seed
ON CONFLICT (department_id, key)
DO UPDATE SET
  label = EXCLUDED.label,
  order_index = EXCLUDED.order_index,
  is_terminal = EXCLUDED.is_terminal,
  is_default = EXCLUDED.is_default,
  is_active = true,
  updated_at = NOW();

-- 4) Backfill leads to first department and initialize history arrays
WITH first_department AS (
  SELECT d.id
  FROM department_order o
  JOIN departments d ON d.id = o.department_id
  WHERE o.is_active = true
  ORDER BY o.order_index ASC
  LIMIT 1
)
UPDATE leads l
SET current_department_id = fd.id
FROM first_department fd
WHERE l.current_department_id IS NULL;

UPDATE leads
SET past_departments = '[]'::jsonb
WHERE past_departments IS NULL;

UPDATE leads
SET past_owners = '[]'::jsonb
WHERE past_owners IS NULL;

-- 5) Map each partner to at least one department (primary = first department)
WITH first_department AS (
  SELECT d.id
  FROM department_order o
  JOIN departments d ON d.id = o.department_id
  WHERE o.is_active = true
  ORDER BY o.order_index ASC
  LIMIT 1
)
INSERT INTO partner_departments (partner_id, department_id, is_primary, is_active)
SELECT p.id, fd.id, true, true
FROM partners p
CROSS JOIN first_department fd
WHERE NOT EXISTS (
  SELECT 1
  FROM partner_departments pd
  WHERE pd.partner_id = p.id
);

-- Ensure every partner has exactly one fallback primary if none is marked
WITH first_department AS (
  SELECT d.id
  FROM department_order o
  JOIN departments d ON d.id = o.department_id
  WHERE o.is_active = true
  ORDER BY o.order_index ASC
  LIMIT 1
)
UPDATE partner_departments pd
SET is_primary = true,
    updated_at = NOW()
FROM first_department fd
WHERE pd.department_id = fd.id
  AND NOT EXISTS (
    SELECT 1
    FROM partner_departments p2
    WHERE p2.partner_id = pd.partner_id
      AND p2.is_primary = true
  );

COMMIT;

-- 6) Post-backfill verification helpers
SELECT COUNT(*) AS leads_without_department
FROM leads
WHERE current_department_id IS NULL;

SELECT current_department_id, COUNT(*) AS lead_count
FROM leads
GROUP BY current_department_id
ORDER BY lead_count DESC;
