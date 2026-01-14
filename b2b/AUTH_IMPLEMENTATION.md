# B2B Panel Authentication

This document describes the authentication implementation for the B2B panel.

## Overview

The B2B panel uses JWT-based authentication with the backend API. Authentication is handled using React Context API and cookies for token storage.

## Features

- ✅ JWT Token Authentication
- ✅ Persistent login (7-day cookie expiration)
- ✅ Protected routes
- ✅ User profile display in header
- ✅ Logout functionality
- ✅ Automatic redirection (authenticated users → dashboard, unauthenticated → login)
- ✅ Branch context support

## Architecture

### 1. Auth Context (`/src/contexts/AuthContext.tsx`)

Manages global authentication state including:
- `partner`: Current user information
- `isAuthenticated`: Boolean authentication status
- `isLoading`: Loading state during initialization
- `login(email, password)`: Authenticates user with backend
- `logout()`: Clears session and redirects to login

### 2. Protected Routes (`/src/components/auth/ProtectedRoute.tsx`)

Wrapper component that:
- Checks authentication status
- Shows loading spinner during auth check
- Redirects to `/login` if unauthenticated
- Renders children if authenticated

### 3. Login Page (`/src/pages/login.tsx`)

Features:
- Email/Password form with validation
- Password visibility toggle
- Error message display
- Loading states
- Link to agent registration
- Responsive design

### 4. API Integration (`/src/lib/api.ts`)

Enhanced with:
- `AuthAPI.login()`: Handles login requests
- `LeadsAPI`: Lead management endpoints
- `AgentsAPI`: Agent onboarding and management
- `ApplicationsAPI`: Application form endpoints
- `DashboardAPI`: Dashboard statistics
- `AnnouncementsAPI`: Announcements

All protected endpoints automatically include JWT token from cookies.

## Usage

### Protecting a Page

Wrap your page component with `ProtectedRoute`:

```tsx
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const MyPage = () => {
  return (
    <ProtectedRoute>
      <div>Your protected content</div>
    </ProtectedRoute>
  );
}
```

### Accessing User Data

Use the `useAuth` hook:

```tsx
import { useAuth } from '@/contexts/AuthContext';

const MyComponent = () => {
  const { partner, isAuthenticated, logout } = useAuth();

  return (
    <div>
      <p>Welcome, {partner?.name}</p>
      <p>Role: {partner?.role}</p>
      <p>Branch: {partner?.branch_name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Making API Calls

Use the API utility functions:

```tsx
import { LeadsAPI, ApplicationsAPI } from '@/lib/api';

// Get all leads
const leads = await LeadsAPI.getAll();

// Get application by lead ID
const application = await ApplicationsAPI.getByLeadId(leadId);

// Update personal details
await ApplicationsAPI.updatePersonal(leadId, personalData);
```

## Token Storage

Tokens are stored in browser cookies with:
- **Name**: `auth-token` (JWT), `auth-user` (user data)
- **Expiration**: 7 days
- **Path**: `/` (available to all routes)
- **SameSite**: `Strict` (CSRF protection)

## Environment Variables

Create a `.env.local` file (copy from `.env.local.example`):

```env
NEXT_PUBLIC_API_BASE=http://localhost:5005
```

Update this URL to point to your backend API.

## API Endpoints Used

### Authentication
- `POST /auth/login` - Partner/Agent login

### Leads
- `GET /leads` - Get all leads (JWT required)
- `GET /leads/:id` - Get single lead (JWT required)
- `POST /leads` - Create lead (Public)
- `PATCH /leads/:id` - Update lead (JWT required)
- `DELETE /leads/:id` - Delete lead (Admin only)

### Agents
- `POST /agents/onboard` - Self-registration (Public)
- `GET /agents` - List agents (Admin only)
- `GET /agents/:id` - Get agent details (Admin only)
- `PATCH /agents/:id/status` - Approve/Reject agent (Admin only)

### Applications
- `GET /applications/:leadId` - Get application
- `PATCH /applications/:leadId/personal` - Update personal details
- `PATCH /applications/:leadId/education` - Update education
- `PATCH /applications/:leadId/preferences` - Update preferences
- `PATCH /applications/:leadId/tests` - Update test scores
- `PATCH /applications/:leadId/work-experience` - Update work experience
- `PATCH /applications/:leadId/visa` - Update visa details
- `PATCH /applications/:leadId/documents` - Upload documents (multipart/form-data)

### Dashboard
- `GET /dashboard/stats` - Get statistics

### Announcements
- `GET /announcements` - Get announcements
- `POST /announcements/:id/mark-read` - Mark as read
- `GET /announcements/unread-count` - Get unread count

## User Roles

The system supports different user roles from the backend:
- **admin**: Full system access
- **counsellor**: Lead and application management
- **agent**: External partners with limited access

Role-based UI rendering can be implemented using:

```tsx
const { partner } = useAuth();

if (partner?.role === 'admin') {
  // Show admin-only features
}
```

## Testing

### Test Credentials

Use backend credentials created during seeding:
- Admin: Check your backend seed data
- Agent: Register through `/agents` page

### Test Flow

1. Navigate to `http://localhost:3000/login`
2. Enter credentials
3. Verify redirect to home page
4. Check user info in header dropdown
5. Navigate to protected pages
6. Click logout to clear session

## Security Considerations

- ✅ Tokens stored in httpOnly-compatible cookies
- ✅ SameSite=Strict to prevent CSRF
- ✅ 7-day token expiration
- ✅ Automatic token inclusion in API requests
- ✅ Protected route validation on client side
- ⚠️ Consider server-side authentication for sensitive pages (SSR)

## Future Enhancements

- [ ] Refresh token mechanism
- [ ] Remember me functionality
- [ ] Password reset flow
- [ ] Two-factor authentication
- [ ] Session timeout warnings
- [ ] Server-side route protection (middleware)
- [ ] Role-based route access control
