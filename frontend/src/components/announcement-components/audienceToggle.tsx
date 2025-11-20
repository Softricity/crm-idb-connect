// components/announcements/AudienceToggle.tsx
"use client";
import React from "react";
import { RadioGroup, Radio } from "@heroui/react"; // adjust import path if different

type Props = {
    value: "user" | "branch";
    onChange: (v: "user" | "branch") => void;
};

export default function AudienceToggle({ value, onChange }: Props) {
    return (
        <RadioGroup value={value} onChange={(e) => onChange((e.target as HTMLInputElement).value as "user" | "branch")} className="grid grid-cols-2 gap-4">
            <div>
                {/* <Radio value="branch" disabled className="w-full">
                    <div className={`p-4 border rounded-lg ${value === "branch" ? "border-blue-600 ring-1 ring-blue-200" : "border-gray-200"}`}>
                        <div className="flex items-center gap-3">
                            <div className="text-sm font-medium">For Branch</div>
                            <div className="text-xs text-gray-500">Assign to specific branch (disabled)</div>
                        </div>
                    </div>
                </Radio> */}
            </div>

            <div>
                <Radio value="user" className="w-full">
                    <div className={`p-4 border rounded-lg ${value === "user" ? "border-blue-600 ring-1 ring-blue-200" : "border-gray-200"}`}>
                        <div className="flex items-center gap-3">
                            <div className="text-sm font-medium">For User</div>
                            <div className="text-xs text-gray-500">Assign to specific user(s)</div>
                        </div>
                    </div>
                </Radio>
            </div>
        </RadioGroup>
    );
};
