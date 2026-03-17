# Contributing to OpenDeploy

Thank you for your interest in contributing to OpenDeploy! We welcome contributions from the community.

## Code of Conduct

Be respectful and constructive in all interactions with other contributors.

## How to Contribute

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR-USERNAME/doez.git
cd doez
```

### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or for bug fixes:
git checkout -b fix/bug-description
```

### 3. Setup Development Environment

Follow the [SETUP.md](./SETUP.md) guide to get your development environment ready.

### 4. Make Your Changes

- Write clear, descriptive commit messages
- Follow the existing code style
- Add comments for complex logic
- Ensure TypeScript types are correct

### 5. Test Your Changes

```bash
# Run linter
pnpm lint

# Format code
pnpm format

# Build to check for errors
pnpm build
```

### 6. Commit and Push

```bash
# Commit with a descriptive message
git commit -m "feat: add new feature"
# or
git commit -m "fix: resolve issue with xyz"

# Push to your fork
git push origin feature/your-feature-name
```

### 7. Create a Pull Request

- Go to the original repository on GitHub
- Click "New Pull Request"
- Select your branch
- Write a clear description of your changes
- Reference any related issues (#123)
- Submit the PR

## Commit Message Guidelines

Use conventional commits for clarity:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (formatting, etc)
- `refactor`: Code change without feature or bug fix
- `perf`: Performance improvements
- `test`: Adding missing tests
- `chore`: Changes to build process or dependencies

Examples:
```
feat(auth): add two-factor authentication
fix(dashboard): resolve navigation menu overlap
docs(setup): add MongoDB Atlas instructions
```

## Code Style

- Use TypeScript for all new code
- Follow the existing code structure
- Use 2 spaces for indentation
- Use single quotes for strings (per Prettier config)
- Add JSDoc comments for exported functions

## Areas to Contribute

### High Priority (Phase 8-9)

- [ ] Monitoring & alerts system
- [ ] Server provisioning
- [ ] Docker orchestration
- [ ] Real-time log streaming
- [ ] RBAC system

### Documentation

- API documentation
- Architecture diagrams
- Video tutorials
- Troubleshooting guides

### Testing

- Unit tests
- Integration tests
- E2E tests with Playwright

### DevOps

- GitHub Actions CI/CD
- Docker setup
- Kubernetes manifests

## Review Process

1. A maintainer will review your PR
2. They may request changes
3. Once approved, your changes will be merged
4. Your contribution will be credited!

## Questions?

- Open a GitHub Discussion
- Check existing Issues
- Read the README and documentation

## Getting Started with an Issue

Look for issues labeled:
- `good first issue` - Perfect for newcomers
- `help wanted` - Areas where we need contributions
- `documentation` - Documentation improvements

## Development Workflow

```
1. Select an issue or propose a feature
2. Create a discussion or comment on the issue
3. Get feedback from maintainers
4. Create a feature branch
5. Make your changes
6. Submit a PR
7. Get reviewed and merged
```

Happy coding! 🚀
