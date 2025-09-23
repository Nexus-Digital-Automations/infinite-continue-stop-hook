# Quality Gates and Pre-Commit Hooks Guide

## Overview

This project implements comprehensive quality gates to ensure code quality, security, and maintainability. The system consists of pre-commit hooks, CI/CD pipelines, and automated quality checks that prevent issues from entering the codebase.

## 🛡️ Quality Gate Architecture

### Pre-Commit Hooks (Local Development)
- **Lint-staged**: Efficient processing of staged files only
- **ESLint**: Code quality and style enforcement
- **Prettier**: Automatic code formatting
- **Semgrep**: Security vulnerability detection
- **Commitlint**: Conventional commit message validation
- **Test Validation**: Quick syntax and critical test checks
- **Dependency Security**: npm audit for vulnerable packages

### CI/CD Pipeline (GitHub Actions)
- **Code Quality**: ESLint, Prettier validation
- **Security Scanning**: Comprehensive Semgrep analysis
- **Test Coverage**: Coverage thresholds and reporting
- **Performance Testing**: Application startup and performance metrics
- **Build Validation**: Ensure application builds and starts correctly

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Husky (if not already done)
```bash
npm run prepare
```

### 3. Test Pre-Commit Hooks
```bash
# Stage some files and try to commit
git add .
git commit -m "test: validate pre-commit hooks"
```

## 📋 Pre-Commit Hook Stages

### Stage 0: Commit Message Validation
- **Tool**: Commitlint
- **Purpose**: Ensures conventional commit format
- **Example**: `feat: add user authentication`
- **Config**: `commitlint.config.js`

### Stage 1: Lint-Staged Processing
- **Tool**: lint-staged + ESLint + Prettier + Semgrep
- **Purpose**: Efficient quality checks on staged files only
- **Performance**: ~10-30 seconds (vs 2-5 minutes for full checks)
- **Config**: `.lintstagedrc.js`

### Stage 2: Security Validation
- **Tool**: Semgrep (comprehensive scan)
- **Purpose**: Detect security vulnerabilities in code
- **Scope**: OWASP Top 10, security audit rules
- **Performance**: ~15-60 seconds depending on changes

### Stage 3: Test Validation
- **Tool**: Jest (selective test execution)
- **Purpose**: Ensure core functionality isn't broken
- **Scope**: API tests for core changes, quick syntax validation
- **Performance**: ~30-60 seconds

### Stage 4: Package Validation
- **Tool**: npm audit + JSON validation
- **Purpose**: Dependency security and package.json validation
- **Triggers**: Changes to package.json or package-lock.json

### Stage 5: Final Quality Checks
- **Purpose**: Large file detection, debugging code warnings
- **Scope**: File size limits, TODO/FIXME detection
- **Interactive**: Prompts for confirmation on issues

## 🔧 Configuration Files

### ESLint Configuration (`eslint.config.js`)
- **Base**: ESLint 9 flat configuration
- **Plugins**: Security, Node.js best practices
- **Rules**: Zero-tolerance for common issues
- **Performance**: Optimized for CommonJS patterns

### Prettier Configuration (`.prettierrc`)
- **Style**: Single quotes, semicolons, 2-space indentation
- **Line Length**: 80 characters (readability optimized)
- **Overrides**: JSON (120 chars), Markdown (preserve prose)

### Lint-staged Configuration (`.lintstagedrc.js`)
- **JavaScript**: ESLint + Prettier + git add
- **TypeScript**: ESLint + Prettier + type checking + git add
- **JSON**: Prettier formatting + syntax validation
- **Security**: Semgrep scan on all relevant files

### Commitlint Configuration (`commitlint.config.js`)
- **Format**: Conventional commits
- **Types**: feat, fix, docs, style, refactor, test, chore, etc.
- **Rules**: 72 char header, sentence case, no trailing period

## 🔒 Security Scanning

### Pre-Commit Security (Semgrep)
- **Rules**: p/security-audit, p/owasp-top-ten
- **Scope**: Staged files only (performance optimization)
- **Action**: Blocks commit on security issues

### CI/CD Security (Comprehensive)
- **Tools**: Semgrep + npm audit
- **Scope**: Full codebase scan
- **Reporting**: Artifacts uploaded for review
- **Action**: Blocks merge on critical issues

## 📊 Test Coverage Requirements

