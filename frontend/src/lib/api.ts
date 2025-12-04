const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

// Helper to get auth token from cookies
function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(c => c.trim().startsWith('auth-token='));
  if (!tokenCookie) return null;
  try {
    const value = tokenCookie.split('=')[1];
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

// Helper to create headers with auth token
function getHeaders(includeAuth = true): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
}

async function handleResponse(res: Response) {
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const err: any = new Error(data?.error || res.statusText || 'API Error');
    err.status = res.status;
    err.statusCode = res.status;
    err.body = data;
    // Preserve field-level errors for duplicate validation
    if (data?.field) {
      err.field = data.field;
    }
    throw err;
  }
  return data;
}

// --- Leads ---
export const LeadsAPI = {
  fetchLeads: async (branchId?: string) => {
    const params = new URLSearchParams({ type: 'lead' });
    if (branchId) params.append('branch_id', branchId);
    const res = await fetch(`${API_BASE}/leads?${params.toString()}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  fetchApplications: async (branchId?: string) => {
    const params = new URLSearchParams({ type: 'application' });
    if (branchId) params.append('branch_id', branchId);
    const res = await fetch(`${API_BASE}/leads?${params.toString()}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  fetchLeadById: async (id: string) => {
    const res = await fetch(`${API_BASE}/leads/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getAgentLeads: async (agentId: string, branchId?: string) => {
    const params = new URLSearchParams({ created_by: agentId });
    if (branchId) params.append('branch_id', branchId);
    const res = await fetch(`${API_BASE}/leads?${params.toString()}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getCounsellorLeads: async (counsellorId: string, branchId?: string) => {
    const params = new URLSearchParams({ assigned_to: counsellorId, type: 'lead' });
    if (branchId) params.append('branch_id', branchId);
    const res = await fetch(`${API_BASE}/leads?${params.toString()}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  createLead: async (lead: any) => {
    // POST /leads is public according to API_DOC, but we'll include auth if available
    const res = await fetch(`${API_BASE}/leads`, { method: 'POST', headers: getHeaders(false), body: JSON.stringify(lead) });
    return handleResponse(res);
  },
  updateLead: async (id: string, updates: any) => {
    const res = await fetch(`${API_BASE}/leads/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(updates) });
    return handleResponse(res);
  },
  deleteLead: async (id: string) => {
    const res = await fetch(`${API_BASE}/leads/${id}`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(res);
  }
};

// --- Partners (agents/counsellors) ---
export const PartnersAPI = {
  getCurrentUser: async () => {
    const res = await fetch(`${API_BASE}/partners/me`, { headers: getHeaders() });
    return handleResponse(res);
  },
  fetchPartners: async (branchId?: string, role?: string) => {
    const params = new URLSearchParams();
    if (branchId) params.append('branch_id', branchId);
    if (role) params.append('role', role);
    const url = params.toString() ? `${API_BASE}/partners?${params}` : `${API_BASE}/partners`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  fetchPartnerById: async (id: string) => {
    const res = await fetch(`${API_BASE}/partners/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  createPartner: async (partner: any) => {
    const res = await fetch(`${API_BASE}/partners`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(partner) });
    return handleResponse(res);
  },
  updatePartner: async (id: string, updates: any) => {
    const res = await fetch(`${API_BASE}/partners/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(updates) });
    return handleResponse(res);
  },
  deletePartner: async (id: string) => {
    const res = await fetch(`${API_BASE}/partners/${id}`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(res);
  }
};

// --- Auth ---
export const AuthAPI = {
  login: async (email: string, password: string) => {
    // Login is public - no auth header needed
    const res = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    return handleResponse(res);
  },
  logout: async () => {
    const res = await fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: getHeaders() });
    return handleResponse(res);
  },
  getSessionPartner: async (email: string) => {
    // Backend provides /partners lookup; frontend can call partners?email=...
    const res = await fetch(`${API_BASE}/partners?email=${encodeURIComponent(email)}`);
    return handleResponse(res);
  }
};

// --- Followups & Comments ---
export const FollowupsAPI = {
  createFollowup: async (payload: any) => {
    const res = await fetch(`${API_BASE}/followups`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) });
    return handleResponse(res);
  },
  fetchAllFollowups: async (params?: { date?: string; userId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.userId) queryParams.append('userId', params.userId);
    const url = queryParams.toString() ? `${API_BASE}/followups?${queryParams}` : `${API_BASE}/followups`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  fetchFollowupsByLeadId: async (leadId: string) => {
    const res = await fetch(`${API_BASE}/leads/${leadId}/followups`, { headers: getHeaders() });
    return handleResponse(res);
  },
  updateFollowup: async (id: string, updates: any) => {
    const res = await fetch(`${API_BASE}/followups/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(updates) });
    return handleResponse(res);
  },
  deleteFollowup: async (id: string) => {
    const res = await fetch(`${API_BASE}/followups/${id}`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(res);
  },
  createComment: async (comment: any) => {
    const res = await fetch(`${API_BASE}/followups/${comment.followup_id}/comments`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(comment) });
    return handleResponse(res);
  },
  fetchCommentsByFollowupId: async (followupId: string) => {
    const res = await fetch(`${API_BASE}/followups/${followupId}/comments`, { headers: getHeaders() });
    return handleResponse(res);
  },
  deleteAllComments: async (followupId: string) => {
    const res = await fetch(`${API_BASE}/followups/${followupId}/comments`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(res);
  },
  markComplete: async (id: string) => {
    const res = await fetch(`${API_BASE}/followups/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ completed: true }) });
    return handleResponse(res);
  },
  extendDueDate: async (id: string, newDate: string) => {
    const res = await fetch(`${API_BASE}/followups/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ due_date: newDate }) });
    return handleResponse(res);
  }
};

// --- Notes ---
export const NotesAPI = {
  fetchNotesByLeadId: async (leadId: string) => {
    const res = await fetch(`${API_BASE}/leads/${leadId}/notes`, { headers: getHeaders() });
    return handleResponse(res);
  },
  createNote: async (payload: any) => {
    const res = await fetch(`${API_BASE}/notes`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) });
    return handleResponse(res);
  },
  updateNote: async (id: string, updates: any) => {
    const res = await fetch(`${API_BASE}/notes/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(updates) });
    return handleResponse(res);
  },
  deleteNote: async (id: string) => {
    const res = await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(res);
  }
};

