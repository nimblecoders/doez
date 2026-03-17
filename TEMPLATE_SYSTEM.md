# Docker & DevOps Template System

**Version:** 1.0.0
**Created:** March 18, 2026

## Overview

The OpenDeploy template system allows you to define reusable deployment templates stored as JSON files, organized by categories. These templates enable consistent, reproducible DevOps deployments across different environments and cloud providers.

---

## Template Directory Structure

```
templates/
├── docker/
│   ├── nextjs-docker-github.json
│   └── nextjs-multi-stage.json
├── docker-compose/
│   ├── nextjs-mongodb-compose.json
│   └── nextjs-nginx-reverse-proxy.json
├── dockerfile/
│   └── nextjs-multi-stage.json
└── kubernetes/
    └── nextjs-k8s-deployment.json
```

---

## Template JSON Structure

Each template is a JSON file with the following structure:

```json
{
  "id": "unique-template-id",
  "name": "Template Display Name",
  "description": "What this template does",
  "version": "1.0.0",
  "category": "docker",
  "provider": "any",
  "tags": ["nextjs", "docker", "github"],
  "author": {
    "name": "Your Name",
    "email": "email@example.com"
  },
  "estimatedTime": "30 minutes",
  "usageCount": 0,
  "requirements": ["Docker installed", "GitHub account"],
  "parameters": [
    {
      "name": "APP_NAME",
      "type": "string",
      "description": "Application name",
      "required": true,
      "default": "doez"
    }
  ],
  "steps": [
    {
      "name": "Step name",
      "description": "What this step does",
      "command": "docker run ...",
      "continueOnError": false
    }
  ],
  "postDeployment": {
    "healthCheck": {
      "enabled": true,
      "endpoint": "http://localhost:3000/health"
    }
  },
  "rollbackSteps": [],
  "documentation": {}
}
```

---

## Part 1: Define Parameters

Parameters define user inputs when deploying a template. They support variable substitution in commands.

### Parameter Types

**String**
```json
{
  "name": "APP_NAME",
  "type": "string",
  "description": "Application name",
  "required": true,
  "default": "my-app"
}
```

**Number**
```json
{
  "name": "PORT",
  "type": "number",
  "description": "Application port",
  "required": false,
  "default": 3000
}
```

**Select/Dropdown**
```json
{
  "name": "NODE_ENV",
  "type": "select",
  "description": "Node environment",
  "options": ["production", "staging", "development"],
  "default": "production"
}
```

**Boolean**
```json
{
  "name": "ENABLE_SSL",
  "type": "boolean",
  "description": "Enable SSL",
  "default": true
}
```

### Secret Parameters

Mark sensitive data with `"secret": true`:

```json
{
  "name": "MONGODB_URI",
  "type": "string",
  "description": "MongoDB connection string",
  "required": true,
  "secret": true
}
```

---

## Part 2: Define Deployment Steps

Steps are executed sequentially. Use parameter placeholders like `${PARAM_NAME}` in commands.

```json
"steps": [
  {
    "name": "Create directories",
    "description": "Set up project structure",
    "command": "mkdir -p ${DEPLOYMENT_PATH} && cd ${DEPLOYMENT_PATH}",
    "continueOnError": false
  },
  {
    "name": "Pull Docker image",
    "description": "Download latest image",
    "command": "docker pull ${DOCKER_IMAGE}",
    "continueOnError": false
  },
  {
    "name": "Run container",
    "description": "Start application",
    "command": "docker run -d -e MONGODB_URI=${MONGODB_URI} ${DOCKER_IMAGE}"
  }
]
```

### Step Properties

- `name` (required): Step name for display
- `description`: What the step does
- `command` (required): Shell command to execute (supports parameter substitution)
- `continueOnError`: If true, deployment continues even if step fails

---

## Part 3: Post-Deployment Configuration

Define health checks and notifications after deployment:

```json
"postDeployment": {
  "healthCheck": {
    "enabled": true,
    "endpoint": "http://localhost:3000/api/auth/check",
    "interval": 30,
    "timeout": 10,
    "retries": 3
  },
  "notifications": [
    {
      "type": "log",
      "message": "Application deployed successfully"
    }
  ]
}
```

---

## Part 4: Rollback Strategy

Define steps to execute if deployment fails:

```json
"rollbackSteps": [
  {
    "name": "Stop current container",
    "command": "docker stop ${APP_NAME}"
  },
  {
    "name": "Restore previous version",
    "command": "docker run -d ${PREVIOUS_IMAGE}"
  }
]
```

---

## Using Templates via API

### 1. List All Templates

```bash
curl http://localhost:3000/api/templates-json \
  -H "Authorization: Bearer token"
```

### 2. List Templates by Category

```bash
curl "http://localhost:3000/api/templates-json?action=categories" \
  -H "Authorization: Bearer token"
```

### 3. Filter by Category

```bash
curl "http://localhost:3000/api/templates-json?category=docker" \
  -H "Authorization: Bearer token"
```

### 4. Get Template Details

```bash
curl http://localhost:3000/api/templates-json/nextjs-docker-github \
  -H "Authorization: Bearer token"
```

### 5. Validate & Prepare Template

