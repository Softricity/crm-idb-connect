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
  Link,
  SlidersHorizontal, // Imported for Customise icon
} from "lucide-react";
import {
  CoursesPermission,
  AgentsPermission,
  ApplicationPermission,
  AgencyPermission,
  CommissionPermission,
  UniversityPermission,
  LeadPermission,
  AdministrativePermission,
  EmployeePermission,
} from "@/lib/utils";

export interface MenuItem {
  title: string;
  type: "link" | "title";
  link?: string;
  icon?: React.ReactNode;
  badge?: string;
  // Optional list of required permission strings (use enums from utils)
  requiredPermissions?: string[];
}

export const menus: MenuItem[] = [
  // Main
  { title: "Main", type: "title" },
  { title: "Dashboard", icon: <LayoutDashboard size={20} />, type: "link", link: "/dashboard" },
  { title: "Reports", icon: <FileText size={20} />, type: "link", link: "/reports", requiredPermissions: [AdministrativePermission.REPORTS_VIEW] },
  { title: "Activity Logs", icon: <Activity size={20} />, type: "link", link: "/activity-logs", requiredPermissions: [AdministrativePermission.ACTIVITY_LOGS] },

  // Study Abroad
  { title: "Study Abroad", type: "title" },
  { title: "Course Wiz", icon: <GraduationCap size={20} />, type: "link", link: "/courses", requiredPermissions: [CoursesPermission.COURSES_VIEW] },
  { title: "Announcements", icon: <Bell size={20} />, type: "link", link: "/announcements" },
  { title: "Leads", icon: <Users size={20} />, type: "link", link: "/leads", requiredPermissions: [LeadPermission.LEAD_MANAGE, LeadPermission.LEAD_UPDATE] },
  { title: "Applications", icon: <School size={20} />, type: "link", link: "/applications", requiredPermissions: [ApplicationPermission.APPLICATION_MANAGE] },
  
  // Business
  { title: "Business", type: "title" },
  { title: "Agents", icon: <Users size={20} />, type: "link", link: "/agents", requiredPermissions: [AgentsPermission.AGENTS_CREATE, AgentsPermission.AGENTS_UPDATE] },
  { title: "Internal Team", icon: <Users size={20} />, type: "link", link: "/team", requiredPermissions: [EmployeePermission.EMPLOYEE_MANAGE, EmployeePermission.EMPLOYEE_CREATE] },
  { title: "Commissions", icon: <DollarSign size={20} />, type: "link", link: "/commissions", requiredPermissions: [CommissionPermission.COMMISSION_MANAGE] },
  { title: "Referrals", icon: <Link size={20} />, type: "link", link: "/referrals" },

  // Task Management
  { title: "Task Management", type: "title" },
  { title: "Tasks", icon: <CheckSquare size={20} />, type: "link", link: "/tasks", badge: "1" },
  { title: "Follow Ups", icon: <Clock size={20} />, type: "link", link: "/follow-ups", badge: "25" },

  // Support
  { title: "Support", type: "title" },
  { title: "Helpdesk", icon: <HelpCircle size={20} />, type: "link", link: "/helpdesk" },
  
  // Settings (Super Admin Only)
  { title: "Settings", type: "title" },
  { title: "Branches", icon: <Building size={20} />, type: "link", link: "/settings/branches", requiredPermissions: ["Branch Manage"] },
  { title: "Customise", icon: <SlidersHorizontal size={20} />, type: "link", link: "/customise" }, // ✅ Added here
];


export const b2bMenus: MenuItem[] = [
  { title: "Main", type: "title" },
  { title: "Home", icon: <LayoutDashboard size={20} />, type: "link", link: "/b2b" },
  { title: "Course Wiz", icon: <GraduationCap size={20} />, type: "link", link: "#" },
  { title: "Agents Leads", icon: <Users size={20} />, type: "link", link: "/b2b/agent-leads" },
  { title: "Reports", icon: <FileText size={20} />, type: "link", link: "#" },
  { title: "Announcements", icon: <Bell size={20} />, type: "link", link: "#" },
  { title: "University Commissions", icon: <Building size={20} />, type: "link", link: "#" },
  { title: "B2B Commissions", icon: <DollarSign size={20} />, type: "link", link: "#" },
];

export const counsellorMenus: MenuItem[] = [
  { title: "Main", type: "title" },
  { title: "Dashboard", icon: <LayoutDashboard size={20} />, type: "link", link: "/counsellor" },
  { title: "My Leads", icon: <Users size={20} />, type: "link", link: "/counsellor" },
  { title: "Course Wiz", icon: <GraduationCap size={20} />, type: "link", link: "/courses" },
  
  { title: "Task Management", type: "title" },
  { title: "Follow Ups", icon: <Clock size={20} />, type: "link", link: "/counsellor/follow-ups" },
  { title: "Tasks", icon: <CheckSquare size={20} />, type: "link", link: "/counsellor/tasks" },
  
  { title: "Support", type: "title" },
  { title: "Helpdesk", icon: <HelpCircle size={20} />, type: "link", link: "/helpdesk" },
];