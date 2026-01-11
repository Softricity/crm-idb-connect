// stores/applicationStore.ts
import { create } from "zustand";
import api from "@/lib/api";

// ----------------- Types -----------------

// Main Application
export interface Application {
  id?: string;
  lead_id: string;
  student_id?: string | null;
  
  // Personal Details
  given_name?: string | null;
  surname?: string | null;
  dob?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  email?: string | null;
  phone?: string | null;
  alternate_phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  citizenship?: string | null;
  national_id?: string | null;
  current_status?: string | null;
  gap_years?: number | null;
  referral_source?: string | null;
  
  // CRM Tracking
  application_stage?: string | null;
  system_remarks?: string | null;
  // Derived / linkage (from lead)
  branch_id?: string | null; // populate client-side from related lead if needed
  is_flagged?: boolean; // from lead
  
  created_at?: string;
  updated_at?: string;
  
  // Relations
  family_details?: ApplicationFamilyDetails[];
  education?: ApplicationEducation[];
  preferences?: ApplicationPreferences[];
  tests?: ApplicationTests[];
  work_experience?: ApplicationWorkExperience[];
  visa_details?: ApplicationVisaDetails[];
  documents?: ApplicationDocuments[];
}

// Family Details
export interface ApplicationFamilyDetails {
  id?: string;
  application_id: string;
  father_name?: string | null;
  mother_name?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_number?: string | null;
}

// Education
export interface ApplicationEducation {
  id?: string;
  application_id: string;
  level?: string | null;
  institution_name?: string | null;
  board_university?: string | null;
  country_of_study?: string | null;
  major_stream?: string | null;
  percentage_gpa?: string | null;
  year_of_passing?: string | null;
  medium_of_instruction?: string | null;
  backlogs?: number | null;
  certificate_url?: string | null;
}

// Preferences
export interface ApplicationPreferences {
  id?: string;
  application_id: string;
  preferred_country?: string | null;
  preferred_course_type?: string | null;
  preferred_course_name?: string | null;
  preferred_intake?: string | null;
  preferred_university?: string | null;
  backup_country?: string | null;
  study_mode?: string | null;
  budget_range?: string | null;
  scholarship_interest?: boolean | null;
  travel_history?: string | null;
}

// English Tests
export interface ApplicationTests {
  id?: string;
  application_id: string;
  test_type?: string | null;
  test_date?: string | null;
  overall_score?: number | null;
  listening?: number | null;
  reading?: number | null;
  writing?: number | null;
  speaking?: number | null;
  trf_number?: string | null;
}

// Work Experience
export interface ApplicationWorkExperience {
  id?: string;
  application_id: string;
  company_name?: string | null;
  designation?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  job_duties?: string | null;
  certificate_url?: string | null;
}

// Visa Details
export interface ApplicationVisaDetails {
  id?: string;
  application_id: string;
  passport_number?: string | null;
  passport_issue_date?: string | null;
  passport_expiry_date?: string | null;
  passport_place_of_issue?: string | null;
  passport_nationality?: string | null;
  country_applied_for?: string | null;
  previous_visa_type?: string | null;
  visa_status?: string | null;
  visa_refusal_reason?: string | null;
  travelled_countries?: string | null;
  is_visa_rejected_past?: boolean | null;
}

// Documents
export interface ApplicationDocuments {
  id?: string;
  application_id: string;
  profile_photo_url?: string | null;
  passport_copy_url?: string | null;
  academic_documents_urls?: string[] | null;
  english_test_cert_url?: string | null;
  sop_url?: string | null;
  cv_resume_url?: string | null;
  recommendation_letters_url?: string[] | null;
  financial_documents_url?: string | null;
  other_documents_url?: string | null;
}

