"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@heroui/react";
import { Todo, useTodoStore } from "@/stores/useTodoStore";
import { toast } from "sonner";

interface TodoFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  todo?: Todo | null;
}

interface FormData {
  title: string;
  dueDate: string;
  created_by: string;
}

export function TodoFormDialog({ isOpen, onOpenChange, todo }: TodoFormDialogProps) {
  const { createTodo, updateTodo } = useTodoStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    dueDate: "",
    created_by: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Reset form when dialog opens/closes or todo changes
  useEffect(() => {
    if (isOpen) {
      if (todo) {
        setFormData({
          title: todo.title || "",
          dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split("T")[0] : "",
          created_by: todo.created_by || "",
        });
      } else {
        setFormData({
          title: "",
          dueDate: "",
          created_by: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, todo]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Task title is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      const todoData = {
        title: formData.title.trim(),
        dueDate: formData.dueDate || undefined,
        created_by: formData.created_by || undefined,
      };

      if (todo?.id) {
        // Update existing todo
        await updateTodo(todo.id, todoData);
        toast.success("Task updated successfully");
      } else {
        // Create new todo
        await createTodo(todoData);
        toast.success("Task created successfully");
      }

      // Close dialog
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving todo:", error);
      toast.error(error.message || "Failed to save task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="md"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {todo ? "Edit Task" : "Create New Task"}
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                {/* Task Title */}
                <Input
                  label="Task Title"
                  placeholder="Enter task description"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  isInvalid={!!errors.title}
                  errorMessage={errors.title}
                  isRequired
                  variant="bordered"
                  autoFocus
                />

                {/* Due Date */}
                <Input
                  label="Due Date"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange("dueDate", e.target.value)}
                  isInvalid={!!errors.dueDate}
                  errorMessage={errors.dueDate}
                  variant="bordered"
                  description="Optional: Set a deadline for this task"
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={isSubmitting}
              >
                {todo ? "Update" : "Create"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export default TodoFormDialog;
