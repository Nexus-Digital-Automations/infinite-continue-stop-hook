# Phase System Documentation

## 🚨 CRITICAL: FEATURE-EXCLUSIVE Phase System

The TaskManager phase system provides sequential phase tracking **EXCLUSIVELY for FEATURE tasks**. This comprehensive system enables timeline management and project organization for feature development lifecycle.

**ABSOLUTE RESTRICTION**: Phases are ONLY supported for feature objects in the `features` array of TODO.json - NOT for error, subtask, or test tasks.

---

## System Overview

### Core Principles

1. **📋 Feature-Only Scope**: Phases exist ONLY within feature objects in `TODO.json.features[]`
2. **🔢 Sequential Numbering**: Simple sequential phases: Phase 1, Phase 2, Phase 3, etc.
3. **📈 Lifecycle Tracking**: Track feature development from planning to completion
4. **⚡ Timeline Management**: Organize complex features into manageable phases
5. **🚫 Strict Boundaries**: Error, subtask, and test tasks NEVER have phases

### Architecture

```javascript
// TODO.json structure
{
  "features": [
    {
      "id": "feature_12345_abc",
      "title": "User Authentication System",
      "description": "Complete OAuth 2.0 implementation",
      "status": "in_progress",
      "phases": [                    // ← PHASES ARRAY (FEATURE-ONLY)
        {
          "number": 1,
          "title": "Planning & Design",
          "description": "Requirements gathering and architecture",
          "status": "completed",
          "created_at": "2025-09-09T10:00:00.000Z",
          "completed_at": "2025-09-09T12:00:00.000Z"
        },
        {
          "number": 2,
          "title": "Core Implementation",
          "description": "OAuth server and token management",
          "status": "in_progress",
          "created_at": "2025-09-09T12:00:00.000Z",
          "started_at": "2025-09-09T12:00:00.000Z"
        }
      ]
    }
  ],
  "tasks": [
    // ❌ Tasks in this array NEVER have phases
    // Only features in the features array can have phases
  ]
}
```

---

## API Reference

All phase commands require a `featureId` parameter and operate ONLY on features.

### Phase Creation

#### `create-phase`
Creates a new sequential phase for a specific feature.

```bash
timeout 10s node taskmanager-api.js create-phase <featureId> '{"title": "Phase Title", "description": "Phase description"}'
```

**Parameters:**
- `featureId` (required): Feature ID from TODO.json features array
- `phaseData` (required): JSON object with phase details
  - `title` (required): Phase title 
  - `description` (optional): Phase description
  - `number` (optional): Phase number (auto-assigned if not provided)
  - `status` (optional): Phase status (default: 'pending')

**Examples:**
```bash
# Create initial planning phase
timeout 10s node taskmanager-api.js create-phase feature_456_xyz '{"title": "Planning & Requirements", "description": "Gather requirements and design architecture"}'

# Create implementation phase
timeout 10s node taskmanager-api.js create-phase feature_456_xyz '{"title": "Core Development", "description": "Implement main functionality"}'
```

### Phase Updates

#### `update-phase`
Updates phase status, description, or other properties.

```bash
timeout 10s node taskmanager-api.js update-phase <featureId> <phaseNumber> '{"status": "completed", "notes": "Phase completed successfully"}'
```

**Parameters:**
- `featureId` (required): Feature ID
- `phaseNumber` (required): Phase number to update
- `updates` (required): JSON object with field updates

**Examples:**
```bash
# Mark phase as completed
timeout 10s node taskmanager-api.js update-phase feature_456_xyz 1 '{"status": "completed"}'

# Add notes to phase
timeout 10s node taskmanager-api.js update-phase feature_456_xyz 2 '{"notes": "Encountered API rate limiting - implementing retry logic"}'
```

### Phase Progression

#### `progress-phase`
Completes current phase and automatically progresses to next phase.

```bash
timeout 10s node taskmanager-api.js progress-phase <featureId> <currentPhaseNumber>
```