// ----------------- State -----------------
interface ApplicationState {
  applications: Application[];
  currentApplication: Application | null;
  loading: boolean;
  fetchApplications: (leadIds?: string[]) => Promise<void>; // until backend list exists, fetch sequentially by lead ids
  fetchApplicationByLeadId: (leadId: string) => Promise<void>;
  createApplication: (leadId: string) => Promise<Application>; // create via minimal trigger (server auto-creates)
  patchSection: (leadId: string, section: string, body: any) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>; // stub
  setCurrentApplication: (application: Application | null) => void;
  reset: () => void;
}

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  applications: [],
  currentApplication: null,
  loading: false,

  fetchApplications: async (leadIds, branchId?: string) => {
    set({ loading: true });
    try {
      // If leadIds provided, fetch per-lead using Applications API
      if (leadIds && leadIds.length > 0) {
        const results: Application[] = [];
        for (const leadId of leadIds) {
          try {
            const data = await api.ApplicationsAPI.fetchApplicationByLeadId(leadId);
            if (data) results.push(data as Application);
          } catch (e) {
            console.warn(`Failed to fetch application for lead ${leadId}`);
          }
        }
        set({ applications: results });
        return;
      }

      // If no leadIds provided, fetch leads with type=application and map to lightweight applications
      const leads = await api.LeadsAPI.fetchApplications(branchId);
      const mapped = (leads || []).map((l: any) => {
        // If the lead has application data nested, use it; otherwise use lead fields
        const app = l.applications?.[0] || {};
        const prefs = app.preferences?.[0] || {};
        
        return {
          id: app.id || l.id,
          lead_id: l.id,
          created_at: app.created_at || l.created_at,
          branch_id: l.branch_id,
          
          // Personal details from application or fallback to lead
          given_name: app.given_name || l.name?.split(' ')[0] || l.name,
          surname: app.surname || l.name?.split(' ').slice(1).join(' ') || '',
          email: app.email || l.email,
          phone: app.phone || l.mobile,
          dob: app.dob,
          gender: app.gender,
          citizenship: app.citizenship,
          country: app.country,
          marital_status: app.marital_status,
          current_status: app.current_status,
          
          // Application tracking
          application_stage: app.application_stage,
          student_id: app.student_id,
          
          // Preferences
          preferences: app.preferences ? [prefs] : [],
          
          // Lead-level fields
          is_flagged: l.is_flagged || false,
        } as Application;
      });
      set({ applications: mapped });
    } catch (error) {
      console.error("Error fetching applications collection:", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchApplicationByLeadId: async (leadId: string) => {
    set({ loading: true });
    try {
      const data = await api.ApplicationsAPI.fetchApplicationByLeadId(leadId);
      set({ currentApplication: data as Application });
    } catch (error) {
      console.error("Error fetching application:", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createApplication: async (leadId: string) => {
    set({ loading: true });
    try {
      // minimal create: server auto creates application record when updating sections; attempt GET to force creation routine
      const data = await api.ApplicationsAPI.fetchApplicationByLeadId(leadId);
      set((state) => ({ applications: [...state.applications, data as Application] }));
      return data as Application;
    } catch (error) {
      console.error("Error initializing application:", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  patchSection: async (leadId: string, section: string, body: any) => {
    set({ loading: true });
    try {
      const data = await api.ApplicationsAPI.patchSection(leadId, section, body);
      set((state) => ({
        applications: state.applications.map((app) =>
          app.lead_id === leadId ? { ...app, ...(data as Application) } : app
        ),
        currentApplication:
          state.currentApplication?.lead_id === leadId
            ? { ...state.currentApplication, ...(data as Application) }
            : state.currentApplication,
      }));
    } catch (error) {
      console.error("Error patching application section:", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteApplication: async (id: string) => {
    set({ loading: true });
    try {
      await api.ApplicationsAPI.deleteApplication(id);
      set((state) => ({
        applications: state.applications.filter((app) => app.id !== id),
        currentApplication:
          state.currentApplication?.id === id ? null : state.currentApplication,
      }));
    } catch (error) {
      console.error("Error deleting application:", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  setCurrentApplication: (application: Application | null) => {
    set({ currentApplication: application });
  },
  reset: () => set({ applications: [], currentApplication: null, loading: false }),
}));
