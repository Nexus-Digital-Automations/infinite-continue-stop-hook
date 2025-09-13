# Task Audit Criteria - Universal Standards

## Overview
This file defines the standard completion criteria that ALL tasks must satisfy before being marked complete. These criteria are automatically added to audit subtasks for objective validation by independent agents.

## Standard Completion Criteria

### 🔴 Mandatory Quality Gates

#### 1. Code Quality Standards
- [ ] **Linter Perfection**: Zero linting warnings or errors
  - **JavaScript/TypeScript**: `eslint` passes with zero violations
  - **Python**: `ruff check` passes with zero violations  
  - **Go**: `golint` passes with zero violations
  - **Rust**: `clippy` passes with zero violations

#### 2. Build Integrity
- [ ] **Build Success**: Project builds without errors or warnings
  - **Node.js**: `npm run build` completes successfully
  - **Python**: Package builds without errors
  - **Go**: `go build` completes successfully
  - **Rust**: `cargo build` completes successfully

#### 3. Application Functionality
- [ ] **Runtime Success**: Application starts and serves without errors
  - **Node.js**: `npm start` launches successfully
  - **Python**: Application starts without runtime errors
  - **Go**: Compiled binary executes successfully
  - **Rust**: Compiled binary executes successfully

#### 4. Test Coverage Maintenance
- [ ] **Test Integrity**: All preexisting tests continue to pass
  - **Node.js**: `npm test` passes all existing tests
  - **Python**: `pytest` passes all existing tests
  - **Go**: `go test ./...` passes all existing tests
  - **Rust**: `cargo test` passes all existing tests

### 🔍 Code Quality Requirements

#### 5. Documentation Standards
- [ ] **Function Documentation**: All public functions have comprehensive documentation
- [ ] **API Documentation**: All public interfaces documented with usage examples
- [ ] **Architecture Documentation**: System design decisions documented
- [ ] **Decision Rationale**: Major technical decisions explained and justified

#### 6. Implementation Quality
- [ ] **Error Handling**: Comprehensive error handling implemented
- [ ] **Performance Metrics**: Execution timing and bottleneck identification
- [ ] **Security Review**: No security vulnerabilities introduced
- [ ] **Architectural Consistency**: Follows existing project patterns and conventions

### 🚀 Integration Requirements

#### 7. Dependency Management
- [ ] **Dependency Validation**: All dependencies properly managed and documented
- [ ] **Version Compatibility**: All dependencies compatible with project requirements
- [ ] **Security Audit**: Dependencies scanned for known vulnerabilities

#### 8. Environment Compatibility
- [ ] **Cross-Platform**: Code works across supported platforms
- [ ] **Environment Variables**: Required environment variables documented
- [ ] **Configuration**: Proper configuration management implemented

### 🔒 Security and Compliance

#### 9. Security Standards
- [ ] **No Credential Exposure**: No secrets, keys, or credentials in code or logs
- [ ] **Input Validation**: Proper input validation and sanitization
- [ ] **Output Encoding**: Proper output encoding to prevent injection attacks
- [ ] **Authentication/Authorization**: Proper security controls where applicable

#### 10. Compliance Requirements
- [ ] **License Compliance**: All code compatible with project license
- [ ] **Data Privacy**: No unauthorized data collection or exposure
- [ ] **Regulatory Compliance**: Meets applicable regulatory requirements

## Audit Task Template

When creating audit subtasks, use this template:

```json
{
  "type": "audit",
  "title": "Audit: [Original Task Title]",
  "description": "Comprehensive quality audit and review of the completed feature: [Original Task Title]\\n\\nOriginal Description: [Original Task Description]",
  "success_criteria": [
    "Linter perfection achieved (zero warnings/errors)",
    "Build perfection achieved (clean build)",
    "All tests pass with full coverage",
    "Code quality standards met",
    "Implementation follows architectural patterns",
    "Security review passed",
    "Performance standards met",
    "Documentation is complete and accurate"
  ],
  "original_implementer": "[Agent ID who implemented the feature]",
  "prevents_self_review": true,
  "audit_type": "post_completion"
}
```

## Research Task Template

When creating research subtasks, use this template:

```json
{
  "type": "research",
  "title": "Research: [Research Topic]",
  "description": "Comprehensive research for [research topic] to support implementation of [parent task]",
  "research_locations": [
    {
      "type": "codebase",
      "paths": ["/path/to/relevant/files"],
      "focus": "Existing implementation patterns"
    },
    {
      "type": "internet",
      "keywords": ["relevant", "search", "terms"],
      "focus": "Best practices and industry standards"
    },
    {
      "type": "documentation",
      "sources": ["official docs", "api references"],
      "focus": "Technical specifications"
    }
  ],
  "deliverables": [
    "Technical analysis report",
    "Implementation recommendations", 
    "Risk assessment",
    "Alternative approaches evaluation"
  ]
}
```

## Validation Commands by Project Type

### Node.js Projects
```bash
# Complete validation sequence
npm run lint && npm run build && npm test && npm start
```

### Python Projects  
```bash
# Complete validation sequence
ruff check . && python -m build && pytest && python -m app
```

### Go Projects
```bash
# Complete validation sequence
golint ./... && go build && go test ./... && ./app
```

### Rust Projects
```bash
# Complete validation sequence
cargo clippy && cargo build && cargo test && cargo run
```

## Agent Assignment Rules

### Implementation Agents
- Primary responsibility: Feature implementation
- Cannot audit their own work
- Must create audit subtasks for independent review

### Audit Agents  
- Must be different from implementation agent
- Responsible for objective quality validation
- Authority to reject implementations that don't meet criteria
- Must provide detailed feedback on any failures

### Research Agents
- Specialized in information gathering and analysis
- Provide comprehensive research reports
- Support implementation with technical guidance
- Independent of implementation and audit agents

## Escalation Procedures

### Failed Audits
1. **Document Failures**: Detailed report of all failing criteria
2. **Create Fix Tasks**: Specific tasks to address each failure
3. **Reassign Implementation**: Different agent if patterns of failure
4. **Additional Review**: Senior agent review for complex failures

### Disputed Results
1. **Independent Review**: Third-party agent assessment
2. **Technical Committee**: Senior agents for complex disputes
3. **Documentation Review**: Ensure criteria are clear and achievable
4. **Process Improvement**: Update criteria based on lessons learned