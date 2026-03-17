# Quick Reference Guide

## Getting Started (5 min setup)

```bash
# 1. Clone & install
git clone <repo>
cd doez
pnpm install

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local with MongoDB URI and JWT_SECRET

# 3. Run dev server
pnpm dev
# Visit http://localhost:3000
```

## Project Structure

```
doez/
├── app/api/              Routes (API endpoints)
├── app/dashboard/        Protected pages
├── components/           React components
├── lib/
│   ├── models/          Mongoose schemas
│   ├── auth.ts          JWT utilities
│   ├── api-utils.ts     Response helpers
│   ├── constants.ts     Shared constants
│   ├── hooks.ts         React hooks
│   └── mongodb.ts       DB connection
├── middleware.ts        Route protection
└── public/              Static files
```

## Common Tasks

### Check if User is Logged In

```typescript
"use client";
import { useSession } from "@/lib/hooks";

export function MyComponent() {
  const { session, loading } = useSession();

  if (!session) return <p>Please log in</p>;
  return <p>Hello {session.name}</p>;
}
```

### Create an Admin-Only API

```typescript
import { getSession } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-utils";
import { USER_ROLES, HTTP_STATUS } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session || session.role !== USER_ROLES.ADMIN) {
    return errorResponse("Forbidden", HTTP_STATUS.FORBIDDEN);
  }

  // Your logic here
  return successResponse({ success: true });
}
```

### Validate Request Data

```typescript
import { validateRequest, errorResponse } from "@/lib/api-utils";
import { HTTP_STATUS } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = validateRequest(body, ["email", "password"]);

  if (!validation.valid) {
    return errorResponse(validation.error!, HTTP_STATUS.BAD_REQUEST);
  }

  // Your logic here
}
```

### Query Database

```typescript
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";

export async function GET() {
  await connectDB();

  const users = await User.find()
    .select("-password")
    .sort({ createdAt: -1 });

  return successResponse(users);
}
```

## Constants Reference

```typescript
import {
  USER_ROLES,
  CLOUD_PROVIDERS,
  TEMPLATE_CATEGORIES,
  DEPLOYMENT_STATUS,
  ERROR_MESSAGES,
  HTTP_STATUS
} from "@/lib/constants";

// Usage
USER_ROLES.ADMIN         // "admin"
USER_ROLES.USER          // "user"
CLOUD_PROVIDERS.AWS      // "aws"
DEPLOYMENT_STATUS.PENDING
ERROR_MESSAGES.UNAUTHORIZED
HTTP_STATUS.OK           // 200
HTTP_STATUS.UNAUTHORIZED // 401
```

## Available Scripts

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Build for production
pnpm start        # Start prod server
pnpm lint         # Check code style
pnpm format       # Format code with Prettier
```

## API Endpoints Overview

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/auth/check` | Check if users exist | - |
| POST | `/api/auth/signup` | Create first user | - |
| POST | `/api/auth/login` | Login | - |
| POST | `/api/auth/logout` | Logout | ✓ |
| GET | `/api/auth/session` | Get session | ✓ |
| GET | `/api/users` | List users | ✓ Admin |
| POST | `/api/users` | Add user | ✓ Admin |
| DELETE | `/api/users/[id]` | Delete user | ✓ Admin |
| GET | `/api/templates` | List templates | ✓ |
| POST | `/api/templates` | Create template | ✓ |
| GET | `/api/credentials` | List credentials | ✓ |
| POST | `/api/credentials` | Add credential | ✓ |
| GET | `/api/deployments` | List deployments | ✓ |
| POST | `/api/deployments` | Create deployment | ✓ |

## Useful Links

- [Setup Guide](./SETUP.md) - Detailed setup instructions
- [Best Practices](./BEST_PRACTICES.md) - Code style guide
- [Contributing](./CONTRIBUTING.md) - How to contribute
- [Changelog](./CHANGELOG.md) - Version history
- [Security Policy](./SECURITY.md) - Security details
- [README](./README.md) - Project overview

## Environment Variables

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/opendeploy
JWT_SECRET=your-secure-32-char-string
NODE_ENV=development
```

## Debugging

```bash
# View full debug logs
DEBUG=doez:* pnpm dev

# View Next.js debug
DEBUG=next:* pnpm dev

# Check build errors
pnpm build
```

## Common Errors & Solutions

| Error | Solution |
|-------|----------|
| "MONGODB_URI is not defined" | Add MONGODB_URI to .env.local |
| "JWT_SECRET is not defined" | Add JWT_SECRET to .env.local |
| "Module not found" | Run `pnpm install` |
| "Connection refused" | Check MongoDB connection string |
| "Build fails" | Delete .next/ and rebuild |

## Database Models Quick Reference

```typescript
// User
{
  name: string
  email: string (unique)
  password: string (hashed)
  role: "admin" | "user"
  createdAt, updatedAt
}

// CloudCredential
{
  userId: ObjectId
  provider: "aws" | "gcp" | "azure" | "digitalocean"
  credentials: Record<string, any>
  createdAt, updatedAt
}

// Template
{
  name, version, description
  category, provider
  parameters: TemplateParameter[]
  steps: TemplateStep[]
  author: { userId, name }
  isPublic, isVerified
  createdAt, updatedAt
}

// Deployment
{
  templateId, userId, credentialId
  parameters: Record<string, any>
  status: "pending" | "in_progress" | "success" | "failed"
  logs: string[]
  createdAt, updatedAt
}

// ActivityLog
{
  userId
  action: string
  resource: string
  resourceId: string
  metadata: Record<string, any>
  createdAt
}
```

## Middleware

Automatic route protection:
- All `/dashboard/*` routes require authentication
- All admin APIs check `session.role === "admin"`
- Protected by `middleware.ts`

## File Size Guidelines

Keep files manageable:
- API routes: < 200 lines
- Components: < 300 lines
- Utils: < 150 lines
- Models: < 100 lines

## Need Help?

1. Check [SETUP.md](./SETUP.md) for environment issues
2. Read [BEST_PRACTICES.md](./BEST_PRACTICES.md) for code patterns
3. See [README.md](./README.md) for feature overview
4. Check GitHub Issues for known problems
5. Join GitHub Discussions for community help
