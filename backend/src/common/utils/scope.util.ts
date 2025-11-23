// src/common/utils/scope.util.ts

export function getScope(user: any) {
  // 1. Head Office Admins (or Super Admins) see EVERYTHING
  if (user.branch_type === 'HeadOffice' && user.role.name === 'admin') {
    return {}; 
  }

  // 2. Safety Check: If user has no branch, return a filter that matches nothing
  if (!user.branch_id) {
    // This UUID is guaranteed to not exist, effectively returning 0 results
    return { branch_id: '00000000-0000-0000-0000-000000000000' }; 
  }

  // 3. Standard Users see only data from their branch
  return { branch_id: user.branch_id };
}