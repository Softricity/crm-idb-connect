"use client";

import { useEffect, useState } from "react";
import { useTodoStore, Todo } from "@/stores/useTodoStore";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Input,
  Spinner,
  Checkbox,
} from "@heroui/react";
import { Calendar, CheckCircle2, Circle, Clock, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TodoFormDialog } from "@/components/todo-components";

export default function TasksPage() {
  const { user } = useAuthStore();
  const { todos, loading, fetchTodos, markComplete, markIncomplete, deleteTodo } = useTodoStore();
  const [selectedDate, setSelectedDate] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  // Get today's date in YYYY-MM-DD format
  function getTodayDate() {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  useEffect(() => {
    if (user?.id) {
      const params: any = {};
      if (selectedDate) params.date = selectedDate;
      if (showCompleted !== undefined) params.completed = showCompleted;
      fetchTodos(params);
    }
  }, [user?.id, selectedDate, showCompleted, fetchTodos]);

  const handleToggleComplete = async (todo: Todo) => {
    try {
      if (todo.completed) {
        await markIncomplete(todo.id!);
        toast.success("Task marked as incomplete");
      } else {
        await markComplete(todo.id!);
        toast.success("Task completed!");
      }
    } catch (error) {
      toast.error("Failed to update task");
      console.error(error);
    }
  };

  const handleEdit = (todo: Todo) => {
    setSelectedTodo(todo);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedTodo(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    try {
      await deleteTodo(id);
      toast.success("Task deleted successfully");
    } catch (error) {
      toast.error("Failed to delete task");
      console.error(error);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedTodo(null);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (todo: Todo) => {
    if (todo.completed) return "success";
    
    if (todo.dueDate) {
      const dueDate = new Date(todo.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) return "danger"; // Overdue
      if (dueDate.toDateString() === today.toDateString()) return "warning"; // Due today
    }
    
    return "default";
  };

  const getStatusText = (todo: Todo) => {
    if (todo.completed) return "Completed";
    
    if (todo.dueDate) {
      const dueDate = new Date(todo.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) return "Overdue";
      if (dueDate.toDateString() === today.toDateString()) return "Due Today";
    }
    
    return "Pending";
  };

  // Group todos by status
  const pendingTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  return (
    <div className="h-full overflow-auto p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
              <p className="mt-2 text-gray-600">
                Manage your personal to-do list
              </p>
            </div>
            <Button
              color="primary"
              startContent={<Plus size={20} />}
              onPress={handleCreate}
            >
              Add Task
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by Date:</span>
            </div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs"
              variant="bordered"
              size="sm"
            />
            <Button
              size="sm"
              variant="flat"
              onPress={() => setSelectedDate(getTodayDate())}
            >
              Today
            </Button>
            <Button
              size="sm"
              variant="flat"
              onPress={() => setSelectedDate("")}
            >
              All
            </Button>
            <div className="ml-auto">
              <Checkbox
                isSelected={showCompleted}
                onValueChange={setShowCompleted}
              >
                Show completed only
              </Checkbox>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Empty State */}
        {!loading && todos.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Circle size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tasks found
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedDate
                ? `No tasks scheduled for ${formatDate(selectedDate)}`
                : showCompleted
                ? "No completed tasks"
                : "Get started by creating your first task"}
            </p>
            <Button color="primary" onPress={handleCreate}>
              Create Task
            </Button>
          </div>
        )}

        {/* Tasks Table */}
        {!loading && todos.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Table aria-label="Tasks table">
              <TableHeader>
                <TableColumn width={50}>STATUS</TableColumn>
                <TableColumn>TASK</TableColumn>
                <TableColumn>DUE DATE</TableColumn>
                <TableColumn>PRIORITY</TableColumn>
                <TableColumn align="center">ACTIONS</TableColumn>
              </TableHeader>
              <TableBody items={todos}>
                {(todo) => (
                  <TableRow key={todo.id}>
                    <TableCell>
                      <button
                        onClick={() => handleToggleComplete(todo)}
                        className="hover:opacity-70 transition-opacity"
                      >
                        {todo.completed ? (
                          <CheckCircle2 size={24} className="text-green-500" />
                        ) : (
                          <Circle size={24} className="text-gray-400" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className={`font-medium ${todo.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {todo.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={14} />
                        {formatDate(todo.dueDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={getStatusColor(todo)}
                        variant="flat"
                      >
                        {getStatusText(todo)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => handleEdit(todo)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => handleDelete(todo.id!)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary Stats */}
        {!loading && todos.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Total Tasks</div>
              <div className="text-2xl font-bold text-gray-900">
                {todos.length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Pending</div>
              <div className="text-2xl font-bold text-orange-600">
                {pendingTodos.length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Completed</div>
              <div className="text-2xl font-bold text-green-600">
                {completedTodos.length}
              </div>
            </div>
          </div>
        )}

        {/* Todo Form Dialog */}
        <TodoFormDialog
          isOpen={isFormOpen}
          onOpenChange={handleFormClose}
          todo={selectedTodo}
        />
      </div>
    </div>
  );
}