// --- Timeline ---
export const TimelineAPI = {
  fetchTimelineByLeadId: async (leadId: string) => {
    const res = await fetch(`${API_BASE}/leads/${leadId}/timeline`, { headers: getHeaders() });
    return handleResponse(res);
  },
  createTimelineEvent: async (payload: any) => {
    const res = await fetch(`${API_BASE}/timeline`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) });
    return handleResponse(res);
  },
  fetchAllTimelines: async (leadIds: string[]) => {
    const res = await fetch(`${API_BASE}/timeline?leadIds=${encodeURIComponent(leadIds.join(','))}`, { headers: getHeaders() });
    return handleResponse(res);
  }
};

// --- Dashboard ---
export const DashboardAPI = {
  getStats: async () => {
    const res = await fetch(`${API_BASE}/dashboard/stats`, { headers: getHeaders() });
    return handleResponse(res);
  },
  fetchDashboardLeads: async () => {
    const res = await fetch(`${API_BASE}/leads?type=lead`, { headers: getHeaders() });
    return handleResponse(res);
  }
};

// --- Applications ---
export const ApplicationsAPI = {
  // TODO: Backend needs GET /applications endpoint to fetch all applications
  fetchApplications: async () => {
    console.warn("fetchApplications not implemented on backend yet");
    return [];
  },
  getApplication: async (leadId: string) => {
    const res = await fetch(`${API_BASE}/applications/${leadId}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  fetchApplicationByLeadId: async (leadId: string) => {
    const res = await fetch(`${API_BASE}/applications/${leadId}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  createApplication: async (application: any) => {
    const res = await fetch(`${API_BASE}/applications`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(application) });
    return handleResponse(res);
  },
  updateApplication: async (id: string, updates: any) => {
    const res = await fetch(`${API_BASE}/applications/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(updates) });
    return handleResponse(res);
  },
  deleteApplication: async (id: string) => {
    // TODO: Backend needs DELETE /applications/:id endpoint
    console.warn("deleteApplication not implemented on backend yet");
    return;
  },
  patchSection: async (leadId: string, section: string, body: any) => {
    const res = await fetch(`${API_BASE}/applications/${leadId}/${section}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(body) });
    return handleResponse(res);
  }
};

