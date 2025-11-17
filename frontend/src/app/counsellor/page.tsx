"use client";

import React from "react";
import { CounsellorLeadsTable } from "@/components/counsellor-panel/counsellorLeadsTable";

export default function CounsellorPage() {
    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold mb-6">My Assigned Leads</h1>
            <CounsellorLeadsTable />
        </div>
    );
}
