# Project Task Requirements - Universal Success Criteria

## 🚨 **MANDATORY SUCCESS CRITERIA FOR ALL FEATURE TASKS**

This file defines project-specific success criteria that ALL feature tasks must satisfy before completion. These requirements are automatically integrated into the 25-point audit system as baseline validation.

### **Build Requirements** (MANDATORY)
- [ ] **Clean Build**: `npm run build` completes without errors or warnings
- [ ] **No Build Artifacts**: Build process doesn't leave temporary files
- [ ] **Build Performance**: Build time remains within acceptable limits
- [ ] **Build Reproducibility**: Consistent builds across different environments

### **Runtime Requirements** (MANDATORY)  
- [ ] **Clean Startup**: `npm start` launches without errors
- [ ] **Service Health**: All required services start successfully
- [ ] **Port Availability**: Application binds to expected ports
- [ ] **Graceful Shutdown**: Application handles termination signals properly

### **Code Quality Requirements** (MANDATORY)
- [ ] **Zero Linting Violations**: `npm run lint` passes with zero warnings/errors
- [ ] **Code Formatting**: All code follows established formatting standards
- [ ] **Import Organization**: All imports properly organized and unused imports removed
- [ ] **Documentation Standards**: All public functions have comprehensive documentation

### **Test Requirements** (MANDATORY)
- [ ] **All Tests Pass**: `npm test` passes all existing tests without failures
- [ ] **Test Coverage**: No regression in test coverage percentages
- [ ] **Test Performance**: Test suite completion time within acceptable limits
- [ ] **Test Reliability**: Tests are deterministic and don't have flaky behavior

### **Git Integration Requirements** (MANDATORY)
- [ ] **Clean Commits**: All changes committed with descriptive messages
- [ ] **No Merge Conflicts**: Working directory clean with no conflicts
- [ ] **Branch Sync**: Branch up to date with main/master
- [ ] **Commit Message Standards**: Follow conventional commit format

## **TECHNOLOGY-SPECIFIC REQUIREMENTS**

### **Node.js/JavaScript Projects**
- [ ] **Package.json Integrity**: No unused dependencies, proper version constraints
- [ ] **Security Audit**: `npm audit` shows no high/critical vulnerabilities
- [ ] **Node Version Compatibility**: Code compatible with specified Node.js version
- [ ] **Environment Configuration**: Proper handling of environment variables

### **TypeScript Projects (Additional)**
- [ ] **Type Safety**: `tsc` compilation with strict mode enabled
- [ ] **Type Coverage**: Maintain or improve TypeScript coverage
- [ ] **Interface Documentation**: All public interfaces properly typed and documented
- [ ] **Generic Usage**: Appropriate use of generics for reusable components

## **PROJECT-SPECIFIC REQUIREMENTS**

### **TaskManager API Integration** (Infinite Continue Stop Hook)
- [ ] **API Compatibility**: Integration with TaskManager API maintained
- [ ] **Hook Functionality**: Stop/continue hooks function correctly
- [ ] **Agent System**: Multi-agent coordination capabilities preserved
- [ ] **TODO.json Integrity**: No corruption of task management data structure

### **Development Workflow**
- [ ] **Claude.md Compliance**: Implementation follows CLAUDE.md guidelines
- [ ] **Agent Communication**: Proper logging for agent coordination
- [ ] **Task Ordering**: Respects task priority and ordering rules
- [ ] **Error Escalation**: Proper error task creation for failures

## **QUALITY GATES**

### **Performance Requirements**
- [ ] **Response Time**: API endpoints respond within acceptable limits
- [ ] **Memory Usage**: No significant memory leaks or excessive usage
- [ ] **CPU Efficiency**: Algorithms and processes optimized for performance
- [ ] **Resource Cleanup**: Proper cleanup of resources and event listeners

### **Security Requirements**
- [ ] **Input Validation**: All user inputs properly validated and sanitized
- [ ] **Output Encoding**: Protection against injection attacks
- [ ] **Error Handling**: No sensitive information exposed in error messages
- [ ] **Dependency Security**: No known vulnerabilities in dependencies

### **Reliability Requirements**
- [ ] **Error Recovery**: Graceful handling of error conditions
- [ ] **Data Integrity**: Operations maintain data consistency
- [ ] **Timeout Handling**: Proper timeout management for async operations
- [ ] **Resource Management**: Efficient use of system resources

## **VALIDATION COMMANDS**

### **Complete Validation Sequence**
```bash
#!/bin/bash
# Project-specific validation script

echo "🔍 Starting comprehensive validation..."

echo "=== LINTING CHECK ==="
npm run lint || exit 1

echo "=== TYPE CHECK ==="
npm run typecheck || exit 1

echo "=== BUILD CHECK ==="
npm run build || exit 1

echo "=== TEST CHECK ==="
npm test || exit 1

echo "=== SECURITY AUDIT ==="
npm audit --audit-level=high || echo "⚠️ Security vulnerabilities found"

echo "=== STARTUP CHECK ==="
timeout 10s npm start &
STARTUP_PID=$!
sleep 5
kill $STARTUP_PID 2>/dev/null
wait $STARTUP_PID 2>/dev/null
echo "✅ Startup test completed"

echo "=== GIT STATUS CHECK ==="
git status --porcelain
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ Working directory clean"
else
    echo "⚠️ Uncommitted changes found"
fi

echo "🎉 All validation checks completed!"
```

### **Quick Validation** (For Minor Changes)
```bash
npm run lint && npm run build && npm test
```

## **FAILURE HANDLING**

### **Test Failure Protocol**
- **Outdated Tests**: If tests fail due to being outdated (not feature bugs):
  - Feature task can be completed
  - MUST create separate `test-update` task immediately
  - Document which tests need updating and why

### **Build Failure Protocol**
- **Dependency Issues**: Update package.json and document changes
- **Configuration Problems**: Fix configuration and test across environments
- **Breaking Changes**: Document breaking changes and migration path

### **Linting Failure Protocol**
- **Code Style**: Apply automated fixes where possible
- **Logical Issues**: Address underlying code problems
- **Configuration**: Update linting rules if needed (with justification)

## **SPECIAL CONSIDERATIONS**

### **Multi-Agent Development**
- [ ] **Agent Coordination**: Changes don't break other agents' work
- [ ] **Shared Resources**: Proper handling of shared files and configurations
- [ ] **Communication**: Clear documentation for other agents

### **Continuous Integration**
- [ ] **CI Pipeline**: All changes pass CI/CD pipeline
- [ ] **Environment Parity**: Development, staging, production parity maintained
- [ ] **Deployment Ready**: Changes are safe for automated deployment

### **Documentation Requirements**
- [ ] **README Updates**: Update README if public API changes
- [ ] **CHANGELOG**: Document significant changes
- [ ] **API Documentation**: Update API docs for interface changes
- [ ] **Migration Guides**: Provide migration instructions for breaking changes

---

## **USAGE NOTES**

🔧 **For Implementation Agents**: Review this file before starting any feature work
📋 **For Audit Agents**: Use these criteria as baseline + 25-point audit system  
📝 **For Project Evolution**: Update this file as project requirements change
🎯 **For Quality Assurance**: These are minimum requirements, not comprehensive standards

**Integration**: These requirements automatically become part of audit criteria points 1-10, with additional project context applied throughout the 25-point system.