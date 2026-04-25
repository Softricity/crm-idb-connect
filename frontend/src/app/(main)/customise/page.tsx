"use client";

import { useEffect, useState } from "react";
import { Button, Spinner, Input, Card, CardBody } from "@heroui/react";
import { Plus, Mail, Tags } from "lucide-react";
import CategoryCard from "@/components/settings/CategoryCard";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Option {
  id: string;
  label: string;
  value: string;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
  label: string;
  is_system: boolean;
  options: Option[];
}

export default function CustomisePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await api.DropdownsAPI.getAllCategories();
      setCategories(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !newCategoryLabel.trim()) {
      toast.error("Please fill in both fields");
      return;
    }

    setIsAdding(true);
    try {
      await api.DropdownsAPI.createCategory({
        name: newCategoryName,
        label: newCategoryLabel,
      });
      
      setNewCategoryName("");
      setNewCategoryLabel("");
      setShowAddCategory(false);
      toast.success("Category created successfully");
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to create category");
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customise Dropdowns</h1>
          <p className="text-gray-500">Manage dropdown categories and options throughout the CRM.</p>
        </div>
        
        <Button
          color="primary"
          startContent={<Plus className="h-4 w-4" />}
          onPress={() => setShowAddCategory(!showAddCategory)}
        >
          New Dropdown Category
        </Button>
      </div>

      {/* Settings Hub Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <Card 
          isPressable 
          className="border-none shadow-lg bg-gradient-to-br from-primary/10 to-blue-500/5 hover:from-primary/20 transition-all group"
          onPress={() => router.push('/settings/email-templates')}
        >
          <CardBody className="p-6 flex flex-row items-center gap-4">
            <div className="p-4 bg-primary rounded-2xl text-white shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
              <Mail size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Email Templates</h3>
              <p className="text-gray-500 text-sm">Design and manage automated system communications.</p>
            </div>
          </CardBody>
        </Card>

        <Card 
          isPressable 
          className="border-none shadow-lg bg-gradient-to-br from-secondary/10 to-purple-500/5 hover:from-secondary/20 transition-all group"
          onPress={() => router.push('/agents/categories')}
        >
          <CardBody className="p-6 flex flex-row items-center gap-4">
            <div className="p-4 bg-secondary rounded-2xl text-white shadow-lg shadow-secondary/30 group-hover:scale-110 transition-transform">
              <Tags size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Agent Categories</h3>
              <p className="text-gray-500 text-sm">Manage agent tiers and university commission access.</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800">Dropdown Management</h2>
        <p className="text-gray-500 text-sm">Configure dynamic options for leads, applications, and agents.</p>
      </div>

      {/* Add New Category Form */}
      {showAddCategory && (
        <div className="mb-6 p-6 border rounded-lg bg-gray-50 dark:bg-zinc-900">
          <h3 className="text-lg font-semibold mb-4">Create New Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Category Name"
              placeholder="e.g., lead_sources"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              description="Unique identifier (lowercase, no spaces)"
            />
            <Input
              label="Display Label"
              placeholder="e.g., Lead Sources"
              value={newCategoryLabel}
              onChange={(e) => setNewCategoryLabel(e.target.value)}
              description="Human-readable label"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button 
              color="primary" 
              onClick={handleAddCategory}
              isLoading={isAdding}
            >
              Create Category
            </Button>
            <Button 
              variant="light" 
              onClick={() => {
                setShowAddCategory(false);
                setNewCategoryName("");
                setNewCategoryLabel("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No categories found. Create your first category to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((category) => (
            <CategoryCard 
              key={category.id} 
              category={category} 
              onUpdate={fetchCategories}
            />
          ))}
        </div>
      )}
    </div>
  );
}