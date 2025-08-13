# Claude Code Project Assistant

## 🚨 CRITICAL COMPLIANCE PROTOCOLS

**ABSOLUTE PRIORITY ORDER:**
1. **User Instructions** - Direct commands take absolute highest priority
2. **Hook Feedback** - System responses must be addressed immediately and completely  
3. **Linting Error Feedback** - All linting errors MUST be fixed before proceeding with any task
4. **CLAUDE.md Protocols** - Follow documented patterns when not conflicting with above

**MANDATORY COMPLIANCE RULES:**
- **ALWAYS** follow user instructions exactly as given
- **ALWAYS** address hook feedback immediately and completely
- **ALWAYS** check for and fix linting errors before starting/continuing any task
- **IMMEDIATELY** stop and address any error feedback from hooks or linting
- **NEVER** bypass or ignore any feedback from systems or users
- **ABSOLUTELY NEVER** mask, hide, or work around problems - **ACTUALLY SOLVE THEM**

**LINTING ERROR PRIORITY PROTOCOL:**
- Run `npm run lint` before starting any development work
- Fix ALL linting errors using `npm run lint:fix` then manual fixes
- NEVER modify ignore files to bypass legitimate errors
- Linting errors block ALL other work until resolved

## 🚨 TASKMANAGER API INTEGRATION

**CRITICAL**: Directory restrictions resolved with Node.js API.

**✅ AGENT INITIALIZATION (MANDATORY):**
```bash
bash "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm" init
```
**This command provides your agent ID, current tasks, and ALL TaskManager API commands.**

**LEARN TASKMANAGER API**: The initialization process teaches you how to create tasks, prioritize them, and manage the TODO.json file. Pay attention to the API commands provided during initialization.

## 🚨 MANDATORY TASK CREATION PROTOCOLS

**ALWAYS CREATE TASKS FOR:**
- **EVERY complex user request** that cannot be completed instantly
- **ANY opportunity for improvement** discovered during work
- **ALL errors detected** (linting, testing, runtime, build failures)
- **Performance issues** (slow responses, memory leaks)
- **Security vulnerabilities** (auth issues, data exposure)
- **Code quality opportunities** (refactoring needs, missing docs)
- **Missing functionality** (incomplete features, edge cases)
- **Integration issues** (API failures, dependency conflicts)

**INSTANT vs COMPLEX REQUEST CLASSIFICATION:**
- **INSTANT**: Single file read | Basic status check | Simple one-line answer | Trivial parameter change
- **COMPLEX**: Multi-step work | Analysis required | Code changes | Research needed | Planning required

**MANDATORY WORKFLOW FOR COMPLEX USER REQUESTS:**
1. **DETECT** - Identify that user request requires multiple steps or cannot be done instantly
2. **CREATE** - Immediately create specific, actionable task using TaskManager API
3. **PRIORITIZE** - Move task to top position using `moveTaskToTop()` 
4. **EXECUTE** - Begin working on the now-prioritized task

**DYNAMIC TASK CREATION WORKFLOW:**
1. **DETECT** - Identify error/opportunity during execution
2. **CREATE** - Immediately use TaskManager API to create specific, actionable task
3. **PRIORITIZE** - Use reordering functions to position task appropriately
4. **CONTINUE** - Resume current work after task creation

**TASK CREATION REQUIREMENTS:**
- **SPECIFIC** - Concrete problem/opportunity description
- **ACTIONABLE** - Clear steps to resolve/implement
- **PRIORITIZED** - Appropriate urgency level (low/medium/high)
- **CATEGORIZED** - Proper mode assignment (DEVELOPMENT/TESTING/etc.)

## 🚨 EXTENDED THINKING ALLOCATION

**THINKING ESCALATION (USE MAXIMUM BENEFICIAL LEVEL):**
- **Simple tasks**: No thinking (single-step trivial work only)
- **Moderate** (2-4 steps): `(think)` - 4,000 tokens
- **Complex** (5-8 steps): `(think hard)` - 10,000 tokens
- **Architecture/system** (9+ steps): `(ultrathink)` - 31,999 tokens

