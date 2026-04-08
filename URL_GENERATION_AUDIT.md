# FlowForge URL Generation & Configuration Audit

## Executive Summary
Found **1 critical issue** with hardcoded localhost URLs in the built dist files, and confirmed proper usage of environment variables throughout the source code.

---

## Critical Issues Found

### 1. 🔴 CRITICAL: Hardcoded Localhost URL in Calendar Feed (Built/Production)
**Severity:** CRITICAL  
**Impact:** Production calendar feed URLs will not work - they point to localhost  
**Status:** This is in the dist file (compiled/built artifact)

**Location:** `client/dist/assets/index-Di5Ds1ao.js` line 750  
**Hardcoded URL:**
```javascript
l8=e=>`http://localhost:5000/api/api/integrations/calendar/feed/${e}`
```

**Issues:**
- Uses hardcoded `http://localhost:5000`
- Has **double `/api/api/`** path (malformed)
- This is in the compiled production build - will break all calendar feed URLs

**Source Code (Correct):**  
[calendar.api.js (line 20)](client/src/api/calendar.api.js#L20):
```javascript
export const getCalendarFeedUrl = (token) => {
  const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
  return `${baseUrl}/api/integrations/calendar/feed/${token}`;
};
```

**Root Cause:** The dist file was built with an old/incorrect version. Need to rebuild with proper production env vars.

**Fix Required:** Rebuild client with correct `VITE_API_URL` set:
```bash
VITE_API_URL=https://flowforge-multi-tenant-project.onrender.com/api npm run build
```

---

## URL Usage - By Feature

### 1. ✅ Calendar URL Generation
**Status:** Source code correct, but dist is outdated with hardcoded URLs

**Files:**
- [client/src/api/calendar.api.js (line 20)](client/src/api/calendar.api.js#L20)
- [client/src/utils/calendar.utils.js (lines 28-50)](client/src/utils/calendar.utils.js#L28)
- [client/src/components/Dashboard Components/Settings/CalendarFeed.jsx (lines 7-150)](client/src/components/Dashboard Components/Settings/CalendarFeed.jsx#L7)

**Implementation:**
```javascript
export const getCalendarFeedUrl = (token) => {
  const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
  return `${baseUrl}/api/integrations/calendar/feed/${token}`;
};
```

**Configuration:**
- Dev: Uses `.env` → `VITE_API_URL=http://localhost:5000/api`
- Prod: Uses `.env.production` → `VITE_API_URL=https://flowforge-multi-tenant-project.onrender.com/api`

**Assessment:** ✅ Correct implementation, but **dist file needs rebuild**

---

### 2. ✅ Slack Integration URL Setup
**Status:** Correct - no hardcoded URLs, uses user-provided webhook

**Files:**
- [server/services/slack.service.js (lines 1-120)](server/services/slack.service.js#L1)
- [server/routes/slack.routes.js (line 11-12)](server/routes/slack.routes.js#L11)

**Implementation:**
```javascript
// User-provided webhook - validated for Slack format
const workspace = await Workspace.findById(workspaceId).select('slackWebhookUrl').lean();
if (!workspace?.slackWebhookUrl) return; // No webhook configured

await axios.post(workspace.slackWebhookUrl, slackMessage, {
  headers: { 'Content-Type': 'application/json' },
  timeout: 5000,
});

// Validation
function isValidSlackWebhookUrl(url) {
  if (!url) return false;
  return url.startsWith('https://hooks.slack.com/');
}
```

**Assessment:** ✅ Correct - uses user-provided webhook URLs, properly validated

---

### 3. ✅ Invite Email URL Generation
**Status:** Correct - uses CLIENT_URL environment variable

**Files:**
- [server/services/email.service.js (lines 1-130)](server/services/email.service.js#L1)
- [server/controllers/workspace.controller.js (line 226-237)](server/controllers/workspace.controller.js#L226)
- [server/controllers/auth.controller.js (line 281-303)](server/controllers/auth.controller.js#L281)

**Implementation:**
```javascript
function buildClientUrl(pathname = '') {
  const rawBase = process.env.CLIENT_URL || 'http://localhost:5173';
  let baseUrl;
  
  try {
    const parsed = new URL(rawBase);
    baseUrl = `${parsed.protocol}//${parsed.host}`;
  } catch {
    baseUrl = rawBase.replace(/\/+$/, '');
  }
  
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${baseUrl}${normalizedPath}`;
}

// For invite emails
const link = buildClientLink('/invite/setup', token);
// Result: https://flowforge-tau-eight.vercel.app/invite/setup?token=...
```

**Configuration:**
- Dev: Falls back to `http://localhost:5173` (client dev port)
- Prod: Uses `process.env.CLIENT_URL=https://flowforge-tau-eight.vercel.app`

**Assessment:** ✅ Correct - properly uses CLIENT_URL with fallback

---

### 4. ✅ Billing/Stripe URL Generation
**Status:** Correct - uses CLIENT_URL environment variable

**Files:**
- [server/services/stripe.service.js (lines 30-42)](server/services/stripe.service.js#L30)
- [server/controllers/billing.controller.js (line 150)](server/controllers/billing.controller.js#L150)

**Implementation:**
```javascript
// Stripe session creation
success_url: `${process.env.CLIENT_URL}/billing?success=true&tier=${encodeURIComponent(tierId)}`,
cancel_url: `${process.env.CLIENT_URL}/billing?cancelled=true`,
return_url: `${process.env.CLIENT_URL}/billing`,
```

**Configuration:**
- Uses `process.env.CLIENT_URL` which must be set to production frontend URL

**Assessment:** ✅ Correct - uses CLIENT_URL, no hardcoded values

---

## Environment Variables Configuration

### Server (.env)
**Current state:** ✅ Correct
```bash
CLIENT_URL=https://flowforge-tau-eight.vercel.app
# Used by:
# - email.service.js (invite links)
# - stripe.service.js (billing return URLs)
# - workspace.controller.js (workspace setup URL)
```

### Client Development (.env)
**Current state:** ✅ Correct
```bash
VITE_API_URL=http://localhost:5000/api
# Used by axios instance and calendar feed URL generation
```

### Client Production (.env.production)
**Current state:** ✅ Correct
```bash
VITE_API_URL=https://flowforge-multi-tenant-project.onrender.com/api
# Should be used when building for production
```

---

## Where CLIENT_URL Should Be Used

### ✅ Currently Used
1. **Email Service** - Invite links
   - [email.service.js (line 11)](server/services/email.service.js#L11): `buildClientUrl()`
   - Fallback: `http://localhost:5173`

2. **Stripe Integration** - Success/cancel URLs
   - [stripe.service.js (lines 30-42)](server/services/stripe.service.js#L30)
   - Fallback: None (required)

3. **Billing Controller** - Plan upgrade URLs
   - [billing.controller.js (line 150)](server/controllers/billing.controller.js#L150)

### ✅ Correctly NOT Used (API URLs)
1. **Axios Instance** - Uses `VITE_API_URL`
   - [client/src/api/axios.js (line 6)](client/src/api/axios.js#L6)
   - Reason: This is frontend→backend API communication, needs API server URL

2. **Calendar Feed URL** - Uses `VITE_API_URL`
   - [client/src/api/calendar.api.js (line 20)](client/src/api/calendar.api.js#L20)
   - Reason: This constructs backend API path

---

## Issues Summary

| Type | Location | Issue | Severity | Fix |
|------|----------|-------|----------|-----|
| Hardcoded localhost | `dist/assets/index-Di5Ds1ao.js:750` | Calendar feed URL has `http://localhost:5000` | 🔴 CRITICAL | Rebuild with correct VITE_API_URL |
| Malformed path | `dist/assets/index-Di5Ds1ao.js:750` | Double `/api/api/` in feed URL | 🔴 CRITICAL | Rebuild with correct VITE_API_URL |
| Missing fallback | `email.service.js:11` | No fallback for CLIENT_URL in production | 🟡 MEDIUM | Add production warning if CLIENT_URL is missing |
| Missing fallback | `stripe.service.js:30-42` | No fallback for CLIENT_URL required | 🟡 MEDIUM | Add validation to ensure CLIENT_URL is set |

---

## Reproduction Steps

### To verify the calendar URL issue:
1. Check current built dist file → You'll see hardcoded localhost
2. Rebuild client:
   ```bash
   cd client
   npm run build  # Uses .env.production with correct VITE_API_URL
   ```
3. Verify new dist file has correct URL

### To test calendar feed:
```bash
# Should point to render backend
curl "https://flowforge-multi-tenant-project.onrender.com/api/integrations/calendar/feed/TOKEN_HERE"
```

---

## Recommendations

1. **Immediate:** Rebuild client dist with production environment
   ```bash
   cd client
   VITE_API_URL=https://flowforge-multi-tenant-project.onrender.com/api npm run build
   ```

2. **Short-term:** Add pre-build validation to ensure no hardcoded localhost URLs slip into production builds

3. **Medium-term:** Add unit tests to verify API URL construction with environment variables

4. **Long-term:** Consider versioning dist artifacts or using CDN invalidation strategy

---

## Files Reviewed

### Client (UI)
- [client/src/api/axios.js](client/src/api/axios.js) - ✅ Correct
- [client/src/api/calendar.api.js](client/src/api/calendar.api.js) - ✅ Correct source, ❌ dist outdated
- [client/src/utils/calendar.utils.js](client/src/utils/calendar.utils.js) - ✅ Correct
- [client/src/components/Dashboard Components/Settings/CalendarFeed.jsx](client/src/components/Dashboard Components/Settings/CalendarFeed.jsx) - ✅ Correct
- [client/.env](client/.env) - ✅ Correct (dev)
- [client/.env.production](client/.env.production) - ✅ Correct (prod)
- [client/vite.config.js](client/vite.config.js) - ✅ Correct

### Server (API)
- [server/services/email.service.js](server/services/email.service.js) - ✅ Correct
- [server/services/stripe.service.js](server/services/stripe.service.js) - ✅ Correct
- [server/services/slack.service.js](server/services/slack.service.js) - ✅ Correct
- [server/controllers/workspace.controller.js](server/controllers/workspace.controller.js) - ✅ Correct
- [server/controllers/billing.controller.js](server/controllers/billing.controller.js) - ✅ Correct
- [server/controllers/auth.controller.js](server/controllers/auth.controller.js) - ✅ Correct
- [server/.env](server/.env) - ✅ Correct
- [server/.env.example](server/.env.example) - ✅ Correct

---

**Audit Date:** April 8, 2026  
**Auditor:** Code Review  
**Status:** 1 CRITICAL issue identified and documented
