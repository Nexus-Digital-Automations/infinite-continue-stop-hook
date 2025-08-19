# Claude Code Project Assistant - Streamlined Guide

## ⚡⚡⚡ ABSOLUTE CRITICAL MANDATE ⚡⚡⚡

# 🚨🚨🚨 INSTANTLY CREATE TASK FOR ANY USER REQUEST 🚨🚨🚨
# 🚨🚨🚨 NO EXCEPTIONS - NO DELAYS - NO ANALYSIS FIRST 🚨🚨🚨
# 🚨🚨🚨 USER SAYS ANYTHING → CREATE TASK IMMEDIATELY 🚨🚨🚨

**⚡ THE MOMENT USER MAKES ANY REQUEST:**
**⚡ STOP EVERYTHING AND CREATE TASK USING TASKMANAGER API**
**⚡ CATEGORY REQUIRED - USE: research, missing-feature, bug, enhancement, etc.**
**⚡ THEN AND ONLY THEN PROCEED WITH WORK**

## 🚨 CRITICAL COMPLIANCE PROTOCOLS

**PRIORITY ORDER:**
1. **⚡ INSTANT TASK CREATION ⚡** - Create task for ANY user request FIRST
2. **User Instructions** - Direct commands take highest priority  
3. **Hook Feedback** - Address system responses immediately
4. **Linting Error Feedback** - Fix all linting errors before proceeding
5. **TaskManager Integration** - Use TaskManager API for all task operations
6. **Evidence-Based Validation** - Validate all work with concrete evidence

**CORE RULES:**
- **⚡ INSTANTLY CREATE TASK ⚡** for ANY user request using TaskManager API
- **VALIDATE BEFORE COMPLETION** - Provide evidence of all validation checks
- **FIX ERRORS IMMEDIATELY** - Create categorized tasks for all detected issues

## 🚨 ERROR HANDLING PROTOCOL

**MANDATORY ERROR RESPONSE:**
1. **DETECT** any error → **INSTANTLY CREATE CATEGORIZED TASK**:
   - Linter errors → `category: 'linter-error'` 
   - Build failures → `category: 'build-error'`
   - Runtime errors → `category: 'error'`
   - Test failures → `category: 'test-error'`
2. **ATTEMPT IMMEDIATE FIX** (< 2 minutes) OR work on task
3. **VERIFY** fix and document resolution

**FORBIDDEN:** Ignoring errors, suppressing messages, or implementing workarounds

## 🚨🚨🚨 ABSOLUTE MANDATE: NEVER MASK ISSUES 🚨🚨🚨

# ⛔⛔⛔ ZERO TOLERANCE FOR ISSUE MASKING ⛔⛔⛔
# ⛔⛔⛔ NO BYPASSING - NO WORKAROUNDS - NO SUPPRESSION ⛔⛔⛔
# ⛔⛔⛔ ALWAYS FIX ROOT CAUSE - NEVER HIDE PROBLEMS ⛔⛔⛔

**🚨 ABSOLUTE PROHIBITION - NEVER EVER EVER:**
- **❌ MASK validation errors** - Fix the validation logic, don't bypass it
- **❌ SUPPRESS error messages** - Fix the error, don't hide it
- **❌ BYPASS quality checks** - Fix the code to pass checks
- **❌ IMPLEMENT WORKAROUNDS** - Fix the root cause, don't work around it
- **❌ HIDE FAILING TESTS** - Fix the tests or code, don't disable them
- **❌ IGNORE LINTING ERRORS** - Fix the linting violations
- **❌ COMMENT OUT ERROR HANDLING** - Fix the underlying issue
- **❌ ADD try/catch TO SILENCE ERRORS** - Fix what's causing the error
- **❌ DISABLE WARNINGS OR CHECKS** - Address what's causing the warnings

**🚨 MANDATORY ROOT CAUSE ANALYSIS:**
When ANY issue is detected:
1. **IDENTIFY** the true root cause of the problem
2. **ANALYZE** why the issue exists in the first place  
3. **FIX** the underlying architectural or logic problem
4. **VALIDATE** that the fix resolves the core issue
5. **DOCUMENT** what was wrong and how it was properly fixed

**🚨 EXAMPLES OF FORBIDDEN MASKING:**
```bash
# ❌ FORBIDDEN - Masking validation
if (!validationResult.isValid) return { success: true }; // HIDING PROBLEM

# ✅ REQUIRED - Fixing validation
if (!validationResult.isValid) {
    // Fix the root cause that made validation fail
    fixValidationIssue(validationResult.errors);
    // Re-run validation to ensure it passes
}

# ❌ FORBIDDEN - Suppressing errors  
try { riskyOperation(); } catch (e) { /* ignore */ } // HIDING PROBLEM

# ✅ REQUIRED - Handling errors properly
try { 
    riskyOperation(); 
} catch (e) { 
    // Fix what's causing riskyOperation to fail
    fixUnderlyingIssue(e);
    // Re-attempt after fixing root cause
}
```

**🚨 ZERO TOLERANCE ENFORCEMENT:**
- **ANY ATTEMPT TO MASK** = Immediate task creation to fix properly
- **ANY WORKAROUND SUGGESTION** = Must be replaced with root cause fix
- **ANY ERROR SUPPRESSION** = Must be replaced with proper error resolution
- **ANY VALIDATION BYPASS** = Must be replaced with validation fix

**🚨 QUALITY GATE PRINCIPLE:**
Every error, warning, or issue is a **QUALITY GATE** that must be **PROPERLY ADDRESSED**:
- Issues exist to **PROTECT CODE QUALITY**
- Masking issues **DEGRADES SYSTEM RELIABILITY** 
- Root cause fixes **IMPROVE LONG-TERM STABILITY**
- Proper solutions **PREVENT FUTURE PROBLEMS**

**⚡ WHEN ISSUE DETECTED → INSTANT ROOT CAUSE ANALYSIS → PROPER FIX → NEVER MASK**

## 🚨 MANDATORY THINKING & VALIDATION

