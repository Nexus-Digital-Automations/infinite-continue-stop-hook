# CI/CD Troubleshooting Guide

## 🚨 Common Issues and Solutions

### Pre-commit Hook Issues

#### Issue: Git hooks not executing
**Symptoms:**
- No pre-commit validation when committing
- Hooks appear to be bypassed

**Solutions:**
```bash
# 1. Reinstall Husky
rm -rf .husky
npm run prepare

# 2. Make hooks executable (if needed)
chmod +x .husky/pre-commit
chmod +x .husky/pre-push

# 3. Check if hooks are properly installed
ls -la .husky/

# 4. Test hook execution
HUSKY_DEBUG=1 git commit -m "test commit"
```

#### Issue: Pre-commit hooks running too slowly
**Symptoms:**
- Hooks take longer than 2-3 minutes
- Timeouts during test execution

**Solutions:**
```bash
# 1. Run only API tests instead of full suite
# Edit .husky/pre-commit to use:
npm run test:api

# 2. Skip tests for minor changes
# Check if changes warrant full testing

# 3. Use incremental testing
# Only test changed files
```

#### Issue: Coverage validation failures
**Symptoms:**
- "Coverage threshold not met" errors
- Pre-commit hook blocks commits

**Solutions:**
```bash
# 1. Generate coverage report to see details
npm run coverage:html
open coverage/lcov-report/index.html

# 2. Add tests for uncovered code
# 3. Check if critical thresholds are met (allow commit with warning)
# 4. Temporary override for urgent fixes
git commit --no-verify -m "urgent fix"
```

### CI/CD Pipeline Failures

#### Issue: "Quick Validation" job failing
**Symptoms:**
- ESLint errors in CI but not locally
- Package.json validation failures

**Solutions:**
```bash
# 1. Run the same checks locally
npm run lint
node -e "JSON.parse(require('fs').readFileSync('package.json'))"

# 2. Check for environment differences
npm ls --depth=0

# 3. Verify Node.js version consistency
node --version  # Should match CI matrix

# 4. Clean install dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Issue: Test matrix jobs timing out
**Symptoms:**
- Jobs exceed 20-minute timeout
- Hanging test processes

**Solutions:**
```bash
# 1. Check for infinite loops or hanging promises
npm test -- --detectOpenHandles

# 2. Run tests in band to isolate issues
npm test -- --runInBand

# 3. Check for memory leaks
npm test -- --logHeapUsage

# 4. Review recent changes for async issues
git diff HEAD~1 -- test/
```

#### Issue: Coverage analysis failures
**Symptoms:**
- Coverage reports not generated
- Threshold validation errors

**Solutions:**
```bash
# 1. Test coverage generation locally
npm run coverage:monitor

# 2. Check Jest configuration
cat jest.config.js

# 3. Verify coverage file exists
ls -la coverage/

# 4. Debug coverage script
DEBUG=1 npm run coverage:monitor
```

#### Issue: Security scan failures
**Symptoms:**
- High/critical vulnerabilities detected
- Security audit blocking pipeline

**Solutions:**
```bash
# 1. Review audit results
npm audit

# 2. Attempt automatic fixes
npm audit fix

# 3. Update vulnerable dependencies
npm update

# 4. For false positives, document exceptions
# Create .npmauditrc with audit exceptions
```

### Performance Issues

#### Issue: CI/CD pipeline running too long
**Symptoms:**
- Total pipeline time > 30 minutes
- Resource consumption warnings

**Optimization strategies:**
```yaml
# 1. Optimize test matrix in .github/workflows/ci-cd-pipeline.yml
strategy:
  matrix:
    os: [ubuntu-latest]  # Reduce OS matrix for faster feedback
    node-version: ['20.x']  # Use single version for quick validation

# 2. Enable caching improvements
- uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}

# 3. Parallelize independent jobs
needs: []  # Remove unnecessary dependencies between jobs
```

#### Issue: Local development slowness
**Symptoms:**
- Pre-commit hooks take > 5 minutes
- Test execution very slow

**Solutions:**
```bash
# 1. Use focused testing during development
npm run test:api  # Instead of full test suite

# 2. Use watch mode for iterative development
npm run test:rag:watch

# 3. Optimize ESLint for speed
npm run lint:focused  # Only changed files

# 4. Skip hooks for rapid iteration (use sparingly)
git commit --no-verify -m "WIP: rapid iteration"
```

### Environment-Specific Issues

#### Issue: Windows-specific failures
**Symptoms:**
- Tests pass on Unix but fail on Windows
- Path-related errors

**Solutions:**
```javascript
// 1. Use cross-platform path handling
const path = require('path');
const filePath = path.join(__dirname, 'file.txt');

// 2. Handle line ending differences
git config core.autocrlf true

// 3. Use cross-platform scripts in package.json
"scripts": {
  "cross-platform-script": "cross-env NODE_ENV=test jest"
}
```

#### Issue: macOS-specific failures
**Symptoms:**
- File system case sensitivity issues
- Permission errors

**Solutions:**
```bash
# 1. Check file case consistency
find . -name "*.js" | grep -i duplicate

