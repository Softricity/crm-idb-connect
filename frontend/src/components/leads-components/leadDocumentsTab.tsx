"use client";

import { useEffect, useMemo, useState } from "react";
import { ApplicationsAPI } from "@/lib/api";
import { getFileUrl } from "@/lib/utils";
import { Button, Card, CardBody } from "@heroui/react";
import {
  User,
  FileText,
  GraduationCap,
  FileCheck,
  BookOpen,
  Briefcase,
  Award,
  DollarSign,
  FolderOpen,
  UploadCloud,
  ExternalLink,
  Paperclip,
  AlertCircle
} from "lucide-react";

type ApplicationDocuments = {
  profile_photo_url?: string | null;
  passport_copy_url?: string | null;
  academic_documents_urls?: string[] | null;
  english_test_cert_url?: string | null;
  sop_url?: string | null;
  cv_resume_url?: string | null;
  recommendation_letters_url?: string[] | null;
  financial_documents_url?: string | null;
  other_documents_url?: string | null;
};

type Category = {
  key: string;
  label: string;
  formKey: string;
  maxFiles: number;
  singleField?: keyof ApplicationDocuments;
  multiField?: keyof ApplicationDocuments;
};

const CATEGORIES: Category[] = [
  { key: "profile_photo", label: "Profile Photo", formKey: "profile_photo", maxFiles: 1, singleField: "profile_photo_url" },
  { key: "passport_copy", label: "Passport Copy", formKey: "passport_copy", maxFiles: 1, singleField: "passport_copy_url" },
  { key: "academic_documents", label: "Academic Documents", formKey: "academic_documents", maxFiles: 10, multiField: "academic_documents_urls" },
  { key: "english_test_cert", label: "English Test Certificate", formKey: "english_test_cert", maxFiles: 1, singleField: "english_test_cert_url" },
  { key: "sop", label: "SOP", formKey: "sop", maxFiles: 1, singleField: "sop_url" },
  { key: "cv_resume", label: "CV / Resume", formKey: "cv_resume", maxFiles: 1, singleField: "cv_resume_url" },
  { key: "recommendation_letters", label: "Recommendation Letters", formKey: "recommendation_letters", maxFiles: 5, multiField: "recommendation_letters_url" },
  { key: "financial_documents", label: "Financial Documents", formKey: "financial_documents", maxFiles: 1, singleField: "financial_documents_url" },
  { key: "other_documents", label: "Other Documents", formKey: "other_documents", maxFiles: 1, singleField: "other_documents_url" },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  profile_photo: User,
  passport_copy: FileText,
  academic_documents: GraduationCap,
  english_test_cert: FileCheck,
  sop: BookOpen,
  cv_resume: Briefcase,
  recommendation_letters: Award,
  financial_documents: DollarSign,
  other_documents: FolderOpen,
};

