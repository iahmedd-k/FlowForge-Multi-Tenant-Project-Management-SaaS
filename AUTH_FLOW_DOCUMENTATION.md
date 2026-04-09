# Complete Authentication & Workspace Setup Flow

## Issue Summary

**Problem:** Workspace was being automatically created during signup (both email and Google), preventing users from seeing the workspace setup page.

**Root Causes Found:**
1. **passport.js** - Google OAuth Passport strategy was auto-creating workspaces
2. **ProjectSetup.jsx** - Form was calling `updateWorkspace` (PUT) instead of `createWorkspace` (POST), which would fail for new users

---

## Corrected Flow

### 1. EMAIL SIGNUP FLOW
```
User submits signup form
    ↓
POST /api/auth/register
    ↓
auth.controller.js register()
  • Creates User with workspaceId: null
  • Returns: { user, workspace: null, workspaces: [] }
    ↓
Frontend receives response
  • workspace is null, so shouldSkipSetup = false
  • Navigate to /workspace/setup ✓
    ↓
User sees ProjectSetup form
  • User enters workspace name
  • Clicks "Next" button
    ↓
POST /api/workspace/create
  • Creates new workspace
  • Adds user as owner to WorkspaceMember
  • Updates user.workspaceId
  • Returns new workspace ✓
    ↓
User redirected to /workspace/team-invite
```

### 2. GOOGLE OAUTH SIGNUP FLOW
```
User clicks "Sign in with Google"
    ↓
Frontend redirects to:
https://accounts.google.com/o/oauth2/v2/auth
    ↓
User grants permission
    ↓
Google redirects to:
https://flowforge-tau-eight.vercel.app/auth/google-callback?code=...
    ↓
GoogleCallback.tsx receives code
    ↓
POST /api/auth/google/token
    ↓
google.controller.js exchangeToken()
  • Exchanges code with Google for ID token
  • Decodes ID token to get email, name, avatar
  • Finds or creates User
  • Creates User with workspaceId: null ✓
  • Returns: { user, workspace: null, workspaces: [] }
    ↓
Frontend receives response
  • workspace is null, so shouldSkipSetup = false
  • Navigate to /workspace/setup ✓
    ↓
[Same as Email Signup from here onward]
```

### 3. WORKSPACE SETUP FLOW
```
User on ProjectSetup form (/workspace/setup)
    ↓
User enters workspace name & clicks "Next"
    ↓
POST /api/workspace/create (✓ FIXED)
  • Requires verifyToken middleware (user must be logged in)
  • Does NOT require tenantScope (user can have null workspaceId)
  • Creates Workspace with name
  • Creates WorkspaceMember entry (user as owner)
  • Updates user.workspaceId = workspace._id
  • Returns: { user, workspace, workspaces, accessToken, refreshToken }
    ↓
Frontend receives response
  • Updates Redux with new workspace info
  • Updates user.workspaceId
  • Navigate to /workspace/team-invite ✓
```

---

## Key Code Changes

### ✓ FIXED: server/config/passport.js
**Before:** Auto-created workspace on new Google user signup
**After:** Creates user with `workspaceId: null` only
```javascript
if (!user) {
  // Create new user WITHOUT workspace
  // Workspace will be created when user submits workspace setup form
  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'User';
  user = new User({
    name: fullName,
    email,
    avatar,
    googleId,
    isVerified: true,
    workspaceId: null,      // ← NO WORKSPACE
    role: 'owner',
  });
}
```

### ✓ FIXED: client/src/pages/Dashboard/ProjectSetup.jsx
**Before:** Called `updateWorkspace` (PUT) which required existing workspace
**After:** Calls `createWorkspace` (POST) to create new workspace
```javascript
// BEFORE (WRONG):
import { updateWorkspace } from '../../api/workspace.api';
mutationFn: updateWorkspace,

// AFTER (CORRECT):
import { createWorkspace } from '../../api/workspace.api';
mutationFn: createWorkspace,
```

### ✓ VERIFIED: server/controllers/google.controller.js
- `exchangeToken()` function correctly creates user with `workspaceId: null`
- No workspace auto-creation ✓

### ✓ VERIFIED: server/controllers/auth.controller.js
- `register()` function correctly creates user with `workspaceId: null`
- No workspace auto-creation ✓

---

## Route Security Matrix

| Route | Requires verifyToken | Requires tenantScope* | Description |
|-------|:------------------:|:-------------------:|------------|
| POST /api/auth/register | ✗ | ✗ | Email signup |
| POST /api/auth/google/token | ✗ | ✗ | Google OAuth code exchange |
| GET /api/auth/google | ✗ | ✗ | Initiate OAuth flow |
| GET /api/auth/google/callback | ✗ | ✗ | OAuth callback (uses Passport) |
| POST /api/workspace/create | ✓ | ✗ | Create workspace (allows null workspaceId) |
| PUT /api/workspace | ✓ | ✓ | Update workspace (requires active workspace) |
| POST /api/workspace/switch | ✓ | ✗ | Switch workspace |
| POST /api/workspace/invite | ✓ | ✓ | Invite users to workspace |

*tenantScope requires `req.user.workspaceId` to be set

---

## Tested Scenarios

✓ Email signup → Setup page shown → Workspace creation works → Team invite page shown
✓ Google signup → Setup page shown → Workspace creation works → Team invite page shown
✓ Database cleanup (`node cleanup.js`) removes all user data
✓ Fresh signup after cleanup shows no workspace auto-creation

---

## Commits

- `67c5f8a` - Fix User model (make passwordHash optional) + Google controller field names
- `df5fa48` - Fix GoogleCallback redirect logic + Google controller response fields
- `8c709f8` - Remove workspace auto-creation from Passport + ProjectSetup uses createWorkspace

---

## Important Notes

1. **Passport Strategy Not Used by Frontend** - Frontend uses SPA flow (POST /token), not Passport callback. But we fixed Passport anyway for consistency.

2. **tenantScope Middleware** - Users with null workspaceId will fail tenantScope. This is intentional - they must use /workspace/create first.

3. **ProjectSetup Endpoint** - Must call POST /workspace/create, not PUT /workspace. Frontend was calling the wrong endpoint.

4. **Cleanup Script** - Use `cd server && node cleanup.js` to reset database for testing.
