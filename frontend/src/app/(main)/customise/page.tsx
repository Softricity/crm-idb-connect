"use client";

import OptionManager from "@/components/settings/OptionManager";

export default function CustomisePage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Customise Dropdowns</h1>
        <p className="text-gray-500">Manage the active options for various lists in the CRM.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <OptionManager title="Lead Statuses" optionKey="lead_statuses" />
        <OptionManager title="Course Names" optionKey="course_names" />
        <OptionManager title="Preferred Countries" optionKey="preferred_countries" />
        <OptionManager title="Rejection/Cold Reasons" optionKey="reasons" />
      </div>
    </div>
  );
}