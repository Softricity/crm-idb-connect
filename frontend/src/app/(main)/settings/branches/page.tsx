"use client";

import { useEffect, useState } from "react";
import { useBranchStore, Branch } from "@/stores/useBranchStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { BranchPermission, hasPermission } from "@/lib/utils";
import { Button, Spinner } from "@heroui/react";
import { Plus, Building2, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { BranchFormDialog } from "@/components/settings/BranchFormDialog";
import { useRouter } from "next/navigation";

export default function BranchesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { branches, loading, fetchBranches } = useBranchStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  // Permission check
  const canManageBranches = user?.permissions 
    ? hasPermission(user.permissions, BranchPermission.BRANCH_MANAGE)
    : false;

  useEffect(() => {
    // Redirect if user doesn't have permission
    if (user && !canManageBranches) {
      toast.error("You don't have permission to access this page");
      router.push("/dashboard");
      return;
    }

    // Fetch branches
    fetchBranches();
  }, [user, canManageBranches, router, fetchBranches]);

  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedBranch(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedBranch(null);
  };

  const getBranchTypeColor = (type: string) => {
    switch (type) {
      case "HeadOffice":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "Regional":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Branch":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Group branches by type
  const groupedBranches = branches.reduce((acc, branch) => {
    if (!acc[branch.type]) {
      acc[branch.type] = [];
    }
    acc[branch.type].push(branch);
    return acc;
  }, {} as Record<string, Branch[]>);

  if (!user || !canManageBranches) {
    return null;
  }

  return (
    <div className="h-full overflow-auto p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Branch Management</h1>
              <p className="mt-2 text-gray-600">
                Manage your organization's branch hierarchy and locations
              </p>
            </div>
            {hasPermission(user?.permissions || [], BranchPermission.BRANCH_CREATE) && (
              <Button
                color="primary"
                startContent={<Plus size={20} />}
                onPress={handleCreate}
              >
                Add Branch
              </Button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Branches Grid */}
        {!loading && branches.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No branches found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first branch</p>
            <Button color="primary" onPress={handleCreate}>
              Create Branch
            </Button>
          </div>
        )}

        {!loading && branches.length > 0 && (
          <div className="space-y-8">
            {/* Head Office */}
            {groupedBranches["HeadOffice"] && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Building2 size={24} className="text-purple-600" />
                  Head Office
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedBranches["HeadOffice"].map((branch) => (
                    <BranchCard
                      key={branch.id}
                      branch={branch}
                      onEdit={handleEdit}
                      typeColor={getBranchTypeColor(branch.type)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regional Offices */}
            {groupedBranches["Regional"] && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Building2 size={24} className="text-blue-600" />
                  Regional Offices
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedBranches["Regional"].map((branch) => (
                    <BranchCard
                      key={branch.id}
                      branch={branch}
                      onEdit={handleEdit}
                      typeColor={getBranchTypeColor(branch.type)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Local Branches */}
            {groupedBranches["Branch"] && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Building2 size={24} className="text-green-600" />
                  Local Branches
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedBranches["Branch"].map((branch) => (
                    <BranchCard
                      key={branch.id}
                      branch={branch}
                      onEdit={handleEdit}
                      typeColor={getBranchTypeColor(branch.type)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Branch Form Dialog */}
        <BranchFormDialog
          isOpen={isFormOpen}
          onOpenChange={handleFormClose}
          branch={selectedBranch}
        />
      </div>
    </div>
  );
}

// Branch Card Component
interface BranchCardProps {
  branch: Branch;
  onEdit: (branch: Branch) => void;
  typeColor: string;
}

function BranchCard({ branch, onEdit, typeColor }: BranchCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer"
         onClick={() => onEdit(branch)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {branch.name}
          </h3>
          {branch.code && (
            <span className="text-sm text-gray-500 font-mono">
              {branch.code}
            </span>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${typeColor}`}>
          {branch.type}
        </span>
      </div>

      {branch.address && (
        <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
          <MapPin size={16} className="mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{branch.address}</span>
        </div>
      )}

      {branch.phone && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone size={16} className="flex-shrink-0" />
          <span>{branch.phone}</span>
        </div>
      )}
    </div>
  );
}
