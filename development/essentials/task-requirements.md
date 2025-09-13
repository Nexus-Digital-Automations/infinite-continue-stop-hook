# Project Task Requirements

## Overview
This file defines project-specific success criteria that ALL feature tasks must satisfy to be marked complete. These requirements are consulted by all agents before completing feature tasks and serve as validation checkpoints.

## Success Criteria for All Feature Tasks

### 🔴 Build Requirements
- [ ] **Build Success**: `npm run build` completes without errors
- [ ] **No Build Warnings**: Build process produces zero warnings or failures
- [ ] **Asset Generation**: All required assets and bundles are generated properly

### 🔴 Runtime Requirements  
- [ ] **Application Start**: `npm start` launches without errors
- [ ] **Service Availability**: All services start successfully and are accessible
- [ ] **API Endpoints**: All API endpoints respond correctly and return expected data
- [ ] **TaskManager Integration**: TaskManager API functionality remains intact

### 🔴 Code Quality Requirements
- [ ] **Lint Perfection**: `npm run lint` passes with zero violations
- [ ] **No Linting Warnings**: All ESLint rules pass without warnings or errors
- [ ] **Code Style Consistency**: All code follows established project patterns
- [ ] **Import/Export Validation**: All imports resolve correctly and exports are valid

### 🔴 Test Requirements
- [ ] **Existing Test Integrity**: `npm test` passes all existing tests
- [ ] **No Test Regressions**: All previously passing tests continue to pass
- [ ] **Test Coverage Maintenance**: No reduction in existing test coverage
- [ ] **API Contract Tests**: TaskManager API contracts remain valid

### 🚨 Special Considerations

#### Outdated Tests Protocol
If tests fail due to **outdated test code** (not feature bugs):
- ✅ **Feature task CAN be completed** if the feature itself works correctly
- 🔴 **MUST create separate test-update task** immediately after feature completion
- 📋 **Document test failures** and specify they are due to outdated test code, not feature issues
- 🔧 **Test-update task priority**: Created as `test` category task to be handled after all error/feature tasks

#### TaskManager API Protection
- [ ] **API Backward Compatibility**: Existing API endpoints must remain functional
- [ ] **Agent Registration**: Agent initialization and registration must work unchanged
- [ ] **Task Operations**: Core task operations (create, claim, complete) must remain intact
- [ ] **JSON Structure**: TODO.json structure must remain valid and readable

## Validation Commands

### Complete Validation Sequence
```bash
# Full project validation - all must pass for feature completion
npm run lint && npm run build && npm test && npm start
```

### Individual Validation Steps
```bash
# Step 1: Code quality validation
npm run lint

# Step 2: Build validation  
npm run build

# Step 3: Test validation
npm test

# Step 4: Runtime validation
npm start
# Verify application starts and all services are accessible
# Check TaskManager API endpoints respond correctly
```

## Evidence Documentation Requirements

When completing feature tasks, include validation evidence:

```json
{
  "validation_results": {
    "lint_status": "✅ Passed - 0 violations",
    "build_status": "✅ Passed - no errors/warnings", 
    "test_status": "✅ Passed - all 45 tests passing",
    "start_status": "✅ Passed - application started successfully",
    "api_status": "✅ Passed - TaskManager API responding"
  },
  "git_status": "✅ All changes committed and pushed",
  "commit_hash": "abc123def456"
}
```

## Agent Responsibilities

### Before Feature Completion
1. **Read This File**: Always consult task-requirements.md before marking feature tasks complete
2. **Run Validation**: Execute all validation commands and verify results
3. **Document Results**: Include validation evidence in task completion
4. **Handle Test Issues**: If tests fail due to outdated code, create test-update tasks

### File Maintenance
- **Update Requirements**: Modify this file based on project evolution
- **Add Project-Specific Rules**: Include any special requirements for this project
- **Version Requirements**: Update validation commands if project tooling changes

## Project-Specific Requirements

### Node.js/TaskManager API Project
- **npm Scripts**: Must use npm run commands for consistency
- **TaskManager API**: Core functionality must remain unchanged
- **Agent System**: Multi-agent coordination must continue working
- **JSON Integrity**: TODO.json must remain valid and parseable
- **Development Structure**: development/ subdirectories must remain organized

### File System Requirements
- **No Root Clutter**: Keep project root clean, organize in development/ subdirectories
- **Report Organization**: Research and analysis files must be properly organized
- **Documentation Updates**: Update relevant docs when making structural changes

## Failure Recovery Procedures

### Build Failures
1. **Identify Root Cause**: Check build logs for specific errors
2. **Fix Dependencies**: Resolve any dependency issues
3. **Validate Fix**: Re-run build command to verify resolution
4. **Document Changes**: Note any required configuration changes

### Test Failures
1. **Categorize Failures**: Determine if failures are due to feature bugs or outdated tests
2. **Feature Bugs**: Fix bugs before completing feature task
3. **Outdated Tests**: Complete feature task, create test-update task
4. **Document Decision**: Clearly explain reasoning in task completion

### Runtime Failures
1. **Check Service Status**: Verify all services start correctly
2. **Validate API Endpoints**: Test critical API functionality
3. **Environment Issues**: Check environment variables and configuration
4. **Rollback if Necessary**: Revert changes if runtime issues cannot be resolved quickly

## Update History

- **2025-09-13**: Initial version created by Configuration Agent #8
- **Future Updates**: Document changes to requirements as project evolves

*Last Updated: 2025-09-13 by Configuration Agent #8*