export default function LeadDocumentsTab({ leadId, canEdit }: { leadId: string; canEdit: boolean }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [application, setApplication] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File[]>>({});

  const documents: ApplicationDocuments = useMemo(
    () => (application?.documents?.[0] || {}) as ApplicationDocuments,
    [application],
  );

  const loadApplication = async () => {
    setLoading(true);
    setError("");
    try {
      const app = await ApplicationsAPI.getApplication(leadId);
      setApplication(app || null);
    } catch {
      setApplication(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!leadId) return;
    loadApplication();
  }, [leadId]);

  const onSelectFiles = (categoryKey: string, files: FileList | null, maxFiles: number) => {
    if (!files) return;
    setSelectedFiles((prev) => ({ ...prev, [categoryKey]: Array.from(files).slice(0, maxFiles) }));
  };

  const uploadSelected = async () => {
    setSaving(true);
    setError("");
    try {
      const form = new FormData();
      for (const category of CATEGORIES) {
        const files = selectedFiles[category.key] || [];
        for (const file of files) {
          form.append(category.formKey, file, file.name);
        }
      }

      if (Array.from(form.keys()).length === 0) {
        setError("Please select at least one file before uploading.");
        return;
      }

      const updated = await ApplicationsAPI.uploadDocuments(leadId, form);
      setApplication(updated || null);
      setSelectedFiles({});
    } catch (e: any) {
      setError(e?.message || "Failed to upload documents.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-sm text-gray-500">Loading documents...</div>;
  }

  return (
    <div className="space-y-6 p-4 bg-white rounded-xl shadow-sm">
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {!canEdit && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span>Read-only access: you can view documents but cannot upload/edit.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((category) => {
          const IconComponent = CATEGORY_ICONS[category.key] || FolderOpen;
          const singleUrlRaw = category.singleField ? documents[category.singleField] : null;
          const singleUrl = typeof singleUrlRaw === "string" ? singleUrlRaw : null;
          const multiUrls = category.multiField ? (documents[category.multiField] || []) : [];
          const hasUploaded = !!singleUrl || (Array.isArray(multiUrls) && multiUrls.length > 0);

          return (
            <Card
              key={category.key}
              className={`border transition-all duration-200 ${
                hasUploaded
                  ? "border-l-4 border-l-teal-600 border-slate-200 bg-gradient-to-br from-white to-slate-50/30"
                  : "border-l-4 border-l-slate-400 border-slate-200 bg-white"
              } hover:shadow-md rounded-xl`}
            >
              <CardBody className="p-4 flex flex-col justify-between h-full gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      hasUploaded ? "bg-teal-50 text-teal-600" : "bg-slate-100 text-slate-500"
                    }`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-800">{category.label}</div>
                      <div className="text-xs text-slate-500">
                        {category.maxFiles === 1 ? "Single File" : `Up to ${category.maxFiles} Files`}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {singleUrl && (
                      <a
                        className="flex items-center gap-2 text-teal-700 bg-teal-50/50 hover:bg-teal-50 border border-teal-100 rounded-lg p-2 text-xs font-medium transition-colors"
                        target="_blank"
                        rel="noreferrer"
                        href={getFileUrl(singleUrl)}
                      >
                        <Paperclip className="h-3.5 w-3.5 text-teal-600" />
                        <span className="truncate flex-1">View uploaded document</span>
                        <ExternalLink className="h-3.5 w-3.5 text-teal-500" />
                      </a>
                    )}

                    {Array.isArray(multiUrls) && multiUrls.length > 0 && (
                      <div className="space-y-1.5">
                        {multiUrls.map((url, idx) => (
                          <a
                            key={`${category.key}-${idx}`}
                            className="flex items-center gap-2 text-teal-700 bg-teal-50/50 hover:bg-teal-50 border border-teal-100 rounded-lg p-2 text-xs font-medium transition-colors"
                            target="_blank"
                            rel="noreferrer"
                            href={getFileUrl(url)}
                          >
                            <Paperclip className="h-3.5 w-3.5 text-teal-600" />
                            <span className="truncate flex-1">Document {idx + 1}</span>
                            <ExternalLink className="h-3.5 w-3.5 text-teal-500" />
                          </a>
                        ))}
                      </div>
                    )}

                    {!hasUploaded && (
                      <div className="flex items-center gap-2 text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-lg p-3 text-xs font-medium justify-center italic">
                        <AlertCircle className="h-4 w-4 text-slate-400" />
                        No documents uploaded
                      </div>
                    )}
                  </div>
                </div>

                {canEdit && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <label className="flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer transition-colors shadow-sm">
                      <UploadCloud className="h-4 w-4 text-slate-500" />
                      Choose {category.maxFiles > 1 ? "Files" : "File"}
                      <input
                        type="file"
                        multiple={category.maxFiles > 1}
                        className="hidden"
                        onChange={(e) => onSelectFiles(category.key, e.target.files, category.maxFiles)}
                      />
                    </label>
                    {(selectedFiles[category.key] || []).length > 0 && (
                      <div className="mt-2 p-1.5 bg-blue-50 border border-blue-100 text-blue-800 rounded-lg flex items-center justify-between text-[11px] font-medium">
                        <div className="truncate flex-1 pr-2">
                          <span className="text-blue-900 font-semibold">Selected: </span>
                          {(selectedFiles[category.key] || []).map((f) => f.name).join(", ")}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFiles((prev) => {
                            const next = { ...prev };
                            delete next[category.key];
                            return next;
                          })}
                          className="text-blue-500 hover:text-blue-700 font-bold px-1"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {canEdit && (
        <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
          <Button
            color="primary"
            onPress={uploadSelected}
            isLoading={saving}
            isDisabled={saving || Object.keys(selectedFiles).length === 0}
            size="md"
            className="font-semibold shadow-sm"
          >
            Upload Selected Documents
          </Button>
        </div>
      )}
    </div>
  );
}
