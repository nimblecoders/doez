# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-18

### Added

- **Infrastructure & Setup**
  - Added `.env.example` template for environment configuration
  - Added `.gitignore` for version control
  - Added `.eslintrc.json` for code linting
  - Added `.prettierrc` for code formatting
  - Added `middleware.ts` for route protection
  - Added `SETUP.md` comprehensive development guide
  - Added `CONTRIBUTING.md` contribution guidelines
  - Added `lib/constants.ts` for shared constants and error messages
  - Added `lib/api-utils.ts` for API response helpers
  - Added `lib/hooks.ts` for React custom hooks

- **Bug Fixes**
  - Fixed `auth.ts` type mismatch in `verifySession()` return type
  - Fixed incorrect comment in session verification

### Fixed

- Type consistency in JWT verification functions
- Session payload typing throughout auth module

## [0.0.1] - 2026-03-01

### Added

- Initial project setup with Next.js 15
- MongoDB with Mongoose integration
- JWT authentication with HTTP-only cookies
- User management system
- Team member management (admin dashboard)
- Cloud credentials storage (AWS, GCP, Azure, DigitalOcean)
- Template system with CRUD operations
- Template marketplace with search and filters
- Deployment tracking
- Activity logging
- Role-based access control (Admin/User)
- Tailwind CSS styling

---

## Upcoming Features

### Phase 7: Deployment Engine
- [ ] Server provisioning across cloud providers
- [ ] Docker orchestration
- [ ] SSH automation
- [ ] Security rules and firewall configuration
- [ ] Deployment queue and background jobs
- [ ] WebSocket-based real-time logs

### Phase 8: Monitoring & Alerts
- [ ] Deployment history view
- [ ] Server metrics (CPU, RAM, Disk)
- [ ] Health checks
- [ ] Email/Slack notifications
- [ ] Cost tracking
- [ ] Rollback support

### Phase 9: Advanced Features
- [ ] Granular RBAC permissions
- [ ] Team projects grouping
- [ ] Scheduled deployments
- [ ] API keys for programmatic access
- [ ] Webhooks for deployment triggers
- [ ] Complete audit trail

---

## Migration Guide

### Migrating from < 0.1.0 to 0.1.0

1. Create `.env.local` from `.env.example`
2. Update any custom session verification code to use new typing
3. Implement `middleware.ts` for route protection if not using existing route handlers

---

## Security Notes

- Always keep `JWT_SECRET` secure and unique per environment
- Regularly update dependencies
- Review security policy in [SECURITY.md](./SECURITY.md)

---

For detailed information about changes, see the [Git log](https://github.com/nimblecoders/doez/commits/main).
