# API Reference

Base URL: `http://localhost:5000` (dev). All protected routes require an `Authorization: Bearer <accessToken>` header unless noted.

`verifyToken` = authenticated user required
`checkRole(...)` = authenticated user with one of the given workspace roles

## Health

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| GET    | `/api/health` | ✗ | Uptime, memory usage, timestamp |

## Auth (`/api/auth`)

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| POST   | `/register` | ✗ | Email signup |
| POST   | `/login` | ✗ | Email login |
| POST   | `/refresh` | ✗ | Refresh access token |
| POST   | `/logout` | ✓ | Logout |
| GET    | `/me` | ✓ | Current user |
| PUT    | `/profile` | ✓ | Update profile |
| PUT    | `/password` | ✓ | Change password |
| POST   | `/forgot-password` | ✗ | Send password reset |
| POST   | `/reset-password` | ✗ | Reset password |
| GET    | `/invite/preview` | ✗ | Preview workspace invite |
| POST   | `/invite/accept` | ✗ | Accept invite |
| POST   | `/invite/decline` | ✗ | Decline invite |

## Google OAuth (`/api/auth`) mounted additionally in `google.routes`

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| POST   | `/google/token` | ✗ | Exchange Google OAuth code for a session |
| GET    | `/google` | ✗ | Initiate OAuth redirect flow |
| GET    | `/google/callback` | ✗ | Passport OAuth callback |

## Workspace (`/api/workspace`)

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| POST   | `/create` | ✓ | Create a workspace (first workspace setup) |
| POST   | `/switch` | ✓ | Switch active workspace |
| GET    | `/` | ✓ | Get current workspace |
| GET    | `/list` | ✓ | List user's workspaces |
| PUT    | `/` | `owner, admin` | Update workspace |
| POST   | `/invite` | `owner, admin` | Invite a user |
| GET    | `/invitations` | `owner, admin` | List pending invitations |
| GET    | `/members` | ✓ | List members |
| PUT    | `/members/:userId` | `owner` | Update member role |
| DELETE | `/members/:userId` | `owner` | Remove member |
| DELETE | `/invitations/:inviteId` | `owner, admin` | Cancel invitation |

## Projects (`/api/projects`)

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| GET    | `/` | ✓ | List projects |
| POST   | `/` | `owner, admin` | Create project |
| GET    | `/:id` | ✓ | Get project |
| PUT    | `/:id` | `owner, admin` | Update project |
| DELETE | `/:id` | `owner` | Delete project |
| POST   | `/:id/members` | `owner, admin` | Add member |
| DELETE | `/:id/members/:userId` | `owner, admin` | Remove member |

## Tasks (`/api/tasks`)

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| GET    | `/` | ✓ | List tasks |
| POST   | `/upload` | `owner, admin, member` | Upload attachment |
| POST   | `/` | `owner, admin, member` | Create task |
| GET    | `/:id` | ✓ | Get task |
| PUT    | `/:id` | `owner, admin, member` | Update task |
| PATCH  | `/:id/status` | `owner, admin, member` | Update status |
| DELETE | `/:id` | `owner, admin` | Delete task |
| POST   | `/:id/comments` | all roles | Add comment |
| DELETE | `/:id/comments/:commentId` | all roles | Delete comment |

## Time Logs (`/api/timelogs`)

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| POST   | `/start` | ✓ | Start timer |
| POST   | `/stop/:timeLogId` | ✓ | Stop timer |
| GET    | `/active` | ✓ | Active timer |
| GET    | `/task/:taskId` | ✓ | Logs for a task |
| GET    | `/user` | ✓ | Logs for current user |

## Reports (`/api/reports`)

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| GET    | `/summary` | ✓ | Summary metrics |
| GET    | `/workload` | ✓ | Workload per user |
| GET    | `/trend` | ✓ | Daily completions (30 days) |
| GET    | `/overdue` | ✓ | Overdue tasks |

## Notifications (`/api/notifications`)

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| GET    | `/` | ✓ | Get notifications |
| PATCH  | `/:id/read` | ✓ | Mark one read |
| PATCH  | `/read-all` | ✓ | Mark all read |
| DELETE | `/:id` | ✓ | Delete one |
| DELETE | `/` | ✓ | Clear all read |

## Billing (`/api/billing`)

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| POST   | `/webhook` | ✗ | Stripe webhook (raw body) |
| GET    | `/plans` | ✓ | List plans |
| GET    | `/status` | ✓ | Workspace billing status |
| GET    | `/usage` | ✓ | Usage limits |
| POST   | `/checkout` | `owner` | Create Stripe checkout session |
| POST   | `/portal` | `owner` | Open Stripe billing portal |

## AI (`/api/ai`)

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| POST   | `/assistant` | ✓ | AI assistant |

## Automations (`/api/automations`)

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| GET    | `/` | ✓ | Get automation settings |
| PUT    | `/sync` | ✓ | Sync automation settings |

## Integrations — Slack (`/api/integrations/slack`)

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| POST   | `/save` | `owner, admin` | Save webhook |
| DELETE | `/remove` | `owner, admin` | Remove webhook |
| POST   | `/test` | `owner, admin` | Test webhook |
| GET    | `/status` | ✓ | Integration status |

## Integrations — Calendar (`/api/integrations/calendar`)

| Method | Route | Auth | Description |
|--------|-------|:----:|-------------|
| GET    | `/feed/:token` | ✗ | Public ICS feed |
| POST   | `/generate-feed-token` | ✓ | Generate feed token |
| DELETE | `/revoke-feed-token` | ✓ | Revoke feed token |
| GET    | `/token-status` | ✓ | Feed token status |
| GET    | `/export/task/:taskId` | ✓ | Export task as ICS |
| GET    | `/export/project/:projectId` | ✓ | Export project as ICS |

## Response Format

Standard JSON. Example:

```json
{
  "success": true,
  "data": { "...": "..." }
}
```

Errors return a non-2xx status with a JSON body:

```json
{
  "success": false,
  "error": "Error message"
}
```