# 🚀 OpenDeploy

> Open Source No-Ops Cloud Deployment Platform  
> Deploy servers, databases, and full-stack applications with **one click** — no DevOps skills required.

---

## 🌍 Vision

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

## ✨ Features

### 🔐 Multi-Cloud Support
- AWS
- Google Cloud
- Azure
- DigitalOcean

### 📦 Template-Based Deployment
Deploy infrastructure using reusable templates:
- Docker-based services
- MySQL, PostgreSQL, MongoDB
- Node.js, PHP, Python apps
- Full-stack environments
- CI/CD pipelines
- Swap memory configuration
- Server security setup

### 🗂️ Template Categories
Templates are organized by:

- **Server-wise** (Ubuntu, CentOS, etc.)
- **Service-wise** (Database, Cache, Queue)
- **Operation-wise** (Security, Scaling, Monitoring)
- **Application-wise** (WordPress, MERN, SaaS Starter)
- **Container-wise** (Docker, Kubernetes)

### 🔎 Template Marketplace
- Search and discover templates
- Publish templates
- Version control support
- Community contributions

### 🔗 GitHub Template Import
- Import templates via GitHub repository URL
- Use external template libraries
- Plugin-style architecture
- YAML / JSON based structure

---

## 🏗️ Architecture

### Frontend
- React (Dashboard UI)

### Backend
- NestJS (API & orchestration layer)

### Infrastructure Engine
- Cloud SDK integrations
- SSH automation
- Docker orchestration
- Template parser system

---

## 🛠️ Tech Stack

| Layer        | Technology |
|-------------|------------|
| Frontend    | React |
| Backend     | NestJS |
| Database    | PostgreSQL / MongoDB |
| Containers  | Docker |
| Templates   | YAML / JSON |
| Cloud SDKs  | AWS SDK, GCP SDK, Azure SDK |

---

## ⚙️ How It Works

1. Connect your cloud provider
2. Select a template
3. Customize configuration (RAM, CPU, region, swap memory, etc.)
4. Click Deploy
5. OpenDeploy automatically:
   - Provisions servers
   - Installs services
   - Configures Docker
   - Applies security rules
   - Deploys applications

---

## 📂 Example Use Cases

- 🐳 Deploy MySQL using Docker
- 🔧 Add swap memory with one click
- 🌐 Deploy Node.js + Nginx server
- 📦 Launch full MERN stack
- 🔐 Apply firewall & security best practices

---

## 🔌 Template Structure (Example)

```yaml
name: mysql-docker-template
category: database
provider: any
parameters:
  - name: root_password
    required: true
  - name: port
    default: 3306
steps:
  - install_docker
  - run_mysql_container
  - configure_firewall
```

# Clone repository
git clone https://github.com/nimblecoders/doez.git

# Backend
cd backend
npm install
npm run start:dev

# Frontend
cd frontend
npm install
npm start
