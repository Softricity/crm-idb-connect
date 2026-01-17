"use client";

import { useEffect, useState } from "react";
import { useApplicationStore, ApplicationEducation, ApplicationTests, ApplicationWorkExperience } from "@/stores/useApplicationStore";
import { format } from "date-fns";
import { Loader2, Pencil, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const InfoRow = ({ label, value }: { label: string; value?: string | null | boolean | number }) => {
  const displayValue = () => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return value.toString();
  };

  return (
    <div className="flex justify-between py-2 border-b border-dotted border-gray-200">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="text-gray-900 font-medium text-sm capitalize">
        {displayValue()}
      </span>
    </div>
  );
};

const DocumentLink = ({ label, url }: { label: string; url?: string | null }) => (
  <div className="flex justify-between py-2 border-b border-dotted border-gray-200">
    <span className="text-gray-500 text-sm">{label}</span>
    {url ? (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
      >
        View Document
      </a>
    ) : (
      <span className="text-gray-400 text-sm">Not uploaded</span>
    )}
  </div>
);

const DocumentLinks = ({ label, urls }: { label: string; urls?: string[] | null }) => (
  <div className="py-2 border-b border-dotted border-gray-200">
    <span className="text-gray-500 text-sm block mb-2">{label}</span>
    {urls && urls.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {urls.map((url, idx) => (
          <a
            key={idx}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium underline"
          >
            <FileText className="h-3 w-3" />
            Document {idx + 1}
          </a>
        ))}
      </div>
    ) : (
      <span className="text-gray-400 text-sm">Not uploaded</span>
    )}
  </div>
);

interface ApplicationDetailsViewProps {
  leadId: string;
}

