# Store Migration Summary

## Overview
All frontend stores have been successfully migrated from direct Supabase client calls to use the centralized backend API (`@/lib/api`).

## Migrated Stores

### ✅ useLeadStore
- **Changes**: All CRUD operations now use `api.LeadsAPI`
- **Timeline**: Frontend no longer inserts timeline events (handled by backend)
- **Methods**: fetchLeads, fetchApplications, fetchLeadById, getAgentLeads, getCounsellorLeads, addLead

### ✅ usePartnerStore
- **Changes**: All CRUD operations now use `api.PartnersAPI`
- **Methods**: fetchPartners, fetchPartnerById, addPartner, updatePartner, deletePartner, loadCurrentPartner
- **Note**: Duplicate checks for email/mobile remain active

### ✅ useAuthStore
- **Changes**: Login/logout now use `api.AuthAPI`
- **Methods**: initAuth (simplified, uses cookie fallback), login, logout
- **Note**: Cookie-based session management preserved

### ✅ useFollowupStore
- **Changes**: All operations now use `api.FollowupsAPI`
- **Timeline**: Frontend no longer inserts timeline events (handled by backend)
- **Methods**: fetchFollowupsByLeadId, addFollowup, updateFollowup, deleteFollowup, addComment, deleteAllCommentsForFollowup, markComplete, extendDueDate, fetchCommentsByFollowupId

### ✅ useNoteStore
- **Changes**: All operations now use `api.NotesAPI`
- **Timeline**: Frontend no longer inserts timeline events (handled by backend)
- **Methods**: fetchNotesByLeadId, addNote, updateNote, deleteNote

### ✅ useTimelineStore
- **Changes**: All operations now use `api.TimelineAPI`
- **Methods**: fetchTimelineByLeadId, addTimelineEvent, fetchAllTimelines

### ✅ useDashboardStore
- **Changes**: Dashboard data fetching now uses `api.DashboardAPI`
- **Methods**: fetchDashboardLeads (uses backend API for leads)
- **Note**: All metrics calculations remain on frontend

### ✅ useApplicationStore
- **Changes**: Main application CRUD now uses `api.ApplicationsAPI`
- **Methods**: loadApplication, saveSection (main app create/update), submitApplication
- **Note**: Supabase storage API still used for document uploads (storage operations)

## API Structure

The central API file (`frontend/src/lib/api.ts`) now includes:

```typescript
- LeadsAPI: CRUD operations for leads
- PartnersAPI: CRUD operations for partners (agents/counsellors)
- AuthAPI: Login/logout
- FollowupsAPI: CRUD + comment operations for followups
- NotesAPI: CRUD operations for notes
- TimelineAPI: Fetch timeline events, create events
- DashboardAPI: Fetch dashboard data
- ApplicationsAPI: CRUD operations for applications
```

## Key Benefits

1. **Centralized Error Handling**: All API calls go through `handleResponse()` helper
2. **Consistent Authentication**: Auth tokens/cookies managed centrally
3. **Backend Timeline Logging**: Timeline events now logged by backend services, ensuring consistency
4. **Cleaner Store Code**: Stores focus on state management, not API implementation details
5. **Easier Testing**: Mock API responses instead of Supabase client
6. **Type Safety**: API responses can be typed at the API layer

## Important Notes

### Timeline Logging
- **Before**: Each store manually inserted timeline events using Supabase client
- **After**: Backend services handle timeline logging automatically when mutations occur
- **Benefit**: Guaranteed consistency, single source of truth

### Document Uploads (Applications)
- Supabase Storage API still used directly in `useApplicationStore` for file uploads
- Reason: Storage operations are distinct from data CRUD and don't have backend endpoints yet
- Consider: Creating backend endpoints for file upload proxying in future

### Authentication Flow
- `useAuthStore.initAuth()` simplified to check cookie first
- Backend session validation can be added later if needed
- Cookie-based approach preserved for SSR compatibility

## Testing Checklist

Before deploying, test these critical flows:

- [ ] Lead creation with duplicate email/mobile validation
- [ ] Partner onboarding with duplicate checks
- [ ] Login/logout flow
- [ ] Followup creation and commenting
- [ ] Note creation
- [ ] Timeline event display
- [ ] Dashboard data loading
- [ ] Application form submission
- [ ] Document uploads (Supabase storage)

## Environment Variables

Ensure `NEXT_PUBLIC_API_BASE` is set correctly:
```env
NEXT_PUBLIC_API_BASE=http://localhost:3001/api
```

For production, update to production backend URL.

## Migration Date
Completed: November 18, 2025
