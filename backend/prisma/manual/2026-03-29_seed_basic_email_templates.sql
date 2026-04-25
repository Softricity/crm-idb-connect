-- Seed/update basic email templates used by transactional flows.
-- Safe to run multiple times.

INSERT INTO "email_templates" ("name", "subject", "body", "category", "variables")
VALUES
(
  'INQUIRY_RECEIVED',
  'Thanks {{name}}, we received your inquiry',
  '<p>Hi {{name}},</p>
<p>Thank you for reaching out to us.</p>
<p>We have received your inquiry for <strong>{{company}}</strong>. Our team will contact you soon.</p>
<p>Regards,<br/>IDB Connect Team</p>',
  'inquiry',
  ARRAY['name', 'company']
),
(
  'AGENT_ONBOARDING',
  'Welcome {{name}} - Agent onboarding update',
  '<p>Hi {{name}},</p>
<p>Your onboarding request for <strong>{{company}}</strong> has been approved.</p>
<p>You can log in here: <a href="{{login_url}}">{{login_url}}</a></p>
<p>Regards,<br/>IDB Connect Team</p>',
  'onboarding',
  ARRAY['name', 'company', 'login_url']
),
(
  'LEAD_ONBOARDING',
  'Welcome {{name}} - Your student account is ready',
  '<p>Hi {{name}},</p>
<p>Your student panel account is ready.</p>
<p><strong>Email:</strong> {{email}}<br/>
<strong>Password:</strong> {{password}}</p>
<p>Login here: <a href="{{login_url}}">{{login_url}}</a></p>
<p>Regards,<br/>IDB Connect Team</p>',
  'credentials',
  ARRAY['name', 'email', 'password', 'login_url']
)
ON CONFLICT ("name")
DO UPDATE SET
  "subject" = EXCLUDED."subject",
  "body" = EXCLUDED."body",
  "category" = EXCLUDED."category",
  "variables" = EXCLUDED."variables",
  "updated_at" = NOW();

