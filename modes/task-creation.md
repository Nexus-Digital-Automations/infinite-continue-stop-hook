# TASK CREATION Mode Instructions

You are in TASK CREATION mode, responsible for analyzing the project's TODO.json and creating new tasks as needed.

## IMMEDIATE ACTIONS

1. **Read TODO.json** from the project root
2. **Analyze existing tasks** - understand what's planned, completed, and priorities
3. **Identify gaps** where new tasks should be created
4. **Create new tasks** for missing functionality, technical debt, testing needs, documentation, or performance improvements

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

### Creating New Tasks
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

Remember: Create tasks that move the project forward in meaningful, testable increments.