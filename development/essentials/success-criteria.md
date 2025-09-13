# Success Criteria Templates and Definitions

## Overview
This file defines standardized success criteria templates for different types of tasks and provides clear definitions for what constitutes successful task completion across the embedded subtasks system.

## Task Type Success Criteria Templates

### 🔴 Error Task Success Criteria
```json
{
  "error_task_criteria": [
    "Root cause identified and documented",
    "Underlying problem completely resolved (not just symptoms)",
    "All related error manifestations eliminated", 
    "Preventive measures implemented",
    "Verification tests pass",
    "No new errors introduced",
    "Error resolution documented with rationale",
    "System stability maintained or improved"
  ]
}
```

**Error Task Definition**: Tasks addressing system errors, linter violations, build failures, runtime bugs, and security vulnerabilities. These have absolute priority and can interrupt other work.

### 🔧 Feature Task Success Criteria
```json
{
  "feature_task_criteria": [
    "Functional requirements completely implemented",
    "All acceptance criteria met and validated",
    "Integration with existing system verified", 
    "User experience requirements satisfied",
    "Performance requirements met",
    "Security requirements implemented",
    "Error handling comprehensive and appropriate",
    "Documentation updated with new functionality",
    "All project task requirements satisfied (lint/build/test/start)"
  ]
}
```

**Feature Task Definition**: New functionality, enhancements, refactoring, and documentation tasks. Must pass all task-requirements.md validation.

### 🧩 Subtask Success Criteria
```json
{
  "subtask_criteria": [
    "Specific component functionality implemented",
    "Integration with parent feature verified",
    "Dependencies properly handled",
    "Interface contracts maintained",
    "Component-level testing complete",
    "Parent feature functionality unaffected",
    "Implementation follows architectural patterns",
    "Documentation updated for component"
  ]
}
```

**Subtask Definition**: Implementation of specific components for preexisting features from TODO.json features array.

### 🧪 Test Task Success Criteria
```json
{
  "test_task_criteria": [
    "Test coverage objectives achieved",
    "All test scenarios implemented and passing",
    "Edge cases and error conditions covered",
    "Performance test targets met",
    "Test automation implemented where applicable",
    "Test documentation comprehensive",
    "CI/CD integration verified",
    "No existing functionality broken by tests"
  ]
}
```

**Test Task Definition**: Test coverage, test creation, test setup, and test performance tasks. Lowest priority, only executed after all error and feature tasks complete.

## Specialized Task Success Criteria

### 🔍 Research Task Success Criteria
```json
{
  "research_task_criteria": [
    "Comprehensive codebase analysis completed",
    "Internet research covering best practices conducted",
    "Technical documentation reviewed and summarized",
    "Multiple approaches evaluated and compared",
    "Risk assessment provided",
    "Implementation recommendations documented",
    "Research report created in development/research-reports/",
    "Findings support informed implementation decisions"
  ]
}
```

### 🔎 Audit Task Success Criteria
```json
{
  "audit_task_criteria": [
    "All audit criteria from audit-criteria.md evaluated",
    "Independent verification completed by different agent",
    "Objective assessment documented",
    "All quality gates validated",
    "Non-compliance issues identified and documented",
    "Recommendation for approval or rejection provided",
    "Audit results stored in development/reports/",
    "Follow-up actions specified if needed"
  ]
}
```

## Quality Gate Definitions

### 🎯 Linter Perfection
- **Definition**: Zero linting warnings or errors across all project files
- **Validation**: `npm run lint` returns exit code 0 with no output
- **Scope**: All JavaScript, TypeScript, configuration files
- **Exception Handling**: No exceptions - all violations must be resolved

### 🏗️ Build Success
- **Definition**: Project builds completely without any errors or warnings
- **Validation**: `npm run build` completes successfully with exit code 0
- **Output Requirements**: All expected assets generated, no missing dependencies
- **Performance**: Build completes within reasonable time limits

### 🚀 Runtime Success
- **Definition**: Application starts and serves without errors
- **Validation**: `npm start` launches successfully, all services accessible
- **API Validation**: All endpoints respond correctly
- **Health Checks**: System health endpoints return positive status

### ✅ Test Integrity
- **Definition**: All existing tests continue to pass
- **Validation**: `npm test` passes all existing tests
- **Coverage**: No reduction in existing test coverage
- **New Tests**: Any new tests must also pass

