# Task Audit Criteria - Comprehensive Standards

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

## Custom Project-Specific Criteria

### 11. TaskManager Integration
- [ ] **TaskManager Compatibility**: Changes maintain compatibility with TaskManager API
- [ ] **Agent Coordination**: Multi-agent functionality works correctly
- [ ] **TODO.json Integrity**: TODO.json structure remains valid and consistent

### 12. Performance Standards
- [ ] **Response Time**: API responses under 2 seconds for standard operations
- [ ] **Memory Usage**: No memory leaks or excessive memory consumption
- [ ] **Concurrent Operations**: System handles concurrent agent operations correctly
