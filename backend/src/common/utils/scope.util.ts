// src/common/utils/scope.util.ts

export function getScope(user: any) {
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

  // 4. For ALL other non-super admins (including Branch Admins, Counsellors)
  // Only leads assigned to them are visible
  return { 
    branch_id: user.branch_id,
    assigned_to: user.id
  };
}