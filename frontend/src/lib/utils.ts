import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export enum TimelineEvent {
  LEAD_CREATED = "LEAD_CREATED",
  LEAD_NAME_CHANGED = "LEAD_NAME_CHANGED",
  LEAD_PHONE_CHANGED = "LEAD_PHONE_CHANGED",
  LEAD_EMAIL_CHANGED = "LEAD_EMAIL_CHANGED",
  LEAD_PURPOSE_CHANGED = "LEAD_PURPOSE_CHANGED",
  LEAD_OWNER_CHANGED = "LEAD_OWNER_CHANGED",
  LEAD_STATUS_CHANGED = "LEAD_STATUS_CHANGED",

  LEAD_NOTE_ADDED = "LEAD_NOTE_ADDED",
  LEAD_NOTE_DELETED = "LEAD_NOTE_DELETED",
  LEAD_NOTE_UPDATED = "LEAD_NOTE_UPDATED",

  LEAD_FOLLOWUP_ADDED = "LEAD_FOLLOWUP_ADDED",
  LEAD_FOLLOWUP_DELETED = "LEAD_FOLLOWUP_DELETED",
  LEAD_FOLLOWUP_UPDATED = "LEAD_FOLLOWUP_UPDATED",
  LEAD_FOLLOWUP_DATE_EXTENDED = "LEAD_FOLLOWUP_DATE_EXTENDED",
  LEAD_FOLLOWUP_COMPLETED = "LEAD_FOLLOWUP_COMPLETED",

  LEAD_FOLLOWUP_COMMENT_ADDED = "LEAD_FOLLOWUP_COMMENT_ADDED",
  LEAD_FOLLOWUP_COMMENT_DELETED = "LEAD_FOLLOWUP_COMMENT_DELETED",
  LEAD_FOLLOWUP_COMMENT_UPDATED = "LEAD_FOLLOWUP_COMMENT_UPDATED",

  OFFLINE_PAYMENT_ADDED = "OFFLINE_PAYMENT_ADDED",
  OFFLINE_PAYMENT_DELETED = "OFFLINE_PAYMENT_DELETED",
  OFFLINE_PAYMENT_UPDATED = "OFFLINE_PAYMENT_UPDATED",
}

export type TimelineEventType = `${TimelineEvent}`;

// ==================== PERMISSION ENUMS ====================

// Permission Groups
export enum PermissionGroup {
  LEAD_MODULE = "Lead Module",
  APPLICATION_MODULE = "Application Module",
  BRANCH_MODULE = "Branch Module",
  AGENCY_MODULE = "Agency Module",
  AGENTS_MODULE = "Agents Module",
  PERMISSION_MODULE = "Permission Module",
  UNIVERSITY_MODULE = "University Module",
  COURSES_MODULE = "Courses Module",
  OFFLINE_PAYMENT_MODULE = "Offline Payment Module",
  COMMISSION_MODULE = "Commission Module",
  EMPLOYEE_MODULE = "Employee Module",
  ADMINISTRATIVE_MODULE = "Administrative Module",
}

// Lead Module Permissions
export enum LeadPermission {
  LEAD_CREATE = "Lead Create",
  LEAD_ASSIGNMENT = "Lead Assignment",
  LEAD_VIEW = "Lead View",
  LEAD_UPDATE = "Lead Update",
  LEAD_MANAGE = "Lead Manage",
  LEAD_DELETE = "Lead Delete",
  BULK_IMPORT = "Bulk Import",
  LEAD_DOWNLOAD = "Lead Download",
  VIEW_EMAIL_AND_PHONE = "View Email and Phone",
}

// Application Module Permissions
export enum ApplicationPermission {
  APPLICATION_MANAGE = "Application Manage",
  LEAD_TO_APPLICATION = "Lead to Application",
}

// Branch Module Permissions
export enum BranchPermission {
  BRANCH_CREATE = "Branch Create",
  BRANCH_MANAGE = "Branch Manage",
  BRANCH_DELETE = "Branch Delete",
}

