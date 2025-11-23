"use client";

import { useEffect, useState } from "react";
import { useApplicationStore, ApplicationEducation, ApplicationTests, ApplicationWorkExperience } from "@/stores/useApplicationStore";
import { format } from "date-fns";
import { Loader2, Pencil, FileText } from "lucide-react";
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
    setEditValues(currentData || {});
    setEditDialog({ section, title, fields: currentData });
  };

  const handleSaveEdit = async () => {
    if (!editDialog) return;
    
    try {
      await patchSection(leadId, editDialog.section, editValues);
      setEditDialog(null);
      await fetchApplicationByLeadId(leadId);
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save changes. Please try again.");
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

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg mb-4">
        <h2 className="text-xl font-bold text-primary">Application Information</h2>
        <p className="text-sm text-muted-foreground">Complete application details</p>
      </div>

      {/* Step 1: Basic Information */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-900">Step 1: Basic Information</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openEditDialog('basic', 'Edit Basic Information', {
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

      {/* Step 2: Visa & Passport Details */}
      {visaDetails && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-lg font-semibold text-gray-900">Step 2: Visa & Passport Details</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEditDialog('visa_details', 'Edit Visa Details', visaDetails)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
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
        </div>
      )}

      {/* Step 3: Study Preferences */}
      {preferences && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-lg font-semibold text-gray-900">Step 3: Study Preferences</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEditDialog('preferences', 'Edit Preferences', preferences)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
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
        </div>
      )}

      {/* Step 4: Family Details */}
      {familyDetails && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-lg font-semibold text-gray-900">Step 4: Family Details</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEditDialog('family_details', 'Edit Family Details', familyDetails)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
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
        </div>
      )}

      {/* Step 5: Education History */}
      {education.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-lg font-semibold text-gray-900">Step 5: Education History</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => alert('Add education functionality coming soon')}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Add Education
            </Button>
          </div>
          
          <div className="space-y-4">
            {education.map((edu: ApplicationEducation, idx: number) => (
              <div key={edu.id || idx} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">
                    {edu.level || 'Education Record'} {idx + 1}
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(`education/${edu.id}`, 'Edit Education', edu)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
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
        </div>
      )}

      {/* Step 6: English Language Tests */}
      {tests.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-lg font-semibold text-gray-900">Step 6: English Language Tests</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => alert('Add test functionality coming soon')}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Add Test
            </Button>
          </div>
          
          <div className="space-y-4">
            {tests.map((test: ApplicationTests, idx: number) => (
              <div key={test.id || idx} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">
                    {test.test_type || 'Test Record'} {idx + 1}
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(`tests/${test.id}`, 'Edit Test', test)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
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
        </div>
      )}

      {/* Step 7: Work Experience */}
      {workExperience.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-lg font-semibold text-gray-900">Step 7: Work Experience</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => alert('Add work experience functionality coming soon')}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Add Experience
            </Button>
          </div>
          
          <div className="space-y-4">
            {workExperience.map((work: ApplicationWorkExperience, idx: number) => (
              <div key={work.id || idx} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">
                    {work.company_name || 'Work Experience'} {idx + 1}
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(`work_experience/${work.id}`, 'Edit Work Experience', work)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
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
        </div>
      )}

      {/* Step 8: Documents */}
      {documents && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-lg font-semibold text-gray-900">Step 8: Documents</h3>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded border border-blue-200">
              ℹ️ Upload all required documents for your application
            </p>
            
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
          </div>
        </div>
      )}

      <Dialog open={!!editDialog} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDialog?.title}</DialogTitle>
            <DialogDescription>Update the fields below and click save.</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            {editDialog && Object.keys(editDialog.fields).map((key) => {
              if (key === 'id' || key === 'application_id') return null;
              
              const isDate = key.includes('date') || key === 'dob';
              
              return (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="capitalize">
                    {key.replace(/_/g, ' ')}
                  </Label>
                  <Input
                    id={key}
                    type={isDate ? 'date' : 'text'}
                    value={editValues[key] || ''}
                    onChange={(e) => setEditValues({...editValues, [key]: e.target.value})}
                  />
                </div>
              );
            })}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