**THINKING LEVELS:** Use maximum beneficial thinking for complexity:
- **ULTRATHINK**: System architecture, task planning, priority evaluation
- **THINK HARD**: Complex refactoring, debugging, task management  
- **MANDATORY**: All task operations (creation, categorization, completion)

**VALIDATION PROTOCOL:** Evidence-based completion required:
1. **RUN validation commands** - show all outputs
2. **TEST functionality manually** - demonstrate it works  
3. **VERIFY requirements met** - list each satisfied requirement
4. **PROVIDE EVIDENCE** - paste command outputs proving success


## 🚨 TASK CATEGORY & PRIORITY SYSTEM

**CATEGORY-BASED PRIORITY SYSTEM:**

Tasks are now organized by **specific categories** instead of generic "low", "medium", "high" priorities. The system **automatically sorts** tasks by category urgency:

### 🌟 TOP PRIORITY (Rank 1) - Highest Priority
1. **🔬 research** - Investigation, exploration, or learning tasks - **HIGHEST PRIORITY**

### 🔴 CRITICAL ERRORS (Rank 2-5) - Block All Work
2. **🔴 linter-error** - Code style, formatting, or quality issues detected by linters
3. **🔥 build-error** - Compilation, bundling, or build process failures  
4. **⚠️ start-error** - Application startup, initialization, or runtime launch failures
5. **❌ error** - General runtime errors, exceptions, or system failures

### 🟡 HIGH PRIORITY (Rank 6) - Important Features
6. **🆕 missing-feature** - Required functionality that needs to be implemented

### 🔵 STANDARD PRIORITY (Rank 7-10) - Normal Development
7. **🐛 bug** - Incorrect behavior or functionality that needs fixing
8. **✨ enhancement** - Improvements to existing features or functionality
9. **♻️ refactor** - Code restructuring, optimization, or technical debt reduction
10. **📚 documentation** - Documentation updates, comments, or API documentation

### 🟢 LOW PRIORITY (Rank 11) - Maintenance
11. **🧹 chore** - Maintenance tasks, cleanup, or administrative work

### 🔴 LOWEST PRIORITY (Rank 12-18) - All Testing Related - LAST PRIORITY
12. **🧪 missing-test** - Test coverage gaps or missing test cases - **LOWEST PRIORITY**
13. **⚙️ test-setup** - Test environment configuration, test infrastructure setup
14. **🔄 test-refactor** - Refactoring test code, improving test structure
15. **📊 test-performance** - Performance tests, load testing, stress testing
16. **🔍 test-linter-error** - Linting issues specifically in test files - **LOWEST PRIORITY**
17. **🚫 test-error** - Failing tests, test framework issues - **LOWEST PRIORITY** 
18. **🔧 test-feature** - New testing features, test tooling improvements - **LOWEST PRIORITY**

**AVAILABLE CATEGORIES (Must be specified when creating tasks):**
- **research** (rank 1) - Highest priority  
- **linter-error, build-error, start-error, error** (ranks 2-5) - Critical errors
- **missing-feature** (rank 6) - Important features
- **bug, enhancement, refactor, documentation** (ranks 7-10) - Standard work
- **chore** (rank 11) - Maintenance
- **missing-test, test-setup, test-refactor, test-performance, test-linter-error, test-error, test-feature** (ranks 12-18) - Testing (lowest priority)

**THREE-LEVEL AUTO-SORTING HIERARCHY:**
1. **PRIMARY: Category Rank** - Research (1) → Linter Errors (2) → Build Errors (3) → etc.
2. **SECONDARY: Priority Value** - Critical (4) → High (3) → Medium (2) → Low (1)
3. **TERTIARY: Creation Time** - Newer tasks first within same category and priority

**CREATING TASKS WITH CATEGORIES (CATEGORY REQUIRED):**
```bash
# Category is MANDATORY - must be specified explicitly
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.createTask({title: 'Fix ESLint errors', category: 'linter-error', mode: 'DEVELOPMENT'}).then(id => console.log('Created:', id));"

# Research task (highest priority)
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.createTask({title: 'Research authentication patterns', category: 'research', mode: 'DEVELOPMENT'}).then(id => console.log('Created:', id));"

# Testing task (lowest priority)  
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.createTask({title: 'Add unit tests', category: 'missing-test', mode: 'DEVELOPMENT'}).then(id => console.log('Created:', id));"

# Bug fix with explicit priority override
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.createTask({title: 'Urgent bug fix', category: 'bug', priority: 'critical', mode: 'DEVELOPMENT'}).then(id => console.log('Created:', id));"
```

## 🚨 TASK MANAGEMENT PROTOCOLS

**INSTANT TASK CREATION - ALWAYS CREATE TASKS FOR:**
- **EVERY USER REQUEST** - no matter how simple or complex
- **EVERY USER INSTRUCTION** - any time user tells you to do something  
- **EVERY ISSUE USER POINTS OUT** - bugs, problems, suggestions, observations
- **ANY opportunity for improvement** discovered during work
- **ALL errors detected** (linting, testing, runtime, build failures)
- **Performance issues** (slow responses, memory leaks)
- **Security vulnerabilities** (auth issues, data exposure)
- **Code quality opportunities** (refactoring needs, missing docs)
- **Missing functionality** (incomplete features, edge cases)
- **Integration issues** (API failures, dependency conflicts)

**🚨 GOLDEN RULE**: User says ANYTHING requiring action OR asks ANY question → **INSTANTLY CREATE TASK THE VERY FIRST SECOND** → Check existing tasks → Modify OR create → Execute

## 🚨 MANDATORY CATEGORY-BASED TASK CREATION PROTOCOL

**🚨 ABSOLUTE MANDATE: CATEGORY DETECTION = IMMEDIATE TASK CREATION**

**THE INSTANT YOU DETECT ANY OF THESE CATEGORIES IN USER COMMUNICATION OR CODE ANALYSIS - CREATE TASK IMMEDIATELY:**

