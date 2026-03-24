const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5005';

function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const tokenCookie =
    cookies.find(c => c.trim().startsWith('crm-auth-token=')) ||
    cookies.find(c => c.trim().startsWith('auth-token='));
  if (!tokenCookie) return null;
  try {
    const value = tokenCookie.split('=')[1];
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

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
    if (data?.field) {
      err.field = data.field;
    }
    throw err;
  }
  return data;
}

export const AgentsAPI = {
  onboard: async (data: any) => {
    const res = await fetch(`${API_BASE}/agents/onboard`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(data) 
    });
    return handleResponse(res);
  },
  getAll: async (status?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    const res = await fetch(`${API_BASE}/agents?${params.toString()}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getById: async (id: string) => {
    const res = await fetch(`${API_BASE}/agents/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  updateStatus: async (id: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    const res = await fetch(`${API_BASE}/agents/${id}/status`, { 
      method: 'PATCH', 
      headers: getHeaders(), 
      body: JSON.stringify({ status, reason }) 
    });
    return handleResponse(res);
  },
  delete: async (id: string) => {
     const res = await fetch(`${API_BASE}/agents/${id}`, { method: 'DELETE', headers: getHeaders() });
     return handleResponse(res);
  },
  getInquiries: async (status?: string) => {
    const url = status ? `${API_BASE}/agents/inquiries?status=${status}` : `${API_BASE}/agents/inquiries`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  updateInquiryStatus: async (id: string, status: string) => {
    const res = await fetch(`${API_BASE}/agents/inquiries/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },
  getUniversityAccess: async (agentId: string) => {
    const res = await fetch(`${API_BASE}/agents/${agentId}/universities`, { headers: getHeaders() });
    return handleResponse(res);
  },
  setUniversityAccess: async (agentId: string, universityIds: string[]) => {
    const res = await fetch(`${API_BASE}/agents/${agentId}/universities`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ universityIds }),
    });
    return handleResponse(res);
  },
};

export const LeadsAPI = {
  fetchLeads: async (branchId?: string, page: number = 1, limit: number = 10) => {
    const params = new URLSearchParams({ type: 'lead', page: page.toString(), limit: limit.toString() });
    if (branchId) params.append('branch_id', branchId);
    const res = await fetch(`${API_BASE}/leads?${params.toString()}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  fetchApplications: async (branchId?: string, page: number = 1, limit: number = 10) => {
    const params = new URLSearchParams({ type: 'application', page: page.toString(), limit: limit.toString() });
    if (branchId) params.append('branch_id', branchId);
    const res = await fetch(`${API_BASE}/leads?${params.toString()}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  fetchLeadById: async (id: string) => {
    const res = await fetch(`${API_BASE}/leads/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getAgentLeads: async (agentId: string, branchId?: string, page: number = 1, limit: number = 10) => {
    const params = new URLSearchParams({ created_by: agentId, page: page.toString(), limit: limit.toString() });
    if (branchId) params.append('branch_id', branchId);
    const res = await fetch(`${API_BASE}/leads?${params.toString()}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getCounsellorLeads: async (counsellorId: string, branchId?: string, page: number = 1, limit: number = 10) => {
    const params = new URLSearchParams({ assigned_to: counsellorId, type: 'lead', page: page.toString(), limit: limit.toString() });
    if (branchId) params.append('branch_id', branchId);
    const res = await fetch(`${API_BASE}/leads?${params.toString()}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  createLead: async (lead: any) => {
    const res = await fetch(`${API_BASE}/leads`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(lead) });
    return handleResponse(res);
  },
  updateLead: async (id: string, updates: any) => {
    const res = await fetch(`${API_BASE}/leads/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(updates) });
    return handleResponse(res);
  },
  deleteLead: async (id: string) => {
    const res = await fetch(`${API_BASE}/leads/${id}`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(res);
  },
  addCourseToLead: async (leadId: string, courseId: string) => {
    const res = await fetch(`${API_BASE}/leads/${leadId}/courses`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ courseId }) });
    return handleResponse(res);
  },
  removeCourseFromLead: async (leadId: string, courseId: string) => {
    const res = await fetch(`${API_BASE}/leads/${leadId}/courses/${courseId}`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(res);
  }
};

export const ReportsAPI = {
  getReportData: async (type: string, query: Record<string, any>) => {
    const params = new URLSearchParams();
    Object.entries(query || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.append(key, value.join(","));
        }
      } else {
        params.append(key, String(value));
      }
    });

    const url = params.toString() ? `${API_BASE}/reports/${type}?${params}` : `${API_BASE}/reports/${type}`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  getReportFilterOptions: async (type: string, query?: Record<string, any>) => {
    const params = new URLSearchParams();
    Object.entries(query || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      params.append(key, String(value));
    });
    const url = params.toString()
      ? `${API_BASE}/reports/${type}/filters?${params}`
      : `${API_BASE}/reports/${type}/filters`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  downloadReportXlsx: async (type: string, query: Record<string, any>) => {
    const params = new URLSearchParams();
    Object.entries(query || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.append(key, value.join(","));
        }
      } else {
        params.append(key, String(value));
      }
    });

    const url = params.toString()
      ? `${API_BASE}/reports/${type}/export?${params}`
      : `${API_BASE}/reports/${type}/export`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) {
      throw new Error("Failed to export report");
    }

    const blob = await res.blob();
    const contentDisposition = res.headers.get("content-disposition");
    let filename = `${type}_report.xlsx`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename=\"?([^\";]+)\"?/i);
      if (match?.[1]) {
        filename = match[1];
      }
    }
    return { blob, filename };
  },
};

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

export const AuthAPI = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    return handleResponse(res);
  },
  me: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    return handleResponse(res);
  },
  logout: async () => {
    const res = await fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: getHeaders() });
    return handleResponse(res);
  }
};

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
  markComplete: async (id: string) => {
    const res = await fetch(`${API_BASE}/followups/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ completed: true }) });
    return handleResponse(res);
  },
  deleteAllComments: async (followupId: string) => {
    const res = await fetch(`${API_BASE}/followups/${followupId}/comments`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  extendDueDate: async (id: string, due_date: string) => {
    const res = await fetch(`${API_BASE}/followups/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ due_date }),
    });
    return handleResponse(res);
  },
};

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

export const TimelineAPI = {
  fetchTimelineByLeadId: async (leadId: string, page: number = 1, limit: number = 20) => {
    const res = await fetch(`${API_BASE}/leads/${leadId}/timeline?page=${page}&limit=${limit}&t=${Date.now()}`, {
      headers: getHeaders(),
      cache: 'no-store',
    });
    return handleResponse(res);
  },
  fetchGlobalTimeline: async (page: number = 1, limit: number = 20) => {
    const res = await fetch(`${API_BASE}/timeline?page=${page}&limit=${limit}&t=${Date.now()}`, {
      headers: getHeaders(),
      cache: 'no-store',
    });
    return handleResponse(res);
  },
  createTimelineEvent: async (event: any) => {
    const res = await fetch(`${API_BASE}/timeline`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(event),
    });
    return handleResponse(res);
  },
  fetchAllTimelines: async (leadIds: string[]) => {
    if (!leadIds || leadIds.length === 0) return [];
    
    const responses = await Promise.all(
      leadIds.map((leadId) =>
        fetch(`${API_BASE}/leads/${leadId}/timeline?limit=10&t=${Date.now()}`, {
          headers: getHeaders(),
          cache: 'no-store',
        }).then(handleResponse),
      )
    );
    
    // Each response is { data: Timeline[], meta: ... }
    return responses.flatMap(res => res.data || []);
  },
};

export const OfflinePaymentsAPI = {
  uploadFile: async (file: File, leadId?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (leadId) form.append('lead_id', leadId);
    const res = await fetch(`${API_BASE}/offline-payments/upload`, { method: 'POST', headers: { Authorization: `Bearer ${getAuthToken()}` }, body: form });
    return handleResponse(res);
  },
  createPayment: async (payload: any) => {
    const res = await fetch(`${API_BASE}/offline-payments`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(payload) });
    return handleResponse(res);
  },
  fetchByLeadId: async (leadId: string) => {
    const res = await fetch(`${API_BASE}/leads/${leadId}/offline-payments`, { headers: getHeaders() });
    return handleResponse(res);
  },
  fetchByReceiver: async (receiverId: string) => {
    const res = await fetch(`${API_BASE}/partners/${receiverId}/offline-payments`, { headers: getHeaders() });
    return handleResponse(res);
  },
  updatePayment: async (id: string, updates: any) => {
    const res = await fetch(`${API_BASE}/offline-payments/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(updates) });
    return handleResponse(res);
  },
  deletePayment: async (id: string) => {
    const res = await fetch(`${API_BASE}/offline-payments/${id}`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(res);
  },
  deleteUploadedFile: async (fileUrl: string) => {
    const res = await fetch(`${API_BASE}/offline-payments/delete-file`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ fileUrl }),
    });
    return handleResponse(res);
  },
  fetchTodaySummary: async (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const url = `${API_BASE}/offline-payments/today-summary${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  fetchAllPayments: async () => {
    const res = await fetch(`${API_BASE}/offline-payments`, { headers: getHeaders() });
    return handleResponse(res);
  },
};

export const DashboardAPI = {
  getStats: async () => {
    const res = await fetch(`${API_BASE}/dashboard/stats`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getApplicationStats: async () => {
    const res = await fetch(`${API_BASE}/dashboard/application-stats`, { headers: getHeaders() });
    return handleResponse(res);
  },
};

export const ApplicationsAPI = {
  fetchApplications: async () => {
    const res = await fetch(`${API_BASE}/leads?type=application`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getApplication: async (leadId: string) => {
    const res = await fetch(`${API_BASE}/applications/${leadId}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  fetchApplicationByLeadId: async (leadId: string) => {
    const res = await fetch(`${API_BASE}/applications/${leadId}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  patchSection: async (leadId: string, section: string, body: any) => {
    const res = await fetch(`${API_BASE}/applications/${leadId}/${section}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(body) });
    return handleResponse(res);
  },
  updatePreferences: async (leadId: string, data: any) => {
    const res = await fetch(`${API_BASE}/applications/${leadId}/preferences`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data) });
    return handleResponse(res);
  },
  deleteApplication: async (id: string) => {
    const res = await fetch(`${API_BASE}/leads/${id}`, { method: 'DELETE', headers: getHeaders() });
    return handleResponse(res);
  },
};

export const CountriesAPI = {
  getAll: async () => {
    const res = await fetch(`${API_BASE}/countries`, { headers: getHeaders() });
    return handleResponse(res);
  },
  create: async (data: any) => {
    const res = await fetch(`${API_BASE}/countries`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  update: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/countries/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/countries/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

export const UniversitiesAPI = {
  getAll: async (countryId?: string) => {
    const url = countryId ? `${API_BASE}/universities?country_id=${countryId}` : `${API_BASE}/universities`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  create: async (data: any) => {
    const res = await fetch(`${API_BASE}/universities`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  update: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/universities/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/universities/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

export const CoursesAPI = {
  getAll: async (filters?: any) => {
    const params = new URLSearchParams();
    if (filters?.universityId) params.append('universityId', filters.universityId);
    if (filters?.search) params.append('search', filters.search);
    const url = params.toString() ? `${API_BASE}/courses?${params}` : `${API_BASE}/courses`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  getFilters: async () => {
    const res = await fetch(`${API_BASE}/courses/filters`, { headers: getHeaders() });
    return handleResponse(res);
  },
  create: async (data: any) => {
    const res = await fetch(`${API_BASE}/courses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  update: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/courses/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/courses/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

export const CommissionsAPI = {
  create: async (data: any) => {
    const res = await fetch(`${API_BASE}/commissions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  getAll: async () => {
    const res = await fetch(`${API_BASE}/commissions`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getOne: async (id: string) => {
    const res = await fetch(`${API_BASE}/commissions/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getMyCommissions: async () => {
    const res = await fetch(`${API_BASE}/commissions/my-commissions`, { headers: getHeaders() });
    return handleResponse(res);
  },
  update: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/commissions/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/commissions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

export const ContractsAPI = {
  getTemplate: async () => {
    const res = await fetch(`${API_BASE}/contracts/template`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getMyContract: async () => {
    const res = await fetch(`${API_BASE}/contracts/my-contract`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getAll: async (status?: string, agentId?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (agentId) params.append('agent_id', agentId);
    const url = params.toString() ? `${API_BASE}/contracts?${params}` : `${API_BASE}/contracts`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  create: async (data: any) => {
    const res = await fetch(`${API_BASE}/contracts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  updateContent: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/contracts/${id}/content`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  sign: async (id: string, signatureUrl: string) => {
    const res = await fetch(`${API_BASE}/contracts/${id}/sign`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ signature_url: signatureUrl })
    });
    return handleResponse(res);
  },
  uploadSignature: async (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE}/contracts/${id}/signature-upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      body: form,
    });
    return handleResponse(res);
  },
  approve: async (id: string) => {
    const res = await fetch(`${API_BASE}/contracts/${id}/approve`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  reject: async (id: string, rejection_note?: string) => {
    const res = await fetch(`${API_BASE}/contracts/${id}/reject`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ rejection_note }),
    });
    return handleResponse(res);
  },
  downloadPdf: async (id: string) => {
    const res = await fetch(`${API_BASE}/contracts/${id}/download`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to download contract PDF');
    return res.blob();
  },
  bulkAssign: async (id: string, agent_ids: string[]) => {
    const res = await fetch(`${API_BASE}/contracts/${id}/assign`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ agent_ids }),
    });
    return handleResponse(res);
  },
};

export const SupportAPI = {
  createTicket: async (data: any) => {
    const res = await fetch(`${API_BASE}/support`, { 
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify(data) 
    });
    return handleResponse(res);
  },
  getAllTickets: async (status?: string) => {
    const url = status ? `${API_BASE}/support?status=${status}` : `${API_BASE}/support`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  getTicketById: async (id: string) => {
    const res = await fetch(`${API_BASE}/support/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  addComment: async (ticketId: string, message: string, attachment_urls?: string[]) => {
    const res = await fetch(`${API_BASE}/support/${ticketId}/comments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, attachment_urls: attachment_urls || [] }),
    });
    return handleResponse(res);
  },
  updateStatus: async (ticketId: string, status: string) => {
    const res = await fetch(`${API_BASE}/support/${ticketId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },
};

export const DropdownsAPI = {
  getAllCategories: async () => {
    const res = await fetch(`${API_BASE}/dropdowns/categories`, { headers: getHeaders() });
    return handleResponse(res);
  },
  createCategory: async (data: any) => {
    const res = await fetch(`${API_BASE}/dropdowns/categories`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  createOption: async (data: any) => {
    const res = await fetch(`${API_BASE}/dropdowns/options`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  updateOption: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/dropdowns/options/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  deleteOption: async (id: string) => {
    const res = await fetch(`${API_BASE}/dropdowns/options/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

export const FinancialsAPI = {
  get: async (leadId: string) => {
    const res = await fetch(`${API_BASE}/financials/${leadId}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  updateStatus: async (leadId: string, status: string) => {
    const res = await fetch(`${API_BASE}/financials/${leadId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },
  addNote: async (leadId: string, data: any) => {
    const res = await fetch(`${API_BASE}/financials/${leadId}/notes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  deleteNote: async (noteId: string) => {
    const res = await fetch(`${API_BASE}/financials/notes/${noteId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

export const OptionsAPI = {
  get: async (key: string) => {
    const res = await fetch(`${API_BASE}/options/${key}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  update: async (key: string, name: string, isActive: boolean) => {
    const res = await fetch(`${API_BASE}/options/${key}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ name, isActive }),
    });
    return handleResponse(res);
  },
  delete: async (key: string, name: string) => {
    const encodedName = encodeURIComponent(name);
    const res = await fetch(`${API_BASE}/options/${key}/${encodedName}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

export const BranchesAPI = {
  fetchBranches: async () => {
    const res = await fetch(`${API_BASE}/branches`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getBranchById: async (id: string) => {
    const res = await fetch(`${API_BASE}/branches/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  createBranch: async (data: any) => {
    const res = await fetch(`${API_BASE}/branches`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  updateBranch: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/branches/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  deleteBranch: async (id: string) => {
    const res = await fetch(`${API_BASE}/branches/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

export interface DepartmentOrderItemInput {
  department_id: string;
  order_index: number;
  is_active?: boolean;
  is_default?: boolean;
}

export interface DepartmentStatusInput {
  key: string;
  label: string;
  order_index: number;
  is_terminal?: boolean;
  is_default?: boolean;
  is_active?: boolean;
}

export interface DepartmentInput {
  name: string;
  code: string;
  is_active?: boolean;
  order_index?: number;
  is_default?: boolean;
}

export const DepartmentsAPI = {
  fetchDepartments: async (includeInactive = false) => {
    const params = new URLSearchParams();
    if (includeInactive) {
      params.append('includeInactive', 'true');
    }

    const url = params.toString()
      ? `${API_BASE}/departments?${params.toString()}`
      : `${API_BASE}/departments`;

    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  fetchDepartmentById: async (id: string, includeInactive = false) => {
    const params = new URLSearchParams();
    if (includeInactive) {
      params.append('includeInactive', 'true');
    }

    const url = params.toString()
      ? `${API_BASE}/departments/${id}?${params.toString()}`
      : `${API_BASE}/departments/${id}`;

    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  createDepartment: async (data: DepartmentInput) => {
    const res = await fetch(`${API_BASE}/departments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  updateDepartment: async (id: string, data: Partial<DepartmentInput>) => {
    const res = await fetch(`${API_BASE}/departments/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  updateDepartmentOrder: async (items: DepartmentOrderItemInput[]) => {
    const res = await fetch(`${API_BASE}/departments/order`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ items }),
    });
    return handleResponse(res);
  },
  fetchDepartmentStatuses: async (departmentId: string, includeInactive = false) => {
    const params = new URLSearchParams();
    if (includeInactive) {
      params.append('includeInactive', 'true');
    }

    const url = params.toString()
      ? `${API_BASE}/departments/${departmentId}/statuses?${params.toString()}`
      : `${API_BASE}/departments/${departmentId}/statuses`;

    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  upsertDepartmentStatuses: async (
    departmentId: string,
    statuses: DepartmentStatusInput[],
  ) => {
    const res = await fetch(`${API_BASE}/departments/${departmentId}/statuses`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ statuses }),
    });
    return handleResponse(res);
  },
};

export const PermissionsAPI = {
  getAll: async () => {
    const res = await fetch(`${API_BASE}/permissions`, { headers: getHeaders() });
    return handleResponse(res);
  },
  create: async (data: any) => {
    const res = await fetch(`${API_BASE}/permissions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/permissions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

export const PermissionGroupsAPI = {
  getAll: async () => {
    const res = await fetch(`${API_BASE}/permission-groups`, { headers: getHeaders() });
    return handleResponse(res);
  },
  create: async (data: any) => {
    const res = await fetch(`${API_BASE}/permission-groups`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/permission-groups/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

export const RolesAPI = {
  getAll: async () => {
    const res = await fetch(`${API_BASE}/roles`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getById: async (id: string) => {
    const res = await fetch(`${API_BASE}/roles/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  create: async (data: any) => {
    const res = await fetch(`${API_BASE}/roles`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  update: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/roles/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/roles/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

export const AnnouncementsAPI = {
  getAll: async (filters?: { target_audience?: string; branch_id?: string; includeInactive?: boolean }) => {
    const params = new URLSearchParams();
    if (filters?.target_audience) params.append('target_audience', filters.target_audience);
    if (filters?.branch_id) params.append('branch_id', filters.branch_id);
    if (filters?.includeInactive !== undefined) params.append('includeInactive', String(filters.includeInactive));
    const url = params.toString() ? `${API_BASE}/announcements?${params}` : `${API_BASE}/announcements`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  getById: async (id: string) => {
    const res = await fetch(`${API_BASE}/announcements/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  create: async (data: any) => {
    const res = await fetch(`${API_BASE}/announcements`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  update: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/announcements/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/announcements/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  markAsRead: async (id: string) => {
    const res = await fetch(`${API_BASE}/announcements/${id}/mark-read`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  getUnreadCount: async () => {
    const res = await fetch(`${API_BASE}/announcements/unread-count`, { headers: getHeaders() });
    return handleResponse(res);
  },
  markAllAsRead: async () => {
    const res = await fetch(`${API_BASE}/announcements/mark-all-read`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

export const TodosAPI = {
  getAll: async (params?: { date?: string; completed?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.completed !== undefined) queryParams.append('completed', String(params.completed));
    const url = queryParams.toString() ? `${API_BASE}/todos?${queryParams}` : `${API_BASE}/todos`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },
  getById: async (id: string) => {
    const res = await fetch(`${API_BASE}/todos/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  create: async (data: any) => {
    const res = await fetch(`${API_BASE}/todos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  update: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/todos/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/todos/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  markComplete: async (id: string) => {
    const res = await fetch(`${API_BASE}/todos/${id}/complete`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  markIncomplete: async (id: string) => {
    const res = await fetch(`${API_BASE}/todos/${id}/incomplete`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

export const IntegrationsAPI = {
  getAll: async () => {
    const res = await fetch(`${API_BASE}/integrations`, { headers: getHeaders() });
    return handleResponse(res);
  },
  upsert: async (data: any) => {
    const res = await fetch(`${API_BASE}/integrations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  update: async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/integrations/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/integrations/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

export default {
  ReportsAPI,
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
  AgentsAPI,
  CommissionsAPI,
  SupportAPI,
  ContractsAPI,
  DropdownsAPI,
  FinancialsAPI,
  OptionsAPI,
  BranchesAPI,
  DepartmentsAPI,
  PermissionsAPI,
  PermissionGroupsAPI,
  RolesAPI,
  AnnouncementsAPI,
  TodosAPI,
  IntegrationsAPI,
};

