# Server Connection Management Guide

**Version:** 1.0.0
**Date:** March 18, 2026

## Overview

The Server Connection system allows you to securely store and manage credentials for connecting to remote servers (SSH, HTTP, HTTPS, WinRM). These connections are used to execute deployment templates on specific servers.

---

## Connection Types

### SSH (Secure Shell)
- **Default Port:** 22
- **Authentication Methods:** Password, Private Key, Token
- **Use Cases:** Linux/Unix servers, Debian, Ubuntu, CentOS
- **Best For:** Template execution, remote command execution

### HTTP / HTTPS
- **Default Port:** 80 / 443
- **Authentication:** Bearer Token
- **Use Cases:** API endpoints, Web servers, REST services
- **Best For:** Health checks, API calls

### WinRM (Windows Remote Management)
- **Default Port:** 5985 / 5986
- **Authentication:** Username/Password
- **Use Cases:** Windows servers
- **Best For:** Windows deployments (future)

---

## API Endpoints

### List Server Connections
```bash
GET /api/server-connections
GET /api/server-connections?type=ssh
GET /api/server-connections?tag=production
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "connection-id",
      "name": "Production Server",
      "connectionType": "ssh",
      "host": "192.168.1.100",
      "port": 22,
      "username": "ubuntu",
      "isValid": true,
      "lastValidated": "2026-03-18T10:00:00Z",
      "tags": ["production", "primary"]
    }
  ],
  "count": 1
}
```

---

### Create Server Connection

```bash
POST /api/server-connections
Content-Type: application/json

{
  "name": "Production Server",
  "description": "Main production deployment server",
  "connectionType": "ssh",
  "host": "192.168.1.100",
  "port": 22,
  "username": "ubuntu",
  "authMethod": "private-key",
  "auth": {
    "privateKey": "-----BEGIN RSA PRIVATE KEY-----\n...",
    "privateKeyPassphrase": "optional-passphrase"
  },
  "sshSettings": {
    "timeout": 30000,
    "readyTimeout": 20000,
    "strictHostKeyChecking": false
  },
  "tags": ["production", "primary"],
  "isDefault": true
}
```

**Request Parameters:**
- `name` (required): Connection name
- `connectionType` (required): "ssh", "http", "https", "winrm"
- `host` (required): IP address or hostname
- `port` (required): Port number (1-65535)
- `username` (required): Username for authentication
- `authMethod` (required): "password", "private-key", or "token"
- `auth` (required): Authentication credentials object
- `tags` (optional): Array of tags for organization
- `isDefault` (optional): Set as default connection

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "connection-id",
    "name": "Production Server",
    ...
  },
  "message": "Server connection created successfully"
}
```

---

### Get Server Connection Details

```bash
GET /api/server-connections/[connection-id]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "connection-id",
    "name": "Production Server",
    "connectionType": "ssh",
    "host": "192.168.1.100",
    "port": 22,
    "username": "ubuntu",
    "authMethod": "private-key",
    "isValid": true,
    "lastValidated": "2026-03-18T10:00:00Z",
    "tags": ["production"]
  }
}
```

**Note:** Sensitive credentials (passwords, keys) are not returned in responses for security.

---

### Update Server Connection

```bash
PUT /api/server-connections/[connection-id]
Content-Type: application/json

{
  "name": "Updated Name",
  "port": 2222,
  "tags": ["production", "updated"],
  "auth": {
    "privateKey": "new-key-content"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Server connection updated successfully"
}
```

---

### Delete Server Connection

```bash
DELETE /api/server-connections/[connection-id]
```

**Response:**
```json
{
  "success": true,
  "data": { "deletedId": "connection-id" },
  "message": "Server connection deleted successfully"
}
```

---

## Validation & Testing

### Validate Connection

```bash
POST /api/server-connections/[connection-id]/validate
```

**Response:**
```json
{
  "success": true,
  "data": {
    "connectionId": "connection-id",
    "connectionType": "ssh",
    "host": "192.168.1.100",
    "port": 22,
    "isValid": true,
    "testResult": "✓ Connection successful\n/home/ubuntu",
    "validatedAt": "2026-03-18T10:00:00Z"
  }
}
```

---

### Execute Test Command

```bash
POST /api/server-connections/[connection-id]/test-command
Content-Type: application/json

{
  "command": "docker ps"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "connectionId": "connection-id",
    "command": "docker ps",
    "output": "CONTAINER ID   IMAGE     ...",
    "executedAt": "2026-03-18T10:00:00Z"
  }
}
```

---

## Authentication Methods

### SSH Password Authentication

```json
{
  "authMethod": "password",
  "auth": {
    "password": "your-password-here"
  }
}
```

### SSH Private Key Authentication

```json
{
  "authMethod": "private-key",
  "auth": {
    "privateKey": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...",
    "privateKeyPassphrase": "optional-passphrase"
  }
}
```

### HTTP/HTTPS Bearer Token

```json
{
  "authMethod": "token",
  "auth": {
    "token": "bearer-token-here"
  }
}
```

---

## SSH Settings

Configure SSH-specific behavior:

```json
"sshSettings": {
  "timeout": 30000,              // Connection timeout (ms)
  "readyTimeout": 20000,         // Ready timeout (ms)
  "strictHostKeyChecking": false, // Allow unknown hosts
  "knownHostsPath": "/home/user/.ssh/known_hosts"
}
```

---

## Usage with Templates

### Deploy Template to Specific Server

```bash
POST /api/deployments/from-template
Content-Type: application/json