```bash
curl -X POST http://localhost:3000/api/templates-json/nextjs-docker-github \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{
    "parameters": {
      "APP_NAME": "my-app",
      "DOCKER_IMAGE": "ghcr.io/user/app:latest",
      "MONGODB_URI": "mongodb://...",
      "JWT_SECRET": "secret123"
    }
  }'
```

---

## Available Templates

### Docker Templates

**nextjs-docker-github** (GitHub Container Registry)
- Pulls pre-built image from GHCR
- Runs with environment variables
- Suitable for: Single server deployments
- Time: 30 minutes

**nextjs-multi-stage** (Multi-Stage Dockerfile)
- Builds optimized Docker image
- Minimal final image size
- Suitable for: Custom builds
- Time: 60 minutes

### Docker Compose Templates

**nextjs-mongodb-compose** (Full Stack)
- Next.js + MongoDB
- Complete development environment
- Suitable for: Full stack deployments
- Time: 45 minutes

**nextjs-nginx-reverse-proxy** (Production Ready)
- Nginx reverse proxy
- SSL support
- Load balancing ready
- Suitable for: Production deployments
- Time: 60 minutes

### Kubernetes Templates

**nextjs-k8s-deployment** (Kubernetes Cluster)
- Multi-replica deployment
- Service and Ingress
- Auto-scaling ready
- Suitable for: Kubernetes clusters
- Time: 90 minutes

---

## Creating Your Own Templates

### Step 1: Copy Template Structure

```bash
cp templates/docker/nextjs-docker-github.json templates/docker/my-template.json
```

### Step 2: Edit Template

```json
{
  "id": "my-custom-template",
  "name": "My Custom Deploy",
  "category": "docker",
  "parameters": [...],
  "steps": [...]
}
```

### Step 3: Test Template

```bash
curl -X POST http://localhost:3000/api/templates-json/my-custom-template \
  -H "Content-Type: application/json" \
  -d '{"parameters": {"APP_NAME": "test"}}'
```

---

## Best Practices

### 1. Use Environment Variables for Secrets

```json
{
  "name": "MONGODB_URI",
  "secret": true,
  "type": "string"
}
```

### 2. Always Include Health Checks

```json
"postDeployment": {
  "healthCheck": {
    "enabled": true,
    "endpoint": "http://localhost:3000/health"
  }
}
```

### 3. Make Steps Idempotent

```bash
# Good: Won't fail if already exists
docker stop ${APP_NAME} || true

# Bad: Fails if directory exists
mkdir ${DEPLOYMENT_PATH}
```

### 4. Document Complex Logic

```json
{
  "name": "Complex step",
  "description": "Explains why this is done",
  "command": "..."
}
```

### 5. Add Rollback Steps for Critical Operations

```json
"rollbackSteps": [
  {
    "name": "Restore backup",
    "command": "cp /backup/data.db /data/data.db"
  }
]
```

---

## Template Categories

| Category | Use Case |
|----------|----------|
| `docker` | Single container deployments |
| `docker-compose` | Multi-container orchestration |
| `dockerfile` | Building Docker images |
| `kubernetes` | Kubernetes cluster deployments |
| `ci-cd` | GitHub Actions, GitLab CI |
| `security` | SSL, firewall, hardening |
| `monitoring` | Health checks, metrics |

---

## Template Parameters Reference

### Common Parameters

```json
{
  "APP_NAME": "Application name (docker container/pod name)",
  "DOCKER_IMAGE": "Full image path (ghcr.io/owner/app:tag)",
  "DEPLOYMENT_PATH": "Server directory path (/opt/app)",
  "NODE_ENV": "production|staging|development",
  "PORT": "Application port (3000)",
  "MONGODB_URI": "Connection string (mongodb://...)",
  "JWT_SECRET": "Authentication secret",
  "DOMAIN": "Domain name (example.com)",
  "SERVER_IP": "Server IP address"
}
```

---

## Troubleshooting

### Template not found

Ensure the JSON file exists in the correct category folder and template ID matches filename.

### Parameters not substituted

Check that parameter names in `${PARAM_NAME}` exactly match definition names (case-sensitive).

### Health check failing

Verify the health check endpoint is correct and accessible on the deployed application.

### Rollback not executing

Make sure rollback steps are using correct image/version tags.

---

## Migration from Database Templates

To migrate existing templates from database to JSON:

```bash
# Export all templates
curl http://localhost:3000/api/templates > templates.json

# Convert to JSON file format
# Save each template as templates/{category}/{id}.json
```

---

## Next Steps

1. **Create your first template** - Copy an existing template and customize
2. **Test with parameters** - Use the API to validate template
3. **Deploy using template** - Use with Phase 7 deployment engine
4. **Monitor deployment** - Check health checks and logs

---

## API Reference

### GET /api/templates-json
List all templates with optional filters

**Query Parameters:**
- `category`: Filter by category
- `provider`: Filter by cloud provider
- `tag`: Search by tag
- `action`: `categories`, `providers`, or `stats`

### GET /api/templates-json/[id]
Get specific template details

### POST /api/templates-json/[id]
Validate parameters and prepare template for execution

**Request Body:**
```json
{
  "parameters": {
    "APP_NAME": "value",
    "DOCKER_IMAGE": "value"
  }
}
```

---

## Support

For issues or questions:
1. Check template documentation section
2. Review error messages in deployment logs
3. Verify all required parameters are provided
4. Check parameter values match expected format

