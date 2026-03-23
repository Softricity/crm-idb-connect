// src/common/utils/scope.util.ts

export function getScope(user: any) {
  // 1. Super Admins or Head Office Admins see EVERYTHING
  const isSuper = user.role === 'super admin';
  const isHeadOfficeAdmin = user.branch_type === 'HeadOffice' && user.role === 'admin';
  
  if (isSuper || isHeadOfficeAdmin) {
    return {}; 
  }

  // 2. Safety Check: If user has no branch, return a filter that matches nothing
  if (!user.branch_id) {
    return { branch_id: '00000000-0000-0000-0000-000000000000' }; 
  }

  // 3. For ALL other non-super admins (including Branch Admins, Counsellors, Agents)
  // Only leads assigned to them are visible
  return { 
    branch_id: user.branch_id,
    assigned_to: user.id
  };
}