// stores/applicationStore.ts
import { create } from "zustand";
import api from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// ----------------- Types -----------------
export interface Application {
  id?: string;
  lead_id: string;
  program_discipline?: string | null;
  program_course?: string | null;
  title?: string | null;
  dob?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  category?: string | null;
  religion?: string | null;
  nationality?: string | null;
  blood_group?: string | null;
}

export interface ApplicationIdentifications {
  aadhaar_number?: string | null;
  pan_card_number?: string | null;
  passport_number?: string | null;
  passport_issuing_country?: string | null;
  passport_valid_upto?: string | null;
}

export interface ApplicationPreferences {
  hostel_facility_required?: boolean | null;
  hostel_type?: string | null;
  travel_accommodation_required?: boolean | null;
  has_given_exam?: boolean | null;
  has_work_experience?: boolean | null;
}

export interface ApplicationFamilyDetails {
  father_title?: string | null;
  father_name?: string | null;
  father_email?: string | null;
  father_mobile?: string | null;
  father_occupation?: string | null;
  mother_title?: string | null;
  mother_name?: string | null;
  mother_email?: string | null;
  mother_mobile?: string | null;
  mother_occupation?: string | null;
  guardian_title?: string | null;
  guardian_name?: string | null;
  guardian_email?: string | null;
  guardian_mobile?: string | null;
  guardian_occupation?: string | null;
  guardian_relationship?: string | null;
  family_annual_income?: string | null;
}

export interface ApplicationAddresses {
  is_permanent_same_as_correspondence?: boolean | null;
  correspondence_address_line_1?: string | null;
  correspondence_address_line_2?: string | null;
  correspondence_city?: string | null;
  correspondence_district?: string | null;
  correspondence_state?: string | null;
  correspondence_country?: string | null;
  correspondence_pincode?: string | null;
  permanent_address_line_1?: string | null;
  permanent_address_line_2?: string | null;
  permanent_city?: string | null;
  permanent_district?: string | null;
  permanent_state?: string | null;
  permanent_country?: string | null;
  permanent_pincode?: string | null;
}

export interface ApplicationDocuments {
  passport_photo_url?: string | null;
  class_x_marksheet_url?: string | null;
  class_xii_marksheet_url?: string | null;
  graduation_marksheet_url?: string | null;
  aadhaar_card_url?: string | null;
  entrance_exam_scorecard_url?: string | null;
  work_experience_certificates_url?: string | null;
  passport_url?: string | null;
  [key: string]: string | null | undefined; // Index signature for dynamic access
}

export interface ApplicationDeclarations {
  declaration_agreed?: boolean | null;
  declaration_applicant_name?: string | null;
  declaration_parent_name?: string | null;
  declaration_date?: string | null;
  declaration_place?: string | null;
}

export interface SectionStatus {
  completed: boolean;
  saved: boolean;
}

// ----------------- State -----------------
interface ApplicationState {
  application: Partial<Application>;
  identifications: Partial<ApplicationIdentifications>;
  preferences: Partial<ApplicationPreferences>;
  familyDetails: Partial<ApplicationFamilyDetails>;
  addresses: Partial<ApplicationAddresses>;
  documents: Partial<ApplicationDocuments>;
  declarations: Partial<ApplicationDeclarations>;
  loading: boolean;
  applicationId: string | null;
  sectionStatus: {
    application: SectionStatus;
    identifications: SectionStatus;
    preferences: SectionStatus;
    familyDetails: SectionStatus;
    addresses: SectionStatus;
    documents: SectionStatus;
    declarations: SectionStatus;
  };