export default function ApplicationDetailsView({
  leadId,
}: ApplicationDetailsViewProps) {
  const {
    currentApplication,
    fetchApplicationByLeadId,
    patchSection,
    loading,
  } = useApplicationStore();

  const [isLoading, setIsLoading] = useState(true);
  const [editDialog, setEditDialog] = useState<{
    section: string;
    title: string;
    fields: any;
    isNew?: boolean;
  } | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchApplicationByLeadId(leadId);
      setIsLoading(false);
    };

    if (leadId) {
      loadData();
    }
  }, [leadId, fetchApplicationByLeadId]);

  const openEditDialog = (section: string, title: string, currentData: any) => {
    const formattedData = { ...currentData };
    
    // Format dates for input[type="date"] - convert ISO strings to YYYY-MM-DD
    Object.keys(formattedData).forEach(key => {
      if ((key.includes('date') || key === 'dob') && formattedData[key]) {
        try {
          const date = new Date(formattedData[key]);
          formattedData[key] = date.toISOString().split('T')[0];
        } catch (e) {
          // Keep original value if date parsing fails
        }
      }
    });
    
    setEditValues(formattedData || {});
    setEditDialog({ section, title, fields: formattedData });
  };

  const openAddDialog = (section: string, title: string, template: any) => {
    setEditValues(template);
    setEditDialog({ section, title, fields: template, isNew: true });
  };

  const handleDeleteRecord = async (section: string, recordId: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      let updatedRecords;
      
      if (section === 'education') {
        const education = currentApplication?.education || [];
        updatedRecords = education.filter((edu: ApplicationEducation) => edu.id !== recordId);
        await patchSection(leadId, section, { records: updatedRecords });
      } else if (section === 'tests') {
        const tests = currentApplication?.tests || [];
        updatedRecords = tests.filter((test: ApplicationTests) => test.id !== recordId);
        await patchSection(leadId, section, { records: updatedRecords });
      } else if (section === 'work-experience') {
        const workExperience = currentApplication?.work_experience || [];
        updatedRecords = workExperience.filter((work: ApplicationWorkExperience) => work.id !== recordId);
        await patchSection(leadId, section, { records: updatedRecords });
      }
      
      await fetchApplicationByLeadId(leadId);
    } catch (error: any) {
      console.error("Failed to delete:", error);
      const errorMessage = error?.body?.message || error?.message || "Failed to delete record. Please try again.";
      alert(errorMessage);
    }
  };

  const handleSaveEdit = async () => {
    if (!editDialog) return;
    
    try {
      let payload = { ...editValues };
      
      // Format date fields to ISO string if they're just date strings
      Object.keys(payload).forEach(key => {
        if ((key.includes('date') || key === 'dob') && payload[key] && !payload[key].includes('T')) {
          payload[key] = new Date(payload[key]).toISOString();
        }
      });
      
      // Handle nested array sections - backend expects arrays wrapped in specific keys
      if (editDialog.section === 'education') {
        const education = currentApplication?.education || [];
        let updatedRecords;
        
        if (editDialog.isNew) {
          // Add new record
          updatedRecords = [...education, payload];
        } else {
          // Update existing record
          const recordId = editValues.id;
          updatedRecords = education.map((edu: ApplicationEducation) => 
            edu.id === recordId ? payload : edu
          );
        }
        payload = { records: updatedRecords };
      } else if (editDialog.section === 'tests') {
        const tests = currentApplication?.tests || [];
        let updatedRecords;
        
        if (editDialog.isNew) {
          // Add new record
          updatedRecords = [...tests, payload];
        } else {
          // Update existing record
          const recordId = editValues.id;
          updatedRecords = tests.map((test: ApplicationTests) => 
            test.id === recordId ? payload : test
          );
        }
        payload = { records: updatedRecords };
      } else if (editDialog.section === 'work-experience') {
        const workExperience = currentApplication?.work_experience || [];
        let updatedRecords;
        
        if (editDialog.isNew) {
          // Add new record
          updatedRecords = [...workExperience, payload];
        } else {
          // Update existing record
          const recordId = editValues.id;
          updatedRecords = workExperience.map((work: ApplicationWorkExperience) => 
            work.id === recordId ? payload : work
          );
        }
        payload = { records: updatedRecords };
      } else if (editDialog.section === 'preferences') {
        const preferences = currentApplication?.preferences || [];
        let updatedRecords;
        
        if (editDialog.isNew) {
          // Add new record
          updatedRecords = [...preferences, payload];
        } else {
          // Update existing record
          const recordId = editValues.id;
          updatedRecords = preferences.map((pref: any) => 
            pref.id === recordId ? payload : pref
          );
        }
        payload = { records: updatedRecords };
      }
      
      await patchSection(leadId, editDialog.section, payload);
      setEditDialog(null);
      await fetchApplicationByLeadId(leadId);
    } catch (error: any) {
      console.error("Failed to save:", error);
      const errorMessage = error?.body?.message || error?.message || "Failed to save changes. Please try again.";
      alert(errorMessage);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading application details...</span>
      </div>
    );
  }

  const application = currentApplication;
  const familyDetails = application?.family_details?.[0];
  const preferences = application?.preferences?.[0];
  const documents = application?.documents?.[0];
  const education = application?.education || [];
  const tests = application?.tests || [];
  const workExperience = application?.work_experience || [];
  const visaDetails = application?.visa_details?.[0];

  const hasApplicationData = application && Object.keys(application).length > 1;

  if (!hasApplicationData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
        <p className="text-yellow-800 text-center">
          No application data available yet. Please complete the application form.
        </p>
      </div>
    );
  }

  // Calculate step numbers dynamically based on what sections have data
  let stepNumber = 0;
  const getStepNumber = () => ++stepNumber;

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg mb-4">
        <h2 className="text-xl font-bold text-primary">Application Information</h2>
        <p className="text-sm text-muted-foreground">Complete application details</p>
      </div>

      {/* Step: Basic Information - Always shown */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-900">Step {getStepNumber()}: Basic Information</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openEditDialog('personal', 'Edit Basic Information', {
              given_name: application.given_name,
              surname: application.surname,
              dob: application.dob,
              gender: application.gender,
              marital_status: application.marital_status,
              email: application.email,
              phone: application.phone,
              alternate_phone: application.alternate_phone,
              address: application.address,
              city: application.city,
              state: application.state,
              country: application.country,
              citizenship: application.citizenship,
              national_id: application.national_id,
              current_status: application.current_status,
              gap_years: application.gap_years,
              referral_source: application.referral_source,
            })}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
        <div className="space-y-1">
          <InfoRow label="Lead ID" value={application.lead_id} />
          <InfoRow label="Student ID" value={application.student_id} />
          <InfoRow label="Given Name" value={application.given_name} />
          <InfoRow label="Surname" value={application.surname} />
          <InfoRow label="Email" value={application.email} />
          <InfoRow label="Phone" value={application.phone} />
          <InfoRow label="Alternate Phone" value={application.alternate_phone} />
          <InfoRow
            label="Date of Birth"
            value={application.dob ? format(new Date(application.dob), "dd MMM yyyy") : null}
          />
          <InfoRow label="Gender" value={application.gender} />
          <InfoRow label="Marital Status" value={application.marital_status} />
          <InfoRow label="Address" value={application.address} />
          <InfoRow label="City" value={application.city} />
          <InfoRow label="State" value={application.state} />
          <InfoRow label="Country" value={application.country} />
          <InfoRow label="Citizenship" value={application.citizenship} />
          <InfoRow label="National ID" value={application.national_id} />
          <InfoRow label="Current Status" value={application.current_status} />
          <InfoRow label="Gap Years" value={application.gap_years} />
          <InfoRow label="Referral Source" value={application.referral_source} />
          <InfoRow label="Application Stage" value={application.application_stage} />
          <InfoRow label="System Remarks" value={application.system_remarks} />
        </div>
      </div>

      {/* Step: Family Details - Always shown */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-900">Step {getStepNumber()}: Family Details</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openEditDialog('family', 'Edit Family Details', familyDetails || {})}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
        {familyDetails ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Parents Information</h4>
              <InfoRow label="Father's Name" value={familyDetails.father_name} />
              <InfoRow label="Mother's Name" value={familyDetails.mother_name} />
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Emergency Contact</h4>
              <InfoRow label="Contact Name" value={familyDetails.emergency_contact_name} />
              <InfoRow label="Contact Number" value={familyDetails.emergency_contact_number} />
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No family details added yet. Click Edit to add information.</p>
          </div>
        )}
      </div>

      {/* Step: Education History - Always shown */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-900">Step {getStepNumber()}: Education History</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openAddDialog('education', 'Add Education', {
              level: '',
              institution_name: '',
              board_university: '',
              country_of_study: '',
              major_stream: '',
              percentage_gpa: '',
              year_of_passing: '',
              medium_of_instruction: '',
              backlogs: 0,
              certificate_url: '',
            })}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Add Education
          </Button>
        </div>
        
        {education.length > 0 ? (
          <div className="space-y-4">
            {education.map((edu: ApplicationEducation, idx: number) => (
              <div key={edu.id || idx} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">
                    {edu.level || 'Education Record'} {idx + 1}
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog('education', 'Edit Education', edu)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    {edu.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteRecord('education', edu.id!)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <InfoRow label="Level" value={edu.level} />
                  <InfoRow label="Institution" value={edu.institution_name} />
                  <InfoRow label="Board/University" value={edu.board_university} />
                  <InfoRow label="Country" value={edu.country_of_study} />
                  <InfoRow label="Major/Stream" value={edu.major_stream} />
                  <InfoRow label="Percentage/GPA" value={edu.percentage_gpa} />
                  <InfoRow label="Year of Passing" value={edu.year_of_passing} />
                  <InfoRow label="Medium of Instruction" value={edu.medium_of_instruction} />
                  <InfoRow label="Backlogs" value={edu.backlogs} />
                  {edu.certificate_url && (
                    <div className="col-span-2">
                      <DocumentLink label="Certificate" url={edu.certificate_url} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No education records added yet. Click Add Education to get started.</p>
          </div>
        )}
      </div>

      {/* Step: English Language Tests - Always shown */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-900">Step {getStepNumber()}: English Language Tests</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openAddDialog('tests', 'Add Test', {
              test_type: '',
              test_date: '',
              overall_score: 0,
              listening: 0,
              reading: 0,
              writing: 0,
              speaking: 0,
              trf_number: '',
            })}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Add Test
          </Button>
        </div>
        
        {tests.length > 0 ? (
          <div className="space-y-4">
            {tests.map((test: ApplicationTests, idx: number) => (
              <div key={test.id || idx} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">
                    {test.test_type || 'Test Record'} {idx + 1}
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog('tests', 'Edit Test', test)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    {test.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteRecord('tests', test.id!)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <InfoRow label="Test Type" value={test.test_type} />
                  <InfoRow label="Test Date" value={test.test_date ? format(new Date(test.test_date), "dd MMM yyyy") : null} />
                  <InfoRow label="Overall Score" value={test.overall_score} />
                  <InfoRow label="TRF Number" value={test.trf_number} />
                  <InfoRow label="Listening" value={test.listening} />
                  <InfoRow label="Reading" value={test.reading} />
                  <InfoRow label="Writing" value={test.writing} />
                  <InfoRow label="Speaking" value={test.speaking} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No test records added yet. Click Add Test to get started.</p>
          </div>
        )}
      </div>

      {/* Step: Work Experience - Always shown */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-900">Step {getStepNumber()}: Work Experience</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openAddDialog('work-experience', 'Add Work Experience', {
              company_name: '',
              designation: '',
              start_date: '',
              end_date: '',
              job_duties: '',
              certificate_url: '',
            })}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Add Experience
          </Button>
        </div>
        
        {workExperience.length > 0 ? (
          <div className="space-y-4">
            {workExperience.map((work: ApplicationWorkExperience, idx: number) => (
              <div key={work.id || idx} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">
                    {work.company_name || 'Work Experience'} {idx + 1}
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog('work-experience', 'Edit Work Experience', work)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    {work.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteRecord('work-experience', work.id!)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <InfoRow label="Company" value={work.company_name} />
                  <InfoRow label="Designation" value={work.designation} />
                  <InfoRow label="Start Date" value={work.start_date ? format(new Date(work.start_date), "dd MMM yyyy") : null} />
                  <InfoRow label="End Date" value={work.end_date ? format(new Date(work.end_date), "dd MMM yyyy") : null} />
                  <div className="col-span-2">
                    <InfoRow label="Job Duties" value={work.job_duties} />
                  </div>
                  {work.certificate_url && (
                    <div className="col-span-2">
                      <DocumentLink label="Certificate" url={work.certificate_url} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No work experience records added yet. Click Add Experience to get started.</p>
          </div>
        )}
      </div>

      {/* Step: Study Preferences - Always shown */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-900">Step {getStepNumber()}: Study Preferences</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openEditDialog('preferences', 'Edit Preferences', preferences || {})}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
        {preferences ? (
          <div className="space-y-1">
            <InfoRow label="Preferred Country" value={preferences.preferred_country} />
            <InfoRow label="Preferred Course Type" value={preferences.preferred_course_type} />
            <InfoRow label="Preferred Course Name" value={preferences.preferred_course_name} />
            <InfoRow label="Preferred Intake" value={preferences.preferred_intake} />
            <InfoRow label="Preferred University" value={preferences.preferred_university} />
            <InfoRow label="Backup Country" value={preferences.backup_country} />
            <InfoRow label="Study Mode" value={preferences.study_mode} />
            <InfoRow label="Budget Range" value={preferences.budget_range} />
            <InfoRow label="Scholarship Interest" value={preferences.scholarship_interest} />
            <InfoRow label="Travel History" value={preferences.travel_history} />
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No study preferences added yet. Click Edit to add preferences.</p>
          </div>
        )}
      </div>

      {/* Step: Visa & Passport Details - Always shown */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-900">Step {getStepNumber()}: Visa & Passport Details</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openEditDialog('visa', 'Edit Visa Details', visaDetails || {})}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
        {visaDetails ? (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Passport Information</h4>
              <InfoRow label="Passport Number" value={visaDetails.passport_number} />
              <InfoRow
                label="Issue Date"
                value={visaDetails.passport_issue_date ? format(new Date(visaDetails.passport_issue_date), "dd MMM yyyy") : null}
              />
              <InfoRow
                label="Expiry Date"
                value={visaDetails.passport_expiry_date ? format(new Date(visaDetails.passport_expiry_date), "dd MMM yyyy") : null}
              />
              <InfoRow label="Place of Issue" value={visaDetails.passport_place_of_issue} />
              <InfoRow label="Nationality" value={visaDetails.passport_nationality} />
            </div>
            
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Visa Information</h4>
              <InfoRow label="Country Applied For" value={visaDetails.country_applied_for} />
              <InfoRow label="Previous Visa Type" value={visaDetails.previous_visa_type} />
              <InfoRow label="Visa Status" value={visaDetails.visa_status} />
              <InfoRow label="Visa Refusal Reason" value={visaDetails.visa_refusal_reason} />
              <InfoRow label="Travelled Countries" value={visaDetails.travelled_countries} />
              <InfoRow label="Previous Visa Rejection" value={visaDetails.is_visa_rejected_past} />
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No visa/passport details added yet. Click Edit to add information.</p>
          </div>
        )}
      </div>

      {/* Step: Documents - Always shown */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-900">Step {getStepNumber()}: Documents</h3>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded border border-blue-200">
            ℹ️ Upload all required documents for your application
          </p>
          
          {documents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DocumentLink label="Profile Photo" url={documents.profile_photo_url} />
              <DocumentLink label="Passport Copy" url={documents.passport_copy_url} />
              <DocumentLinks label="Academic Documents" urls={documents.academic_documents_urls} />
              <DocumentLink label="English Test Certificate" url={documents.english_test_cert_url} />
              <DocumentLink label="Statement of Purpose (SOP)" url={documents.sop_url} />
              <DocumentLink label="CV/Resume" url={documents.cv_resume_url} />
              <DocumentLinks label="Recommendation Letters" urls={documents.recommendation_letters_url} />
              <DocumentLink label="Financial Documents" url={documents.financial_documents_url} />
              <DocumentLink label="Other Documents" url={documents.other_documents_url} />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No documents uploaded yet.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!editDialog} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDialog?.title}</DialogTitle>
            <DialogDescription>
              {editDialog?.isNew ? 'Fill in the details below to add a new record.' : 'Update the fields below and click save.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {editDialog && Object.keys(editDialog.fields).map((key) => {
              if (key === 'id' || key === 'application_id') return null;
              
              const isDate = key.includes('date') || key === 'dob';
              const isBoolean = typeof editDialog.fields[key] === 'boolean' || key.includes('is_') || key === 'scholarship_interest';
              const isLongText = key.includes('duties') || key.includes('reason') || key.includes('remarks');
              const isNumber = key.includes('score') || key.includes('backlogs') || key.includes('gap_years') || 
                               key === 'listening' || key === 'reading' || key === 'writing' || key === 'speaking';
              
              // Select fields with predefined options
              const selectFields: Record<string, string[]> = {
                gender: ['Male', 'Female', 'Other'],
                marital_status: ['Single', 'Married', 'Divorced', 'Widowed'],
                level: ['High School', 'Diploma', 'Bachelor', 'Master', 'PhD'],
                test_type: ['IELTS', 'TOEFL', 'PTE', 'Duolingo'],
                medium_of_instruction: ['English', 'Hindi', 'Other'],
                study_mode: ['Full-time', 'Part-time', 'Online'],
                visa_status: ['Not Applied', 'Applied', 'Approved', 'Rejected'],
                current_status: ['Student', 'Working Professional', 'Gap Year', 'Other'],
              };
              
              const label = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
              
              return (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="text-sm font-medium">
                    {label}
                  </Label>
                  
                  {isBoolean ? (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={editValues[key] || false}
                        onCheckedChange={(checked) => setEditValues({...editValues, [key]: checked})}
                      />
                      <Label htmlFor={key} className="font-normal cursor-pointer">
                        Yes
                      </Label>
                    </div>
                  ) : selectFields[key] ? (
                    <Select
                      value={editValues[key] || ''}
                      onValueChange={(value) => setEditValues({...editValues, [key]: value})}
                    >
                      <SelectTrigger id={key}>
                        <SelectValue placeholder={`Select ${label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {selectFields[key].map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : isLongText ? (
                    <Textarea
                      id={key}
                      value={editValues[key] || ''}
                      onChange={(e) => setEditValues({...editValues, [key]: e.target.value})}
                      rows={4}
                      placeholder={`Enter ${label.toLowerCase()}`}
                    />
                  ) : (
                    <Input
                      id={key}
                      type={isDate ? 'date' : isNumber ? 'number' : 'text'}
                      value={editValues[key] || ''}
                      onChange={(e) => setEditValues({...editValues, [key]: isNumber ? (e.target.value ? Number(e.target.value) : '') : e.target.value})}
                      placeholder={`Enter ${label.toLowerCase()}`}
                      step={isNumber && (key.includes('score') || key === 'listening' || key === 'reading' || key === 'writing' || key === 'speaking') ? '0.5' : '1'}
                    />
                  )}
                </div>
              );
            })}
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} className="bg-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editDialog?.isNew ? 'Add Record' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
