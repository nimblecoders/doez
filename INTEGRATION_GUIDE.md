# Server Connections + Template Deployment Integration Guide

**Version:** 1.0.0
**Date:** March 18, 2026

## Overview

This guide explains how to deploy templates to specific servers using the integrated Server Connections system. The integration allows you to:

1. Create and manage server connections (SSH, HTTP, HTTPS, WinRM)
2. Test connections before deployment
3. Deploy templates directly to specific servers
4. Execute commands on remote servers via SSH

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│ User Interface Dashboard                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Template Deployment Flow                                 │
├─────────────────────────────────────────────────────────┤
│ 1. Select Template (JSON-based)                          │
│ 2. Configure Parameters (variables substitution)         │
│ 3. Choose Server Connection (SSH/HTTP/HTTPS/WinRM)       │
│ 4. Execute Deployment Job                               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ API Endpoints                                            │
├─────────────────────────────────────────────────────────┤
│ POST /api/deployments/from-template                     │
│   ├─ templateId (required)                              │
│   ├─ templateParams (required)                          │
│   ├─ credentialId (optional - for cloud providers)      │
│   └─ serverConnectionId (optional - for SSH/HTTP)       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Deployment Processor                                     │
├─────────────────────────────────────────────────────────┤
│ 1. Validate Server Connection                           │
│ 2. Load SSH/HTTP credentials                            │
│ 3. Execute Template Steps Sequentially                  │
│ 4. Track Progress & Logs                                │
│ 5. Update Deployment Status                             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Execution Services                                       │
├─────────────────────────────────────────────────────────┤
│ SSHExecutor - SSH command execution                      │
│ HTTPExecutor - HTTP/HTTPS requests (future)             │
│ DeploymentExecutor - Step orchestration                 │
└─────────────────────────────────────────────────────────┘
```

---

## Complete Workflow: Create Connection → Deploy Template

### Step 1: Create a Server Connection

```bash
curl -X POST http://localhost:3000/api/server-connections \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Ubuntu Server",
    "description": "Main production deployment server",
    "connectionType": "ssh",
    "host": "192.168.1.100",
    "port": 22,
    "username": "ubuntu",
    "authMethod": "private-key",
    "auth": {
      "privateKey": "-----BEGIN OPENSSH PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END OPENSSH PRIVATE KEY-----",
      "privateKeyPassphrase": "optional-key-passphrase"
    },
    "sshSettings": {
      "timeout": 30000,
      "readyTimeout": 20000,
      "strictHostKeyChecking": false
    },
    "tags": ["production", "ubuntu", "primary"],
    "isDefault": true
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Production Ubuntu Server",
    "connectionType": "ssh",
    "host": "192.168.1.100",
    "port": 22,
    "username": "ubuntu",
    "isValid": false,
    "lastValidated": null,
    "tags": ["production", "ubuntu", "primary"]
  },
  "message": "Server connection created successfully"
}
```

### Step 2: Validate the Connection

Before deploying, validate that the connection works:

```bash
curl -X POST http://localhost:3000/api/server-connections/507f1f77bcf86cd799439011/validate \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "connectionId": "507f1f77bcf86cd799439011",
    "connectionType": "ssh",
    "host": "192.168.1.100",
    "port": 22,
    "isValid": true,
    "testResult": "✓ Connection successful\n/home/ubuntu\n",
    "validatedAt": "2026-03-18T15:30:00Z"
  }
}
```

### Step 3: Test a Command (Optional)

Execute a test command to verify command execution works:

```bash
curl -X POST http://localhost:3000/api/server-connections/507f1f77bcf86cd799439011/test-command \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "docker --version && docker ps -q | wc -l"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "connectionId": "507f1f77bcf86cd799439011",
    "command": "docker --version && docker ps -q | wc -l",
    "output": "Docker version 20.10.21, build baeda1f\n3",
    "executedAt": "2026-03-18T15:35:00Z"
  }
}
```

### Step 4: Deploy Template to Server Connection

```bash
curl -X POST http://localhost:3000/api/deployments/from-template \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "nextjs-docker-github",
    "serverConnectionId": "507f1f77bcf86cd799439011",
    "templateParams": {
      "APP_NAME": "doez-prod",
      "GITHUB_REGISTRY": "ghcr.io",
      "GITHUB_OWNER": "nimblecoders",
      "DOCKER_IMAGE": "ghcr.io/nimblecoders/doez:latest",
      "NODE_ENV": "production",
      "MONGODB_URI": "mongodb+srv://user:pass@cluster.mongodb.net/doez",
      "JWT_SECRET": "your-secret-key-here-min-32-chars",
      "PORT": 3000
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deploymentId": "60d5ec49c1234567890abcde",
    "jobId": "job-001",
    "templateId": "nextjs-docker-github",
    "templateName": "Next.js Docker with GitHub Container Registry",
    "status": "queued",
    "estimatedTime": "30 minutes",
    "message": "Deployment queued using template: Next.js Docker with GitHub Container Registry on server Production Ubuntu Server"
  },
  "timestamp": 1710764100000
}
```

### Step 5: Monitor Deployment Progress

```bash
curl http://localhost:3000/api/deployments/60d5ec49c1234567890abcde \
  -H "Authorization: Bearer {jwt_token}"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49c1234567890abcde",
    "userId": "user-001",
    "templateId": "nextjs-docker-github",
    "templateName": "Next.js Docker with GitHub Container Registry",
    "serverConnectionId": "507f1f77bcf86cd799439011",
    "status": "running",
    "currentStep": 3,
    "totalSteps": 5,
    "logs": [
      {
        "timestamp": "2026-03-18T15:30:00Z",
        "level": "info",
        "message": "Deployment execution started"
      },
      {
        "timestamp": "2026-03-18T15:30:05Z",
        "level": "success",
        "message": "✓ Connected to server: 192.168.1.100"
      },
      {
        "timestamp": "2026-03-18T15:30:10Z",
        "level": "info",
        "message": "Step 1/5: Pull Docker image"
      },
      {
        "timestamp": "2026-03-18T15:35:00Z",
        "level": "success",
        "message": "Step 3/5: Container running successfully"
      }
    ],
    "parameters": {
      "APP_NAME": "doez-prod",
      "NODE_ENV": "production"
    },
    "createdAt": "2026-03-18T15:30:00Z",
    "updatedAt": "2026-03-18T15:35:00Z"
  }
}
```

---

## Using Different Connection Types

### SSH with Password Authentication

```bash
curl -X POST http://localhost:3000/api/server-connections \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Staging Server",
    "connectionType": "ssh",
    "host": "staging.internal.com",
    "port": 22,
    "username": "deploy",
    "authMethod": "password",
    "auth": {
      "password": "your-password-here"
    },
    "tags": ["staging"]
  }'
