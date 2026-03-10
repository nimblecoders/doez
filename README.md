# OpenDeploy

> Open Source No-Ops Cloud Deployment Platform  
> Deploy servers, databases, and full-stack applications with **one click** — no DevOps skills required.

---

## Vision

OpenDeploy is an open-source platform designed to simplify cloud infrastructure and DevOps.  
Our goal is to allow anyone to deploy and manage cloud resources without needing expertise in:

- AWS
- Google Cloud
- Microsoft Azure
- DigitalOcean

Users simply:
1. Enter cloud credentials
2. Choose a template
3. Click **Deploy**

---

## Tech Stack

| Layer        | Technology |
|-------------|------------|
| Framework   | Next.js 15 (App Router) |
| Language    | TypeScript |
| Database    | MongoDB (Mongoose) |
| Auth        | JWT (HTTP-only cookies) |
| Styling     | Tailwind CSS |
| Containers  | Docker |
| Templates   | YAML / JSON |
| Cloud SDKs  | AWS SDK, GCP SDK, Azure SDK, DO SDK |

---

## Features Roadmap

### Phase 1: Foundation (COMPLETED)

| Feature | Status | Description |
|---------|--------|-------------|
| Next.js Setup | DONE | App Router with TypeScript |
| MongoDB Connection | DONE | Mongoose with connection pooling |
| User Model | DONE | Name, email, password (bcrypt), role, timestamps |
| JWT Authentication | DONE | HTTP-only cookies, 7-day sessions |
| Sign Up (First Admin) | DONE | Shows only when user count is zero |
| Login | DONE | Email/password authentication |
| Session Management | DONE | Verify, create, destroy sessions |
| Protected Routes | DONE | Dashboard requires authentication |

### Phase 2: Team Management (COMPLETED)

| Feature | Status | Description |
|---------|--------|-------------|
| Admin Dashboard | DONE | Stats, team member list |
| Add Team Member | DONE | Modal form with role selection (admin/user) |
| Delete Team Member | DONE | Admin only, cannot delete self |
| User Dashboard | DONE | Basic profile view |
| Dashboard Navigation | DONE | Role-based navigation |

### Phase 3: User Management Enhancements (TODO)

| Feature | Status | Description |
|---------|--------|-------------|
| Password Reset | TODO | Email-based password recovery |
| Email Verification | TODO | Verify email on signup |
| User Profile Edit | TODO | Update name, email, password |
| Activity Logs | TODO | Track user actions |
| Two-Factor Auth (2FA) | TODO | TOTP-based 2FA |
| Session Management | TODO | View and revoke active sessions |

### Phase 4: Cloud Provider Integration (TODO)

| Feature | Status | Description |
|---------|--------|-------------|
| Cloud Credentials Model | TODO | Store encrypted cloud credentials |
| AWS Integration | TODO | AWS SDK for EC2, RDS, S3 |
| GCP Integration | TODO | Google Cloud SDK |
| Azure Integration | TODO | Azure SDK |
| DigitalOcean Integration | TODO | DO SDK for Droplets |
| Credential Validation | TODO | Test connection before saving |
| Credential Encryption | TODO | AES-256 encryption at rest |

### Phase 5: Template System (TODO)

| Feature | Status | Description |
|---------|--------|-------------|
| Template Model | TODO | MongoDB schema for templates |
| YAML/JSON Parser | TODO | Parse template configurations |
| Template CRUD | TODO | Create, read, update, delete templates |
| Template Categories | TODO | Server, Service, Operation, App, Container |
| Template Parameters | TODO | Dynamic input fields |
| Template Validation | TODO | Validate before deployment |

### Phase 6: Template Marketplace (TODO)

| Feature | Status | Description |
|---------|--------|-------------|
| Browse Templates | TODO | Grid view with filters |
| Search Templates | TODO | Full-text search |
| Category Filters | TODO | Filter by category, provider |
| Template Details | TODO | View parameters, steps, requirements |
| GitHub Import | TODO | Import via repository URL |
| Template Versioning | TODO | Version control support |
| Community Templates | TODO | Publish and share templates |

### Phase 7: Deployment Engine (TODO)

| Feature | Status | Description |
|---------|--------|-------------|
| Deployment Model | TODO | Track deployment status |
| Server Provisioning | TODO | Create VMs across providers |
| Docker Orchestration | TODO | Container deployment |
| SSH Automation | TODO | Remote command execution |
| Security Rules | TODO | Firewall, swap, hardening |
| Deployment Queue | TODO | Background job processing |
| Real-time Logs | TODO | WebSocket-based log streaming |

### Phase 8: Monitoring & Alerts (TODO)

