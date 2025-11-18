# Authentication Migration - JWT Token-Based Auth

## Overview
Successfully migrated from cookie-only authentication to JWT token-based authentication as per the backend API specification.

## Changes Made

### 1. Auth Store (`src/stores/useAuthStore.ts`)

#### Added Token Management
- **New State**: `token: string | null` - stores JWT access token
- **New Method**: `getToken()` - retrieves current token
- **Cookie Management**:
  - `auth-token` cookie - stores JWT access token
  - `partner-session` cookie - stores user profile (id, name, email, role)

#### Updated Login Flow
```typescript
// Before: Only stored user info
login(email, password) → partner object

// After: Stores both token and user info
login(email, password) → { access_token, partner: { id, name, role, email } }
```

#### Updated AuthUser Interface
```typescript
interface AuthUser {
  id: string;
  email: string;
  name: string;        // ✅ Added
  type: "partner";
  role: "agent" | "counsellor" | "admin";
}
```

### 2. API Helper (`src/lib/api.ts`)

#### Added Authorization Header Helper
```typescript
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
```

#### Updated All API Methods
- **Protected Endpoints**: Now send `Authorization: Bearer <token>` header
- **Public Endpoints**: Login endpoint excluded from auth (as per API_DOC)
- **Lead Creation**: Can be called with or without auth

#### Enhanced Error Handling
- Added `statusCode` to error objects
- Preserved `field` property for duplicate validation errors
- Better error propagation for UI handling

### 3. Middleware (`src/middleware.ts`)

#### Removed Supabase Dependency
- **Before**: Used `@supabase/ssr` for session management
- **After**: Pure cookie-based token validation

#### Updated Authentication Check
```typescript
// Now checks for both auth-token and partner-session cookies
const authToken = request.cookies.get("auth-token");
const partnerSession = request.cookies.get("partner-session");
const isAuthenticated = !!partnerUser && !!authToken;
```

#### Cookie Cleanup
- Clears both cookies on invalid session
- Prevents unauthorized access if either cookie is missing

## Backend Integration

### Login Response Format (from API_DOC.md)
```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...",
  "partner": {
    "id": "uuid",
    "name": "Admin User",
    "role": "admin",
    "email": "admin@example.com"
  }
}
```

### Protected Endpoint Requirements
- **Header**: `Authorization: Bearer <access_token>`
- **Token Type**: JWT
- **Error**: Returns 401 Unauthorized if token missing/invalid

## API Endpoint Authorization Status

### Public Endpoints (No Auth Required)
- `POST /auth/login`
- `POST /leads` (can include auth if available)

### Protected Endpoints (JWT Required)
- All `GET /leads/*` endpoints
- All `PATCH /leads/*` endpoints
- All `DELETE /leads/*` endpoints
- All Partner endpoints
- All Followup endpoints
- All Note endpoints
- All Timeline endpoints
- All Dashboard endpoints
- All Application endpoints

## Cookie Strategy

### Cookie: `auth-token`
- **Value**: JWT access token string
- **Max-Age**: 7 days (604,800 seconds)
- **Attributes**: `secure; samesite=strict; path=/`
- **Purpose**: Send as Bearer token in API requests

### Cookie: `partner-session`
- **Value**: JSON-encoded user object
- **Max-Age**: 7 days
- **Attributes**: `secure; samesite=strict; path=/`
- **Purpose**: Client-side user info (avoid API calls for user data)

## Security Improvements

1. **Token-Based Auth**: Backend validates JWT on each request
2. **Secure Cookies**: Both cookies use `secure` and `samesite=strict`
3. **Dual Validation**: Middleware checks both token and session exist
4. **Auto Cleanup**: Invalid sessions clear both cookies immediately
5. **Bearer Token**: Industry-standard Authorization header format

## Testing Checklist

- [ ] Login flow stores both `auth-token` and `partner-session` cookies
- [ ] All API requests include `Authorization: Bearer <token>` header
- [ ] Protected endpoints return data (not 401 errors)
- [ ] Logout clears both cookies
- [ ] Invalid/expired tokens redirect to login
- [ ] Role-based access control works (admin/counsellor/agent)
- [ ] Duplicate email/mobile validation still works
- [ ] Dashboard loads data correctly
- [ ] Lead creation/update works
- [ ] Follow-up and note creation works

## Migration Steps for Existing Users

### For New Users
- Login will automatically create new cookie structure
- Both `auth-token` and `partner-session` will be set

### For Existing Users (with old cookies)
1. Old `partner-session` cookie will be detected by middleware
2. Missing `auth-token` will fail authentication check
3. User will be redirected to `/login`
4. Re-login will create new cookie structure

### Manual Cleanup (Optional)
Users can clear browser cookies for the domain to force re-authentication.

## Environment Variables

Ensure the following is set:
```env
NEXT_PUBLIC_API_BASE=http://localhost:3001/api
```

For production:
```env
NEXT_PUBLIC_API_BASE=https://api.yourdomain.com/api
```

## Backend Requirements

The backend must:
1. Accept `Authorization: Bearer <token>` header
2. Validate JWT token on protected routes
3. Return 401 Unauthorized if token invalid/missing
4. Return login response in format: `{ access_token, partner }`

## Troubleshooting

### "Unauthorized" Errors
- Check if `auth-token` cookie exists in browser
- Verify token is being sent in `Authorization` header
- Check backend logs for JWT validation errors
- Ensure `NEXT_PUBLIC_API_BASE` points to correct backend

### Login Not Working
- Check backend `/auth/login` endpoint
- Verify response includes `access_token` and `partner` fields
- Check browser console for errors
- Verify credentials are correct

### Auto-Logout Issues
- Token might be expired (backend sets expiry)
- Check if both cookies exist
- Verify cookie `secure` flag matches protocol (https vs http)

## Migration Date
Completed: November 18, 2025