### 🔴 **CRITICAL ERROR CATEGORIES - CREATE TASK IN FIRST SECOND:**
- **🔴 LINTER-ERROR SPOTTED** → INSTANTLY CREATE `category: 'linter-error'` TASK
- **🔥 BUILD-ERROR DETECTED** → INSTANTLY CREATE `category: 'build-error'` TASK  
- **⚠️ START-ERROR FOUND** → INSTANTLY CREATE `category: 'start-error'` TASK
- **❌ RUNTIME ERROR SEEN** → INSTANTLY CREATE `category: 'error'` TASK

### 🌟 **RESEARCH OPPORTUNITIES - CREATE TASK IN FIRST SECOND:**
- **🔬 INVESTIGATION NEEDED** → INSTANTLY CREATE `category: 'research'` TASK (HIGHEST PRIORITY)
- **🔍 EXPLORATION REQUIRED** → INSTANTLY CREATE `category: 'research'` TASK (HIGHEST PRIORITY)
- **📊 ANALYSIS OPPORTUNITY** → INSTANTLY CREATE `category: 'research'` TASK (HIGHEST PRIORITY)
- **🧭 LEARNING REQUIRED** → INSTANTLY CREATE `category: 'research'` TASK (HIGHEST PRIORITY)

### 🆕 **FEATURE OPPORTUNITIES - CREATE TASK IN FIRST SECOND:**
- **🆕 MISSING FUNCTIONALITY** → INSTANTLY CREATE `category: 'missing-feature'` TASK
- **✨ ENHANCEMENT SPOTTED** → INSTANTLY CREATE `category: 'enhancement'` TASK
- **🐛 BUG DISCOVERED** → INSTANTLY CREATE `category: 'bug'` TASK

### 🧪 **TESTING OPPORTUNITIES - CREATE TASK IN FIRST SECOND (LOWEST PRIORITY):**
- **🧪 MISSING TESTS** → INSTANTLY CREATE `category: 'missing-test'` TASK
- **🔍 TEST LINTER ERRORS** → INSTANTLY CREATE `category: 'test-linter-error'` TASK
- **🚫 FAILING TESTS** → INSTANTLY CREATE `category: 'test-error'` TASK
- **🔧 TEST IMPROVEMENTS** → INSTANTLY CREATE `category: 'test-feature'` TASK

### 📚 **MAINTENANCE OPPORTUNITIES - CREATE TASK IN FIRST SECOND:**
- **♻️ REFACTORING NEEDED** → INSTANTLY CREATE `category: 'refactor'` TASK
- **📚 DOCUMENTATION GAPS** → INSTANTLY CREATE `category: 'documentation'` TASK
- **🧹 CLEANUP REQUIRED** → INSTANTLY CREATE `category: 'chore'` TASK

**🚨 CATEGORY DETECTION TRIGGERS - NO EXCEPTIONS:**
- User mentions ANY error, issue, or problem → **INSTANT TASK CREATION**
- Code analysis reveals ANY quality issue → **INSTANT TASK CREATION**
- You spot ANY opportunity for improvement → **INSTANT TASK CREATION**
- ANY missing functionality is identified → **INSTANT TASK CREATION**
- ANY research need is discovered → **INSTANT TASK CREATION**
- ANY test coverage gap is found → **INSTANT TASK CREATION**

**🚨 MANDATORY TASK CREATION COMMANDS - USE THESE IMMEDIATELY:**
```bash
# INSTANT LINTER ERROR TASK
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.createTask({title: 'Fix [specific linter error]', category: 'linter-error', mode: 'DEVELOPMENT', priority: 'critical'}).then(id => console.log('URGENT LINTER TASK:', id));"

# INSTANT RESEARCH TASK (HIGHEST PRIORITY)
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.createTask({title: 'Research [specific topic]', category: 'research', mode: 'DEVELOPMENT', priority: 'high'}).then(id => console.log('PRIORITY RESEARCH TASK:', id));"

# INSTANT BUG TASK
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.createTask({title: 'Fix [specific bug]', category: 'bug', mode: 'DEVELOPMENT', priority: 'high'}).then(id => console.log('URGENT BUG TASK:', id));"

# INSTANT MISSING FEATURE TASK
node -e "const TaskManager = require('./lib/taskManager'); const tm = new TaskManager('./TODO.json'); tm.createTask({title: 'Implement [specific feature]', category: 'missing-feature', mode: 'DEVELOPMENT', priority: 'high'}).then(id => console.log('FEATURE TASK:', id));"
```

**🚨 ZERO DELAY ENFORCEMENT:**
- **NO ANALYSIS PARALYSIS** - Create task FIRST, analyze SECOND
- **NO HESITATION** - Category spotted = Immediate task creation
- **NO WAITING** - User mentions issue = Task created within 1 second
- **NO EXCEPTIONS** - Every category opportunity gets a task

**WORKFLOW:**
1. **INSTANT TASK CREATION** - THE VERY FIRST SECOND you detect ANY category opportunity
2. **EVALUATE EXISTING TASKS** - Check if current tasks can handle the request
3. **MODIFY OR CREATE** - Update existing task (preferred) OR create new categorized task
4. **AUTO-PRIORITIZE** - Category-based sorting handles priority automatically  
5. **EXECUTE** - Begin working with thinking-driven approach

**CONTINUOUS EVALUATION:**
- **MANDATORY THINKING** for all task operations (creation, categorization, reordering, completion)
- **INSTANT CATEGORY ASSESSMENT** - Detect category patterns in real-time
- **AUTOMATIC TASK CREATION** for every category opportunity discovered
- **PROACTIVE SCANNING** - Actively look for category opportunities in all communications

**CATEGORY ASSIGNMENT RULES:**
- **ALWAYS specify category** when creating tasks - NO EXCEPTIONS
- **USE SPECIFIC CATEGORIES** - prefer 'linter-error' over 'error', 'missing-test' over 'test'  
- **CREATE IMMEDIATELY** upon category detection - NO delay, NO analysis first
- **TRUST CATEGORY HIERARCHY** - Let automatic sorting handle prioritization

