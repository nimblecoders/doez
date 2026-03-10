import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Template from "@/lib/models/template";
import User from "@/lib/models/user";
import { verifySession } from "@/lib/auth";

const seedTemplates = [
  {
    name: "Ubuntu Server 22.04",
    version: "1.0.0",
    description: "Deploy a fresh Ubuntu 22.04 LTS server with basic security hardening, automatic updates, and essential tools pre-installed.",
    category: "server",
    provider: "any",
    icon: "server",
    parameters: [
      {
        name: "server_name",
        type: "string",
        label: "Server Name",
        description: "Hostname for the server",
        required: true,
      },
      {
        name: "instance_type",
        type: "select",
        label: "Instance Type",
        description: "Server size",
        required: true,
        options: ["small", "medium", "large", "xlarge"],
        default: "small",
      },
      {
        name: "enable_firewall",
        type: "boolean",
        label: "Enable Firewall",
        description: "Configure UFW firewall",
        required: false,
        default: true,
      },
    ],
    requirements: ["SSH access", "Root privileges"],
    steps: [
      { name: "update_system", description: "Update system packages", command: "apt-get update && apt-get upgrade -y" },
      { name: "install_essentials", description: "Install essential packages", command: "apt-get install -y curl wget git vim htop" },
      { name: "configure_firewall", description: "Configure UFW firewall", command: "ufw --force enable && ufw allow ssh" },
      { name: "enable_updates", description: "Enable automatic updates", command: "apt-get install -y unattended-upgrades && dpkg-reconfigure -plow unattended-upgrades" },
    ],
    estimatedTime: 10,
    tags: ["ubuntu", "linux", "server", "lts"],
    isPublic: true,
    isVerified: true,
  },
  {
    name: "MySQL 8.0 Docker",
    version: "1.0.0",
    description: "Deploy MySQL 8.0 database server using Docker with persistent storage, automatic backups, and optimized configuration.",
    category: "database",
    provider: "any",
    icon: "database",
    parameters: [
      {
        name: "root_password",
        type: "string",
        label: "Root Password",
        description: "MySQL root user password",
        required: true,
        secret: true,
      },
      {
        name: "database_name",
        type: "string",
        label: "Database Name",
        description: "Initial database to create",
        required: true,
      },
      {
        name: "port",
        type: "number",
        label: "Port",
        description: "MySQL port",
        required: false,
        default: 3306,
        validation: { min: 1024, max: 65535 },
      },
    ],
    requirements: ["Docker", "Docker Compose"],
    steps: [
      { name: "create_directories", description: "Create data directories", command: "mkdir -p /var/lib/mysql-data /var/lib/mysql-backup" },
      { name: "pull_image", description: "Pull MySQL Docker image", command: "docker pull mysql:8.0" },
      { name: "run_container", description: "Start MySQL container", command: "docker run -d --name mysql -e MYSQL_ROOT_PASSWORD={{root_password}} -e MYSQL_DATABASE={{database_name}} -v /var/lib/mysql-data:/var/lib/mysql -p {{port}}:3306 --restart unless-stopped mysql:8.0" },
      { name: "configure_firewall", description: "Allow MySQL port", command: "ufw allow {{port}}/tcp" },
    ],
    estimatedTime: 5,
    tags: ["mysql", "database", "docker", "sql"],
    isPublic: true,
    isVerified: true,
  },
  {
    name: "PostgreSQL 15 Docker",
    version: "1.0.0",
    description: "Deploy PostgreSQL 15 database with pgAdmin, persistent storage, and production-ready configuration.",
    category: "database",
    provider: "any",
    icon: "database",
    parameters: [
      {
        name: "postgres_password",
        type: "string",
        label: "Postgres Password",
        description: "PostgreSQL superuser password",
        required: true,
        secret: true,
      },
      {
        name: "database_name",
        type: "string",
        label: "Database Name",
        description: "Initial database to create",
        required: true,
      },
      {
        name: "port",
        type: "number",
        label: "Port",
        description: "PostgreSQL port",
        required: false,
        default: 5432,
      },
    ],
    requirements: ["Docker", "Docker Compose"],
    steps: [
      { name: "create_directories", description: "Create data directory", command: "mkdir -p /var/lib/postgresql-data" },
      { name: "pull_image", description: "Pull PostgreSQL image", command: "docker pull postgres:15" },
      { name: "run_container", description: "Start PostgreSQL container", command: "docker run -d --name postgres -e POSTGRES_PASSWORD={{postgres_password}} -e POSTGRES_DB={{database_name}} -v /var/lib/postgresql-data:/var/lib/postgresql/data -p {{port}}:5432 --restart unless-stopped postgres:15" },
      { name: "configure_firewall", description: "Allow PostgreSQL port", command: "ufw allow {{port}}/tcp" },
    ],
    estimatedTime: 5,
    tags: ["postgresql", "database", "docker", "sql"],
    isPublic: true,
    isVerified: true,
  },
  {
    name: "Redis Cache Server",
    version: "1.0.0",
    description: "Deploy Redis 7 as a high-performance in-memory cache with persistence and password protection.",
    category: "cache",
    provider: "any",
    icon: "zap",
    parameters: [
      {
        name: "redis_password",
        type: "string",
        label: "Redis Password",
        description: "Authentication password",
        required: true,
        secret: true,
      },
      {
        name: "max_memory",
        type: "select",
        label: "Max Memory",
        description: "Maximum memory allocation",
        required: true,
        options: ["256mb", "512mb", "1gb", "2gb", "4gb"],
        default: "512mb",
      },
      {
        name: "port",
        type: "number",
        label: "Port",
        description: "Redis port",
        required: false,
        default: 6379,
      },
    ],
    requirements: ["Docker"],
    steps: [
      { name: "pull_image", description: "Pull Redis image", command: "docker pull redis:7-alpine" },
      { name: "create_config", description: "Create Redis config", command: "echo 'requirepass {{redis_password}}\nmaxmemory {{max_memory}}\nmaxmemory-policy allkeys-lru' > /etc/redis.conf" },
      { name: "run_container", description: "Start Redis container", command: "docker run -d --name redis -v /etc/redis.conf:/usr/local/etc/redis/redis.conf -p {{port}}:6379 --restart unless-stopped redis:7-alpine redis-server /usr/local/etc/redis/redis.conf" },
    ],
    estimatedTime: 3,
    tags: ["redis", "cache", "docker", "nosql"],
    isPublic: true,
    isVerified: true,
  },
  {
    name: "MongoDB 7 Replica Set",
    version: "1.0.0",
    description: "Deploy MongoDB 7 with authentication, replica set configuration, and automatic backups.",
    category: "database",
    provider: "any",
    icon: "database",
    parameters: [
      {
        name: "admin_password",
        type: "string",
        label: "Admin Password",
        description: "MongoDB admin password",
        required: true,
        secret: true,
      },
      {
        name: "database_name",
        type: "string",
        label: "Database Name",
        description: "Initial database to create",
        required: true,
      },
      {
        name: "port",
        type: "number",
        label: "Port",
        description: "MongoDB port",
        required: false,
        default: 27017,
      },
    ],
    requirements: ["Docker"],
    steps: [
      { name: "create_directories", description: "Create data directory", command: "mkdir -p /var/lib/mongodb-data" },
      { name: "pull_image", description: "Pull MongoDB image", command: "docker pull mongo:7" },
      { name: "run_container", description: "Start MongoDB container", command: "docker run -d --name mongodb -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD={{admin_password}} -e MONGO_INITDB_DATABASE={{database_name}} -v /var/lib/mongodb-data:/data/db -p {{port}}:27017 --restart unless-stopped mongo:7" },
      { name: "configure_firewall", description: "Allow MongoDB port", command: "ufw allow {{port}}/tcp" },
    ],
    estimatedTime: 5,
    tags: ["mongodb", "database", "docker", "nosql"],
    isPublic: true,
    isVerified: true,
  },
  {
    name: "Nginx Reverse Proxy",
    version: "1.0.0",
    description: "Deploy Nginx as a reverse proxy with SSL termination, load balancing, and caching.",
    category: "server",
    provider: "any",
    icon: "globe",
    parameters: [
      {
        name: "domain",
        type: "string",
        label: "Domain Name",
        description: "Primary domain for the proxy",
        required: true,
      },
      {
        name: "backend_url",
        type: "string",
        label: "Backend URL",
        description: "Backend server URL (e.g., http://localhost:3000)",
        required: true,
      },
      {
        name: "enable_ssl",
        type: "boolean",
        label: "Enable SSL",
        description: "Configure Let's Encrypt SSL",
        required: false,
        default: true,
      },
    ],
    requirements: ["Docker", "Domain DNS configured"],
    steps: [
      { name: "pull_image", description: "Pull Nginx image", command: "docker pull nginx:alpine" },
      { name: "create_config", description: "Create Nginx configuration", command: "mkdir -p /etc/nginx/conf.d && cat > /etc/nginx/conf.d/default.conf << 'EOF'\nserver {\n  listen 80;\n  server_name {{domain}};\n  location / {\n    proxy_pass {{backend_url}};\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n  }\n}\nEOF" },
      { name: "run_container", description: "Start Nginx container", command: "docker run -d --name nginx -v /etc/nginx/conf.d:/etc/nginx/conf.d -p 80:80 -p 443:443 --restart unless-stopped nginx:alpine" },
    ],
    estimatedTime: 5,
    tags: ["nginx", "proxy", "docker", "web"],
    isPublic: true,
    isVerified: true,
  },
  {
    name: "Docker Compose Stack",
    version: "1.0.0",
    description: "Deploy a complete Docker Compose stack with Traefik, monitoring, and automatic container updates.",
    category: "container",
    provider: "any",
    icon: "layers",
    parameters: [
      {
        name: "stack_name",
        type: "string",
        label: "Stack Name",
        description: "Name for the Docker stack",
        required: true,
      },
      {
        name: "email",
        type: "string",
        label: "Admin Email",
        description: "Email for SSL certificates",
        required: true,
      },
    ],
    requirements: ["Docker", "Docker Compose"],
    steps: [
      { name: "install_compose", description: "Install Docker Compose", command: "apt-get install -y docker-compose-plugin" },
      { name: "create_network", description: "Create Docker network", command: "docker network create {{stack_name}}-network || true" },
      { name: "create_volumes", description: "Create Docker volumes", command: "docker volume create {{stack_name}}-data" },
    ],
    estimatedTime: 10,
    tags: ["docker", "compose", "container", "stack"],
    isPublic: true,
    isVerified: true,
  },
  {
    name: "RabbitMQ Message Queue",
    version: "1.0.0",
    description: "Deploy RabbitMQ with management UI, clustering support, and persistent queues.",
    category: "queue",
    provider: "any",
    icon: "mail",
    parameters: [
      {
        name: "admin_user",
        type: "string",
        label: "Admin Username",
        description: "RabbitMQ admin username",
        required: true,
        default: "admin",
      },
      {
        name: "admin_password",
        type: "string",
        label: "Admin Password",
        description: "RabbitMQ admin password",
        required: true,
        secret: true,
      },
      {
        name: "port",
        type: "number",
        label: "AMQP Port",
        description: "RabbitMQ AMQP port",
        required: false,
        default: 5672,
      },
    ],
    requirements: ["Docker"],
    steps: [
      { name: "pull_image", description: "Pull RabbitMQ image", command: "docker pull rabbitmq:3-management-alpine" },
      { name: "run_container", description: "Start RabbitMQ container", command: "docker run -d --name rabbitmq -e RABBITMQ_DEFAULT_USER={{admin_user}} -e RABBITMQ_DEFAULT_PASS={{admin_password}} -p {{port}}:5672 -p 15672:15672 --restart unless-stopped rabbitmq:3-management-alpine" },
      { name: "configure_firewall", description: "Allow RabbitMQ ports", command: "ufw allow {{port}}/tcp && ufw allow 15672/tcp" },
    ],
    estimatedTime: 5,
    tags: ["rabbitmq", "queue", "docker", "messaging"],
    isPublic: true,
    isVerified: true,
  },
  {
    name: "Prometheus + Grafana",
    version: "1.0.0",
    description: "Deploy complete monitoring stack with Prometheus for metrics collection and Grafana for visualization.",
    category: "monitoring",
    provider: "any",
    icon: "activity",
    parameters: [
      {
        name: "grafana_password",
        type: "string",
        label: "Grafana Admin Password",
        description: "Password for Grafana admin user",
        required: true,
        secret: true,
      },
      {
        name: "retention_days",
        type: "number",
        label: "Data Retention (days)",
        description: "How long to keep metrics data",
        required: false,
        default: 15,
      },
    ],
    requirements: ["Docker", "Docker Compose"],
    steps: [
      { name: "create_directories", description: "Create data directories", command: "mkdir -p /var/lib/prometheus /var/lib/grafana" },
      { name: "pull_images", description: "Pull monitoring images", command: "docker pull prom/prometheus && docker pull grafana/grafana" },
      { name: "run_prometheus", description: "Start Prometheus", command: "docker run -d --name prometheus -v /var/lib/prometheus:/prometheus -p 9090:9090 --restart unless-stopped prom/prometheus --storage.tsdb.retention.time={{retention_days}}d" },
      { name: "run_grafana", description: "Start Grafana", command: "docker run -d --name grafana -e GF_SECURITY_ADMIN_PASSWORD={{grafana_password}} -v /var/lib/grafana:/var/lib/grafana -p 3001:3000 --restart unless-stopped grafana/grafana" },
    ],
    estimatedTime: 10,
    tags: ["prometheus", "grafana", "monitoring", "docker"],
    isPublic: true,
    isVerified: true,
  },
  {
    name: "Node.js Application",
    version: "1.0.0",
    description: "Deploy a Node.js application with PM2 process manager, Nginx reverse proxy, and automatic restarts.",
    category: "application",
    provider: "any",
    icon: "code",
    parameters: [
      {
        name: "app_name",
        type: "string",
        label: "Application Name",
        description: "Name for the PM2 process",
        required: true,
      },
      {
        name: "git_repo",
        type: "string",
        label: "Git Repository URL",
        description: "URL of the Git repository",
        required: true,
      },
      {
        name: "node_version",
        type: "select",
        label: "Node.js Version",
        description: "Node.js version to install",
        required: true,
        options: ["18", "20", "22"],
        default: "20",
      },
      {
        name: "port",
        type: "number",
        label: "Application Port",
        description: "Port the application runs on",
        required: false,
        default: 3000,
      },
    ],
    requirements: ["Git"],
    steps: [
      { name: "install_node", description: "Install Node.js", command: "curl -fsSL https://deb.nodesource.com/setup_{{node_version}}.x | bash - && apt-get install -y nodejs" },
      { name: "install_pm2", description: "Install PM2", command: "npm install -g pm2" },
      { name: "clone_repo", description: "Clone application", command: "git clone {{git_repo}} /var/www/{{app_name}}" },
      { name: "install_deps", description: "Install dependencies", command: "cd /var/www/{{app_name}} && npm install --production" },
      { name: "start_app", description: "Start application", command: "cd /var/www/{{app_name}} && pm2 start npm --name {{app_name}} -- start && pm2 save && pm2 startup" },
    ],
    estimatedTime: 15,
    tags: ["nodejs", "application", "pm2", "javascript"],
    isPublic: true,
    isVerified: true,
  },
  {
    name: "Fail2Ban Security",
    version: "1.0.0",
    description: "Install and configure Fail2Ban to protect against brute force attacks on SSH and other services.",
    category: "security",
    provider: "any",
    icon: "shield",
    parameters: [
      {
        name: "ban_time",
        type: "number",
        label: "Ban Time (seconds)",
        description: "How long to ban offending IPs",
        required: false,
        default: 3600,
      },
      {
        name: "max_retry",
        type: "number",
        label: "Max Retries",
        description: "Failed attempts before ban",
        required: false,
        default: 5,
      },
    ],
    requirements: ["Root access"],
    steps: [
      { name: "install_fail2ban", description: "Install Fail2Ban", command: "apt-get install -y fail2ban" },
      { name: "configure_jail", description: "Configure jail settings", command: "cat > /etc/fail2ban/jail.local << 'EOF'\n[DEFAULT]\nbantime = {{ban_time}}\nmaxretry = {{max_retry}}\n\n[sshd]\nenabled = true\nport = ssh\nfilter = sshd\nlogpath = /var/log/auth.log\nEOF" },
      { name: "restart_service", description: "Restart Fail2Ban", command: "systemctl restart fail2ban && systemctl enable fail2ban" },
    ],
    estimatedTime: 5,
    tags: ["security", "fail2ban", "firewall", "protection"],
    isPublic: true,
    isVerified: true,
  },
  {
    name: "AWS EC2 Instance",
    version: "1.0.0",
    description: "Launch an AWS EC2 instance with your preferred AMI, instance type, and security group configuration.",
    category: "server",
    provider: "aws",
    icon: "cloud",
    parameters: [
      {
        name: "instance_name",
        type: "string",
        label: "Instance Name",
        description: "Name tag for the EC2 instance",
        required: true,
      },
      {
        name: "instance_type",
        type: "select",
        label: "Instance Type",
        description: "EC2 instance type",
        required: true,
        options: ["t2.micro", "t2.small", "t2.medium", "t3.micro", "t3.small", "t3.medium"],
        default: "t2.micro",
      },
      {
        name: "ami_id",
        type: "string",
        label: "AMI ID",
        description: "Amazon Machine Image ID",
        required: true,
        default: "ami-0c55b159cbfafe1f0",
      },
    ],
    requirements: ["AWS credentials", "VPC configured"],
    steps: [
      { name: "create_security_group", description: "Create security group", command: "aws ec2 create-security-group --group-name {{instance_name}}-sg --description 'Security group for {{instance_name}}'" },
      { name: "authorize_ssh", description: "Allow SSH access", command: "aws ec2 authorize-security-group-ingress --group-name {{instance_name}}-sg --protocol tcp --port 22 --cidr 0.0.0.0/0" },
      { name: "launch_instance", description: "Launch EC2 instance", command: "aws ec2 run-instances --image-id {{ami_id}} --instance-type {{instance_type}} --security-groups {{instance_name}}-sg --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value={{instance_name}}}]'" },
    ],
    estimatedTime: 5,
    tags: ["aws", "ec2", "cloud", "server"],
    isPublic: true,
    isVerified: true,
  },
];

export async function POST() {
  try {
    const session = await verifySession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get admin user for author field
    const adminUser = await User.findById(session.userId);
    if (!adminUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check existing templates
    const existingCount = await Template.countDocuments();
    
    // Add author to each template
    const templatesWithAuthor = seedTemplates.map(template => ({
      ...template,
      author: {
        userId: adminUser._id,
        name: adminUser.name,
      },
    }));

    // Insert templates (skip duplicates by slug)
    const results = [];
    for (const template of templatesWithAuthor) {
      const existing = await Template.findOne({ slug: template.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") });
      if (!existing) {
        const created = await Template.create(template);
        results.push(created);
      }
    }

    return NextResponse.json({
      message: `Seeded ${results.length} templates`,
      previousCount: existingCount,
      newCount: existingCount + results.length,
      templates: results.map(t => ({ name: t.name, slug: t.slug })),
    });
  } catch (error) {
    console.error("Seed templates error:", error);
    return NextResponse.json(
      { error: "Failed to seed templates" },
      { status: 500 }
    );
  }
}
