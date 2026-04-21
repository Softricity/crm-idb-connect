

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5005';

// Helper to get auth token from cookies (client-side only)
function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const tokenCookie =
    cookies.find(c => c.trim().startsWith('b2b-auth-token=')) ||
    cookies.find(c => c.trim().startsWith('auth-token='));
  if (!tokenCookie) return null;
  try {
    const value = tokenCookie.split('=')[1];
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

// Helper to create headers with auth token
// Pass token explicitly for server-side calls
function getHeaders(includeAuth = true, token?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const authToken = token || getAuthToken();
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
  }

  return headers;
}

async function handleResponse(res: Response) {
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const err: any = new Error(data?.message || data?.error || res.statusText || 'API Error');
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

// --- Countries ---
export const CountriesAPI = {
  create: async (data: any, token?: string) => {
    const res = await fetch(`${API_BASE}/countries`, { method: 'POST', headers: getHeaders(true, token), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  getAll: async (token?: string) => {
    const res = await fetch(`${API_BASE}/countries`, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  getById: async (id: string, token?: string) => {
    const res = await fetch(`${API_BASE}/countries/${id}`, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  update: async (id: string, data: any, token?: string) => {
    const res = await fetch(`${API_BASE}/countries/${id}`, { method: 'PATCH', headers: getHeaders(true, token), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  delete: async (id: string, token?: string) => {
    const res = await fetch(`${API_BASE}/countries/${id}`, { method: 'DELETE', headers: getHeaders(true, token) });
    return handleResponse(res);
  },
};

// --- Universities ---
export const UniversitiesAPI = {
  create: async (data: any, token?: string) => {
    const res = await fetch(`${API_BASE}/universities`, { method: 'POST', headers: getHeaders(true, token), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  getAll: async (countryId?: string, token?: string) => {
    const url = countryId ? `${API_BASE}/universities?countryId=${countryId}` : `${API_BASE}/universities`;
    const res = await fetch(url, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  getAllWithAccess: async (token?: string) => {
    const res = await fetch(`${API_BASE}/universities/all-with-access`, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  getById: async (id: string, token?: string) => {
    const res = await fetch(`${API_BASE}/universities/${id}`, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  update: async (id: string, data: any, token?: string) => {
    const res = await fetch(`${API_BASE}/universities/${id}`, { method: 'PATCH', headers: getHeaders(true, token), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  delete: async (id: string, token?: string) => {
    const res = await fetch(`${API_BASE}/universities/${id}`, { method: 'DELETE', headers: getHeaders(true, token) });
    return handleResponse(res);
  },
};

// --- Courses ---
export const CoursesAPI = {
  create: async (data: any, token?: string) => {
    const res = await fetch(`${API_BASE}/courses`, { method: 'POST', headers: getHeaders(true, token), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  getAll: async (filters?: any, token?: string) => {
    const params = new URLSearchParams();
    if (filters?.universityId) params.append('universityId', filters.universityId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.country) {
      if (Array.isArray(filters.country)) {
        filters.country.forEach((c: string) => params.append('country', c));
      } else {
        params.append('country', filters.country);
      }
    }
    if (filters?.level) {
      if (Array.isArray(filters.level)) {
        filters.level.forEach((l: string) => params.append('level', l));
      } else {
        params.append('level', filters.level);
      }
    }
    if (filters?.university) {
      if (Array.isArray(filters.university)) {
        filters.university.forEach((u: string) => params.append('university', u));
      } else {
        params.append('university', filters.university);
      }
    }
    if (filters?.intake) {
      if (Array.isArray(filters.intake)) {
        filters.intake.forEach((i: string) => params.append('intake', i));
      } else {
        params.append('intake', filters.intake);
      }
    }
    const url = params.toString() ? `${API_BASE}/courses?${params}` : `${API_BASE}/courses`;
    const res = await fetch(url, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  getById: async (id: string, token?: string) => {
    const res = await fetch(`${API_BASE}/courses/${id}`, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  update: async (id: string, data: any, token?: string) => {
    const res = await fetch(`${API_BASE}/courses/${id}`, { method: 'PATCH', headers: getHeaders(true, token), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  delete: async (id: string, token?: string) => {
    const res = await fetch(`${API_BASE}/courses/${id}`, { method: 'DELETE', headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  getFilters: async (token?: string) => {
    const res = await fetch(`${API_BASE}/courses/filters`, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
};

// --- Auth ---
export const AuthAPI = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },
};

// --- Leads (Public Lead Creation) ---
export const LeadsAPI = {
  createLead: async (lead: any) => {
    // POST /leads is public according to API_DOC, but we need auth for agent context
    const res = await fetch(`${API_BASE}/leads`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(lead) });
    return handleResponse(res);
  },
  getAll: async (filters?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }, token?: string) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    const url = params.toString() ? `${API_BASE}/leads?${params}` : `${API_BASE}/leads`;
    const res = await fetch(url, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  getMyApplications: async (createdBy?: string, token?: string) => {
    const params = new URLSearchParams();
    if (createdBy) params.append('created_by', createdBy);
    const url = params.toString() ? `${API_BASE}/leads/my-applications?${params}` : `${API_BASE}/leads/my-applications`;
    const res = await fetch(url, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  getById: async (id: string, token?: string) => {
    const res = await fetch(`${API_BASE}/leads/${id}`, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  update: async (id: string, data: any, token?: string) => {
    const res = await fetch(`${API_BASE}/leads/${id}`, { method: 'PATCH', headers: getHeaders(true, token), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  delete: async (id: string, token?: string) => {
    const res = await fetch(`${API_BASE}/leads/${id}`, { method: 'DELETE', headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  assignToAgent: async (leadId: string, agentId: string, token?: string) => {
    const res = await fetch(`${API_BASE}/leads/${leadId}/assign-agent`, {
      method: 'PATCH',
      headers: getHeaders(true, token),
      body: JSON.stringify({ agentId })
    });
    return handleResponse(res);
  },
};

export const PartnersAPI = {
  fetchPartners: async (branchId?: string, role?: string, token?: string) => {
    const params = new URLSearchParams();
    if (branchId) params.append('branch_id', branchId);
    if (role) params.append('role', role);
    const url = params.toString() ? `${API_BASE}/partners?${params.toString()}` : `${API_BASE}/partners`;
    const res = await fetch(url, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
};

export const DepartmentsAPI = {
  fetchDepartments: async (includeInactive = false, token?: string) => {
    const params = new URLSearchParams();
    if (includeInactive) params.append('includeInactive', 'true');

    const url = params.toString()
      ? `${API_BASE}/departments?${params.toString()}`
      : `${API_BASE}/departments`;

    const res = await fetch(url, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  fetchDepartmentStatuses: async (departmentId: string, includeInactive = false, token?: string) => {
    const params = new URLSearchParams();
    if (includeInactive) params.append('includeInactive', 'true');

    const url = params.toString()
      ? `${API_BASE}/departments/${departmentId}/statuses?${params.toString()}`
      : `${API_BASE}/departments/${departmentId}/statuses`;

    const res = await fetch(url, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
};

// --- Agents ---
export const AgentsAPI = {
  onboard: async (data: any) => {
    // POST /agents/onboard is public
    const res = await fetch(`${API_BASE}/agents/onboard`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  getAll: async (status?: string, token?: string) => {
    const url = status ? `${API_BASE}/agents?status=${status}` : `${API_BASE}/agents`;
    const res = await fetch(url, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  getById: async (id: string, token?: string) => {
    const res = await fetch(`${API_BASE}/agents/${id}`, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  updateStatus: async (id: string, status: string, reason?: string, token?: string) => {
    const res = await fetch(`${API_BASE}/agents/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(true, token),
      body: JSON.stringify({ status, reason })
    });
    return handleResponse(res);
  },
  delete: async (id: string, token?: string) => {
    const res = await fetch(`${API_BASE}/agents/${id}`, { method: 'DELETE', headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  getMyTeam: async (token?: string) => {
    const res = await fetch(`${API_BASE}/agents/my/team`, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  createTeamMember: async (data: any, token?: string) => {
    const res = await fetch(`${API_BASE}/agents/my/team`, {
      method: 'POST',
      headers: getHeaders(true, token),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  updateTeamMember: async (id: string, data: any, token?: string) => {
    const res = await fetch(`${API_BASE}/agents/my/team/${id}`, {
      method: 'PATCH',
      headers: getHeaders(true, token),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  deleteTeamMember: async (id: string, token?: string) => {
    const res = await fetch(`${API_BASE}/agents/my/team/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true, token),
    });
    return handleResponse(res);
  },
  assignLeadToTeamMember: async (leadId: string, teamMemberId: string, token?: string) => {
    const res = await fetch(`${API_BASE}/agents/leads/${leadId}/assign-team-member`, {
      method: 'PATCH',
      headers: getHeaders(true, token),
      body: JSON.stringify({ teamMemberId }),
    });
    return handleResponse(res);
  },
  createInquiry: async (data: any) => {
    const res = await fetch(`${API_BASE}/agents/inquiry`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  uploadInquiryDocument: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/agents/inquiry/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },
};

// --- Applications ---
export const ApplicationsAPI = {
  getByLeadId: async (leadId: string, token?: string) => {
    const res = await fetch(`${API_BASE}/applications/${leadId}`, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  updatePersonal: async (leadId: string, data: any, token?: string) => {
    const res = await fetch(`${API_BASE}/applications/${leadId}/personal`, {
      method: 'PATCH',
      headers: getHeaders(true, token),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  updateEducation: async (leadId: string, data: any, token?: string) => {
    const res = await fetch(`${API_BASE}/applications/${leadId}/education`, {
      method: 'PATCH',
      headers: getHeaders(true, token),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  updatePreferences: async (leadId: string, data: any, token?: string) => {
    const res = await fetch(`${API_BASE}/applications/${leadId}/preferences`, {
      method: 'PATCH',
      headers: getHeaders(true, token),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  updateTests: async (leadId: string, data: any, token?: string) => {
    const res = await fetch(`${API_BASE}/applications/${leadId}/tests`, {
      method: 'PATCH',
      headers: getHeaders(true, token),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  updateWorkExperience: async (leadId: string, data: any, token?: string) => {
    const res = await fetch(`${API_BASE}/applications/${leadId}/work-experience`, {
      method: 'PATCH',
      headers: getHeaders(true, token),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  updateVisa: async (leadId: string, data: any, token?: string) => {
    const res = await fetch(`${API_BASE}/applications/${leadId}/visa`, {
      method: 'PATCH',
      headers: getHeaders(true, token),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  uploadDocuments: async (leadId: string, formData: FormData, token?: string) => {
    const authToken = token || getAuthToken();
    const headers: HeadersInit = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    const res = await fetch(`${API_BASE}/applications/${leadId}/documents`, {
      method: 'PATCH',
      headers,
      body: formData
    });
    return handleResponse(res);
  },
};

// --- Dashboard ---
export const DashboardAPI = {
  getStats: async (token?: string) => {
    const res = await fetch(`${API_BASE}/dashboard/stats`, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
};

// --- Announcements ---
export const AnnouncementsAPI = {
  getAll: async (targetAudience?: string, branchId?: string, token?: string) => {
    let url = `${API_BASE}/announcements`;
    const params = new URLSearchParams();
    if (targetAudience) params.append('target_audience', targetAudience);
    if (branchId) params.append('branch_id', branchId);
    if (params.toString()) url += `?${params}`;
    const res = await fetch(url, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  markAsRead: async (id: string, token?: string) => {
    const res = await fetch(`${API_BASE}/announcements/${id}/mark-read`, {
      method: 'POST',
      headers: getHeaders(true, token)
    });
    return handleResponse(res);
  },
  getUnreadCount: async (token?: string) => {
    const res = await fetch(`${API_BASE}/announcements/unread-count`, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
};

// --- Commissions ---
export const CommissionsAPI = {
  create: async (data: any, token?: string) => {
    const res = await fetch(`${API_BASE}/commissions`, {
      method: 'POST',
      headers: getHeaders(true, token),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  getAll: async (token?: string) => {
    const res = await fetch(`${API_BASE}/commissions`, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  getMyCommissions: async (token?: string) => {
    const res = await fetch(`${API_BASE}/commissions/my-commissions`, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  getById: async (id: string, token?: string) => {
    const res = await fetch(`${API_BASE}/commissions/${id}`, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  update: async (id: string, data: any, token?: string) => {
    const res = await fetch(`${API_BASE}/commissions/${id}`, {
      method: 'PATCH',
      headers: getHeaders(true, token),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  delete: async (id: string, token?: string) => {
    const res = await fetch(`${API_BASE}/commissions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true, token)
    });
    return handleResponse(res);
  },
};

// --- Support ---
export const SupportAPI = {
  createTicket: async (data: any, token?: string) => {
    const res = await fetch(`${API_BASE}/support`, {
      method: 'POST',
      headers: getHeaders(true, token),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  getAllTickets: async (status?: string, token?: string) => {
    const url = status ? `${API_BASE}/support?status=${status}` : `${API_BASE}/support`;
    const res = await fetch(url, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  getTicketById: async (id: string, token?: string) => {
    const res = await fetch(`${API_BASE}/support/${id}`, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  addComment: async (ticketId: string, message: string, token?: string) => {
    const res = await fetch(`${API_BASE}/support/${ticketId}/comments`, {
      method: 'POST',
      headers: getHeaders(true, token),
      body: JSON.stringify({ message })
    });
    return handleResponse(res);
  },
  updateStatus: async (ticketId: string, status: string, token?: string) => {
    const res = await fetch(`${API_BASE}/support/${ticketId}/status`, {
      method: 'PATCH',
      headers: getHeaders(true, token),
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },
};

export const ContractsAPI = {
  getTemplate: async (token?: string) => {
    const res = await fetch(`${API_BASE}/contracts/template`, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  getMyContract: async (token?: string) => {
    const res = await fetch(`${API_BASE}/contracts/my-contract`, { headers: getHeaders(true, token) });
    return handleResponse(res);
  },
  sign: async (id: string, signatureUrl: string, token?: string) => {
    const res = await fetch(`${API_BASE}/contracts/${id}/sign`, {
      method: 'PATCH',
      headers: getHeaders(true, token),
      body: JSON.stringify({ signature_url: signatureUrl }),
    });
    return handleResponse(res);
  },
  uploadSignature: async (id: string, file: File, token?: string) => {
    const authToken = token || getAuthToken();
    const headers: HeadersInit = {};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const form = new FormData();
    form.append('file', file);

    const res = await fetch(`${API_BASE}/contracts/${id}/signature-upload`, {
      method: 'POST',
      headers,
      body: form,
    });
    return handleResponse(res);
  },
  downloadPdf: async (id: string, token?: string) => {
    const res = await fetch(`${API_BASE}/contracts/${id}/download`, { headers: getHeaders(true, token) });
    if (!res.ok) throw new Error('Failed to download contract PDF');
    return res.blob();
  },
}

export const DropdownsAPI = {
  getList: async (_key?: string, token?: string) => {
    const res = await fetch(`${API_BASE}/dropdowns/categories`, { headers: getHeaders(true, token) });
    const categories = await handleResponse(res);
    return (categories || []).map((c: any) => ({
      name: c.name,
      options: (c.options || []).map((o: any) => ({
        label: o?.label || o?.value || '',
        value: o?.value || o?.label || '',
      })),
    }));
  },
}