{
  "templateId": "nextjs-docker-github",
  "serverConnectionId": "connection-id",
  "templateParams": {
    "APP_NAME": "my-app",
    "DOCKER_IMAGE": "ghcr.io/user/app:latest",
    "MONGODB_URI": "mongodb://...",
    "JWT_SECRET": "secret123"
  }
}
```

The deployment executor will:
1. Load the server connection
2. Establish SSH connection
3. Execute template steps on remote server
4. Stream logs back to client
5. Manage failures and rollback if needed

---

## Security Features

### ✅ Credential Encryption
- Sensitive data marked as `secret: true`
- Not returned in API responses
- Stored securely in database

### ✅ Access Control
- All endpoints require authentication
- Users can only access their own connections
- Session validation on every request

### ✅ Validation
- Connection type validation
- Port range validation (1-65535)
- Auth method validation

### ✅ Audit Trail
- Connection creation/update/deletion logged
- Command execution logged
- Validation attempts tracked

---

## Best Practices

### 1. Use Private Keys for Production
```json
{
  "authMethod": "private-key",
  "auth": {
    "privateKey": "generated-key-content"
  }
}
```

### 2. Tag Connections for Organization
```json
{
  "tags": ["production", "us-east-1", "nginx"]
}
```

### 3. Always Validate Before Deploying
```bash
POST /api/server-connections/[id]/validate
```

### 4. Use Specific Ports for SSH
If SSH runs on non-standard port:
```json
{
  "port": 2222
}
```

### 5. Set Connection Disabled if Not Used
Keep connections but mark as not default:
```json
{
  "isDefault": false
}
```

---

## Common Connection Examples

### Ubuntu Server via SSH Key
```json
{
  "name": "Ubuntu Prod",
  "connectionType": "ssh",
  "host": "deploy.example.com",
  "port": 22,
  "username": "ubuntu",
  "authMethod": "private-key",
  "auth": {
    "privateKey": "-----BEGIN OPENSSH PRIVATE KEY-----\n..."
  },
  "tags": ["linux", "production"]
}
```

### Staging Server via Password
```json
{
  "name": "Staging Server",
  "connectionType": "ssh",
  "host": "staging.internal",
  "port": 22,
  "username": "deploy",
  "authMethod": "password",
  "auth": {
    "password": "secure-password"
  },
  "tags": ["staging"]
}
```

### API Health Check via HTTP
```json
{
  "name": "Health Check API",
  "connectionType": "https",
  "host": "api.example.com",
  "port": 443,
  "username": "health-check",
  "authMethod": "token",
  "auth": {
    "token": "healthcheck-api-token"
  }
}
```

---

## Troubleshooting

### Connection Failed: "Host unreachable"
- Check host IP/hostname is correct
- Verify firewall allows port access
- Ensure SSH service is running on server

### Authentication Failed: "Invalid credentials"
- Verify username is correct
- Check password/key is correct if using password auth
- Ensure key permissions are 600 if using SSH key

### Connection Timeout
- Increase timeout value in sshSettings
- Check network connectivity
- Verify server is responding

### Command Execution Failed
- Test command manually on server
- Check user has permissions to run command
- Verify command syntax is correct

---

## Production Deployment

### 1. Set Up Secure SSH Keys
```bash
ssh-keygen -t rsa -b 4096 -f deploy_key
chmod 600 deploy_key
```

### 2. Add Public Key to Server
```bash
ssh-copy-id -i deploy_key.pub ubuntu@server.com
```

### 3. Create Connection in Dashboard
Use private key content from `deploy_key`

### 4. Validate Connection
```bash
POST /api/server-connections/[id]/validate
```

### 5. Test First Deployment
Run a simple template on the connection first

---

## API Security Headers

All requests should include:
```
Authorization: Bearer your-jwt-token
Content-Type: application/json
X-CSRF-Token: token-if-required
```

---

## Limits & Quotas

- **Max connections per user:** Unlimited
- **Max credentials (passwords/keys):** Unlimited
- **Command timeout:** 30 seconds (configurable)
- **Max command output:** 10MB
- **Connection validation cache:** 1 hour

---

## Integration with Deployment Templates

When a template is deployed to a server connection:

1. **Load Connection** - Retrieve connection from database
2. **Establish Connection** - Connect via SSH/HTTP/etc
3. **Execute Steps** - Run template steps sequentially
4. **Capture Output** - Stream logs to deployment record
5. **Handle Errors** - Rollback if configured
6. **Disconnect** - Clean up connection resources

---

## Next Steps

1. **Create your first connection** - Add your server
2. **Validate connection** - Test with validation endpoint
3. **Execute test command** - Verify command execution works
4. **Deploy template** - Use connection with a template
5. **Monitor execution** - Check deployment logs

---

## Support

For issues:
1. Validate connection first
2. Test command execution
3. Check firewall/network
4. Review connection parameters
5. Check server logs on remote host

