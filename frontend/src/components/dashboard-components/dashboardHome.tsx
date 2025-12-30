"use client";

"use client";

import { Card, CardBody, Input, Button } from "@heroui/react";
import { Tabs, Tab } from "@heroui/react";
import { BellIcon, MegaphoneIcon, CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTodoStore } from "@/stores/useTodoStore";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { format } from "date-fns";

export default function DashboardHome() {
  const { todos, loading: todosLoading, fetchTodos, createTodo } = useTodoStore();
  const { metrics, loading: dashboardLoading, fetchDashboardLeads } = useDashboardStore();
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    fetchTodos({});
    fetchDashboardLeads();
  }, [fetchTodos, fetchDashboardLeads]);

  const pending = todos.filter((t) => !t.completed);
  const completed = todos.filter((t) => t.completed);
  const today = format(new Date(), "yyyy-MM-dd");
  const dueToday = todos.filter((t) => t.dueDate && t.dueDate.startsWith(today));

  const handleAdd = async () => {
    if (!newTodo.trim()) return;
    await createTodo({ title: newTodo.trim() });
    setNewTodo("");
    await fetchTodos({});
  };

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* My To-dos (Tasks) */}
      <Card radius="lg" className="shadow-sm border border-gray-200">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BellIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">My To-dos</h2>
          </div>

          <Tabs aria-label="to-dos tabs" variant="underlined">
            <Tab key="current" title={`Current (${pending.length})`}>
              <div className="flex gap-2">
                <Input radius="md" placeholder="Add a to do... Use # to mention any lead..." value={newTodo} onChange={(e) => setNewTodo(e.target.value)} />
                <Button color="secondary" onPress={handleAdd}>Add</Button>
              </div>

              <div className="mt-4 space-y-3">
                {pending.length === 0 ? (
                  <div className="text-sm text-gray-400">No To-dos yet.</div>
                ) : (
                  pending.slice(0, 6).map((t) => (
                    <div key={t.id} className="flex justify-between items-start bg-gray-50 p-3 rounded">
                      <div>
                        <div className="font-medium">{t.title}</div>
                        <div className="text-xs text-gray-500">{t.dueDate ? `Due ${format(new Date(t.dueDate), 'PP')}` : ''}</div>
                      </div>
                      <div className="text-xs text-gray-400">{t.partners?.name ?? ''}</div>
                    </div>
                  ))
                )}
              </div>
            </Tab>

            <Tab key="completed" title={`Completed (${completed.length})`}>
              <div className="pt-4 space-y-2">
                {completed.length === 0 ? (
                  <div className="text-sm text-gray-400">No completed tasks yet.</div>
                ) : (
                  completed.slice(0, 6).map((t) => (
                    <div key={t.id} className="flex justify-between items-start bg-gray-50 p-3 rounded">
                      <div>
                        <div className="font-medium line-through text-gray-600">{t.title}</div>
                        <div className="text-xs text-gray-500">{t.dueDate ? `Due ${format(new Date(t.dueDate), 'PP')}` : ''}</div>
                      </div>
                      <div className="text-xs text-gray-400">{t.partners?.name ?? ''}</div>
                    </div>
                  ))
                )}
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Announcements - keep static for now */}
      <Card radius="lg" className="shadow-sm border border-gray-200">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MegaphoneIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Announcements</h2>
          </div>

          <Tabs aria-label="announcements" variant="underlined">
            <Tab key="unread" title="Unread">
              <div className="pt-6 text-center text-sm text-gray-400">No unread announcements.</div>
            </Tab>
            <Tab key="read" title="Read">
              <div className="pt-6 text-center text-sm text-gray-400">No read announcements.</div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Today's Follow Ups - keep as placeholder */}
      <Card radius="lg" className="shadow-sm border border-gray-200">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Today's Follow Ups</h2>
          </div>
          <Tabs aria-label="follow-ups" variant="underlined">
            <Tab key="pending" title={`Pending (${0})`}>
              <div className="pt-6 text-center text-sm text-gray-400">Nothing pending.</div>
            </Tab>
            <Tab key="complete" title={`Completed (${0})`}>
              <div className="pt-6 text-center text-sm text-gray-400">No follow ups completed.</div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Today's Task Deadlines (uses todos due today) */}
      <Card radius="lg" className="shadow-sm border border-gray-200">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Today's Tasks Deadline</h2>
          </div>

          <div className="pt-6">
            {dueToday.length === 0 ? (
              <div className="text-sm text-gray-400">No tasks due today.</div>
            ) : (
              dueToday.map((t) => (
                <div key={t.id} className="mb-3">
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-gray-500">Due {format(new Date(t.dueDate || ''), 'p')}</div>
                </div>
              ))
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
