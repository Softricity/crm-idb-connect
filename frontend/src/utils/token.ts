// utils/token.ts
// Simple token generator using btoa for demo. Replace with secure JWT in production.

export function generateStudentPanelToken(lead: { id: string; email: string; name: string }) {
  // You should use a real JWT or encryption in production!
  const payload = {
    leadId: lead.id,
    email: lead.email,
    name: lead.name,
    ts: Date.now(),
  };
  // For demo: base64 encode the JSON payload
  return btoa(JSON.stringify(payload));
}