```

### SSH with Private Key

```bash
curl -X POST http://localhost:3000/api/server-connections \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Primary",
    "connectionType": "ssh",
    "host": "prod-01.example.com",
    "port": 2222,
    "username": "ubuntu",
    "authMethod": "private-key",
    "auth": {
      "privateKey": "-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----",
      "privateKeyPassphrase": "optional-passphrase"
    },
    "sshSettings": {
      "timeout": 30000,
      "readyTimeout": 20000,
      "strictHostKeyChecking": false
    }
  }'
```

### HTTP API Endpoint

```bash
curl -X POST http://localhost:3000/api/server-connections \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Health Check",
    "connectionType": "https",
    "host": "api.example.com",
    "port": 443,
    "username": "health-check",
    "authMethod": "token",
    "auth": {
      "token": "your-bearer-token-here"
    }
  }'
```

---

## Database Models Integration

### Updated Deployment Model

The Deployment model now includes `serverConnectionId` field:

```typescript
export interface IDeployment extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  templateName: string;
  credentialId: mongoose.Types.ObjectId;
  serverConnectionId?: mongoose.Types.ObjectId;  // ← NEW FIELD
  provider: string;
  status: DeploymentStatus;
  parameters: Record<string, string | number | boolean>;
  currentStep: number;
  totalSteps: number;
  logs: DeploymentLog[];
  startedAt: Date | null;
  completedAt: Date | null;
  // ... other fields
}
```

### Deployment Processor Updates

The deployment processor now:

1. **Validates Server Connection** - Fetches and verifies connection is valid before deployment
2. **Loads SSH Credentials** - Uses server connection credentials instead of parameters
3. **Establishes SSH Connection** - Connects to remote server using provided credentials
4. **Executes Template Steps** - Runs all template steps on the remote server
5. **Tracks Logs** - Records connection status, step progress, and errors
6. **Handles Failures** - Gracefully handles SSH connection failures with detailed error messages

---

## Error Handling

### Connection Not Validated

```json
{
  "success": false,
  "error": "Server connection is not validated. Please validate before deploying.",
  "status": 400
}
```

### Connection Not Found

```json
{
  "success": false,
  "error": "Server connection not found",
  "status": 404
}
```

### SSH Connection Failure

```json
{
  "success": true,
  "data": {
    "status": "failed",
    "logs": [
      {
        "timestamp": "2026-03-18T15:30:00Z",
        "level": "error",
        "message": "✗ SSH connection failed: ECONNREFUSED 192.168.1.100:22"
      }
    ]
  }
}
```

---

## API Endpoints Reference

### Server Connections

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/server-connections` | List all server connections |
| POST | `/api/server-connections` | Create new server connection |
| GET | `/api/server-connections/[id]` | Get connection details |
| PUT | `/api/server-connections/[id]` | Update server connection |
| DELETE | `/api/server-connections/[id]` | Delete server connection |
| POST | `/api/server-connections/[id]/validate` | Validate connection |
| POST | `/api/server-connections/[id]/test-command` | Execute test command |

