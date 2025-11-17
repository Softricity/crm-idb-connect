"use client";

import React from "react";
import { Lead } from "@/stores/useLeadStore";
import { Card, CardBody, CardHeader, Chip, Divider } from "@heroui/react";
import { format } from "date-fns";
import { Mail, Phone, MapPin, Target, Calendar } from "lucide-react";

interface CounsellorLeadDetailsProps {
  lead: Lead;
}

export function CounsellorLeadDetails({ lead }: CounsellorLeadDetailsProps) {
  const statusColorMap: Record<string, "default" | "primary" | "secondary" | "success" | "warning" | "danger"> = {
    new: "primary",
    contacted: "secondary",
    qualified: "success",
    "not-interested": "danger",
    "follow-up": "warning",
  };

  return (
    <div className="w-full mt-6 space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold">Personal Information</h3>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-base font-medium">{lead.name}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Chip color={statusColorMap[lead.status] || "default"} size="sm" variant="flat">
                {lead.status}
              </Chip>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-base font-medium">{lead.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Mobile</p>
                <p className="text-base font-medium">{lead.mobile}</p>
              </div>
            </div>

            {lead.alternate_mobile && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Alternate Mobile</p>
                  <p className="text-base font-medium">{lead.alternate_mobile}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">City</p>
                <p className="text-base font-medium">{lead.city}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Purpose</p>
                <p className="text-base font-medium capitalize">{lead.purpose}</p>
              </div>
            </div>

            {lead.preferred_country && (
              <div>
                <p className="text-sm text-gray-500">Preferred Country</p>
                <p className="text-base font-medium">{lead.preferred_country}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p className="text-base font-medium">
                  {lead.created_at ? format(new Date(lead.created_at), "PPP") : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {lead.reason && (
            <div className="mt-6">
              <p className="text-sm text-gray-500">Reason/Notes</p>
              <p className="text-base font-medium">{lead.reason}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* UTM Parameters */}
      {(lead.utm_source || lead.utm_medium || lead.utm_campaign) && (
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold">Marketing Information</h3>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {lead.utm_source && (
                <div>
                  <p className="text-sm text-gray-500">Source</p>
                  <p className="text-base font-medium">{lead.utm_source}</p>
                </div>
              )}
              {lead.utm_medium && (
                <div>
                  <p className="text-sm text-gray-500">Medium</p>
                  <p className="text-base font-medium">{lead.utm_medium}</p>
                </div>
              )}
              {lead.utm_campaign && (
                <div>
                  <p className="text-sm text-gray-500">Campaign</p>
                  <p className="text-base font-medium">{lead.utm_campaign}</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
