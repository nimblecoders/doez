# Build & Deployment Guide

## Prerequisites

### 1. Install ESLint (Required for Build)

```bash
pnpm install --save-dev eslint
```

### 2. Set Environment Variables

Create a `.env.local` file in the project root:

```bash
# Copy the template
cp .env.example .env.local

# Edit .env.local with your values
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/opendeploy
JWT_SECRET=your-secure-32-character-random-string-here
NODE_ENV=development
```

**To generate a secure JWT_SECRET**, use one of these commands:

```bash
# macOS/Linux
openssl rand -hex 32

# Node.js (any platform)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Building the Project

### Development Build
```bash
pnpm build
```

### Production Build with Environment
```bash
JWT_SECRET=your-secret MONGODB_URI=your-uri pnpm build
```

## Running the Project

### Development Mode (Recommended for Testing)
```bash
pnpm dev
```

This starts the development server with:
- Hot reloading
- Development logging
- Turbopack bundler

### Production Mode
```bash
pnpm build
pnpm start
```

## Environment Variables Reference

| Variable | Required | When | Example |
|----------|----------|------|---------|
| `JWT_SECRET` | Yes (production) | Runtime | `abc123xyz789...` (32+ chars) |
| `MONGODB_URI` | Yes | Runtime | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `NODE_ENV` | No | Build/Runtime | `development` or `production` |

## Troubleshooting Build Issues

### Issue: "ESLint must be installed"
**Solution:**
```bash
pnpm install --save-dev eslint
```

### Issue: "JWT_SECRET environment variable is required"
**Solution:**
```bash
# During build
JWT_SECRET=your-secret pnpm build

# Or set in .env.local file
echo "JWT_SECRET=your-secret-here" >> .env.local
```

### Issue: "MONGODB_URI is not defined"
**Solution:**
```bash
# Set in .env.local
echo "MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db" >> .env.local

# Or set during dev
MONGODB_URI=your-uri pnpm dev
```

### Issue: "Module not found" errors
**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Development Workflow

1. **Setup (First Time)**
   ```bash
   pnpm install --save-dev eslint
   cp .env.example .env.local
   # Edit .env.local with your MongoDB URI and JWT_SECRET
   ```

2. **Start Development Server**
   ```bash
   pnpm dev
   ```

3. **Build for Production**
   ```bash
   pnpm build
   pnpm start
   ```

4. **Run Linter**
   ```bash
   pnpm lint
   ```

## Deployment Checklist

Before deploying to production:

- [ ] Install all dependencies: `pnpm install`
- [ ] Set `JWT_SECRET` environment variable
- [ ] Set `MONGODB_URI` with production database
- [ ] Set `NODE_ENV=production`
- [ ] Run build: `pnpm build`
- [ ] Test production build locally: `pnpm start`
- [ ] Verify all routes work
- [ ] Check error handling
- [ ] Enable HTTPS in production
- [ ] Set up monitoring and error tracking
- [ ] Configure backups for MongoDB

## Quick Start Commands

```bash
# Full setup from scratch
pnpm install --save-dev eslint
cp .env.example .env.local
# Edit .env.local with your values
pnpm dev

# Build and test production
JWT_SECRET=your-secret MONGODB_URI=your-uri pnpm build
pnpm start

# Run linting
pnpm lint

# Format code with Prettier
pnpm format
```

## Notes

- **Development Mode:** Uses dev JWT_SECRET automatically
- **Production Mode:** Requires JWT_SECRET to be set
- **Build Time:** MongoDB URI is NOT needed during build - only at runtime
- **ESLint:** Required for Next.js builds to validate code quality