## 🚨 MAXIMUM PARALLEL SUBAGENT DEPLOYMENT & COORDINATION

**MANDATORY**: Deploy **UP TO 10 SUBAGENTS** in parallel for ALL complex work. **ALWAYS USE AS MANY SUBAGENTS AS POSSIBLE**. **FAILURE TO USE SUBAGENTS = FAILED EXECUTION**

### 🎯 Synchronized Completion Protocol
**CRITICAL**: All subagents must finish within same timeframe for optimal efficiency

**COMPLETION SYNCHRONIZATION STRATEGY:**
1. **Pre-Flight Load Balancing**: Distribute work complexity evenly across all 10 subagents
2. **Coordinated Start**: All subagents begin execution simultaneously 
3. **Progress Checkpoints**: 25%, 50%, 75% completion status reporting to main agent
4. **Dynamic Rebalancing**: Redistribute workload if any subagent falls behind schedule
5. **Synchronized Quality Gates**: All subagents run validation simultaneously in final phase
6. **Coordinated Completion**: Main agent waits for ALL subagents before marking task complete

### 🚀 Universal Subagent Deployment
**MANDATORY SPECIALIZATIONS BY MODE:**

- **DEVELOPMENT**: Frontend, Backend, Database, DevOps, Security specialists
- **TESTING**: Unit Test, Integration Test, E2E Test, Performance Test, Security Test specialists  
- **RESEARCH**: Technology Evaluator, API Analyst, Performance Researcher, Security Auditor, UX Researcher
- **DEBUGGING**: Error Analysis, Performance Profiling, Security Audit, Code Quality, System Integration specialists
- **REFACTORING**: Architecture, Performance, Code Quality, Documentation, Testing specialists

### 🔄 Coordination & Timing Controls
**LOAD BALANCING STRATEGIES:**
- **Equal Complexity Distribution**: Each subagent receives ~10% of total work complexity (10 subagents)
- **Dependency-Aware Scheduling**: Sequential tasks distributed to maintain parallel execution
- **Failure Recovery**: If any subagent fails, redistribute work to remaining agents
- **Completion Buffer**: Build in 10-15% time buffer for synchronization delays

**INTEGRATION CHECKPOINTS:**
- **Context Sharing**: Critical information passed between subagents at each checkpoint
- **Quality Verification**: Each subagent validates outputs meet perfection standards
- **Conflict Resolution**: Main agent resolves any conflicting recommendations
- **Final Integration**: All subagent outputs merged into cohesive deliverable

**DEPLOYMENT PATTERN:** Think → Map Work Distribution → Balance Complexity → Deploy UP TO 10 Agents Simultaneously → Monitor Progress → Synchronize Completion

**SUBAGENT DEPLOYMENT RULES:**
- **ALWAYS MAXIMIZE SUBAGENTS**: Use as many subagents as possible up to 10 for complex tasks
- **MINIMUM 3 SUBAGENTS**: Even simple tasks should use at least 3 subagents when possible
- **SCALE BY COMPLEXITY**: More complex tasks = more subagents (up to 10 maximum)
- **PARALLEL EXECUTION**: All subagents work simultaneously, not sequentially

## 🚨 CONTEXT MANAGEMENT

**Always check for ABOUT.md files** before editing code (current directory, parent directories, subdirectories)

## 🚨 STANDARDIZED CODING STYLES FOR MULTI-AGENT DEVELOPMENT

**MANDATORY**: All agents MUST follow these standardized coding conventions to ensure consistency across large codebases and multi-agent collaboration. Based on comprehensive research of industry best practices for 2024.

### 🟨 JavaScript/TypeScript Standards (Airbnb + TypeScript Strict)

**Core Configuration:**
- **ESLint Config**: Airbnb + Prettier + TypeScript strict mode (2024 flat config)
- **Line Length**: 80 characters (Prettier default for readability)
- **Semicolons**: Always required for statement termination
- **Quotes**: Single quotes for strings, double quotes for JSX attributes
- **Trailing Commas**: Always in multiline objects/arrays for clean diffs

**Naming Conventions:**
- **Variables/Functions**: `camelCase` (e.g., `getUserData`, `isValidEmail`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT`, `API_ENDPOINTS`)
- **Classes/Interfaces**: `PascalCase` (e.g., `UserService`, `ApiResponse`)
- **Types/Enums**: `PascalCase` (e.g., `UserRole`, `HttpStatus`)
- **Files**: `kebab-case.js/.ts` (e.g., `user-service.ts`, `api-client.js`)
- **Directories**: `kebab-case` (e.g., `user-management/`, `api-services/`)

**Multi-Agent Naming Patterns:**
```typescript
// Agent-specific prefixes for conflict prevention
const frontendAgent_userValidation = {};
const backendAgent_userValidation = {};
const testingAgent_userValidation = {};

// File naming: [AGENT-TYPE]_[MODULE]_[COMPONENT].ts
// frontend_auth_validation.ts
// backend_user_service.ts
// testing_integration_specs.ts
```

**Import/Export Standards:**
```typescript
// Centralized exports (src/shared/index.ts)
export { ValidationUtils } from './validation';
export { ApiClient } from './api-client';
export { UserService } from './user-service';

// Agent-specific imports with absolute paths
import { ValidationUtils, ApiClient } from '@shared';
import { UserModel } from '@backend/models';
import { ComponentLibrary } from '@frontend/components';
```

**Error Handling Standards:**
```typescript
interface AgentError {
  agentId: string;
  errorCode: string;
  message: string;
  context: Record<string, unknown>;
  timestamp: Date;
  stack?: string;
}

class AgentErrorHandler {
  static createError(agentId: string, error: Error): AgentError {
    return {
      agentId,
      errorCode: error.name,
      message: error.message,
      context: {},
      timestamp: new Date(),
      stack: error.stack
    };
  }
}
```

**Documentation Standards:**
```typescript
/**
 * Validates user input according to business rules
 * @param userData - User data to validate
 * @param validationRules - Custom validation rules
 * @returns Validation result with errors if any
 * @throws AgentError when validation system fails
 * @example
 * ```typescript
 * const result = validateUser({ email: 'test@example.com' }, defaultRules);
 * if (!result.isValid) {
 *   console.log('Validation errors:', result.errors);
 * }
 * ```
 */
async function validateUser(
  userData: UserData, 
  validationRules: ValidationRules
): Promise<ValidationResult> {
  // Implementation
}
```

### 🐍 Python Standards (Black + Ruff + mypy Strict)

**Core Configuration:**
- **Formatters**: Black + Ruff (2024 unified tooling)
- **Line Length**: 88 characters (Black default, optimal for readability)
- **Type Hints**: Mandatory with mypy strict mode
- **Import Sorting**: isort with Black compatibility
- **Docstring Style**: Google style docstrings

**Naming Conventions:**
- **Variables/Functions**: `snake_case` (e.g., `get_user_data`, `is_valid_email`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT`)
- **Classes**: `PascalCase` (e.g., `UserService`, `DatabaseManager`)
- **Private Methods**: `_leading_underscore` (e.g., `_validate_input`)
- **Files/Modules**: `snake_case.py` (e.g., `user_service.py`, `api_client.py`)
- **Packages**: `snake_case` (e.g., `user_management/`, `api_services/`)