# 2. Fix permission issues
chmod +x scripts/*.js

# 3. Handle symlink differences
ls -la node_modules/.bin/
```

#### Issue: Node.js version compatibility
**Symptoms:**
- Features work on Node 20.x but fail on 18.x
- API compatibility issues

**Solutions:**
```javascript
// 1. Use feature detection instead of version checking
if (typeof structuredClone !== 'undefined') {
  // Use structuredClone (Node 17+)
} else {
  // Fallback implementation
}

// 2. Add polyfills for missing features
// 3. Update engines requirement in package.json
"engines": {
  "node": ">=20.0.0"  // If newer features required
}
```

### Quality Gate Bypasses

#### Emergency Hotfixes
When quality gates must be bypassed for critical production issues:

```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-issue

# 2. Make minimal changes
# 3. Commit with bypass
git commit --no-verify -m "hotfix: critical production issue"

# 4. Push with bypass
git push --force-with-lease

# 5. Create immediate follow-up task
# Document in GitHub issue:
# - Reason for bypass
# - Quality debt incurred
# - Plan to address quality issues
```

#### Temporary Quality Relaxation
For legitimate cases where strict quality gates prevent progress:

```yaml
# In workflow file, temporarily adjust thresholds
env:
  COVERAGE_THRESHOLD: '70'  # Reduced from 80
```

```bash
# Or override locally
COVERAGE_THRESHOLD=70 npm run coverage:check
```

### Debugging Workflow Failures

#### Access GitHub Actions Logs
1. Go to repository → Actions tab
2. Click on failed workflow run
3. Click on failed job
4. Expand failing step to see detailed logs

#### Download Artifacts
```bash
# Using GitHub CLI
gh run download [run-id]

# Or via web interface
# Actions → Workflow Run → Artifacts section
```

#### Debug Workflow Locally
```bash
# Use act to run GitHub Actions locally
npm install -g @nektos/act

# Run specific job
act -j test-matrix

# Run with specific Node version
act -j test-matrix --matrix node-version:20.x
```

### Recovery Procedures

#### Corrupted Git Hooks
```bash
# 1. Remove all hooks
rm -rf .husky

# 2. Reinstall from scratch
npm run prepare

# 3. Test installation
git commit --dry-run -m "test"
```

#### Corrupted Coverage Data
```bash
# 1. Clean coverage directory
npm run coverage:clean

# 2. Regenerate coverage
npm run coverage

# 3. Verify reports
ls -la coverage/
```

#### Broken Dependencies
```bash
# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Audit and fix
npm audit fix

# 3. Update if needed
npm update

# 4. Test installation
npm test
```

## 📞 Getting Help

### Internal Resources
1. **Repository Documentation**: `docs/ci-cd/`
2. **Workflow Files**: `.github/workflows/`
3. **Configuration Files**: `jest.config.js`, `eslint.config.mjs`

### External Resources
1. **GitHub Actions**: https://docs.github.com/en/actions
2. **Jest Testing**: https://jestjs.io/docs/troubleshooting
3. **ESLint**: https://eslint.org/docs/user-guide/troubleshooting
4. **Husky**: https://typicode.github.io/husky/

### Emergency Contacts
- **CI/CD Pipeline Issues**: Create GitHub issue with `ci-cd` label
- **Critical Production Issues**: Contact repository administrators
- **Security Vulnerabilities**: Follow security disclosure policy

## 🔧 Diagnostic Commands

### Quick Health Check
```bash
#!/bin/bash
echo "🏥 CI/CD Health Check"
echo "===================="

echo "📦 Node.js version:"
node --version

echo "📦 npm version:"
npm --version

echo "🔍 Package validation:"
npm ls --depth=0

echo "🧪 Quick test:"
npm run test:api

echo "🔍 Lint check:"
npm run lint

echo "📊 Coverage check:"
npm run coverage:check || echo "Coverage check failed"

echo "🔐 Security audit:"
npm audit --audit-level=high

echo "✅ Health check completed"
```

### Comprehensive Diagnostics
```bash
#!/bin/bash
echo "🔬 Comprehensive CI/CD Diagnostics"
echo "==================================="

# Environment info
echo "Environment:"
echo "- OS: $(uname -a)"
echo "- Node: $(node --version)"
echo "- npm: $(npm --version)"
echo "- Git: $(git --version)"

# Repository status
echo "Repository:"
echo "- Branch: $(git rev-parse --abbrev-ref HEAD)"
echo "- Commit: $(git rev-parse HEAD)"
echo "- Status: $(git status --porcelain)"

# Dependencies
echo "Dependencies:"
npm ls --depth=0 2>/dev/null || echo "Dependency issues detected"

# Test status
echo "Tests:"
npm test 2>&1 | tail -10

# Coverage status
echo "Coverage:"
npm run coverage:check 2>&1 | tail -5

# Security status
echo "Security:"
npm audit --audit-level=moderate 2>&1 | tail -10

echo "🎯 Diagnostics completed"
```

Save these commands as scripts for quick troubleshooting!