**Parameters:**
- `featureId` (required): Feature ID
- `currentPhaseNumber` (required): Phase number to complete

**Behavior:**
- Marks specified phase as 'completed'
- Sets completion timestamp
- Automatically starts next phase (if exists)
- Returns next phase object or null if no more phases

**Examples:**
```bash
# Complete Phase 1 and start Phase 2
timeout 10s node taskmanager-api.js progress-phase feature_456_xyz 1

# Complete final phase
timeout 10s node taskmanager-api.js progress-phase feature_456_xyz 3
```

### Phase Queries

#### `list-phases`
Lists all phases for a feature with completion statistics.

```bash
timeout 10s node taskmanager-api.js list-phases <featureId>
```

**Returns:**
- Array of all phases for the feature
- Completion statistics (total, completed, in_progress, pending)
- Completion percentage

#### `current-phase`
Gets the currently active phase for a feature.

```bash
timeout 10s node taskmanager-api.js current-phase <featureId>
```

**Returns:**
- Current 'in_progress' phase, or first 'pending' phase if none in progress
- Completion statistics
- Status message

#### `phase-stats`
Gets detailed phase completion statistics.

```bash
timeout 10s node taskmanager-api.js phase-stats <featureId>
```

**Returns:**
- Detailed statistics object
- Individual phase status breakdown
- Timeline information

---

## Phase Workflow Examples

### Complete Feature Development Lifecycle

```bash
# 1. Create feature phases for comprehensive development
timeout 10s node taskmanager-api.js create-phase feature_789_def '{"title": "Discovery & Planning", "description": "Requirements gathering, user research, and technical design"}'

timeout 10s node taskmanager-api.js create-phase feature_789_def '{"title": "MVP Implementation", "description": "Core functionality development and basic testing"}'

timeout 10s node taskmanager-api.js create-phase feature_789_def '{"title": "Enhancement & Polish", "description": "Advanced features, UI polish, and optimization"}'

timeout 10s node taskmanager-api.js create-phase feature_789_def '{"title": "Testing & QA", "description": "Comprehensive testing, bug fixes, and quality assurance"}'

timeout 10s node taskmanager-api.js create-phase feature_789_def '{"title": "Documentation & Deployment", "description": "User docs, API documentation, and production deployment"}'

# 2. Monitor current status
timeout 10s node taskmanager-api.js current-phase feature_789_def

# 3. Progress through phases as work completes
timeout 10s node taskmanager-api.js progress-phase feature_789_def 1  # Complete planning
timeout 10s node taskmanager-api.js progress-phase feature_789_def 2  # Complete MVP
timeout 10s node taskmanager-api.js progress-phase feature_789_def 3  # Complete enhancement

# 4. Check completion statistics
timeout 10s node taskmanager-api.js phase-stats feature_789_def
```

### Agile Sprint-Based Development

```bash
# Create sprint-based phases
timeout 10s node taskmanager-api.js create-phase feature_sprint_abc '{"title": "Sprint 1 - Foundation", "description": "Basic architecture and core models"}'

timeout 10s node taskmanager-api.js create-phase feature_sprint_abc '{"title": "Sprint 2 - API Development", "description": "REST API endpoints and authentication"}'

timeout 10s node taskmanager-api.js create-phase feature_sprint_abc '{"title": "Sprint 3 - Frontend UI", "description": "User interface and client-side logic"}'

timeout 10s node taskmanager-api.js create-phase feature_sprint_abc '{"title": "Sprint 4 - Integration", "description": "Full stack integration and testing"}'

# Progress through sprints
timeout 10s node taskmanager-api.js progress-phase feature_sprint_abc 1
timeout 10s node taskmanager-api.js list-phases feature_sprint_abc
```

---

## Integration Patterns

### With TaskManager Tasks

While phases are EXCLUSIVE to features, you can link tasks to features for coordination:

