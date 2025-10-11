import {
  LayoutDashboard,
  FileText,
  Activity,
  GraduationCap,
  Bell,
  Users,
  MessageCircle,
  School,
  FileCheck,
  Building,
  DollarSign,
  CheckSquare,
  Clock,
  HelpCircle,
  Settings,
  ShieldUser,
} from "lucide-react";

export interface MenuItem {
  title: string;
  type: "link" | "title";
  link?: string;
  icon?: React.ReactNode;
  badge?: string;
}

export const menus: MenuItem[] = [
  // Main
  { title: "Main", type: "title" },
  { title: "Dashboard", icon: <LayoutDashboard size={22} />, type: "link", link: "/dashboard" },
  { title: "Reports", icon: <FileText size={22} />, type: "link", link: "/reports" },
  { title: "Activity Logs", icon: <Activity size={22} />, type: "link", link: "/activity-logs" },

  // Study Abroad
  { title: "Study Abroad", type: "title" },
  { title: "Course Wiz", icon: <GraduationCap size={22} />, type: "link", link: "/courses" },
  { title: "Announcements", icon: <Bell size={22} />, type: "link", link: "/announcements" },
  { title: "Leads", icon: <Users size={22} />, type: "link", link: "/leads" },
  { title: "Applications", icon: <School size={22} />, type: "link", link: "/applications" },
  
  // Business
  { title: "Business", type: "title" },
  { title: "Agents", icon: <ShieldUser size={22} />, type: "link", link: "/agents" },
  { title: "Commissions", icon: <DollarSign size={22} />, type: "link", link: "/commissions" },

  // Task Management
  { title: "Task Management", type: "title" },
  { title: "Tasks", icon: <CheckSquare size={22} />, type: "link", link: "/tasks", badge: "1" },
  { title: "Follow Ups", icon: <Clock size={22} />, type: "link", link: "/follow-ups", badge: "25" },

  // Support
  { title: "Support", type: "title" },
  { title: "Helpdesk", icon: <HelpCircle size={22} />, type: "link", link: "/helpdesk" },
  { title: "Settings", icon: <Settings size={22} />, type: "link", link: "/settings" },
];


export const b2bMenus: MenuItem[] = [
  { title: "Main", type: "title" },
  { title: "Home", icon: <LayoutDashboard size={22} />, type: "link", link: "/b2b" },
  { title: "Course Wiz", icon: <GraduationCap size={22} />, type: "link", link: "#" },
  { title: "Agents Leads", icon: <Users size={22} />, type: "link", link: "/b2b/agent-leads" },
  { title: "Reports", icon: <FileText size={22} />, type: "link", link: "#" },
  { title: "Announcements", icon: <Bell size={22} />, type: "link", link: "#" },
  { title: "University Commissions", icon: <Building size={22} />, type: "link", link: "#" },
  { title: "B2B Commissions", icon: <DollarSign size={22} />, type: "link", link: "#" },
];