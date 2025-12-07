"use client";

import { useState, useEffect } from "react";
import { Button, Input, Switch, Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { Plus, Trash2, Save, X } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface OptionManagerProps {
  title: string;
  optionKey: string; // e.g. "lead_statuses"
}

export default function OptionManager({ title, optionKey }: OptionManagerProps) {
  const [options, setOptions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState("");

  const fetchOptions = async () => {
    try {
      const data = await api.OptionsAPI.get(optionKey);
      setOptions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, [optionKey]);

  const handleToggle = async (name: string, currentValue: boolean) => {
    // Optimistic update
    setOptions(prev => ({ ...prev, [name]: !currentValue }));
    try {
      await api.OptionsAPI.update(optionKey, name, !currentValue);
      toast.success(`Updated successfully`);
    } catch (error) {
      // Revert on fail
      setOptions(prev => ({ ...prev, [name]: currentValue }));
      toast.error("Failed to update");
    }
  };

  const handleAdd = async () => {
    if (!newItem.trim()) return;
    if (options[newItem]) return toast.error("Item already exists");

    try {
      await api.OptionsAPI.update(optionKey, newItem, true);
      setOptions(prev => ({ ...prev, [newItem]: true }));
      setNewItem("");
      toast.success("Added successfully");
    } catch (error) {
      toast.error("Failed to add");
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    try {
      const newOptions = { ...options };
      delete newOptions[name];
      setOptions(newOptions);
      
      await api.OptionsAPI.delete(optionKey, name);
      toast.success("Deleted successfully");
    } catch (error) {
      fetchOptions(); // Revert
      toast.error("Failed to delete");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-center px-6 py-4 border-b">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Chip size="sm" variant="flat">{Object.keys(options).length} items</Chip>
      </CardHeader>
      <CardBody className="p-6 space-y-6">
        
        {/* Add New Input */}
        <div className="flex gap-2">
          <Input 
            placeholder={`Add new ${title.toLowerCase()}...`} 
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button isIconOnly color="primary" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {Object.entries(options).length === 0 && (
             <p className="text-center text-gray-400 py-4">No items yet.</p>
          )}
          
          {Object.entries(options).map(([name, isActive]) => (
            <div key={name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900">
              <span className={`font-medium ${!isActive ? 'text-gray-400 line-through' : ''}`}>
                {name}
              </span>
              
              <div className="flex items-center gap-4">
                <Switch 
                  size="sm" 
                  isSelected={isActive} 
                  onValueChange={() => handleToggle(name, isActive)}
                />
                <Button 
                  isIconOnly 
                  size="sm" 
                  variant="light" 
                  color="danger"
                  onClick={() => handleDelete(name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}