// Agency Module Permissions
export enum AgencyPermission {
  AGENCY_CREATE = "Agency Create",
  AGENCY_UPDATE = "Agency Update",
  AGENCY_DELETE = "Agency Delete",
  AGENCY_MANAGE = "Agency Manage",
}

// Agents Module Permissions
export enum AgentsPermission {
  AGENTS_CREATE = "Agents Create",
  AGENTS_UPDATE = "Agents Update",
  AGENTS_AGREEMENT = "Agents Agreement",
  AGENTS_DELETE = "Agents Delete",
  AGENTS_PAYOUT = "Agents Payout",
}

// University Module Permissions
export enum UniversityPermission {
  UNIVERSITY_CREATE = "University Create",
  UNIVERSITY_UPDATE = "University Update",
  UNIVERSITY_DELETE = "University Delete",
}

// Courses Module Permissions
export enum CoursesPermission {
  COURSES_CREATE = "Courses Create",
  COURSES_UPDATE = "Courses Update",
  COURSES_DELETE = "Courses Delete",
  COURSES_VIEW = "Courses View",
}

// Offline Payment Module Permissions
export enum OfflinePaymentPermission {
  OFFLINE_PAYMENT_CREATE = "Offline Payment Create",
  OFFLINE_PAYMENT_RECEIVE = "Offline Payment Receive",
  OFFLINE_PAYMENT_APPROVAL = "Offline Payment Approval",
}

// Commission Module Permissions
export enum CommissionPermission {
  COMMISSION_CREATE = "Commission Create",
  COMMISSION_PAYOUT = "Commission Payout",
  COMMISSION_MANAGE = "Commission Manage",
}

export enum EmployeePermission {
  EMPLOYEE_CREATE = "Employee Create",
  EMPLOYEE_UPDATE = "Employee Update",
  EMPLOYEE_DELETE = "Employee Delete",
  EMPLOYEE_MANAGE = "Employee Manage",
}

export enum AdministrativePermission {
 REPORTS_VIEW = "Reports View",
 ACTIVITY_LOGS = "Activity Logs", 
}

export enum PermissionPermission {
  ROLES_CREATE = "Roles Create",
  ROLES_PERMISSION = "Roles Permission",
  PERMISSION_DELETE = "Permission Delete",
}

// All Permissions Combined
export const ALL_PERMISSIONS = {
  [PermissionGroup.LEAD_MODULE]: Object.values(LeadPermission),
  [PermissionGroup.APPLICATION_MODULE]: Object.values(ApplicationPermission),
  [PermissionGroup.BRANCH_MODULE]: Object.values(BranchPermission),
  [PermissionGroup.AGENCY_MODULE]: Object.values(AgencyPermission),
  [PermissionGroup.AGENTS_MODULE]: Object.values(AgentsPermission),
  [PermissionGroup.PERMISSION_MODULE]: Object.values(PermissionPermission), // Will be populated when needed
  [PermissionGroup.UNIVERSITY_MODULE]: Object.values(UniversityPermission),
  [PermissionGroup.COURSES_MODULE]: Object.values(CoursesPermission),
  [PermissionGroup.OFFLINE_PAYMENT_MODULE]: Object.values(OfflinePaymentPermission),
  [PermissionGroup.COMMISSION_MODULE]: Object.values(CommissionPermission),
  [PermissionGroup.EMPLOYEE_MODULE]: Object.values(EmployeePermission), // Will be populated when needed
  [PermissionGroup.ADMINISTRATIVE_MODULE]: Object.values(AdministrativePermission), // Will be populated when needed
} as const;

// Helper function to get all permission values
export const getAllPermissionValues = (): string[] => {
  return Object.values(ALL_PERMISSIONS).flat();
};

// Helper function to get permissions by group
export const getPermissionsByGroup = (group: PermissionGroup): readonly string[] => {
  return ALL_PERMISSIONS[group] || [];
};