## Success Criteria Application Rules

### Priority-Based Application
1. **Error Tasks**: Apply error task criteria + universal quality gates
2. **Feature Tasks**: Apply feature task criteria + task requirements + quality gates
3. **Subtasks**: Apply subtask criteria + parent feature integration validation
4. **Test Tasks**: Apply test task criteria + no disruption to existing functionality

### Context-Specific Criteria
- **API Changes**: Include backward compatibility verification
- **Database Changes**: Include migration safety and rollback procedures
- **Security Features**: Include security audit and penetration testing
- **Performance Features**: Include performance benchmarking and optimization validation

## Success Measurement Templates

### Quantitative Success Metrics
```json
{
  "metrics": {
    "code_quality": {
      "linter_violations": 0,
      "build_warnings": 0,
      "test_coverage": ">= baseline",
      "performance_regression": 0
    },
    "functionality": {
      "acceptance_criteria_met": "100%",
      "user_stories_completed": "100%",
      "integration_tests_passing": "100%"
    }
  }
}
```

### Qualitative Success Indicators
```json
{
  "indicators": {
    "maintainability": "Code follows project patterns and is easily extensible",
    "documentation": "All public interfaces documented with examples",
    "error_handling": "Comprehensive error handling with clear user messages",
    "security": "No security vulnerabilities introduced",
    "user_experience": "Feature is intuitive and meets user expectations"
  }
}
```

## Task Completion Validation Workflow

### Pre-Completion Checklist
1. **Review Applicable Criteria**: Select appropriate success criteria template
2. **Self-Assessment**: Verify all criteria are met
3. **Evidence Collection**: Gather validation evidence (test results, build output, etc.)
4. **Documentation Review**: Ensure all documentation is updated
5. **Integration Testing**: Verify integration with existing system

### Completion Evidence Template
```json
{
  "task_completion_evidence": {
    "task_id": "feature_1234567890_abcdef",
    "success_criteria_applied": "feature_task_criteria",
    "validation_results": {
      "functional_requirements": "✅ All requirements implemented and tested",
      "acceptance_criteria": "✅ All criteria met and validated",
      "integration_testing": "✅ System integration verified",
      "quality_gates": "✅ All quality gates passed"
    },
    "evidence_artifacts": [
      "Test execution results",
      "Build output logs", 
      "Lint check results",
      "Performance metrics",
      "User acceptance testing results"
    ],
    "completion_timestamp": "2025-09-13T16:40:00.000Z",
    "completing_agent": "development_session_xyz"
  }
}
```

## Failure Recovery Procedures

### Criteria Not Met
1. **Document Gaps**: Identify which criteria are not satisfied
2. **Create Fix Tasks**: Generate specific tasks to address each gap
3. **Re-evaluate**: Re-assess after fixes are implemented
4. **Escalate if Necessary**: Involve senior agents for complex issues

### Quality Gate Failures
1. **Root Cause Analysis**: Identify why quality gates failed
2. **Systematic Fixes**: Address each failure systematically
3. **Prevention Measures**: Implement checks to prevent recurrence
4. **Validation**: Re-run all quality gates before completion

## Integration with Embedded Subtasks System

### Research Task Integration
- Research tasks must generate findings that inform success criteria evaluation
- Research deliverables become part of evidence for parent task completion
- Research prevents implementation until comprehensive analysis complete

### Audit Task Integration  
- Audit tasks validate success criteria independently
- Different agent must perform audit for objectivity
- Audit results determine final task approval/rejection
- Failed audits require re-work and re-audit

### TaskManager API Integration
- Success criteria templates automatically applied based on task category
- API endpoints provide criteria retrieval and validation support
- Completion evidence stored as structured data in task records

## Customization Guidelines

### Project-Specific Adaptations
- Modify templates to reflect project-specific requirements
- Add domain-specific criteria (e.g., compliance, accessibility)
- Adjust quality gates based on project maturity and requirements

### Continuous Improvement
- Review and update criteria based on project evolution
- Incorporate lessons learned from completed tasks
- Adjust criteria difficulty based on team capabilities and project needs

*Created: 2025-09-13 by Configuration Agent #8*
*Version: 1.0.0*