"use client";

import React, { useState } from "react";
import { Card, Input, Select, SelectItem, Button } from "@heroui/react";

export default function Referral() {
  const [source, setSource] = useState("referral");
  const [medium, setMedium] = useState("consultant");
  const [campaign, setCampaign] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");

  const baseUrl = "https://inquiry.idbconnect.global";

  const handleGenerate = () => {
    if (!campaign.trim()) {
      alert("Please enter the campaign (person's name)");
      return;
    }

    const finalUrl = `${baseUrl}?utm_source=${source}&utm_medium=${medium}&utm_campaign=${encodeURIComponent(
      campaign.trim().replace(/\s+/g, "_")
    )}`;
    setGeneratedUrl(finalUrl);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedUrl);
    alert("URL copied to clipboard!");
  };

  return (
    <>
      <h1 className="text-xl font-bold mb-4">Referral Form</h1>

      <Card className="p-6 max-w-md space-y-4">
        {/* Source */}
        <div>
          <label className="font-medium text-sm mb-1 block">Source</label>
          <Input
            isDisabled
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Referral"
          />
        </div>

        {/* Medium */}
        <div>
          <label className="font-medium text-sm mb-1 block">Medium</label>
          <Select
            selectedKeys={[medium]}
            onChange={(e) => setMedium(e.target.value)}
          >
            <SelectItem key="consultant">
              Consultant
            </SelectItem>
            <SelectItem key="employee">
              Employee
            </SelectItem>
          </Select>
        </div>

        {/* Campaign */}
        <div>
          <label className="font-medium text-sm mb-1 block">Campaign (Person’s Name)</label>
          <Input
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            placeholder="Enter person's name"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <Button color="primary" onPress={handleGenerate} className="text-white">
            Generate Link
          </Button>
          {generatedUrl && (
            <Button color="secondary" onPress={handleCopy}>
              Copy URL
            </Button>
          )}
        </div>

        {/* Generated URL */}
        {generatedUrl && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm break-all">
            <strong>Generated URL:</strong> <br />
            {generatedUrl}
          </div>
        )}
      </Card>
    </>
  );
}
