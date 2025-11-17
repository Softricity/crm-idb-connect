"use client";

import { useEffect, useState } from "react";
import { useApplicationStore } from "@/stores/useApplicationStore";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

const InfoRow = ({ label, value }: { label: string; value?: string | null | boolean }) => {
  const displayValue = () => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return value;
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

const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
      {title}
    </h3>
    <div className="space-y-1">{children}</div>
  </div>
);

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

interface ApplicationDetailsViewProps {
  leadId: string;
}

export default function ApplicationDetailsView({
  leadId,
}: ApplicationDetailsViewProps) {
  const {
    application,
    identifications,
    preferences,
    familyDetails,
    addresses,
    documents,
    declarations,
    loadApplication,
    loading,
  } = useApplicationStore();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await loadApplication(leadId);
      setIsLoading(false);
    };

    if (leadId) {
      loadData();
    }
  }, [leadId, loadApplication]);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading application details...</span>
      </div>
    );
  }

  // Check if any application data exists
  const hasApplicationData = application && Object.keys(application).length > 1; // More than just lead_id

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
      {/* Step 1: Basic Application Information */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg mb-4">
        <h2 className="text-xl font-bold text-primary">Application Information</h2>
        <p className="text-sm text-muted-foreground">Complete application details in 7 sections</p>
      </div>

      <SectionCard title="Step 1: Basic Information">
        <InfoRow label="Lead ID" value={application.lead_id} />
        <InfoRow label="Program Discipline" value={application.program_discipline} />
        <InfoRow label="Program Course" value={application.program_course} />
        <InfoRow label="Title" value={application.title} />
        <InfoRow
          label="Date of Birth"
          value={
            application.dob
              ? format(new Date(application.dob), "dd MMM yyyy")
              : null
          }
        />
        <InfoRow label="Gender" value={application.gender} />
        <InfoRow label="Marital Status" value={application.marital_status} />
        <InfoRow label="Category" value={application.category} />
        <InfoRow label="Religion" value={application.religion} />
        <InfoRow label="Nationality" value={application.nationality} />
        <InfoRow label="Blood Group" value={application.blood_group} />
      </SectionCard>

      {/* Step 2: Identification Details */}
      {identifications && Object.keys(identifications).length > 0 && (
        <SectionCard title="Step 2: Identification Details">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Identity Documents</h4>
              <InfoRow
                label="Aadhaar Number"
                value={identifications.aadhaar_number}
              />
              <InfoRow
                label="PAN Card Number"
                value={identifications.pan_card_number}
              />
            </div>
            
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Passport Details</h4>
              <InfoRow
                label="Passport Number"
                value={identifications.passport_number}
              />
              <InfoRow
                label="Passport Issuing Country"
                value={identifications.passport_issuing_country}
              />
              <InfoRow
                label="Passport Valid Upto"
                value={
                  identifications.passport_valid_upto
                    ? format(
                        new Date(identifications.passport_valid_upto),
                        "dd MMM yyyy"
                      )
                    : null
                }
              />
            </div>
          </div>
        </SectionCard>
      )}

      {/* Step 3: Application Preferences */}
      {preferences && Object.keys(preferences).length > 0 && (
        <SectionCard title="Step 3: Preferences">
          <InfoRow
            label="Hostel Facility Required"
            value={preferences.hostel_facility_required}
          />
          {preferences.hostel_facility_required && (
            <InfoRow label="Hostel Type" value={preferences.hostel_type} />
          )}
          <InfoRow
            label="Travel Accommodation Required"
            value={preferences.travel_accommodation_required}
          />
          <InfoRow
            label="Have Given Entrance Exam"
            value={preferences.has_given_exam}
          />
          <InfoRow
            label="Have Work Experience"
            value={preferences.has_work_experience}
          />
        </SectionCard>
      )}

      {/* Step 4: Family Details */}
      {familyDetails && Object.keys(familyDetails).length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Step 4: Family Details
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Father's Details */}
            <SectionCard title="Father's Details">
              <InfoRow label="Title" value={familyDetails.father_title} />
              <InfoRow label="Name" value={familyDetails.father_name} />
              <InfoRow label="Email" value={familyDetails.father_email} />
              <InfoRow label="Mobile" value={familyDetails.father_mobile} />
              <InfoRow
                label="Occupation"
                value={familyDetails.father_occupation}
              />
            </SectionCard>

            {/* Mother's Details */}
            <SectionCard title="Mother's Details">
              <InfoRow label="Title" value={familyDetails.mother_title} />
              <InfoRow label="Name" value={familyDetails.mother_name} />
              <InfoRow label="Email" value={familyDetails.mother_email} />
              <InfoRow label="Mobile" value={familyDetails.mother_mobile} />
              <InfoRow
                label="Occupation"
                value={familyDetails.mother_occupation}
              />
            </SectionCard>
          </div>

          {/* Guardian's Details - Only show if data exists */}
          {(familyDetails.guardian_name || 
            familyDetails.guardian_email || 
            familyDetails.guardian_mobile) && (
            <SectionCard title="Guardian Details (if applicable)">
              <InfoRow label="Title" value={familyDetails.guardian_title} />
              <InfoRow label="Name" value={familyDetails.guardian_name} />
              <InfoRow label="Email" value={familyDetails.guardian_email} />
              <InfoRow label="Mobile" value={familyDetails.guardian_mobile} />
              <InfoRow
                label="Occupation"
                value={familyDetails.guardian_occupation}
              />
              <InfoRow
                label="Relationship"
                value={familyDetails.guardian_relationship}
              />
            </SectionCard>
          )}

          {/* Family Income */}
          <SectionCard title="Family Financial Details">
            <InfoRow
              label="Family Annual Income"
              value={familyDetails.family_annual_income}
            />
          </SectionCard>
        </div>
      )}

      {/* Step 5: Address Details */}
      {addresses && Object.keys(addresses).length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Step 5: Address Details
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Correspondence Address */}
            <SectionCard title="Correspondence Address">
              <InfoRow
                label="Address Line 1"
                value={addresses.correspondence_address_line_1}
              />
              <InfoRow
                label="Address Line 2"
                value={addresses.correspondence_address_line_2}
              />
              <InfoRow label="City" value={addresses.correspondence_city} />
              <InfoRow
                label="District"
                value={addresses.correspondence_district}
              />
              <InfoRow label="State" value={addresses.correspondence_state} />
              <InfoRow
                label="Country"
                value={addresses.correspondence_country}
              />
              <InfoRow
                label="Pincode"
                value={addresses.correspondence_pincode}
              />
            </SectionCard>

            {/* Permanent Address */}
            <SectionCard title="Permanent Address">
              {addresses.is_permanent_same_as_correspondence ? (
                <div className="text-gray-600 italic py-4 text-center bg-gray-50 rounded">
                  ✓ Same as Correspondence Address
                </div>
              ) : (
                <>
                  <InfoRow
                    label="Address Line 1"
                    value={addresses.permanent_address_line_1}
                  />
                  <InfoRow
                    label="Address Line 2"
                    value={addresses.permanent_address_line_2}
                  />
                  <InfoRow label="City" value={addresses.permanent_city} />
                  <InfoRow label="District" value={addresses.permanent_district} />
                  <InfoRow label="State" value={addresses.permanent_state} />
                  <InfoRow label="Country" value={addresses.permanent_country} />
                  <InfoRow label="Pincode" value={addresses.permanent_pincode} />
                </>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {/* Step 6: Documents */}
      {documents && Object.keys(documents).length > 0 && (
        <SectionCard title="Step 6: Document Upload">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded border border-blue-200">
              ℹ️ Required documents: Passport Photo, Class X Marksheet, Class XII Marksheet
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DocumentLink
                label="Passport Photo *"
                url={documents.passport_photo_url}
              />
              <DocumentLink
                label="Class X Marksheet *"
                url={documents.class_x_marksheet_url}
              />
              <DocumentLink
                label="Class XII Marksheet *"
                url={documents.class_xii_marksheet_url}
              />
              <DocumentLink
                label="Graduation Marksheet"
                url={documents.graduation_marksheet_url}
              />
              <DocumentLink
                label="Aadhaar Card"
                url={documents.aadhaar_card_url}
              />
              <DocumentLink
                label="Entrance Exam Scorecard"
                url={documents.entrance_exam_scorecard_url}
              />
              <DocumentLink
                label="Work Experience Certificates"
                url={documents.work_experience_certificates_url}
              />
              <DocumentLink label="Passport" url={documents.passport_url} />
            </div>
          </div>
        </SectionCard>
      )}

      {/* Step 7: Declarations */}
      {declarations && Object.keys(declarations).length > 0 && (
        <SectionCard title="Step 7: Declaration Details">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              ⚠️ The applicant has read and agreed to all terms and conditions
            </p>
          </div>
          
          <InfoRow
            label="Declaration Agreed"
            value={declarations.declaration_agreed}
          />
          <InfoRow
            label="Applicant Name"
            value={declarations.declaration_applicant_name}
          />
          <InfoRow
            label="Parent/Guardian Name"
            value={declarations.declaration_parent_name}
          />
          <InfoRow
            label="Declaration Date"
            value={
              declarations.declaration_date
                ? format(
                    new Date(declarations.declaration_date),
                    "dd MMM yyyy"
                  )
                : null
            }
          />
          <InfoRow
            label="Declaration Place"
            value={declarations.declaration_place}
          />
        </SectionCard>
      )}
    </div>
  );
}