**ULTRATHINK TRIGGERS:** System architecture | Multi-service integration
**THINK HARD TRIGGERS:** Performance optimization | Security planning | Complex refactoring | Debugging | Task planning

## 🚨 MAXIMUM PARALLEL SUBAGENT DEPLOYMENT

**FAILURE TO USE SUBAGENTS = FAILED EXECUTION**

Deploy **UP TO 5 SUBAGENTS** in parallel for ALL complex work.

**🎯 MICRO-SPECIALIZATION PRINCIPLE:**
Break work into **SMALLEST POSSIBLE SPECIALIZED UNITS** (30s-2min each) that can run in parallel. Each subagent:
- Has **ONE CLEAR, SPECIFIC PURPOSE** with concrete deliverable
- **NO OVERLAP** with other subagent domains
- **COORDINATES** seamlessly for synchronized completion

**SUBAGENTS REQUIRED FOR:**
- Any work taking >few seconds | All analysis/research/exploration
- Multi-step problem solving | Quality assurance/optimization
- Cross-cutting concerns | Parallel solution investigation

**🔬 SPECIALIZED SUBAGENT DOMAINS:**
- **Core System Analysis** - Architecture patterns, code quality, dependencies
- **Security & Performance** - Vulnerabilities, bottlenecks, optimization
- **Testing & Quality** - Coverage analysis, test strategy, edge cases (**Only ONE subagent may execute tests**)
- **User Experience** - UI components, user flows, accessibility
- **Data & State** - Data flow, state management, API design
- **Infrastructure** - Deployment, monitoring, CI/CD

**DEPLOYMENT STRATEGY: Think → Map → Balance → Deploy Simultaneously**

## 🚨 CODE QUALITY STANDARDS

- **250/400 line limit** per file/function
- **Comprehensive documentation** with JSDoc/TSDoc
- **Type annotations** for all functions and variables
- **Input validation** and error handling with logging
- **No hardcoded secrets** or credentials
- **Zero linter errors** before any task completion

## 🚨 ALWAYS PUSH AFTER COMMITTING

Every commit MUST be followed by a push to the remote repository.

```bash
# Standard Git Workflow
git add -A
git commit -m "feat: implement feature description

- Bullet point of accomplishment
- Another accomplishment

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

**Push Failure Recovery:**
```bash
# If push fails due to conflicts
git pull --rebase && git push

# If push fails due to branch tracking
git push -u origin HEAD
```

## 🚨 NEVER MODIFY SETTINGS FILE

**FORBIDDEN**: Never touch, read, modify, or interact with `/Users/jeremyparker/.claude/settings.json` under ANY circumstances.

## 🚨 TODO.json INTERACTION PROTOCOL

**MANDATORY**: ALL TODO.json write operations MUST use TaskManager API exclusively. Reading TODO.json directly is allowed.

**✅ CORRECT**: TaskManager API for writes, direct read for TODO.json allowed
**❌ FORBIDDEN**: Direct write operations on TODO.json

## 🚨 CONTINUE COMMAND PROTOCOL

- Use TaskManager Node.js API to get current active task or next pending task
- NEVER assume what to continue with - always check TODO.json via TaskManager API first
- Use commands from TaskManager API guide provided during initialization

## 🚨 ATTENTIVE WAITING PROTOCOL

- Wait attentively for user instructions before proceeding
- Ask clarifying questions when instructions are ambiguous  
- Stop immediately when user provides new instructions

## Standard Approach

1. **Wait for User** - Listen attentively to instructions
2. **Think First** - Assess complexity, determine thinking level (think/think hard/ultrathink)
3. **Initialize Agent** - If no agent number remembered: `bash "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm" init`
4. **Create Tasks** - For complex requests: CREATE → PRIORITIZE → EXECUTE
5. **Deploy Subagents** - Maximize parallel coverage for complex work
6. **Detect Opportunities** - Constantly scan for task creation opportunities
7. **Implement** - Execute with quality standards
8. **Commit & Push** - Always push after committing
9. **Complete Tasks** - Use TaskManager API to mark tasks complete

**Success Formula:** User Instructions + Maximum Thinking + Maximum Parallel Subagents + Dynamic Task Creation + Quality Standards + Always Push = **MAXIMUM SPEED WITH QUALITY**