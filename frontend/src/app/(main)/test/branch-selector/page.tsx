"use client";

import BranchSelector from "@/components/BranchSelector";
import { useState } from "react";
import { Card, CardBody, CardHeader, Divider, Button } from "@heroui/react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBranchStore } from "@/stores/useBranchStore";
import { isSuperAdmin } from "@/lib/utils";

export default function BranchSelectorDemo() {
  const { user } = useAuthStore();
  const { selectedBranch } = useBranchStore();
  const [formBranch, setFormBranch] = useState(user?.branch_id || "");

  const isUserSuperAdmin = user?.permissions ? isSuperAdmin(user.permissions) : false;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Branch Selector Component Demo</h1>

      <div className="grid gap-6">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Current User Info</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="space-y-2">
              <p><strong>Name:</strong> {user?.name || "Not logged in"}</p>
              <p><strong>Email:</strong> {user?.email || "N/A"}</p>
              <p><strong>Role:</strong> {user?.role || "N/A"}</p>
              <p><strong>Is Super Admin:</strong> {isUserSuperAdmin ? "Yes ✅" : "No ❌"}</p>
              <p><strong>Assigned Branch:</strong> {user?.branch_name || "None"}</p>
              <p><strong>Branch Type:</strong> {user?.branch_type || "N/A"}</p>
              <p><strong>Permissions Count:</strong> {user?.permissions?.length || 0}</p>
            </div>
          </CardBody>
        </Card>

        {/* Branch Selector Demo */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Branch Selector</h2>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                {isUserSuperAdmin 
                  ? "✅ You are a Super Admin - you can select any branch"
                  : "⚠️ You are restricted to your assigned branch"}
              </p>

              <BranchSelector
                value={formBranch}
                onChange={setFormBranch}
                label="Select Branch"
                placeholder="Choose a branch"
              />
            </div>

            {formBranch && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="font-semibold">Selected Branch ID:</p>
                <code className="text-sm">{formBranch}</code>
              </div>
            )}

            {selectedBranch && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <p className="font-semibold">Branch Details (from store):</p>
                <pre className="text-sm mt-2">{JSON.stringify(selectedBranch, null, 2)}</pre>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Usage Example */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Usage Example</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-x-auto">
{`import BranchSelector from "@/components/BranchSelector";

function MyForm() {
  const [branchId, setBranchId] = useState("");

  return (
    <BranchSelector
      value={branchId}
      onChange={setBranchId}
      label="Branch"
      placeholder="Select branch"
    />
  );
}`}
            </pre>
          </CardBody>
        </Card>

        {/* Behavior Notes */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Component Behavior</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Super Admin:</strong> Can select from all available branches</li>
              <li><strong>Regular User:</strong> Dropdown is disabled, shows their assigned branch</li>
              <li><strong>Automatic Detection:</strong> Uses <code>isSuperAdmin()</code> utility to determine user type</li>
              <li><strong>Store Integration:</strong> Selected branch is saved in <code>useBranchStore</code></li>
              <li><strong>Auto-fetch:</strong> Fetches all branches on component mount</li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
