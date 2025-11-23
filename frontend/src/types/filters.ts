// types/filters.ts
export type DateRange = { start?: Date | null; end?: Date | null };

export interface LeadFilterState {
  search: string;
  courses: string[];        // maps to lead.preferred_course
  owners: string[];       // maps to lead.assigned_to
  statuses: string[];     // maps to lead.status
  sources: string[];      // maps to lead.utm_source
  countries: string[];    // maps to lead.preferred_country
  dateRange?: DateRange;  // created_at between start..end
}

export interface LeadFilterOptions {
  courses: string[];
  owners: string[];
  statuses: string[];
  sources: string[];
  countries: string[];
}