// Helper function to check if user has permission
export const hasPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  return userPermissions.includes(requiredPermission);
};

// Helper function to check if user has any of the permissions
export const hasAnyPermission = (userPermissions: string[], requiredPermissions: string[]): boolean => {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
};

// Helper function to check if user has all permissions
export const hasAllPermissions = (userPermissions: string[], requiredPermissions: string[]): boolean => {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
};

// ==================== ROLE CAPABILITY HELPERS ====================
// These functions determine role capabilities based on permissions

// Check if user can manage partners (agents/counsellors)
export const canManagePartners = (permissions: string[]): boolean => {
  return hasAnyPermission(permissions, [
    AgentsPermission.AGENTS_CREATE,
    AgentsPermission.AGENTS_UPDATE,
    AgentsPermission.AGENTS_DELETE,
  ]);
};

// Check if user can assign leads
export const canAssignLeads = (permissions: string[]): boolean => {
  return hasPermission(permissions, LeadPermission.LEAD_ASSIGNMENT);
};

// Check if user can view all leads
export const canViewAllLeads = (permissions: string[]): boolean => {
  return hasPermission(permissions, LeadPermission.LEAD_VIEW);
};

// Check if user can manage applications
export const canManageApplications = (permissions: string[]): boolean => {
  return hasPermission(permissions, ApplicationPermission.APPLICATION_MANAGE);
};

// Check if user has full lead access (typically admin/counsellor role)
export const hasFullLeadAccess = (permissions: string[]): boolean => {
  return hasAnyPermission(permissions, [
    LeadPermission.LEAD_MANAGE,
    LeadPermission.LEAD_ASSIGNMENT,
  ]);
};

// Check if user is super admin (can manage branches and has extensive permissions)
export const isSuperAdmin = (permissions: string[]): boolean => {
  // Super admin typically has multiple high-level manage permissions
  const adminPermissions = [
    LeadPermission.LEAD_MANAGE,
    ApplicationPermission.APPLICATION_MANAGE,
    EmployeePermission.EMPLOYEE_MANAGE,
    AgentsPermission.AGENTS_DELETE,
    PermissionPermission.ROLES_PERMISSION,
    BranchPermission.BRANCH_MANAGE,
  ];
  
  // Count how many admin-level permissions the user has
  const adminPermCount = adminPermissions.filter(perm => 
    hasPermission(permissions, perm)
  ).length;
  
  // If user has 3 or more admin permissions, consider them super admin
  return adminPermCount === 6;
};

// Check if user is restricted to their own leads (typically agent role)
export const isRestrictedToOwnLeads = (permissions: string[]): boolean => {
  return hasPermission(permissions, LeadPermission.LEAD_CREATE) && 
         !hasPermission(permissions, LeadPermission.LEAD_MANAGE);
};

// Get base path for leads based on permissions
export const getLeadsBasePath = (permissions: string[]): string => {
  // If restricted to own leads, use agent panel
  if (isRestrictedToOwnLeads(permissions)) {
    return "/b2b";
  }
  // All internal team members use main panel
  return "/leads";
};

// Get default route based on permissions
export const getDefaultRoute = (permissions: string[]): string => {
  // Agent-like permissions - can only create leads
  if (isRestrictedToOwnLeads(permissions)) {
    return "/b2b";
  }
  // All internal team members go to dashboard
  return "/dashboard";
};

// Check if user can edit application for a specific lead
// Lead owner (assigned_to) can edit their lead's application
export const canEditLeadApplication = (
  userId: string | undefined,
  leadAssignedTo: string | null | undefined,
  permissions: string[]
): boolean => {
  // Admin or those with APPLICATION_MANAGE can edit any application
  if (canManageApplications(permissions)) {
    return true;
  }
  
  // Lead owner can edit their own lead's application
  if (userId && leadAssignedTo && userId === leadAssignedTo) {
    return true;
  }
  
  return false;
};
