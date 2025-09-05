# Feature-Based TODO.json Migration Research Report

**Research Task ID:** task_1757094293365_hhkfonvqn  
**Implementation Task:** task_1757094293364_vfspshdb9  
**Date:** September 5, 2025  
**Author:** Claude Code

## Executive Summary

This research analyzes the migration from the current phase-based task system with dual features.json tracking to a unified feature-based TODO.json schema. The proposed architecture eliminates system complexity while providing better organization and user experience.

## Current System Analysis

### Current Architecture Issues
- **Dual System Complexity**: Both phase numbering in tasks AND separate features.json tracking
- **Synchronization Overhead**: Complex bidirectional sync between TaskManager and FeatureManager
- **API Proliferation**: feature-* endpoints duplicate core task functionality
- **Phase Numbering Limitations**: Arbitrary numbering doesn't reflect logical feature grouping

### Current Schema Structure
```json
{
  "tasks": [
    {
      "id": "task_123",
      "title": "Phase 1.2: Feature Name",
      "phase": {"major": 1, "minor": 2, "patch": 0},
      "subtasks": []
    }
  ]
}
```

## Proposed Architecture

### Unified Feature-Task Schema
```json
{
  "features": [
    {
      "id": "feature_bytebot_ane_bridge",
      "title": "Bytebot Apple Neural Engine Bridge", 
      "description": "Native macOS ANE access for containers",
      "status": "planned|in_progress|implemented",
      "category": "bytebot|open_interpreter|opendia|huginn|orchestrator",
      "priority": "low|medium|high|critical",
      "created_at": "ISO timestamp",
      "updated_at": "ISO timestamp", 
      "subtasks": ["task_ane_service", "task_vision_processor"],
      "dependencies": ["feature_prerequisite_id"],
      "success_criteria": ["Criteria 1", "Criteria 2"],
      "metadata": {
        "estimated_effort": "high",
        "completion_percentage": 0
      }
    }
  ],
  "tasks": [
    {
      "id": "task_ane_service",
      "title": "Create ANE Service Implementation",
      "parent_feature": "feature_bytebot_ane_bridge",
      "status": "pending|in_progress|completed",
      // ... existing task fields
    }
  ]
}
```

## Implementation Strategy

### Phase 1: Schema Enhancement
**Objective**: Modify TaskManager to support features array  
**Duration**: 30 minutes  
**Actions**:
- Add features array to TODO.json schema
- Implement feature creation, status tracking methods
- Add parent_feature field to tasks
- Maintain backward compatibility with existing phase-based tasks

### Phase 2: Data Migration
**Objective**: Convert existing phase-based tasks to feature hierarchy  
**Duration**: 20 minutes  
**Actions**:
- Analyze current AIgent tasks and group by logical features
- Create migration script to preserve all data relationships
- Generate feature hierarchy from phase structure
- Map phase numbering to natural feature grouping

### Phase 3: System Cleanup  
**Objective**: Remove redundant features.json system  
**Duration**: 15 minutes
**Actions**:
- Delete features.json, FeatureManager.js, FeaturesMigrator.js
- Remove feature-* API endpoints from taskmanager-api.js
- Clean up setup script integration
- Remove unused imports and references

### Phase 4: Documentation Update
**Objective**: Update workflows to use unified system  
**Duration**: 10 minutes
**Actions**:
- Update CLAUDE.md feature workflow sections
- Modify stop hook feedback to use task operations only
- Update examples and command references
- Remove feature-specific API documentation

## Technical Implementation Details

### Feature Status Derivation
```javascript
function calculateFeatureStatus(feature, tasks) {
  const subtasks = tasks.filter(t => t.parent_feature === feature.id);
  if (subtasks.length === 0) return 'planned';
  
  const completed = subtasks.filter(t => t.status === 'completed').length;
  const inProgress = subtasks.filter(t => t.status === 'in_progress').length;
  
  if (completed === subtasks.length) return 'implemented';
  if (inProgress > 0 || completed > 0) return 'in_progress';
  return 'planned';
}
```

### Task Creation Enhancement
```javascript
async createTask(taskData) {
  // Existing task creation logic...
  
  if (taskData.parent_feature) {
    // Link to parent feature
    const feature = await this.getFeature(taskData.parent_feature);
    if (feature && !feature.subtasks.includes(taskData.id)) {
      feature.subtasks.push(taskData.id);
      await this.updateFeature(feature.id, feature);
    }
  }
  
  return task;
}
```

## Risk Assessment

### Low Risk Areas
- **Schema Extension**: Adding features array is non-breaking
- **Task Linking**: parent_feature field is optional enhancement
- **API Simplification**: Removing feature endpoints reduces complexity

### Medium Risk Areas  
- **Data Migration**: Must preserve all existing task relationships
  - *Mitigation*: Create comprehensive backup before migration
  - *Mitigation*: Implement rollback mechanism
  - *Mitigation*: Validate data integrity after migration

### Migration Strategy
1. **Backup Current State**: Full TODO.json backup before any changes
2. **Incremental Migration**: Feature-by-feature conversion with validation
3. **Rollback Plan**: Restore from backup if any data loss detected
4. **Validation Protocol**: Verify task counts, dependencies, and metadata preservation

## Benefits Analysis

### Immediate Benefits
- **Simplified Architecture**: One system instead of two
- **Natural Organization**: Features group related implementation tasks
- **Reduced Complexity**: No synchronization logic needed
- **Performance**: Elimination of dual-system overhead

### Long-term Benefits  
- **Maintainability**: Single system to understand and debug
- **Extensibility**: Feature-based organization scales naturally
- **User Experience**: Clearer mental model of project structure
- **Development Velocity**: Reduced context switching between systems

## Success Criteria

1. **Data Preservation**: All existing tasks and relationships maintained
2. **Feature Organization**: Tasks properly grouped under logical features
3. **Status Accuracy**: Feature status correctly derived from subtask completion
4. **API Simplification**: Removal of redundant feature endpoints
5. **Documentation Accuracy**: Updated workflows reflect new architecture

## Recommendation

**Proceed with implementation** following the phased approach. The architectural benefits significantly outweigh the migration risks, and the implementation strategy provides adequate safeguards through backup and validation protocols.

The unified feature-based system will provide a cleaner, more maintainable foundation for task management while eliminating the complexity overhead of the dual-system approach.