| Feature | Status | Description |
|---------|--------|-------------|
| Deployment History | TODO | View past deployments |
| Server Monitoring | TODO | CPU, RAM, Disk metrics |
| Health Checks | TODO | Automated service health checks |
| Alert System | TODO | Email/Slack notifications |
| Cost Tracking | TODO | Track cloud spending |
| Rollback Support | TODO | Revert to previous deployment |

### Phase 9: Advanced Features (TODO)

| Feature | Status | Description |
|---------|--------|-------------|
| RBAC Permissions | TODO | Granular role-based access |
| Team Projects | TODO | Group deployments by project |
| Scheduled Deployments | TODO | Cron-based scheduling |
| API Keys | TODO | Programmatic access |
| Webhooks | TODO | Trigger deployments via webhook |
| Audit Trail | TODO | Complete action history |

---

## Multi-Cloud Support

| Provider | Services |
|----------|----------|
| AWS | EC2, RDS, S3, Lambda, ECS |
| Google Cloud | Compute Engine, Cloud SQL, GKE |
| Azure | Virtual Machines, Azure SQL, AKS |
| DigitalOcean | Droplets, Managed Databases, Kubernetes |

---

## Template Categories

Templates are organized by:

- **Server-wise** (Ubuntu, CentOS, Debian, etc.)
- **Service-wise** (Database, Cache, Queue, Search)
- **Operation-wise** (Security, Scaling, Monitoring, Backup)
- **Application-wise** (WordPress, MERN, Laravel, Django)
- **Container-wise** (Docker, Kubernetes, Docker Compose)

---

## Template Structure (Example)

```yaml
name: mysql-docker-template
version: "1.0.0"
category: database
provider: any
description: Deploy MySQL using Docker
parameters:
  - name: root_password
    type: string
    required: true
    secret: true
  - name: port
    type: number
    default: 3306
  - name: database_name
    type: string
    required: true
requirements:
  - docker
steps:
  - name: install_docker
    command: apt-get install -y docker.io
  - name: run_mysql_container
    command: docker run -d --name mysql -e MYSQL_ROOT_PASSWORD={{root_password}} -p {{port}}:3306 mysql:8
  - name: configure_firewall
    command: ufw allow {{port}}/tcp
```

---

## Project Structure

```
/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── check/route.ts      # Check if users exist
│   │   │   ├── login/route.ts      # User login
│   │   │   ├── logout/route.ts     # User logout
│   │   │   ├── session/route.ts    # Get current session
│   │   │   └── signup/route.ts     # Admin signup (first user)
│   │   └── users/
│   │       ├── route.ts            # List/Create users
│   │       └── [id]/route.ts       # Delete user
│   ├── dashboard/
│   │   ├── layout.tsx              # Dashboard layout
│   │   └── page.tsx                # Dashboard page
│   ├── globals.css                 # Global styles
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Home page (auth)
├── components/
│   ├── add-team-member-modal.tsx   # Add member modal
│   ├── admin-dashboard.tsx         # Admin view
│   ├── auth-form.tsx               # Login/Signup form
│   ├── dashboard-nav.tsx           # Navigation
│   └── user-dashboard.tsx          # User view
├── lib/
│   ├── models/
│   │   └── user.ts                 # User mongoose model
│   ├── auth.ts                     # JWT utilities
│   ├── mongodb.ts                  # Database connection
│   └── utils.ts                    # Helper functions
└── package.json
```

---

## Environment Variables

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/opendeploy
JWT_SECRET=your-secure-jwt-secret-key-min-32-chars
```

---

## Getting Started

```bash
# Clone repository
git clone https://github.com/nimblecoders/doez.git
cd doez

# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local with your MongoDB URI and JWT secret

# Run development server
npm run dev

# Open http://localhost:3000
```

---

## Authentication Flow

1. **First Visit**: If no users exist, show Sign Up form
2. **Sign Up**: First user is automatically assigned `admin` role
3. **After First User**: Only Login form is shown
4. **Login**: Validates credentials, creates JWT session
5. **Dashboard**: Redirects based on role (admin/user)
6. **Admin**: Can add/remove team members
7. **User**: Can view their profile

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/check` | Check if users exist |
| POST | `/api/auth/signup` | Create admin (first user only) |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/session` | Get current session |

### Users (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create new user |
| DELETE | `/api/users/[id]` | Delete user |

---

## Security Features

- Password hashing with bcrypt (12 salt rounds)
- JWT tokens stored in HTTP-only cookies
- CSRF protection via SameSite cookies
- Role-based access control
- Input validation on all endpoints
- MongoDB injection prevention

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.

---

## Contact

- GitHub: [nimblecoders/doez](https://github.com/nimblecoders/doez)
