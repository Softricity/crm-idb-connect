"use client";

import React, { useState, useEffect } from "react";
import { Card, Input, Select, SelectItem, Button } from "@heroui/react";
import { toast } from "sonner";
import { QRCodeCanvas as QRCode } from "qrcode.react";
import { useBranchStore } from "@/stores/useBranchStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { BranchPermission, ReferralPermission, hasPermission } from "@/lib/utils";

export default function Referral() {
  const [source] = useState("referral");
  const [medium, setMedium] = useState("consultant");
  const [campaign, setCampaign] = useState("");
  const [branchId, setBranchId] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [showUtm, setShowUtm] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");

  const { branches, fetchBranches, loading } = useBranchStore();
  const { user } = useAuthStore();

  const canManageBranch = !!user && hasPermission(user.permissions || [], BranchPermission.BRANCH_MANAGE);
  const canManageReferrals = !!user && hasPermission(user.permissions || [], ReferralPermission.REFERRAL_MANAGE);

  useEffect(() => {
    fetchBranches();
    // If user cannot manage branches, default to their branch
    if (user && !canManageBranch) {
      setBranchId(user.branch_id || "");
    }
    // If user cannot manage referrals, default campaign & medium
    if (user && !canManageReferrals) {
      setCampaign(user.name || "");
      setMedium("employee");
    }
  }, [fetchBranches, user, canManageBranch]);

  const baseUrl = "https://inquiry.idbconnect.global";

  // Generate the referral link automatically if all fields are filled
  React.useEffect(() => {
    // Determine effective UTM values
    const finalSource = canManageReferrals ? (utmSource.trim() || source) : source;
    const finalMedium = canManageReferrals ? (utmMedium.trim() || medium) : "employee";
    const finalCampaign = canManageReferrals
      ? (utmCampaign.trim() || campaign.trim())
      : (user?.name || campaign.trim());

    if (finalCampaign && branchId.trim()) {
      const encodedCampaign = encodeURIComponent(finalCampaign.replace(/\s+/g, "_"));
      const finalUrl = `${baseUrl}?utm_source=${finalSource}&utm_medium=${finalMedium}&utm_campaign=${encodedCampaign}&branch_id=${encodeURIComponent(branchId.trim())}`;
      setGeneratedUrl(finalUrl);
    } else {
      setGeneratedUrl("");
    }
  }, [source, medium, campaign, branchId, utmSource, utmMedium, utmCampaign, user, canManageReferrals]);

  const handleCopy = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      toast.success("URL copied to clipboard");
    }
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById("referral-qr") as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "referral-qr.png";
      a.click();
    }
  };

  return (
    <>
      <h1 className="text-xl font-bold mb-4">Referral Form</h1>
      <Card className="p-6 max-w-md space-y-4">
        {/* Source, Medium, Campaign (hidden when editing UTM) */}
        {!showUtm && (
          <>
            <div>
              <label className="font-medium text-sm mb-1 block">Source</label>
              <Input isDisabled value={source} placeholder="Referral" />
            </div>
            <div>
              <label className="font-medium text-sm mb-1 block">Medium</label>
              <Select selectedKeys={[medium]} onChange={(e) => setMedium(e.target.value)} isDisabled={!canManageReferrals}>
                <SelectItem key="consultant">Consultant</SelectItem>
                <SelectItem key="employee">Employee</SelectItem>
              </Select>
            </div>
            <div>
              <label className="font-medium text-sm mb-1 block">Campaign (Person’s Name)</label>
              <Input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="Enter person's name" isDisabled={!canManageReferrals} />
            </div>
          </>
        )}
        {/* Branch Select */}
        <div>
          <label className="font-medium text-sm mb-1 block">Branch</label>
          <Select
            selectedKeys={branchId ? [branchId] : []}
            onChange={e => setBranchId(e.target.value)}
            isLoading={loading}
            placeholder={canManageBranch ? "Select branch" : "Your branch"}
            isDisabled={!canManageBranch}
          >
            {branches.map(branch => (
              <SelectItem key={branch.id}>{branch.name}</SelectItem>
            ))}
          </Select>
        </div>
        {/* UTM Inputs (only for users who can manage referrals) - shown on demand */}
        {canManageReferrals && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button size="sm" color="secondary" onPress={() => setShowUtm((s) => !s)}>
                {showUtm ? "Hide UTM" : "Edit UTM"}
              </Button>
              <span className="text-sm text-gray-500">(optional) Customize UTM parameters for this referral</span>
            </div>

            {showUtm && (
              <div className="space-y-2">
                <div>
                  <label className="font-medium text-sm mb-1 block">UTM Source</label>
                  <Input value={utmSource} onChange={(e) => setUtmSource(e.target.value)} placeholder="utm_source (default: referral)" />
                </div>
                <div>
                  <label className="font-medium text-sm mb-1 block">UTM Medium</label>
                  <Input value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} placeholder="utm_medium (e.g. consultant)" />
                </div>
                <div>
                  <label className="font-medium text-sm mb-1 block">UTM Campaign</label>
                  <Input value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder="utm_campaign (person or campaign)" />
                </div>
              </div>
            )}
          </div>
        )}
        {/* Buttons */}
        <div className="flex gap-2">
          {generatedUrl && (
            <Button color="secondary" onPress={handleCopy}>
              Copy URL
            </Button>
          )}
          {generatedUrl && canManageReferrals && (
            <Button color="secondary" onPress={handleDownloadQR}>
              Download QR
            </Button>
          )}
        </div>
        {/* Generated URL */}
        {generatedUrl && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm break-all">
            <strong>Generated URL:</strong> <br />
            {generatedUrl}
            {canManageReferrals && (
              <div className="mt-4 flex flex-col items-center">
                <QRCode id="referral-qr" value={generatedUrl} size={160} />
              </div>
            )}
          </div>
        )}
      </Card>
    </>
  );
}
