// utils/filterLeads.ts
import { Lead } from "@/stores/useLeadStore";
import { LeadFilterState } from "@/types/filters";

const inSet = (val: string | null | undefined, set: string[]) =>
  set.length === 0 || (val ? set.includes(String(val)) : false);

const matchText = (lead: Lead, q: string) => {
  if (!q) return true;
  const hay = [
    lead.name ?? "",
    lead.mobile ?? "",
    lead.email ?? "",
    lead.partners_leads_assigned_toTopartners?.name ?? "",
    lead.purpose ?? "",
    lead.utm_source ?? "",
    lead.utm_medium ?? "",
    lead.preferred_country ?? "",
    lead.status ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q.toLowerCase());
};

export function filterLeads(leads: Lead[], f: LeadFilterState): Lead[] {
  const { search, types, owners, statuses, sources, countries, dateRange } = f;

  const startMs = dateRange?.start ? new Date(dateRange.start).setHours(0, 0, 0, 0) : null;
  const endMs = dateRange?.end ? new Date(dateRange.end).setHours(23, 59, 59, 999) : null;

  return leads.filter((lead) => {
    // Date
    if (startMs || endMs) {
      const created = lead.created_at ? new Date(lead.created_at).getTime() : null;
      if (!created) return false;
      if (startMs && created < startMs) return false;
      if (endMs && created > endMs) return false;
    }

    // Multi-selects
    if (!inSet(lead.purpose ?? "", types)) return false;
    if (!inSet(lead.partners_leads_assigned_toTopartners?.name ?? "Unassigned", owners)) return false;
    if (!inSet((lead.status ?? "").toLowerCase(), statuses.map((s) => s.toLowerCase()))) return false;
    if (!inSet(lead.utm_source ?? "", sources)) return false;
    if (!inSet(lead.preferred_country ?? "", countries)) return false;

    // Search
    if (!matchText(lead, search)) return false;

    return true;
  });
}