```bash
# Create tasks that reference feature phases in descriptions
timeout 10s node taskmanager-api.js create '{"title": "Implement user authentication endpoints", "description": "Part of feature_auth_123 Phase 2: Core Implementation", "category": "feature", "parent_feature": "feature_auth_123"}'
```

### Project Timeline Management

```bash
# Get comprehensive project status across all features with phases
timeout 10s node taskmanager-api.js list-features

# Monitor phase completion across multiple features
for feature in feature_auth_123 feature_dashboard_456 feature_analytics_789; do
  echo "=== $feature ==="
  timeout 10s node taskmanager-api.js current-phase $feature
done
```

---

## Validation & Error Handling

### Strict Feature-Only Enforcement

The system enforces feature-only phase creation:

```javascript
// ✅ VALID: Creating phase for feature
await taskManager.createPhase('feature_123_abc', {
  title: 'Implementation Phase',
  description: 'Core development work'
});

// ❌ INVALID: Attempting to create phase for task
// This will throw error: "phases can only be added to features"
await taskManager.createPhase('task_123_xyz', { title: 'Phase 1' });

// ❌ INVALID: Feature not found
await taskManager.createPhase('nonexistent_feature', { title: 'Phase 1' });
// Throws: "Feature nonexistent_feature not found"
```

### Phase Validation

- **Required Fields**: Phase title is mandatory
- **Sequential Numbers**: Phases automatically numbered sequentially
- **Status Validation**: Only valid statuses accepted ('pending', 'in_progress', 'completed')
- **Feature Existence**: Feature must exist before phases can be created

---

## Best Practices

### ✅ When to Use Phases

1. **Complex Features**: Multi-step features requiring structured development
2. **Timeline Tracking**: Projects needing phase-based progress monitoring  
3. **Team Coordination**: Features with multiple development stages
4. **Milestone Management**: Features with distinct completion criteria
5. **Sprint Planning**: Agile development with sprint-based phases

### ❌ When NOT to Use Phases

1. **Simple Features**: Single-step implementations
2. **Error Tasks**: Use priority and urgency instead
3. **Subtasks**: Already components of larger features
4. **Test Tasks**: Organize by test type and coverage
5. **Bug Fixes**: Use severity and impact classification

### Naming Conventions

**Good Phase Names:**
```
✅ "Discovery & Requirements"
✅ "Core Implementation"  
✅ "Testing & QA"
✅ "Performance Optimization"
✅ "Documentation & Deployment"
```

**Poor Phase Names:**
```
❌ "Phase 1" (too generic)
❌ "Do stuff" (non-descriptive)
❌ "Fix things" (unclear scope)
```

---

## Troubleshooting

### Common Issues

**1. "Feature not found" Error**
```bash
# Verify feature exists
timeout 10s node taskmanager-api.js list-features
```

**2. "Phase number required" Error**  
```bash
# Ensure phase number is provided as integer
timeout 10s node taskmanager-api.js update-phase feature_123 1 '{"status": "completed"}'
```

**3. "phases can only be added to features" Error**
```bash
# Verify you're using a feature ID, not a task ID
# Feature IDs typically start with "feature_" prefix
```

### Debug Commands

```bash
# Check feature structure and existing phases
timeout 10s node taskmanager-api.js list-phases <featureId>

# Verify current phase status
timeout 10s node taskmanager-api.js current-phase <featureId>

# Get detailed statistics
timeout 10s node taskmanager-api.js phase-stats <featureId>
```

---

## Related Documentation

- [TaskManager API Reference](./taskmanager-api-reference.md)
- [Feature Management Guide](./feature-management.md)
- [TaskManager Architecture](./taskmanager-guide-integration-architecture.md)

---

**Document Information**
- **Last Updated**: 2025-09-09
- **Version**: 2.1.0 (Phase System Implementation)
- **Phase System**: FEATURE-EXCLUSIVE Sequential Phases
- **Maintained By**: Claude Code AI Assistant
- **Review Schedule**: After major feature updates
- **Related Systems**: TaskManager API, Feature Management, TODO.json Structure