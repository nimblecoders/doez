# Code Style & Best Practices Guide

## Using the New Utilities

### API Error Handling

Use the `api-utils.ts` helpers for consistent error responses:

```typescript
import { successResponse, errorResponse, validateRequest } from "@/lib/api-utils";
import { ERROR_MESSAGES, HTTP_STATUS } from "@/lib/constants";

// Bad: Inconsistent error responses
export async function GET() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Good: Using helpers
export async function GET() {
  const session = await getSession();
  if (!session) {
    return errorResponse(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }

  const data = await fetch(...);
  return successResponse(data);
}
```

### Request Validation

```typescript
import { validateRequest, errorResponse } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validate required fields
  const validation = validateRequest(body, ["name", "email", "password"]);
  if (!validation.valid) {
    return errorResponse(validation.error!, HTTP_STATUS.BAD_REQUEST);
  }

  // Continue with request
}
```

### Using Constants

```typescript
import { USER_ROLES, CLOUD_PROVIDERS, DEPLOYMENT_STATUS } from "@/lib/constants";

// Bad: String literals scattered in code
role === "admin"
provider === "aws"
status === "pending"

// Good: Using constants
role === USER_ROLES.ADMIN
provider === CLOUD_PROVIDERS.AWS
status === DEPLOYMENT_STATUS.PENDING
```

### Session & Auth Hooks

```typescript
"use client";

import { useSession, useIsAdmin, useAuth } from "@/lib/hooks";

// In your component
export function Dashboard() {
  const { session, loading } = useSession();
  const { isAdmin } = useIsAdmin();

  if (loading) return <div>Loading...</div>;
  if (!session) return <div>Please log in</div>;

  return (
    <div>
      Welcome, {session.name}!
      {isAdmin && <AdminPanel />}
    </div>
  );
}
```

## API Response Format

All API endpoints should follow this format:

```typescript
// Success Response
{
  "success": true,
  "data": { /* response data */ },
  "timestamp": 1710776400000
}

// Error Response
{
  "success": false,
  "error": "Error message",
  "timestamp": 1710776400000
}
```

## TypeScript Best Practices

```typescript
// Always use explicit types
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  // ...
}

// Use type guards
if (typeof data === "object" && data !== null) {
  // ...
}

// Use type inference where obvious
const name = "John"; // inferred as string
const users = await User.find({}); // inferred as IUser[]
```

## Role-Based Access Control

```typescript
import { USER_ROLES } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return errorResponse(ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }

  if (session.role !== USER_ROLES.ADMIN) {
    return errorResponse(ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

  // Admin-only logic
}
```

## Environment Variables

Always check for required env vars at startup:

```typescript
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}
```

## Error Handling

```typescript
// Always include try-catch in API routes
try {
  // Your logic
} catch (error) {
  console.error("Operation failed:", error);
  return errorResponse(
    ERROR_MESSAGES.INTERNAL_ERROR,
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
}
```

## Database Operations

```typescript
import connectDB from "@/lib/mongodb";

export async function GET() {
  try {
    await connectDB();

    const users = await User.find()
      .select("-password") // Exclude sensitive fields
      .sort({ createdAt: -1 });

    return successResponse(users);
  } catch (error) {
    console.error("Database error:", error);
    return errorResponse(
      ERROR_MESSAGES.DATABASE_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}
```

## Logging

```typescript
// Development logging
if (process.env.NODE_ENV === "development") {
  console.log("User created:", user._id);
}

// Error logging (always)
console.error("Failed to process deployment:", error);
```

## Security Considerations

1. **Never expose passwords** - Use `.select("-password")`
2. **Validate all inputs** - Use `validateRequest` helper
3. **Check roles** - Always verify user role for admin operations
4. **Use HTTP-only cookies** - Already configured in `createSession()`
5. **Hash passwords** - Always use bcrypt with salt rounds >= 12
6. **Validate JWT** - Middleware checks tokens automatically

## Code Organization

```
lib/
├── models/          # Mongoose schemas
├── auth.ts          # JWT utilities
├── api-utils.ts     # Response helpers (NEW)
├── constants.ts     # Constants (NEW)
├── hooks.ts         # React hooks (NEW)
├── mongodb.ts       # DB connection
└── utils.ts         # General utilities

app/
├── api/
│   ├── auth/        # Authentication endpoints
│   ├── users/       # User management
│   └── ...
└── dashboard/       # Protected routes
```

## File Naming

- Components: `kebab-case.tsx` (e.g., `user-dashboard.tsx`)
- Utilities/Hooks: `kebab-case.ts` (e.g., `api-utils.ts`)
- Models: `kebab-case.ts` (e.g., `cloud-credential.ts`)

## Testing Requirements

When implementing new features:

1. ✅ Test happy path
2. ✅ Test error cases
3. ✅ Test permission checks
4. ✅ Test validation
5. ✅ Test database interactions

## Commit Message Format

```
feat(auth): add two-factor authentication
fix(users): prevent admin self-deletion
docs(setup): update MongoDB instructions
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.