**Multi-Agent Prefixes:**
```python
# Agent-specific module prefixes
# frontend_agent_validation.py
# backend_agent_services.py  
# testing_agent_fixtures.py

# Agent-specific variable prefixes for shared modules
frontend_agent_config = {}
backend_agent_config = {}
testing_agent_config = {}
```

**Import Standards:**
```python
# Import order: standard library, third-party, local
import asyncio
import logging
from typing import Dict, List, Optional, Union

import requests
import pydantic
from fastapi import FastAPI

from .models import User
from .services import UserService
from ..shared import ValidationUtils
```

**Type Hints and Error Handling:**
```python
from typing import Dict, List, Optional, Union
from dataclasses import dataclass
from enum import Enum

@dataclass
class AgentError:
    agent_id: str
    error_code: str
    message: str
    context: Dict[str, Any]
    timestamp: datetime

class AgentErrorHandler:
    @staticmethod
    def create_error(agent_id: str, error: Exception) -> AgentError:
        return AgentError(
            agent_id=agent_id,
            error_code=type(error).__name__,
            message=str(error),
            context={},
            timestamp=datetime.now()
        )

async def validate_user_data(
    user_data: Dict[str, Any],
    validation_rules: Optional[Dict[str, Any]] = None
) -> ValidationResult:
    """
    Validates user input according to business rules.
    
    Args:
        user_data: Dictionary containing user information to validate
        validation_rules: Optional custom validation rules to apply
        
    Returns:
        ValidationResult object containing validation status and errors
        
    Raises:
        AgentError: When validation system encounters internal errors
        
    Example:
        >>> result = await validate_user_data({"email": "test@example.com"})
        >>> if not result.is_valid:
        ...     print(f"Validation errors: {result.errors}")
    """
    # Implementation with proper error handling
```

### 🔗 Multi-Agent Coordination Standards

**Agent Documentation Headers:**
```typescript
/**
 * @agent Frontend Specialist
 * @responsibility UI/UX implementation, user interactions, client-side validation
 * @dependencies ['@shared/validation', '@shared/api-client', '@shared/constants']
 * @outputs ['src/components/', 'src/styles/', 'src/tests/frontend/']
 * @coordination Communicates with Backend Agent via shared API contracts
 * @performance Optimized for bundle size, lazy loading, responsive design
 * @testing Jest + React Testing Library for unit/integration tests
 */
```

**Structured Logging Standards:**
```typescript
interface LogEntry {
  timestamp: Date;
  agentId: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata: Record<string, unknown>;
  correlation: {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
  };
}

class AgentLogger {
  constructor(private agentId: string) {}
  
  info(message: string, metadata: Record<string, unknown> = {}): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      agentId: this.agentId,
      level: 'info',
      message,
      metadata,
      correlation: this.getCorrelationContext()
    };
    console.log(JSON.stringify(entry));
  }
}
```

**Dependency Injection Patterns:**
```typescript
interface AgentDependencies {
  logger: AgentLogger;
  config: AgentConfig;
  dataSource: DataSource;
  eventBus: EventBus;
}

interface ServiceContainer {
  register<T>(token: string, factory: () => T): void;
  resolve<T>(token: string): T;
}

class AgentServiceContainer implements ServiceContainer {
  private services = new Map<string, () => unknown>();
  
  register<T>(token: string, factory: () => T): void {
    this.services.set(token, factory);
  }
  
  resolve<T>(token: string): T {
    const factory = this.services.get(token);
    if (!factory) throw new Error(`Service ${token} not registered`);
    return factory() as T;
  }
}
```

### ⚙️ Required Configuration Files (MANDATORY)

**`.editorconfig`** (project root):
```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
max_line_length = 120

[*.{js,ts,jsx,tsx,json,yml,yaml,md}]
indent_style = space
indent_size = 2

[*.{py}]
indent_style = space
indent_size = 4

[*.{go}]
indent_style = tab

[Makefile]
indent_style = tab
```

**`eslint.config.mjs`** (2024 flat config format):
```javascript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylistic,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Multi-agent specific rules
      'prefer-const': 'error',
      'no-var': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    }
  },
);
```

**`pyproject.toml`** (unified Python configuration):
```toml
[tool.black]
line-length = 88
target-version = ['py38', 'py39', 'py310', 'py311']
include = '\.pyi?$'
extend-exclude = '''
/(
  # Directories to exclude
  \.git
  | \.hg
  | \.mypy_cache
  | \.tox
  | \.venv
  | _build
  | buck-out
  | build
  | dist
)/
'''

[tool.ruff]
line-length = 88
target-version = "py38"
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # pyflakes
    "I",   # isort
    "N",   # pep8-naming
    "UP",  # pyupgrade
    "B",   # flake8-bugbear
    "C4",  # flake8-comprehensions
    "ICN", # flake8-import-conventions
    "PIE", # flake8-pie
    "PYI", # flake8-pyi
    "RSE", # flake8-raise
    "RUF", # ruff-specific
]
ignore = [
    "E203", # Whitespace before ':' (conflicts with Black)
    "W503", # Line break before binary operator (conflicts with Black)
]

[tool.mypy]
python_version = "3.8"
strict = true
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_any_generics = true
no_implicit_optional = true
warn_redundant_casts = true
warn_unused_ignores = true

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py", "*_test.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = "--strict-markers --strict-config --verbose"
```

