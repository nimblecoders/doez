# Development Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- pnpm (v9 or higher) - [Install pnpm](https://pnpm.io/installation)
- MongoDB Atlas account - [Create free cluster](https://www.mongodb.com/cloud/atlas)
- Git

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/nimblecoders/doez.git
cd doez
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# MongoDB Connection String
# 1. Go to https://www.mongodb.com/cloud/atlas
# 2. Create a free M0 cluster
# 3. Get your connection string: mongodb+srv://username:password@cluster...
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/opendeploy

# JWT Secret for session signing
# Generate a secure random string:
#   macOS/Linux: openssl rand -hex 32
#   Windows: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-generated-32-char-hex-string-here

# Environment mode
NODE_ENV=development
```

### 4. MongoDB Setup

#### Using MongoDB Atlas (Recommended for Development)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account or sign in
3. Create a new project (or use default)
4. Create an M0 (free tier) cluster
5. Set up a database user:
   - Go to Database Access
   - Create a user (username: `opendeploy`, password: generate a strong one)
6. Set up network access:
   - Go to Network Access
   - Add your IP address (or 0.0.0.0/0 for development)
7. Get connection string:
   - Click "Connect"
   - Choose "Drivers" tab
   - Copy the connection string
   - Replace `<password>` with your user password
   - Add `/opendeploy` at the end of the URI

#### Using Local MongoDB

```bash
# Install MongoDB locally (macOS with Homebrew)
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Connection string for local development
MONGODB_URI=mongodb://localhost:27017/opendeploy
```

### 5. Run Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## First Launch

1. Visit `http://localhost:3000`
2. You'll see a Sign Up form (since no users exist)
3. Create an admin account:
   - Name: Your name
   - Email: admin@example.com
   - Password: Your secure password
4. You'll be redirected to the admin dashboard

## Project Structure

```
/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── users/             # User management
│   │   ├── credentials/       # Cloud credentials
│   │   ├── templates/         # Template CRUD
│   │   └── deployments/       # Deployment tracking
│   ├── dashboard/             # Protected routes
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Auth page
│   └── globals.css            # Global styles
├── components/                # React components
├── lib/
│   ├── models/               # Mongoose schemas
│   ├── auth.ts               # JWT utilities
│   ├── mongodb.ts            # DB connection
│   ├── api-utils.ts          # API helpers
│   └── utils.ts              # Shared utilities
├── middleware.ts             # Route protection
├── .env.example              # Environment template
└── package.json
```

## Available Scripts

```bash
# Development (with Turbopack)
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint

# Format code (using Prettier)
pnpm format

# Run tests (when configured)
pnpm test
```

## API Endpoints

### Authentication

```
GET    /api/auth/check          Check if users exist
POST   /api/auth/signup         Create first admin
POST   /api/auth/login          Login user
POST   /api/auth/logout         Logout user
GET    /api/auth/session        Get current session
```

### Users (Admin Only)

```
GET    /api/users               List all users
POST   /api/users               Create new user
DELETE /api/users/[id]          Delete user
```

### Cloud Credentials

```
GET    /api/credentials         List user credentials
POST   /api/credentials         Add new credential
DELETE /api/credentials/[id]    Delete credential
```

### Templates

```
GET    /api/templates                  List templates
GET    /api/templates/[id]             Get template details
POST   /api/templates                  Create template
PUT    /api/templates/[id]             Update template
DELETE /api/templates/[id]             Delete template
POST   /api/templates/seed             Seed sample templates
```

### Deployments

```
GET    /api/deployments         List deployments
POST   /api/deployments         Create deployment
```

## Debugging

### Enable Debug Mode

```bash
# macOS/Linux
DEBUG=doez:* pnpm dev

# Windows
set DEBUG=doez:* && pnpm dev
```

### Common Issues

**Issue:** "MongoDB connection failed"
- Check MONGODB_URI in `.env.local`
- Verify your IP is whitelisted in MongoDB Atlas Network Access
- Ensure username and password are correct

**Issue:** "JWT_SECRET is not defined"
- Make sure `.env.local` exists
- Verify JWT_SECRET is set with at least 32 characters

**Issue:** "Module not found"
- Run `pnpm install` again
- Delete `.pnpm-lock.yaml` and `node_modules/`, then reinstall

## Testing Login

After setup, you can test the application:

```bash
# Default test credentials (create these via UI)
Email: admin@example.com
Password: your-password-here
```

## Next Steps

- [ ] Read the [CONTRIBUTING.md](./CONTRIBUTING.md) file
- [ ] Review [Architecture](./docs/architecture.md) (when available)
- [ ] Check Phase 7 [Deployment Engine](./README.md#phase-7-deployment-engine) tasks
- [ ] Join our [GitHub Discussions](https://github.com/nimblecoders/doez/discussions)

## Getting Help

- Check GitHub Issues: https://github.com/nimblecoders/doez/issues
- Read the Security Policy: [SECURITY.md](./SECURITY.md)
- Check existing documentation in the README

## Troubleshooting

If you encounter issues:

1. Check the error message in browser console (F12)
2. Check server logs in terminal
3. Verify environment variables are set correctly
4. Clear `.next/` build cache: `rm -rf .next/`
5. Reinstall dependencies: `rm -rf node_modules pnpm-lock.yaml && pnpm install`