### Deployments with Templates

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/deployments/from-template` | Deploy template to server |
| GET | `/api/deployments/[id]` | Get deployment details |
| PATCH | `/api/deployments/[id]` | Update deployment status |
| DELETE | `/api/deployments/[id]` | Cancel deployment |

---

## Best Practices

### 1. Always Validate Before Deploying

```bash
# Step 1: Create connection
POST /api/server-connections

# Step 2: Validate connection
POST /api/server-connections/[id]/validate

# Step 3: Test command (optional)
POST /api/server-connections/[id]/test-command

# Step 4: Deploy template
POST /api/deployments/from-template
```

### 2. Use Private Keys for Production

```json
{
  "authMethod": "private-key",
  "auth": {
    "privateKey": "-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----"
  }
}
```

### 3. Tag Connections for Easy Management

```json
{
  "tags": ["production", "us-east-1", "primary"]
}
```

### 4. Monitor Deployment Logs

```bash
# Poll for deployment status
while true; do
  curl http://localhost:3000/api/deployments/[id] \
    -H "Authorization: Bearer {token}"
  sleep 5
done
```

### 5. Handle SSH Key Passphrases

```json
{
  "authMethod": "private-key",
  "auth": {
    "privateKey": "-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----",
    "privateKeyPassphrase": "your-passphrase"
  }
}
```

---

## Troubleshooting

### Template Deployment Fails: "Server connection not found"

**Cause:** The `serverConnectionId` doesn't exist or doesn't belong to the user.

**Solution:**
1. Verify the connection ID is correct
2. Ensure you're using the same authentication token for deployment
3. Get the correct connection ID: `GET /api/server-connections`

### SSH Connection Times Out

**Cause:** Server is unreachable or firewall is blocking connection.

**Solution:**
1. Verify host IP/hostname is correct
2. Check server firewall allows SSH port (usually 22)
3. Test connection manually: `ssh -i key.pem user@host`
4. Increase timeout in sshSettings: `"timeout": 60000`

### Command Execution Returns Empty Output

**Cause:** Command executed successfully but produced no output.

**Solution:**
1. This is normal for commands like `docker pull` or data modification
2. Add output to test: `docker ps; echo OK` or `ls -la`

### "Connection not validated" Error

**Cause:** Server connection status shows `isValid: false`.

**Solution:**
1. Run validation endpoint: `POST /api/server-connections/[id]/validate`
2. Check connection details are correct
3. Verify server is running and accessible

---

## Monitoring & Logs

### Real-Time Deployment Monitoring

```javascript
// Poll for updates every 5 seconds
const pollDeployment = async (deploymentId) => {
  const interval = setInterval(async () => {
    const response = await fetch(`/api/deployments/${deploymentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { data } = await response.json();

    // Log new messages
    console.log(`[${data.status}] Step ${data.currentStep}/${data.totalSteps}`);
    data.logs.forEach(log => {
      console.log(`[${log.level}] ${log.message}`);
    });

    // Stop polling when complete
    if (data.status === 'completed' || data.status === 'failed') {
      clearInterval(interval);
    }
  }, 5000);
};
```

### Deployment Log Levels

- `info` - General information
- `success` - Successful operation
- `warning` - Warning but continues
- `error` - Error occurred

---

## Next Steps

1. **Create your first server connection** - Add a test server
2. **Validate the connection** - Run validation tests
3. **Deploy a template** - Execute a template on the server
4. **Monitor logs** - Track deployment progress
5. **Troubleshoot issues** - Use logs to diagnose problems

---

## Support

For detailed information:
- Server Connections: See `SERVER_CONNECTIONS.md`
- Templates: See `TEMPLATE_SYSTEM.md`
- Deployments: See `IMPLEMENTATION_GUIDE.md`