### Local Pre-Commit
- **Scope**: Quick syntax validation
- **Performance**: API tests only for core changes
- **Threshold**: Basic functionality validation

### CI/CD Pipeline
- **Scope**: Full test suite with coverage
- **Thresholds**:
  - Lines: 80%
  - Functions: 80%
  - Branches: 75%
  - Statements: 80%
- **Action**: Blocks merge if thresholds not met

## ⚡ Performance Optimization

### Lint-Staged Benefits
- **Speed**: 10-30 seconds vs 2-5 minutes for full checks
- **Efficiency**: Only processes changed files
- **Developer Experience**: Fast feedback loop

### Selective Test Execution
- **API Tests**: Only for core file changes
- **Quick Tests**: Syntax validation for all changes
- **Full Suite**: CI/CD pipeline only

### Caching Strategy
- **Node Modules**: GitHub Actions cache
- **ESLint**: Built-in caching
- **Test Results**: Jest cache optimization

## 🚨 Troubleshooting

### Common Pre-Commit Issues

#### ESLint Errors
```bash
# Auto-fix most issues
npm run lint:fix

# Manual review for complex issues
npm run lint
```

#### Prettier Formatting
```bash
# Fix all formatting issues
npx prettier --write .

# Check specific files
npx prettier --check src/**/*.js
```

#### Security Issues
```bash
# Review security findings
semgrep --config=p/security-audit <file>

# Fix dependency vulnerabilities
npm audit fix
```

#### Test Failures
```bash
# Run full test suite locally
npm test

# Run specific test categories
npm run test:api
npm run test:unit
```

### Bypass Options (Emergency Only)

#### Skip Pre-Commit Hooks
```bash
# NOT RECOMMENDED - Emergency only
git commit --no-verify -m "emergency: critical hotfix"
```

#### Override Coverage Thresholds
```bash
# Local override (interactive prompt)
# Responds 'y' when coverage check fails

# CI override
# Use workflow_dispatch with custom threshold
```

## 🎯 Quality Standards

### Code Quality Requirements
- **Zero Linting Errors**: All ESLint rules must pass
- **Consistent Formatting**: Prettier enforced
- **Security Clean**: No Semgrep violations
- **Test Coverage**: Maintain or improve coverage

### Commit Standards
- **Conventional Commits**: Required format
- **Descriptive Messages**: Clear intent and scope
- **Atomic Commits**: Single logical change per commit
- **No Debug Code**: Remove console.log, debugger statements

### Performance Standards
- **Build Time**: < 2 minutes for CI/CD
- **Test Execution**: < 5 minutes for full suite
- **Pre-Commit**: < 60 seconds for typical changes
- **Application Startup**: < 30 seconds validation

## 🔄 Continuous Improvement

### Monitoring and Metrics
- **Coverage Trends**: Track coverage changes over time
- **Performance Metrics**: Monitor build and test times
- **Security Findings**: Track and resolve security issues
- **Quality Gate Failures**: Identify and address common issues

### Tool Updates
- **ESLint**: Regular updates for new rules and patterns
- **Semgrep**: Security rule updates and new vulnerability detection
- **Dependencies**: Regular security and feature updates
- **Prettier**: Formatting standard evolution

### Developer Feedback
- **Hook Performance**: Optimize for developer experience
- **Rule Adjustments**: Balance quality with productivity
- **Documentation**: Keep guides current with tool changes

## 📚 Additional Resources

### Documentation
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semgrep Rules](https://semgrep.dev/p/security-audit)

### Scripts Reference
```bash
# Quality checks
npm run lint              # Run ESLint
npm run lint:fix          # Auto-fix ESLint issues
npx prettier --check .    # Check formatting
npx prettier --write .    # Fix formatting

# Testing
npm test                  # Full test suite
npm run test:api          # API tests only
npm run coverage          # Coverage report

# Security
semgrep --config=p/security-audit .  # Security scan
npm audit                            # Dependency audit

# Pre-commit simulation
npx lint-staged --dry-run  # Test lint-staged config
```

## 🎉 Benefits

### For Developers
- **Fast Feedback**: Issues caught early in development
- **Consistent Code**: Automated formatting and standards
- **Security Awareness**: Early detection of vulnerabilities
- **Quality Confidence**: Comprehensive validation before merge

### For Project
- **Maintainability**: Consistent code quality standards
- **Security**: Proactive vulnerability detection
- **Reliability**: Comprehensive testing and validation
- **Performance**: Optimized development workflow