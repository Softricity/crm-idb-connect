"use client";

import { Card, CardBody, Input, Button } from "@heroui/react";
import { Tabs, Tab } from "@heroui/react";
import {
  BellIcon,
  MegaphoneIcon,
  CalendarIcon,
  TrendingUp,
  CheckCircle,
  XCircle,
  Users,
  Check
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTodoStore } from "@/stores/useTodoStore";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { useAnnouncementStore } from "@/stores/useAnnouncementStore";
import { useFollowupStore } from "@/stores/useFollowupStore";
import { useOfflinePaymentStore } from "@/stores/useOfflinePaymentStore";
import { format, isSameDay } from "date-fns";

export default function DashboardHome() {
  const { todos, fetchTodos, createTodo, markComplete } = useTodoStore();
  const { metrics, fetchDashboardLeads } = useDashboardStore();
  const { announcements, fetchAnnouncements } = useAnnouncementStore();
  const { followups, fetchAllFollowups } = useFollowupStore();
  const { todaySummary, fetchTodaySummary } = useOfflinePaymentStore();
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    fetchTodos({});
    fetchDashboardLeads();
    fetchAnnouncements();
    fetchAllFollowups();
    fetchTodaySummary();
  }, [fetchTodos, fetchDashboardLeads, fetchAnnouncements, fetchAllFollowups, fetchTodaySummary]);

  const pendingDots = todos.filter((t) => !t.completed);
  const completedDots = todos.filter((t) => t.completed);
  const todayDate = new Date();
  const todayStr = format(todayDate, "yyyy-MM-dd");

  // Followups
  const pendingFollowups = followups.filter(f =>
    f.due_date && isSameDay(new Date(f.due_date), todayDate) && !f.completed
  );
  const completedFollowups = followups.filter(f =>
    f.due_date && isSameDay(new Date(f.due_date), todayDate) && f.completed
  );

  const unreadAnnouncements = announcements.filter(a => !a.announcement_reads?.length);
  const readAnnouncements = announcements.filter(a => a.announcement_reads?.length);

  const handleAdd = async () => {
    if (!newTodo.trim()) return;
    await createTodo({ title: newTodo.trim() });
    setNewTodo("");
    await fetchTodos({});
  };

  const statCards = [
    {
      label: "Total Leads",
      value: metrics.total,
      icon: <Users size={20} className="text-white" />,
      gradient: "from-blue-600 to-indigo-700",
      shadow: "shadow-blue-100",
      textColor: "text-blue-50"
    },
    {
      label: "Today's Leads",
      value: metrics.todaysLeads,
      icon: <TrendingUp size={20} className="text-white" />,
      gradient: "from-fuchsia-600 to-purple-700",
      shadow: "shadow-purple-100",
      textColor: "text-fuchsia-50"
    },
    {
      label: "Converted",
      value: metrics.converted,
      icon: <CheckCircle size={20} className="text-white" />,
      gradient: "from-emerald-500 to-teal-700",
      shadow: "shadow-emerald-100",
      textColor: "text-emerald-50"
    },
    {
      label: "Rejected",
      value: metrics.rejected,
      icon: <XCircle size={20} className="text-white" />,
      gradient: "from-rose-500 to-red-700",
      shadow: "shadow-rose-100",
      textColor: "text-rose-50"
    },
  ];

  const emptyState = (msg: string) => (
    <div className="text-sm text-gray-400 py-4 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
      {msg}
    </div>
  );

  const cardContainerClass = "space-y-2 overflow-y-auto pr-1 hover-scrollbar transition-colors duration-200";

  const tabClassNames = {
    base: "w-full",
    tabList: "gap-6 p-0 mb-2 border-b-0",
    tab: "px-0 h-10 text-sm font-medium data-[selected=true]:text-black text-gray-400",
    panel: "p-0 pt-0 flex flex-col flex-1 min-h-0",
    cursor: "bg-black h-[2px] w-full"
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 p-5 rounded-2xl bg-gradient-to-br ${stat.gradient} ${stat.shadow} shadow-lg border border-white/10`}
          >
            {/* Decorative Background Glow */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />

            <div className="flex flex-col space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-white/15 rounded-xl backdrop-blur-md">
                  {stat.icon}
                </div>
                <div className={`text-[10px] font-bold ${stat.textColor} uppercase tracking-widest opacity-70`}>
                  Live
                </div>
              </div>

              <div>
                <p className={`text-xs font-medium ${stat.textColor} opacity-90 mb-0.5`}>
                  {stat.label}
                </p>
                <div className="flex items-baseline space-x-1.5 ">
                  <h3 className="text-3xl font-bold text-white tracking-tight leading-none">
                    {stat.value}
                  </h3>
                  <span className={`text-[10px] ${stat.textColor} font-medium opacity-60 uppercase tracking-tighter`}>
                    units
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6 flex-1 min-h-0 overflow-y-auto lg:overflow-visible font-outfit">
        {/* My To-dos (Tasks) */}
        <Card radius="lg" className="group shadow-sm border border-gray-200 h-[300px] lg:h-[350px] lg:min-h-[300px]">
          <CardBody className="p-6 flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
              <BellIcon className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold">My To-dos</h2>
            </div>

            <Tabs
              aria-label="to-dos tabs"
              variant="underlined"
              fullWidth={false}
              classNames={tabClassNames}
              className="p-2"
            >
              <Tab key="current" title={`Current (${pendingDots.length})`}>
                <div className="flex gap-2 mb-3 flex-shrink-0 pt-3 ">
                  <Input
                    radius="lg"
                    placeholder="Add a to do..."
                    size="md"
                    variant="flat"
                    className="flex-1"
                    classNames={{ inputWrapper: "bg-gray-100/50" }}
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                  />
                  <Button color="primary" radius="lg" size="md" className="font-semibold shadow-sm" onPress={handleAdd}>Add</Button>
                </div>

                <div className={cardContainerClass}>
                  {pendingDots.length === 0 ? (
                    emptyState("No To-dos yet.")
                  ) : (
                    pendingDots.map((t) => (
                      <div key={t.id} className="flex gap-3 items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="faded"
                          color="success"
                          radius="full"
                          className="h-7 w-7 min-w-0"
                          onPress={() => t.id && markComplete(t.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <div className="font-bold text-[13px] text-gray-900 flex-1">{t.title}</div>
                      </div>
                    ))
                  )}
                </div>
              </Tab>

              <Tab key="completed" title={`Completed (${completedDots.length})`}>
                <div className={cardContainerClass + " pt-3"}>
                  {completedDots.length === 0 ? (
                    emptyState("No completed tasks yet.")
                  ) : (
                    completedDots.map((t) => (
                      <div key={t.id} className="flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100/50 opacity-60">
                        <div className="font-bold text-[13px] text-gray-400 line-through">{t.title}</div>
                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                          Done
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>

        {/* Announcements */}
        <Card radius="lg" className="group shadow-sm border border-gray-200 h-[300px] lg:h-[350px] lg:min-h-[300px]">
          <CardBody className="p-6 flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
              <MegaphoneIcon className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold">Announcements</h2>
            </div>

            <Tabs
              aria-label="announcements"
              variant="underlined"
              fullWidth={false}
              classNames={tabClassNames}
              className="p-2"
            >
              <Tab key="unread" title={`Unread (${unreadAnnouncements.length})`}>
                <div className={cardContainerClass + " pt-3"}>
                  {unreadAnnouncements.length === 0 ? (
                    emptyState("No unread announcements.")
                  ) : (
                    unreadAnnouncements.map((a) => (
                      <div key={a.id} className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/30">
                        <div className="font-bold text-[13px] text-blue-900">{a.title}</div>
                        <p className="text-xs text-blue-700/80 line-clamp-2 mt-1">{a.content}</p>
                        <div className="text-[10px] text-blue-400 mt-2 font-medium">
                          {a.created_at ? format(new Date(a.created_at), 'PP') : ''}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Tab>
              <Tab key="read" title="Read">
                <div className={cardContainerClass + " pt-3"}>
                  {readAnnouncements.length === 0 ? (
                    emptyState("No read announcements.")
                  ) : (
                    readAnnouncements.map((a) => (
                      <div key={a.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100/50 opacity-70">
                        <div className="font-bold text-[13px] text-gray-700">{a.title}</div>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{a.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>

        {/* Today's Follow Ups */}
        <Card radius="lg" className="group shadow-sm border border-gray-200 h-[300px] lg:h-[350px] lg:min-h-[300px]">
          <CardBody className="p-6 flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold">Today's Follow Ups</h2>
            </div>

            <Tabs
              aria-label="followups tabs"
              variant="underlined"
              fullWidth={false}
              classNames={tabClassNames}
              className="p-2"
            >
              <Tab key="pending" title={`Pending (${pendingFollowups.length})`}>
                <div className={cardContainerClass + " pt-3"}>
                  {pendingFollowups.length === 0 ? (
                    emptyState("No follow ups scheduled for today.")
                  ) : (
                    pendingFollowups.map((f) => (
                      <div key={f.id} className="p-4 bg-blue-50/30 border border-blue-100/50 rounded-xl flex justify-between items-center">
                        <div>
                          <div className="font-bold text-[13px] text-gray-900">{f.leads?.name || "Unknown Lead"}</div>
                          <div className="text-[11px] text-gray-500 line-clamp-1">{f.title}</div>
                        </div>
                        <div className="text-[10px] bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-bold uppercase tracking-tight">
                          Today
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Tab>
              <Tab key="completed" title={`Completed (${completedFollowups.length})`}>
                <div className={cardContainerClass + " pt-3"}>
                  {completedFollowups.length === 0 ? (
                    emptyState("No completed follow ups today.")
                  ) : (
                    completedFollowups.map((f) => (
                      <div key={f.id} className="p-4 bg-gray-50/50 border border-gray-100/50 rounded-xl flex justify-between items-center opacity-70">
                        <div>
                          <div className="font-bold text-[13px] text-gray-400 line-through">{f.leads?.name || "Unknown Lead"}</div>
                          <div className="text-[11px] text-gray-400 line-clamp-1">{f.title}</div>
                        </div>
                        <div className="text-[10px] bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-bold uppercase tracking-tight">
                          Done
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>

        {/* Today's Payments */}
        <Card radius="lg" className="group shadow-sm border border-gray-200 h-[300px] lg:h-[350px] lg:min-h-[300px]">
          <CardBody className="p-6 flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold">Today's Payments</h2>
            </div>

            <Tabs
              aria-label="payments tabs"
              variant="underlined"
              fullWidth={false}
              classNames={tabClassNames}
              className="p-2"
            >
              <Tab key="received" title={`Received (${todaySummary.received.length})`}>
                <div className={cardContainerClass + " pt-3"}>
                  {todaySummary.received.length === 0 ? (
                    emptyState("No payments recorded today.")
                  ) : (
                    todaySummary.received.map((p) => (
                      <div key={p.id} className="p-4 bg-green-50/30 border border-green-100/50 rounded-xl flex justify-between items-center">
                        <div>
                          <div className="font-bold text-[13px] text-gray-900">{p.leads?.name || "Unknown Lead"}</div>
                          <div className="text-[11px] text-green-600 font-bold font-mono">
                            {Number(p.amount).toLocaleString()} {p.currency}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="solid"
                          color="success"
                          className="text-[10px] h-7 font-bold uppercase tracking-tight rounded-lg"
                          onPress={() => window.location.href = `/leads/${p.lead_id}`}
                        >
                          View Lead
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </Tab>
              <Tab key="due" title={`Due (${todaySummary.due.length})`}>
                <div className={cardContainerClass + " pt-3"}>
                  {todaySummary.due.length === 0 ? (
                    emptyState("No payments due today.")
                  ) : (
                    todaySummary.due.map((p) => (
                      <div key={p.id} className="p-4 bg-blue-50/30 border border-blue-100/50 rounded-xl flex justify-between items-center">
                        <div>
                          <div className="font-bold text-[13px] text-gray-900">{p.leads?.name || "Unknown Lead"}</div>
                          <div className="text-[11px] text-blue-600 font-bold font-mono">
                            {Number(p.amount).toLocaleString()} {p.currency}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="solid"
                          color="primary"
                          className="text-[10px] h-7 font-bold uppercase tracking-tight rounded-lg"
                          onPress={() => window.location.href = `/leads/${p.lead_id}`}
                        >
                          View Lead
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