**`.vscode/settings.json`** (shared IDE configuration):
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "eslint.workingDirectories": ["./"],
  "prettier.requireConfig": true,
  "python.defaultInterpreterPath": "./venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.ruffEnabled": true,
  "python.formatting.provider": "black",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter"
  },
  "files.associations": {
    "*.json": "jsonc"
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/.git": true,
    "**/.DS_Store": true,
    "**/dist": true,
    "**/build": true,
    "**/.venv": true,
    "**/__pycache__": true
  }
}
```

### 🏗️ Architecture Patterns for Large Codebases

**Modular Organization:**
```
src/
├── agents/
│   ├── frontend/
│   │   ├── components/
│   │   ├── services/
│   │   ├── utils/
│   │   └── types/
│   ├── backend/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   └── types/
│   ├── testing/
│   │   ├── fixtures/
│   │   ├── mocks/
│   │   ├── utils/
│   │   └── types/
│   └── shared/
│       ├── types/
│       ├── utils/
│       ├── constants/
│       └── interfaces/
├── config/
│   ├── agent-configs/
│   ├── environment/
│   └── build/
└── docs/
    ├── api/
    ├── architecture/
    └── deployment/
```

**Performance Optimization Patterns:**
```typescript
// Lazy loading for agent modules
class AgentLoader {
  private static agents = new Map<string, Promise<any>>();
  
  static async loadAgent(agentType: string): Promise<any> {
    if (!this.agents.has(agentType)) {
      const agentPromise = this.dynamicImport(agentType);
      this.agents.set(agentType, agentPromise);
    }
    return this.agents.get(agentType)!;
  }
  
  private static async dynamicImport(agentType: string): Promise<any> {
    switch (agentType) {
      case 'frontend':
        return import('./agents/frontend');
      case 'backend':
        return import('./agents/backend');
      case 'testing':
        return import('./agents/testing');
      default:
        throw new Error(`Unknown agent type: ${agentType}`);
    }
  }
}

// Memory management for agent lifecycle
class AgentManager {
  private activeAgents = new Map<string, Agent>();
  private readonly maxConcurrentAgents = 10;
  
  async startAgent(agentId: string, config: AgentConfig): Promise<Agent> {
    if (this.activeAgents.size >= this.maxConcurrentAgents) {
      await this.evictLeastRecentlyUsedAgent();
    }
    
    const agent = await AgentLoader.loadAgent(config.type);
    const instance = new agent(config);
    this.activeAgents.set(agentId, instance);
    
    return instance;
  }
  
  async stopAgent(agentId: string): Promise<void> {
    const agent = this.activeAgents.get(agentId);
    if (agent) {
      await agent.cleanup();
      this.activeAgents.delete(agentId);
    }
  }
}
```

### 🔧 CI/CD Integration (MANDATORY)

**`.pre-commit-config.yaml`**:
```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-json
      - id: check-yaml
      - id: check-merge-conflict
      
  - repo: https://github.com/charliermarsh/ruff-pre-commit
    rev: v0.1.0
    hooks:
      - id: ruff
        args: [--fix, --exit-non-zero-on-fix]
      - id: ruff-format
        
  - repo: https://github.com/psf/black
    rev: 23.9.1
    hooks:
      - id: black
        
  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.50.0
    hooks:
      - id: eslint
        files: \.(js|ts|jsx|tsx)$
        types: [file]
        additional_dependencies: 
          - eslint@8.50.0
          - "@typescript-eslint/parser@6.7.0"
          - "@typescript-eslint/eslint-plugin@6.7.0"
          - prettier@3.0.0
```

**GitHub Actions Multi-Agent Workflow:**
```yaml
name: Multi-Agent Code Quality
on: [push, pull_request]

jobs:
  quality-checks:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        agent: [frontend, backend, testing, shared]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          
      - name: Install dependencies
        run: |
          npm ci
          pip install -r requirements.txt
          
      - name: Run linting for ${{ matrix.agent }}
        run: |
          npm run lint:${{ matrix.agent }}
          ruff check src/agents/${{ matrix.agent }}/
          
      - name: Run type checking for ${{ matrix.agent }}
        run: |
          npm run typecheck:${{ matrix.agent }}
          mypy src/agents/${{ matrix.agent }}/
          
      - name: Run tests for ${{ matrix.agent }}
        run: npm run test:${{ matrix.agent }}
        
      - name: Build ${{ matrix.agent }}
        run: npm run build:${{ matrix.agent }}
