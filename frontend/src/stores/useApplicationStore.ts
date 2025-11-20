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
  
  fetchApplications: () => Promise<void>;
  fetchApplicationById: (id: string) => Promise<void>;
  createApplication: (application: Partial<Application>) => Promise<Application>;
  updateApplication: (id: string, updates: Partial<Application>) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  
  setCurrentApplication: (application: Application | null) => void;
}

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  applications: [],
  currentApplication: null,
  loading: false,

  fetchApplications: async () => {
    set({ loading: true });
    try {
      const data = await api.ApplicationsAPI.fetchApplications();
      set({ applications: data as Application[] });
    } catch (error) {
      console.error("Error fetching applications:", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchApplicationById: async (leadId: string) => {
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

  createApplication: async (application: Partial<Application>) => {
    set({ loading: true });
    try {
      const data = await api.ApplicationsAPI.createApplication(application);
      set((state) => ({
        applications: [...state.applications, data as Application],
      }));
      return data as Application;
    } catch (error) {
      console.error("Error creating application:", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateApplication: async (id: string, updates: Partial<Application>) => {
    set({ loading: true });
    try {
      const data = await api.ApplicationsAPI.updateApplication(id, updates);
      set((state) => ({
        applications: state.applications.map((app) =>
          app.id === id ? { ...app, ...(data as Application) } : app
        ),
        currentApplication:
          state.currentApplication?.id === id
            ? { ...state.currentApplication, ...(data as Application) }
            : state.currentApplication,
      }));
    } catch (error) {
      console.error("Error updating application:", error);
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
}));