// --- Countries ---
export const CountriesAPI = {
  create: async (data: any) => {
    const res = await fetch(`${API_BASE}/countries`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  getAll: async () => {
    const res = await fetch(`${API_BASE}/countries`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getById: async (id: string) => {
    const res = await fetch(`${API_BASE}/countries/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  update: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/countries/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/countries/${id}`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(res);
  },
};

// --- Universities ---
export const UniversitiesAPI = {
  create: async (data: any) => {
    const res = await fetch(`${API_BASE}/universities`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  getAll: async (countryId?: string) => {
    const url = countryId ? `${API_BASE}/universities?country_id=${countryId}` : `${API_BASE}/universities`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  getById: async (id: string) => {
    const res = await fetch(`${API_BASE}/universities/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  update: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/universities/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/universities/${id}`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(res);
  },
};

// --- Courses ---
export const CoursesAPI = {
  create: async (data: any) => {
    const res = await fetch(`${API_BASE}/courses`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  getAll: async (filters?: any) => {
    const params = new URLSearchParams();
    if (filters?.universityId) params.append('universityId', filters.universityId);
    if (filters?.search) params.append('search', filters.search);
    const url = params.toString() ? `${API_BASE}/courses?${params}` : `${API_BASE}/courses`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  getById: async (id: string) => {
    const res = await fetch(`${API_BASE}/courses/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  update: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/courses/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/courses/${id}`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(res);
  },
  getFilters: async () => {
    const res = await fetch(`${API_BASE}/courses/filters`, { headers: getHeaders() });
    return handleResponse(res);
  },
};

// --- Permission Groups ---
export const PermissionGroupsAPI = {
  create: async (data: { name: string }) => {
    const res = await fetch(`${API_BASE}/permission-groups`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  getAll: async () => {
    const res = await fetch(`${API_BASE}/permission-groups`, { headers: getHeaders() });
    return handleResponse(res);
  },
  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/permission-groups/${id}`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(res);
  },
};

// --- Permissions ---
export const PermissionsAPI = {
  create: async (data: { name: string; permission_group_id?: string }) => {
    const res = await fetch(`${API_BASE}/permissions`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  getAll: async () => {
    const res = await fetch(`${API_BASE}/permissions`, { headers: getHeaders() });
    return handleResponse(res);
  },
  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/permissions/${id}`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(res);
  },
};

// --- Roles ---
export const RolesAPI = {
  create: async (data: { name: string; description?: string; permissionIds: string[] }) => {
    const res = await fetch(`${API_BASE}/roles`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  getAll: async () => {
    const res = await fetch(`${API_BASE}/roles`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getById: async (id: string) => {
    const res = await fetch(`${API_BASE}/roles/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  update: async (id: string, data: { name?: string; description?: string; permissionIds?: string[] }) => {
    const res = await fetch(`${API_BASE}/roles/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/roles/${id}`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(res);
  },
};

// --- Branches ---
export const BranchesAPI = {
  fetchBranches: async () => {
    const res = await fetch(`${API_BASE}/branches`, { headers: getHeaders() });
    return handleResponse(res);
  },
  fetchBranchById: async (id: string) => {
    const res = await fetch(`${API_BASE}/branches/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  createBranch: async (branch: any) => {
    const res = await fetch(`${API_BASE}/branches`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(branch) });
    return handleResponse(res);
  },
  updateBranch: async (id: string, updates: any) => {
    const res = await fetch(`${API_BASE}/branches/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(updates) });
    return handleResponse(res);
  },
  deleteBranch: async (id: string) => {
    const res = await fetch(`${API_BASE}/branches/${id}`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(res);
  },
};

// --- Announcements ---
export const AnnouncementsAPI = {
  create: async (data: any) => {
    const res = await fetch(`${API_BASE}/announcements`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  getAll: async (filters?: { target_audience?: string; branch_id?: string }) => {
    const params = new URLSearchParams();
    if (filters?.target_audience) params.append('target_audience', filters.target_audience);
    if (filters?.branch_id) params.append('branch_id', filters.branch_id);
    const url = params.toString() ? `${API_BASE}/announcements?${params}` : `${API_BASE}/announcements`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  getById: async (id: string) => {
    const res = await fetch(`${API_BASE}/announcements/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  update: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/announcements/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/announcements/${id}`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(res);
  },
  markAsRead: async (id: string) => {
    const res = await fetch(`${API_BASE}/announcements/${id}/mark-read`, { method: 'POST', headers: getHeaders() });
    return handleResponse(res);
  },
  getUnreadCount: async () => {
    const res = await fetch(`${API_BASE}/announcements/unread-count`, { headers: getHeaders() });
    return handleResponse(res);
  },
};

// --- Todos ---
export const TodosAPI = {
  create: async (data: any) => {
    const res = await fetch(`${API_BASE}/todos`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  getAll: async (params?: { date?: string; completed?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.completed !== undefined) queryParams.append('completed', params.completed.toString());
    const url = queryParams.toString() ? `${API_BASE}/todos?${queryParams}` : `${API_BASE}/todos`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  getById: async (id: string) => {
    const res = await fetch(`${API_BASE}/todos/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  update: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/todos/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/todos/${id}`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(res);
  },
  markComplete: async (id: string) => {
    const res = await fetch(`${API_BASE}/todos/${id}/complete`, { method: 'PATCH', headers: getHeaders() });
    return handleResponse(res);
  },
  markIncomplete: async (id: string) => {
    const res = await fetch(`${API_BASE}/todos/${id}/incomplete`, { method: 'PATCH', headers: getHeaders() });
    return handleResponse(res);
  },
};

export default {
  LeadsAPI,
  PartnersAPI,
  AuthAPI,
  FollowupsAPI,
  NotesAPI,
  TimelineAPI,
  DashboardAPI,
  ApplicationsAPI,
  CountriesAPI,
  UniversitiesAPI,
  CoursesAPI,
  PermissionGroupsAPI,
  PermissionsAPI,
  RolesAPI,
  BranchesAPI,
  AnnouncementsAPI,
  TodosAPI,
};