```

### 🎯 Code Quality Gates & Enforcement

**Linting Standards (ZERO TOLERANCE):**
- **JavaScript/TypeScript**: ESLint with Airbnb config + TypeScript strict rules
- **Python**: Ruff with comprehensive rule set + Black formatting
- **ALL code must pass linting** before commit - no exceptions
- **Pre-commit hooks prevent** non-compliant code from entering repository

**Type Checking Requirements:**
- **TypeScript**: Strict mode enabled, no `any` types without explicit reasoning
- **Python**: mypy strict mode, all functions must have type hints
- **Interface definitions required** for all agent communication contracts

**Documentation Standards:**
- **All public APIs documented** with JSDoc (TS/JS) or Google-style docstrings (Python)
- **Examples required** for complex functions and classes  
- **Agent responsibility headers** mandatory for all agent-specific files
- **README files required** for each agent module explaining purpose and usage

**Testing Requirements:**
- **Unit test coverage minimum 80%** for all agent-specific code
- **Integration tests required** for agent communication interfaces
- **End-to-end tests required** for complete multi-agent workflows
- **Performance tests required** for critical path operations

### 🚨 Enforcement Protocol & Success Metrics

**ABSOLUTE ENFORCEMENT RULES:**
- **❌ NEVER commit code with linting errors** - Fix all violations immediately
- **❌ NEVER use inconsistent naming** - Follow agent-specific patterns strictly  
- **❌ NEVER skip documentation** - All public interfaces must be documented
- **❌ NEVER bypass type checking** - Address all type errors properly
- **❌ NEVER ignore test failures** - All tests must pass before merging

**MANDATORY VALIDATION CHECKLIST:**
```bash
# Before any commit, ALL of these must pass:
npm run lint        # ESLint + Prettier validation
npm run typecheck   # TypeScript strict type checking  
ruff check .        # Python linting with Ruff
mypy .             # Python type checking with mypy
black --check .    # Python formatting validation
npm test           # All test suites pass
npm run build      # Build process succeeds
```

**SUCCESS METRICS & MONITORING:**
- **Zero linting errors** across all codebases at all times
- **Consistent code style** regardless of contributing agent
- **Reduced merge conflicts** through standardized formatting and patterns
- **Improved maintainability** via clear architectural boundaries  
- **Enhanced performance** through optimized multi-agent coordination
- **Faster onboarding** for new agents through consistent patterns
- **Reduced debugging time** through standardized error handling
- **Better code reviews** through automated quality gates

**CONTINUOUS IMPROVEMENT:**
- **Weekly code quality audits** to identify pattern violations
- **Monthly tool updates** to maintain latest best practices
- **Quarterly architecture reviews** to optimize agent coordination
- **Regular performance monitoring** to identify bottlenecks and optimization opportunities

**🏆 ULTIMATE GOAL:** Create a self-enforcing ecosystem where code quality and consistency are automatic, enabling seamless collaboration between multiple AI agents on large-scale projects while maintaining enterprise-grade reliability and performance.

## 🚨 WORKFLOW PROTOCOLS

**TODO.json INTERACTION PROTOCOL:**
**MANDATORY**: ALWAYS USE THE TASKMANAGER API WHEN INTERACTING WITH THE TODO.JSON

**CRITICAL REQUIREMENT**: ALL TODO.json operations (read/write) MUST use TaskManager API exclusively.

**✅ ALLOWED**: Reading TODO.json as a file (Read tool only) for viewing/inspection
**✅ CORRECT**: TaskManager API for ALL TODO.json interactions (create, update, delete, modify, reorder)
**❌ ABSOLUTELY FORBIDDEN**: Any write operations directly to TODO.json file
**❌ ABSOLUTELY FORBIDDEN**: fs.readFileSync/writeFileSync on TODO.json for modifications
**❌ ABSOLUTELY FORBIDDEN**: require('./TODO.json') for any mutations
**❌ ABSOLUTELY FORBIDDEN**: JSON.parse/JSON.stringify operations that modify TODO.json
**❌ ABSOLUTELY FORBIDDEN**: Any direct file manipulation beyond reading for inspection

**GOLDEN RULE**: TODO.json is READ-ONLY as a file. ALL modifications MUST go through TaskManager API.

**ALWAYS USE THESE COMMANDS INSTEAD:**
```bash
# AGENT INITIALIZATION (MANDATORY FIRST STEP) - ALWAYS use universal script
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project [PROJECT_DIRECTORY]

# UPDATE TASK STATUS (SIMPLIFIED)
node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" update task_id completed "Optional completion notes" --project [PROJECT_DIRECTORY]

# Read TODO.json data
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.readTodo().then(data => console.log(JSON.stringify(data, null, 2)));"

# Get current task
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.getCurrentTask('agent_id').then(task => console.log(JSON.stringify(task, null, 2)));"

# List all tasks
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.readTodo().then(data => console.log(JSON.stringify(data.tasks, null, 2)));"

# Create new task
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.createTask({title: 'Task name', mode: 'DEVELOPMENT'}).then(id => console.log('Created:', id));"
```

## 🚨 ROOT FOLDER ORGANIZATION POLICY

**MANDATORY ROOT FOLDER CLEANLINESS:**
- **KEEP ROOT FOLDER CLEAN** - Only essential project files in root directory
- **Create development subdirectories** for reports, research, and documentation if they don't exist
- **Move analysis files, reports, and documentation** to appropriate subdirectories

**ALLOWED IN ROOT DIRECTORY:**
- **Core project files**: package.json, README.md, CLAUDE.md, TODO.json, DONE.json
- **Configuration files**: .eslintrc, .gitignore, jest.config.js, etc.
- **Build/deployment files**: Dockerfile, docker-compose.yml, etc.
- **License and legal**: LICENSE, CONTRIBUTING.md, etc.

**ORGANIZE INTO SUBDIRECTORIES:**
- **Reports and analysis** → `development/reports/` 
- **Research documentation** → `development/research-reports/`
- **Development notes** → `development/notes/`
- **Backup files** → `backups/`

## 🚨 MANDATORY GIT WORKFLOW

**ABSOLUTE REQUIREMENT**: ALWAYS commit and push work after EVERY task completion

### 🔴 MANDATORY COMMIT PROTOCOL - NO EXCEPTIONS

**AFTER COMPLETING ANY TASK - IMMEDIATELY RUN:**

```bash
# 1. Stage all changes
git add -A

# 2. Commit with descriptive message
git commit -m "feat: [brief description of what was accomplished]

- [bullet point of specific changes made]
- [another accomplishment]
- [any fixes or improvements]

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# 3. MANDATORY - Push to remote repository
git push
```

### 📝 COMMIT MESSAGE STANDARDS

**REQUIRED FORMAT:**
- **Type**: Use conventional commit prefixes: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- **Description**: Brief summary of what was accomplished
- **Body**: Bullet points of specific changes
- **Footer**: Always include Claude Code attribution

**EXAMPLES:**
```bash
git commit -m "fix: resolve multi-agent processing bottlenecks

