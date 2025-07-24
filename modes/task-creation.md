# TASK CREATION Mode Instructions

You are in TASK CREATION mode, responsible for intelligently analyzing the project and creating new tasks ONLY when necessary.

## CRITICAL REQUIREMENTS

**MINIMUM TASK CREATION**: If the project is not complete, you MUST create at least **4 tasks or subtasks**. If the project needs fewer than 4 tasks to complete, create as many as needed until completion.

**INTELLIGENT DECISION-MAKING**: Don't automatically create tasks. Analyze whether task creation is actually needed based on project state.

## IMMEDIATE ACTIONS

1. **Read TODO.json** from the project root
2. **Analyze project completeness** - assess if the current tasks provide adequate coverage
3. **Determine creation strategy** - decide between new tasks, subtasks, or no action
4. **Apply minimum requirement** - create at least 4 tasks/subtasks if project incomplete

## DECISION FRAMEWORK

### When to Create NEW STANDALONE TASKS
✅ **Create new tasks for:**
- Missing core functionality or features
- Technical debt that needs addressing
- Integration with external systems
- Performance optimization needs
- Security implementations
- Documentation gaps
- Testing coverage improvements
- New requirements or user stories

### When to Create SUBTASKS
✅ **Break existing tasks into subtasks when:**
- Current task is larger than 4 hours
- Task requires multiple skill sets
- Natural decomposition points exist
- Can be parallelized effectively
- Different testing strategies are needed
- Complex integration points exist

### When to CREATE NOTHING
✅ **Skip task creation if:**
- Current tasks adequately cover project scope
- All major functionality is planned
- Project roadmap is complete and well-defined
- No significant gaps or technical debt exist
- Tasks are appropriately sized (2-4 hours each)

### FALLBACK BEHAVIOR
If you determine that NO new tasks or subtasks are needed:
1. **Mark current task as completed** if it's actually done
2. **Proceed to the next pending task** in the TODO.json
3. **Continue normal execution workflow**

## Task Decomposition Strategies

### 1. Vertical Slicing (User Value)
Break features into complete, shippable increments:
```
User Dashboard → Basic layout → Real-time updates → Filtering → Export → Customization
```

### 2. Horizontal Slicing (Technical Layers)
Split by architectural components:
```
API Integration → Research docs → Data models → API client → Caching → Error handling → UI
```

### 3. Risk-First Decomposition
Tackle unknowns first:
```
Payment System → Research providers → Test sandbox → Design architecture → Basic flow → Refunds → Subscriptions
```

## Subtask Guidelines

### Ideal Task Size
- **2-4 hours**: One focused work session
- **Single Responsibility**: Does one thing well
- **Clear Success Criteria**: Measurable outcomes
- **Minimal Dependencies**: Can work in parallel

### Examples
✅ **Good**: "Create login endpoint with JWT generation"
❌ **Too Large**: "Implement entire authentication system"
❌ **Too Small**: "Create a variable"

## PROJECT ANALYSIS GUIDE

### Assess Project Completeness
Before creating tasks, evaluate:
- **Functional Coverage**: Are all core features planned?
- **Technical Debt**: What needs refactoring or improvement?
- **Testing Gaps**: Where is test coverage insufficient?
- **Documentation Needs**: What's missing or outdated?
- **Performance Issues**: Any optimization opportunities?
- **Security Concerns**: What security measures are needed?
- **Integration Points**: Are external system connections handled?

### Identify Task Gaps
Look for missing tasks in these areas:
- **User-facing features** not yet implemented
- **API endpoints** or data models needed
- **Database migrations** or schema changes
- **Authentication/authorization** components
- **Error handling** and logging improvements
- **Deployment and DevOps** requirements
- **Monitoring and observability** setup

## When to Create Tasks

### Create RESEARCH Tasks For:
- Unknown external APIs
- New technologies/frameworks
- Complex architectural decisions
- Performance optimization needs
- Security implementation patterns

### Split Tasks When:
- Different skill sets required
- Can be parallelized
- Natural checkpoint exists
- Different testing strategies needed

### Keep Together When:
- Tightly coupled logic
- Shared context critical
- Overhead exceeds benefit
- Single atomic change required

## Common Templates

### API Integration
1. Research API capabilities and limits
2. Design data model mappings
3. Build authentication flow
4. Create basic CRUD operations
5. Add error handling and retries
6. Implement rate limiting
7. Add caching layer
8. Write integration tests

### UI Feature
1. Design component structure
2. Build static components
3. Add state management
4. Connect to backend
5. Add loading/error states
6. Implement optimistic updates
7. Add animations/transitions
8. Write component tests

## JSON Structure for TODO.json

### Creating New Tasks AND Subtasks
```json
{
  "id": "task_[number]",
  "title": "Brief descriptive title",
  "description": "Detailed explanation of what needs to be done",
  "mode": "DEVELOPMENT|TESTING|RESEARCH|DEBUGGING|REFACTORING",
  "priority": "high|medium|low",
  "status": "pending",
  "success_criteria": [
    "Specific measurable outcome 1",
    "Specific measurable outcome 2"
  ],
  "dependencies": ["task_1", "task_2"],  // Optional
  "estimate": "2-4 hours",               // Optional
  "important_files": ["src/auth/"],      // Optional
  "requires_research": false             // Optional
}
```

### Task Status Updates
- **pending**: Not started
- **in_progress**: Currently working
- **completed**: Finished successfully
- **blocked**: Waiting on dependencies

## Quick Reference

### Priority Matrix
| Priority | Impact | Urgency | Examples |
|----------|--------|---------|----------|
| High | Critical path | Immediate | Security fixes, blocking bugs |
| Medium | Important | Soon | New features, optimizations |
| Low | Nice to have | Eventually | UI polish, minor improvements |

### Dependency Types
- **Technical**: Code/API dependencies
- **Data**: Database schema, migrations
- **Team**: Cross-team handoffs
- **External**: Third-party services

### Success Checklist
Before creating tasks, ensure:
- [ ] Clear acceptance criteria defined
- [ ] Dependencies explicitly mapped
- [ ] 2-4 hour scope maintained
- [ ] Success metrics are measurable
- [ ] Priority aligns with project goals
- [ ] Mode correctly assigned

## Task Creation Mindset

Think strategically about:
- **Value Delivery**: What provides the most user/business value?
- **Risk Mitigation**: What could block progress?
- **Parallelism**: What can teams work on simultaneously?
- **Integration Points**: Where do components connect?
- **Incremental Progress**: How to show continuous improvement?

## FINAL REMINDERS

**MINIMUM REQUIREMENT**: Create at least 4 tasks/subtasks if the project is incomplete. If fewer than 4 tasks are needed to complete the project, create only what's necessary.

**FALLBACK**: If no task creation is needed, proceed to the next pending task in the workflow.

Remember: Create tasks that move the project forward in meaningful, testable increments, but only when actually needed.