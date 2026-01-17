"use client";

import { useState } from "react";
import { Button, Input, Switch, Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { Plus, Trash2 } from "lucide-react";
import api from "@/lib/api";
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

interface CategoryCardProps {
  category: Category;
  onUpdate: () => void;
}

export default function CategoryCard({ category, onUpdate }: CategoryCardProps) {
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddOption = async () => {
    if (!newOptionLabel.trim()) return;
    
    setIsAdding(true);
    try {
      // Generate value from label (lowercase, replace spaces with underscores)
      const value = newOptionLabel.toLowerCase().replace(/\s+/g, '_');
      
      await api.DropdownsAPI.createOption({
        category_id: category.id,
        label: newOptionLabel,
        value: value,
      });
      
      setNewOptionLabel("");
      toast.success("Option added successfully");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to add option");
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleOption = async (optionId: string, currentStatus: boolean) => {
    try {
      await api.DropdownsAPI.updateOption(optionId, { is_active: !currentStatus });
      toast.success(`Option ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to update option");
    }
  };

  const handleDeleteOption = async (optionId: string, optionLabel: string) => {
    if (!confirm(`Are you sure you want to delete "${optionLabel}"?`)) return;
    
    try {
      await api.DropdownsAPI.deleteOption(optionId);
      toast.success("Option deleted successfully");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete option");
    }
  };

  const activeCount = category.options.filter(opt => opt.is_active).length;

  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-center px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">{category.label}</h3>
          {category.is_system && (
            <Chip size="sm" color="primary" variant="flat">System</Chip>
          )}
        </div>
        <Chip size="sm" variant="flat">
          {activeCount} / {category.options.length} active
        </Chip>
      </CardHeader>
      
      <CardBody className="p-6 space-y-6">
        {/* Add New Option Input */}
        <div className="flex gap-2">
          <Input 
            placeholder={`Add new ${category.label.toLowerCase()}...`} 
            value={newOptionLabel}
            onChange={(e) => setNewOptionLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
            disabled={isAdding}
          />
          <Button 
            isIconOnly 
            color="primary" 
            onClick={handleAddOption}
            isLoading={isAdding}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Options List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {category.options.length === 0 ? (
            <p className="text-center text-gray-400 py-4">No options yet.</p>
          ) : (
            category.options.map((option) => (
              <div 
                key={option.id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900"
              >
                <div className="flex-1">
                  <span className={`font-medium ${!option.is_active ? 'text-gray-400 line-through' : ''}`}>
                    {option.label}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <Switch 
                    size="sm" 
                    isSelected={option.is_active}
                    onValueChange={() => handleToggleOption(option.id, option.is_active)}
                    color="success"
                  />
                  <Button 
                    isIconOnly 
                    size="sm" 
                    variant="light" 
                    color="danger"
                    onClick={() => handleDeleteOption(option.id, option.label)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
}
