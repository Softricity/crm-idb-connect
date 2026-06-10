// src/common/utils/scope.util.ts

/**
 * Resolve department codes from the user's department_ids.
 * This is a helper for callers that need to pass department codes to getScope.
 */
export async function resolveUserDepartmentCodes(user: any, prisma: any): Promise<string[]> {
  if (!user?.department_ids?.length) return [];
  const depts = await prisma.department.findMany({
    where: { id: { in: user.department_ids } },
    select: { code: true },
  });
  return depts.map((d: any) => d.code);
}

/**
 * Generate Prisma scope filter based on user role/departments.
 *
 * @param user - The authenticated user object
 * @param departmentCodes - Optional array of department codes (e.g. ['frontdesk', 'accounts'])
 *                          Resolve via resolveUserDepartmentCodes() before calling.
 */
export function getScope(user: any, departmentCodes?: string[]) {
  const role = user?.role?.toLowerCase()?.trim() || "";
  const type = user?.type?.toLowerCase()?.trim() || "";
  const branch_type = user?.branch_type?.toLowerCase()?.trim() || "";

  // 1. Super Admins or Head Office Admins see EVERYTHING
  const isSuper = role.includes("super");
  const isHeadOfficeAdmin = branch_type === "headoffice" && (role === "admin" || isSuper);
  
  if (isSuper || isHeadOfficeAdmin) {
    return {}; 
  }

  // 2. Check if user is an agent or agent team member
  if (type === 'agent' || role === 'agent') {
    return { agent_id: user.id };
  }
  if (type === 'agent_team_member' || role === 'agent_team_member') {
    return { agent_id: user.parent_agent_id || user.parent_id };
  }

  // 3. Safety Check: If user has no branch, return a filter that matches nothing
  if (!user.branch_id) {
    return { branch_id: '00000000-0000-0000-0000-000000000000' }; 
  }

  // 4. Front Desk and Accounts: see ALL leads in their branch (not just assigned to them)
  if (departmentCodes?.length) {
    const codes = departmentCodes.map((c: string) => c.toLowerCase().trim());
    if (codes.includes('frontdesk') || codes.includes('accounts')) {
      return { branch_id: user.branch_id };
    }
  }

  // 5. For ALL other non-super admins (including Branch Admins, Counsellors)
  // Only leads assigned to them are visible
  return { 
    branch_id: user.branch_id,
    assigned_to: user.id
  };
}