  updateSection: (
    section: keyof Omit<
      ApplicationState,
      | "loading"
      | "submitApplication"
      | "resetForm"
      | "sectionStatus"
      | "applicationId"
      | "saveSection"
      | "loadApplication"
      | "validateSection"
      | "updateSection"
      | "uploadDocument"
      | "uploadMultipleDocuments"
      | "validateDocumentsWithFiles"
    >,
    values: any
  ) => void;
  uploadDocument: (
    file: File,
    documentType: string,
    leadId: string
  ) => Promise<string | null>;
  uploadMultipleDocuments: (
    files: Record<string, File>,
    leadId: string
  ) => Promise<Record<string, string> | null>;
  saveSection: (section: string, leadId: string) => Promise<boolean>;
  loadApplication: (leadId: string) => Promise<boolean>;
  validateSection: (section: string) => boolean;
  validateDocumentsWithFiles: (selectedFiles: Record<string, File>) => boolean;
  resetForm: () => void;
  submitApplication: (leadId: string) => Promise<string | null>;
}

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  application: {},
  identifications: {},
  preferences: {},
  familyDetails: {},
  addresses: {},
  documents: {},
  declarations: {},
  loading: false,
  applicationId: null,
  sectionStatus: {
    application: { completed: false, saved: false },
    identifications: { completed: false, saved: false },
    preferences: { completed: false, saved: false },
    familyDetails: { completed: false, saved: false },
    addresses: { completed: false, saved: false },
    documents: { completed: false, saved: false },
    declarations: { completed: false, saved: false },
  },

  updateSection: (section, values) =>
    set((state) => ({
      [section]: { ...state[section], ...values },
      sectionStatus: {
        ...state.sectionStatus,
        [section]: { ...state.sectionStatus[section], saved: false },
      },
    })),

  uploadDocument: async (
    file: File,
    documentType: string,
    leadId: string
  ): Promise<string | null> => {
    try {
      console.log("Starting upload for:", documentType, "User:", leadId);

      // Check authentication status
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      console.log("Auth status:", { user: user?.id, error: authError });

      const timestamp = Date.now();
      const fileExtension = file.name.split(".").pop();
      const fileName = `${leadId}/${documentType}_${timestamp}.${fileExtension}`;

      console.log("Uploading file:", fileName);

      const { data, error } = await supabase.storage
        .from("idb-student-documents")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Detailed upload error:", {
          message: error.message,
          error: error,
        });
        return null;
      }

      console.log("Upload successful:", data);

      const { data: urlData } = supabase.storage
        .from("idb-student-documents")
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Unexpected error:", error);
      return null;
    }
  },

  uploadMultipleDocuments: async (
    files: Record<string, File>,
    leadId: string
  ): Promise<Record<string, string> | null> => {
    try {
      const uploadPromises = Object.entries(files).map(
        async ([documentType, file]) => {
          const timestamp = Date.now();
          const fileExtension = file.name.split(".").pop();
          const fileName = `${leadId}/${documentType}_${timestamp}.${fileExtension}`;

          // Upload file to Supabase storage
          const { data, error } = await supabase.storage
            .from("idb-student-documents")
            .upload(fileName, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (error) {
            console.error(`Error uploading ${documentType}:`, error);
            throw new Error(`Failed to upload ${documentType}`);
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from("idb-student-documents")
            .getPublicUrl(fileName);

          return { documentType, url: urlData.publicUrl };
        }
      );

      const results = await Promise.all(uploadPromises);

      // Convert array to object
      const uploadedFiles: Record<string, string> = {};
      results.forEach(({ documentType, url }) => {
        uploadedFiles[documentType] = url;
      });

      return uploadedFiles;
    } catch (error) {
      console.error("Error in uploadMultipleDocuments:", error);
      return null;
    }
  },

  validateSection: (section: string): boolean => {
    const state = get();

    switch (section) {
      case "application":
        return !!(
          state.application.lead_id &&
          state.application.program_discipline &&
          state.application.title &&
          state.application.dob &&
          state.application.gender
        );

      case "identifications":
        return !!(
          state.identifications.aadhaar_number ||
          state.identifications.pan_card_number
        );

      case "preferences":
        return (
          state.preferences.hostel_facility_required !== undefined &&
          state.preferences.has_given_exam !== undefined &&
          state.preferences.has_work_experience !== undefined
        );

      case "familyDetails":
        return !!(
          state.familyDetails.father_name ||
          state.familyDetails.mother_name ||
          state.familyDetails.guardian_name
        );

      case "addresses":
        return !!(
          state.addresses.correspondence_address_line_1 &&
          state.addresses.correspondence_city &&
          state.addresses.correspondence_state &&
          state.addresses.correspondence_pincode
        );

      case "documents":
        return !!(
          state.documents.passport_photo_url &&
          state.documents.class_x_marksheet_url &&
          state.documents.class_xii_marksheet_url
        );

      case "declarations":
        return !!(
          state.declarations.declaration_agreed &&
          state.declarations.declaration_applicant_name &&
          state.declarations.declaration_date
        );

      default:
        return false;
    }
  },

  // New method to validate documents section including selected files
  validateDocumentsWithFiles: (
    selectedFiles: Record<string, File>
  ): boolean => {
    const state = get();
    const requiredDocs = [
      "passport_photo_url",
      "class_x_marksheet_url",
      "class_xii_marksheet_url",
    ];

    return requiredDocs.every(
      (docType) =>
        state.documents[docType as keyof ApplicationDocuments] ||
        selectedFiles[docType]
    );
  },

  loadApplication: async (leadId: string): Promise<boolean> => {
    set({ loading: true });

    try {
      // Check if application exists using API
      let appData;
      try {
        appData = await api.ApplicationsAPI.fetchApplicationByLeadId(leadId);
      } catch (error: any) {
        // If not found, initialize with lead_id
        if (error.statusCode === 404 || error.message?.includes('not found')) {
          set({
            application: { lead_id: leadId },
            loading: false,
          });
          return true;
        }
        throw error;
      }

      if (!appData) {
        // No existing application, initialize with lead_id
        set({
          application: { lead_id: leadId },
          loading: false,
        });
        return true;
      }

      const applicationId = appData.id;
      set({ applicationId, application: appData });

      // Load child tables
      const tables = [
        { table: "application_identifications", section: "identifications" },
        { table: "application_preferences", section: "preferences" },
        { table: "application_family_details", section: "familyDetails" },
        { table: "application_addresses", section: "addresses" },
        { table: "application_documents", section: "documents" },
        { table: "application_declarations", section: "declarations" },
      ];

      const updatedSectionStatus = { ...get().sectionStatus };

      for (const { table, section } of tables) {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .eq("application_id", applicationId)
          .single();

        if (!error && data) {
          const { application_id, ...sectionData } = data;
          set((state) => ({
            [section]: sectionData,
          }));

          // Mark section as saved if it has data
          if (
            Object.keys(sectionData).some((key) => sectionData[key] !== null)
          ) {
            updatedSectionStatus[section as keyof typeof updatedSectionStatus] =
              { completed: true, saved: true };
          }
        }
      }

      set({ sectionStatus: updatedSectionStatus, loading: false });
      return true;
    } catch (error) {
      console.error("Error loading application:", error);
      set({ loading: false });
      return false;
    }
  },

  saveSection: async (section: string, leadId: string): Promise<boolean> => {
    const state = get();

    if (!state.validateSection(section)) {
      return false;
    }

    set({ loading: true });

    try {
      let applicationId = state.applicationId;

      // Create application if it doesn't exist
      if (!applicationId) {
        const appData = await api.ApplicationsAPI.createApplication({
          ...state.application,
          lead_id: leadId,
        });

        applicationId = appData.id;
        set({ applicationId });

        // Backend handles updating lead type to "application"
      } else {
        // Update main application data if section is 'application'
        if (section === "application") {
          await api.ApplicationsAPI.updateApplication(applicationId, state.application);
        }
      }

      // Save section data to appropriate child table
      if (section !== "application") {
        const tableMap: Record<
          | "identifications"
          | "preferences"
          | "familyDetails"
          | "addresses"
          | "documents"
          | "declarations",
          string
        > = {
          identifications: "application_identifications",
          preferences: "application_preferences",
          familyDetails: "application_family_details",
          addresses: "application_addresses",
          documents: "application_documents",
          declarations: "application_declarations",
        };

        const tableName = tableMap[section as keyof typeof tableMap];
        type SectionKey = keyof typeof tableMap;
        const sectionKey = section as SectionKey;
        const sectionData = state[sectionKey];

        if (tableName && Object.keys(sectionData).length > 0) {
          // Check if record exists
          const { data: existing } = await supabase
            .from(tableName)
            .select("application_id")
            .eq("application_id", applicationId)
            .single();

          if (existing) {
            // Update existing record
            const { error } = await supabase
              .from(tableName)
              .update(sectionData)
              .eq("application_id", applicationId);

            if (error) throw error;
          } else {
            // Insert new record
            const { error } = await supabase
              .from(tableName)
              .insert([{ application_id: applicationId, ...sectionData }]);

            if (error) throw error;
          }
        }
      }

      // Update section status
      set((state) => ({
        loading: false,
        sectionStatus: {
          ...state.sectionStatus,
          [section]: { completed: true, saved: true },
        },
      }));

      return true;
    } catch (error) {
      console.error(`Error saving ${section}:`, error);
      set({ loading: false });
      return false;
    }
  },

  resetForm: () =>
    set({
      application: {},
      identifications: {},
      preferences: {},
      familyDetails: {},
      addresses: {},
      documents: {},
      declarations: {},
      applicationId: null,
      sectionStatus: {
        application: { completed: false, saved: false },
        identifications: { completed: false, saved: false },
        preferences: { completed: false, saved: false },
        familyDetails: { completed: false, saved: false },
        addresses: { completed: false, saved: false },
        documents: { completed: false, saved: false },
        declarations: { completed: false, saved: false },
      },
    }),

  submitApplication: async (leadId: string): Promise<string | null> => {
    const state = get();

    // Validate all sections before final submission
    const allSections = [
      "application",
      "identifications",
      "preferences",
      "familyDetails",
      "addresses",
      "documents",
      "declarations",
    ];
    for (const section of allSections) {
      if (!state.validateSection(section)) {
        console.error(`Section ${section} is not complete`);
        return null;
      }
    }

    set({ loading: true });

    try {
      // Final save of declarations section if not already saved
      if (!state.sectionStatus.declarations.saved) {
        const success = await state.saveSection("declarations", leadId);
        if (!success) throw new Error("Failed to save final section");
      }

      // Mark application as submitted
      if (state.applicationId) {
        await api.ApplicationsAPI.updateApplication(state.applicationId, { status: "submitted" });
      }

      set({ loading: false });
      return state.applicationId;
    } catch (error) {
      console.error("Error submitting application:", error);
      set({ loading: false });
      return null;
    }
  },
}));