- Fixed stop-hook JSON parsing error
- Reactivated multiple agents for concurrent processing  
- Updated validation system to support multiple in_progress tasks
- Verified task distribution across specialized agents

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

### ⚡ WORKFLOW ENFORCEMENT

**MANDATORY SEQUENCE:**
1. **Complete Task** - Finish all implementation and testing
2. **Validate Work** - Run all validation commands and verify results
3. **Stage Changes** - `git add -A` to include all modifications
4. **Commit Work** - Use descriptive commit message with proper format
5. **Push Remote** - `git push` to ensure work is backed up and shared
6. **Mark Task Complete** - Update TaskManager with completion status

**🚨 ABSOLUTE RULES:**
- **NEVER skip git commit and push** after completing any task
- **ALWAYS use descriptive commit messages** with bullet points
- **ALWAYS push to remote** - local commits are not sufficient
- **COMMIT BEFORE** marking tasks as completed in TaskManager

**TASK COMPLETION REQUIREMENTS:**

**MANDATORY COMPLETION PROTOCOL**: At the end of EVERY task execution, you MUST mark tasks as completed when they are finished.

**Task Completion API:**
```bash
# Initialize TaskManager and mark task as completed
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.updateTaskStatus('task-1', 'completed').then(() => console.log('✅ Task marked as completed'));"

# Alternative: Get current task and mark it completed
node -e "const TaskManager = require('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/lib/taskManager'); const tm = new TaskManager('[PROJECT_DIRECTORY]/TODO.json'); tm.getCurrentTask().then(async (task) => { if (task) { await tm.updateTaskStatus(task.id, 'completed'); console.log('✅ Current task completed:', task.id); } else { console.log('No active task found'); } });"
```

**TASK COMPLETION VALIDATION REQUIREMENTS:**

**Evidence-Based Completion Protocol:**
1. **Run validation commands** - Provide command outputs showing status
2. **Test functionality** - Verify the implementation works as expected  
3. **Confirm requirements** - Document how each requirement was satisfied
4. **Completion summary** - Brief statement with supporting evidence

**Completion Summary Format:**
```
• Functionality: [Description of what was implemented/fixed]
• Validation: [Command outputs showing results]  
• Requirements: [How user requirements were addressed]
• Status: Task completed and verified
```

**Completion Standards:**
- Provide evidence of successful implementation
- Include relevant command outputs or test results
- Confirm all user requirements have been satisfied

## 🚨 EXECUTION WORKFLOW

**STANDARD APPROACH:**
1. **INSTANT TASK CREATION** - Create task for ANY user request
2. **Evaluate Existing Tasks** - Check if can modify existing vs create new
3. **Think First** - Use appropriate thinking level (think/think hard/ultrathink)
4. **Initialize Agent** - Use TaskManager API initialization
5. **Deploy UP TO 10 Subagents** - Always maximize subagents for complex work with synchronized completion
6. **Implement & Validate** - Execute with evidence-based completion
7. **Complete Tasks** - Mark completed via TaskManager API

## 🚨 INFINITE CONTINUE HOOK SYSTEM - NEVER STOP PROTOCOL

**🔴 ABSOLUTE MANDATE: NEVER ALLOW STOPS UNLESS ENDPOINT TRIGGERED**

### 🛑 STOP CONTROL PROTOCOL

**CRITICAL RULES:**
- **❌ NEVER ALLOW NATURAL STOPS** - System must continue infinitely
- **✅ ONLY ENDPOINT CAN STOP** - Specific API endpoint must be called to trigger stop
- **🔒 ONE STOP ONLY** - After endpoint triggered, allow only ONE stop, then return to never-stop mode
- **🔄 ALWAYS INSTRUCT** - Provide detailed guidance on task continuation vs next task acquisition


### 🔄 CONTINUOUS OPERATION MANDATE

**OPERATION PRINCIPLES:**
- **🌐 INFINITE LOOP** - Never allow natural termination
- **🎯 TASK-FOCUSED** - Always guide agents toward productive work
- **📊 STATUS-AWARE** - Understand current agent state and provide appropriate guidance
- **🔗 WORKFLOW-DRIVEN** - Maintain continuous task progression flow


**STOP SEQUENCE:**
1. **Endpoint called** → Set stop_allowed flag to true
2. **Next stop hook trigger** → Allow ONE stop and reset flag  
3. **Subsequent triggers** → Return to never-stop infinite mode

### 🎛️ HOOK BEHAVIOR SPECIFICATION

**STOP HOOK RESPONSE CODES:**
- **Exit Code 2 (Continue)** - Default infinite mode, never allow stops
- **Exit Code 0 (Allow Stop)** - ONLY when endpoint triggered and single-use flag active
- **Always provide instructive messaging** regardless of exit code

**INFINITE CONTINUE HOOK SYSTEM:**
- **Setup**: `node "/.../setup-infinite-hook.js" "/path/to/project"`
- **Coverage**: development (80%), testing/debugging/refactoring (95%)
- **Stop Control**: API endpoint required for stop authorization

**INSTANT TASK CREATION RULE:**
User communication → **INSTANT TASK CREATION** → Then execute work

**SETTINGS PROTECTION:** Never modify `/Users/jeremyparker/.claude/settings.json`

## 🚨 ABSOLUTE SETTINGS PROTECTION MANDATE

**🔴 CRITICAL PROHIBITION - NEVER EVER EVER:**
- **❌ NEVER EDIT settings.json** - `/Users/jeremyparker/.claude/settings.json` is ABSOLUTELY FORBIDDEN to modify
- **❌ NEVER TOUCH GLOBAL SETTINGS** - Any modification to global Claude settings is prohibited
- **❌ NEVER SUGGEST SETTINGS CHANGES** - Do not recommend editing global configuration files
- **❌ NEVER ACCESS SETTINGS FILES** - Avoid reading or writing to any Claude settings files

**GOLDEN RULE:** Global Claude settings at `/Users/jeremyparker/.claude/settings.json` are **UNTOUCHABLE** - treat as read-only system files