# B2B Panel - Quick Start Guide

## Setup

1. **Install dependencies:**
   ```bash
   cd b2b
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local and set NEXT_PUBLIC_API_BASE to your backend URL
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access the app:**
   - Login: http://localhost:3000/login
   - Home: http://localhost:3000/

## Authentication

### Login
Users authenticate through `/login` using their email and password. The system supports both internal staff (admin, counsellor) and external agents.

### Token Management
- Tokens are stored in cookies (`auth-token`, `auth-user`)
- Automatic expiration after 7 days
- Auto-logout on 401 responses

## Using the API

### Import API functions:
```typescript
import { 
  LeadsAPI, 
  AgentsAPI, 
  ApplicationsAPI,
  DashboardAPI,
  AnnouncementsAPI 
} from '@/lib/api';
```

### Example: Fetch leads
```typescript
import { useEffect, useState } from 'react';
import { LeadsAPI } from '@/lib/api';

const MyComponent = () => {
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const data = await LeadsAPI.getAll();
        setLeads(data);
      } catch (error) {
        console.error('Failed to fetch leads:', error);
      }
    };
    fetchLeads();
  }, []);

  return <div>{/* Render leads */}</div>;
};
```

### Example: Using the useApi hook
```typescript
import { useApi } from '@/hooks/useApi';
import { LeadsAPI } from '@/lib/api';

const MyComponent = () => {
  const { execute, loading, error } = useApi(LeadsAPI.getAll, {
    onSuccess: (data) => console.log('Leads loaded:', data),
    onError: (err) => console.error('Error:', err),
  });

  useEffect(() => {
    execute();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{/* Render content */}</div>;
};
```

## Protected Routes

All pages except `/login` are protected. Users must be authenticated to access them.

### Create a new protected page:
```typescript
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const MyPage = () => {
  return (
    <ProtectedRoute>
      <div>Your protected content</div>
    </ProtectedRoute>
  );
};

export default MyPage;
```

## Access User Data

```typescript
import { useAuth } from '@/contexts/AuthContext';

const MyComponent = () => {
  const { partner, isAuthenticated, logout } = useAuth();

  return (
    <div>
      <p>Name: {partner?.name}</p>
      <p>Email: {partner?.email}</p>
      <p>Role: {partner?.role}</p>
      <p>Branch: {partner?.branch_name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

## Available API Endpoints

### Auth
- `AuthAPI.login(email, password)` - Login

### Leads
- `LeadsAPI.createLead(data)` - Create lead (public)
- `LeadsAPI.getAll()` - Get all leads
- `LeadsAPI.getById(id)` - Get single lead
- `LeadsAPI.update(id, data)` - Update lead
- `LeadsAPI.delete(id)` - Delete lead (admin only)

### Agents
- `AgentsAPI.onboard(data)` - Agent registration (public)
- `AgentsAPI.getAll(status?)` - List agents
- `AgentsAPI.getById(id)` - Get agent details
- `AgentsAPI.updateStatus(id, status, reason?)` - Approve/reject
- `AgentsAPI.delete(id)` - Delete agent

### Applications
- `ApplicationsAPI.getByLeadId(leadId)` - Get application
- `ApplicationsAPI.updatePersonal(leadId, data)` - Update personal
- `ApplicationsAPI.updateEducation(leadId, data)` - Update education
- `ApplicationsAPI.updatePreferences(leadId, data)` - Update preferences
- `ApplicationsAPI.updateTests(leadId, data)` - Update tests
- `ApplicationsAPI.updateWorkExperience(leadId, data)` - Update work
- `ApplicationsAPI.updateVisa(leadId, data)` - Update visa
- `ApplicationsAPI.uploadDocuments(leadId, formData)` - Upload files

### Dashboard
- `DashboardAPI.getStats()` - Get statistics

### Announcements
- `AnnouncementsAPI.getAll(targetAudience?, branchId?)` - Get all
- `AnnouncementsAPI.markAsRead(id)` - Mark as read
- `AnnouncementsAPI.getUnreadCount()` - Get unread count

### Universities & Courses
- `UniversitiesAPI.getAll(countryId?)` - Get universities
- `CoursesAPI.getAll(filters?)` - Search courses
- `CoursesAPI.getFilters()` - Get filter options

## File Structure

```
b2b/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx    # Route protection wrapper
│   │   ├── layouts/
│   │   │   └── CommonLayout.tsx      # Main layout with header/footer
│   │   └── shared/
│   │       ├── Header.tsx            # Header with auth dropdown
│   │       └── Footer.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx           # Auth state management
│   ├── hooks/
│   │   └── useApi.ts                 # API call hook with error handling
│   ├── lib/
│   │   └── api.ts                    # API client functions
│   └── pages/
│       ├── _app.tsx                  # App wrapper with providers
│       ├── login.tsx                 # Login page
│       ├── index.tsx                 # Home page
│       ├── agents.tsx                # Agents page
│       ├── my-applications.tsx       # Applications page
│       ├── commission-hub.tsx
│       ├── contract-hub.tsx
│       ├── analytics.tsx
│       └── support.tsx
├── .env.local.example                # Environment template
└── AUTH_IMPLEMENTATION.md            # Detailed auth docs
```

## Common Tasks

### Add a new API endpoint
1. Open `/src/lib/api.ts`
2. Add your API function to the appropriate section or create a new one
3. Use the existing patterns for error handling

### Add a new protected page
1. Create file in `/src/pages/`
2. Wrap content in `<ProtectedRoute>`
3. Import necessary hooks (`useAuth`, `useApi`)

### Add role-based UI
```typescript
const { partner } = useAuth();

{partner?.role === 'admin' && (
  <button>Admin Only Feature</button>
)}
```

## Troubleshooting

### "Unauthorized" errors
- Check if backend is running
- Verify `NEXT_PUBLIC_API_BASE` in `.env.local`
- Clear cookies and login again

### TypeScript errors
- Run `npm run build` to see all errors
- Check import paths are correct

### Auth not persisting
- Check browser cookies are enabled
- Verify cookie expiration settings
- Check for console errors

## Testing Checklist

- [ ] Login works with valid credentials
- [ ] Invalid credentials show error
- [ ] User info displays in header
- [ ] Protected pages redirect to login when logged out
- [ ] Logout clears session and redirects
- [ ] API calls include auth token
- [ ] 401 errors trigger automatic logout
- [ ] Refresh page maintains login state

## Next Steps

1. Implement role-based access control
2. Add server-side authentication (middleware)
3. Create password reset flow
4. Add refresh token mechanism
5. Implement remember me feature
