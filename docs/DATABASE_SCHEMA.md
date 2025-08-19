# TaskManager Database Schema Documentation

## Overview

This document describes the comprehensive database schema design for the TaskManager system. The schema supports both SQL (PostgreSQL/MySQL) and NoSQL (MongoDB) databases, as well as the current JSON file-based system.

## Design Principles

### 1. **Multi-Database Support**
- **JSON Files**: Current system for development and simple deployments
- **PostgreSQL**: Recommended for production environments requiring ACID compliance
- **MongoDB**: Optimal for high-volume, flexible document storage
- **MySQL**: Alternative SQL option for existing MySQL environments

### 2. **TaskManager Features Supported**
- ✅ Task management with dependencies and categorization
- ✅ Multi-agent coordination and session tracking
- ✅ Priority-based task queuing with category hierarchy
- ✅ Parallel execution support
- ✅ Complete audit trails and history tracking
- ✅ Performance metrics and analytics
- ✅ Heartbeat monitoring and stale task detection
- ✅ Project isolation and multi-project support

### 3. **Performance Considerations**
- Optimized indexes for common query patterns
- Aggregation pipelines for real-time analytics
- Efficient dependency resolution algorithms
- Automatic data archival and cleanup strategies

## Database Schema Comparison

| Feature | JSON Files | PostgreSQL | MongoDB | MySQL |
|---------|------------|------------|---------|-------|
| **ACID Compliance** | ❌ | ✅ | ⚠️ (Document level) | ✅ |
| **Horizontal Scaling** | ❌ | ⚠️ (Read replicas) | ✅ | ⚠️ (Read replicas) |
| **Complex Queries** | ❌ | ✅ | ✅ | ✅ |
| **Real-time Analytics** | ❌ | ✅ | ✅ | ✅ |
| **Schema Flexibility** | ✅ | ⚠️ (Migrations) | ✅ | ⚠️ (Migrations) |
| **Deployment Complexity** | ✅ (Simple) | ⚠️ (Medium) | ⚠️ (Medium) | ⚠️ (Medium) |
| **Memory Usage** | ✅ (Low) | ⚠️ (Medium) | ⚠️ (Medium) | ⚠️ (Medium) |

## Core Entities

### 1. Projects
**Purpose**: Support multi-project TaskManager instances

**SQL Schema**:
```sql
CREATE TABLE projects (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    root_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true
);
```

**MongoDB Schema**:
```javascript
{
  _id: "infinite-continue-stop-hook",
  name: "Infinite Continue Stop Hook",
  description: "TaskManager automation system",
  rootPath: "/path/to/project",
  createdAt: ISODate("2025-08-19T22:00:00Z"),
  updatedAt: ISODate("2025-08-19T22:00:00Z"),
  settings: { /* project configuration */ },
  isActive: true
}
```

### 2. Agents
**Purpose**: Centralized agent registry with performance tracking

**SQL Schema**:
```sql
CREATE TABLE agents (
    id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES projects(id),
    role VARCHAR(50) NOT NULL DEFAULT 'development',
    session_id VARCHAR(100),
    specialization JSONB DEFAULT '[]',
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    total_tasks_completed INTEGER DEFAULT 0,
    avg_completion_time_minutes INTEGER DEFAULT 0
);
```

**MongoDB Schema**:
```javascript
{
  _id: "development_session_1755641552331_1_general_43b03e03",
  projectId: "infinite-continue-stop-hook",
  role: "development",
  sessionId: "session_1755641552331",
  specialization: ["backend", "api"],
  config: { /* agent configuration */ },
  createdAt: ISODate("2025-08-19T22:00:00Z"),
  lastHeartbeat: ISODate("2025-08-19T22:15:00Z"),
  isActive: true,
  statistics: {
    totalTasksCompleted: 5,
    avgCompletionTimeMinutes: 45,
    totalWorkTimeMinutes: 225,
    successRate: 95.5
  }
}
```

### 3. Tasks
**Purpose**: Enhanced task management with full feature support

**SQL Schema**:
```sql
CREATE TABLE tasks (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES projects(id),
    title VARCHAR(500) NOT NULL,
    description TEXT DEFAULT '',
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    mode VARCHAR(50) DEFAULT 'DEVELOPMENT',
    status VARCHAR(20) DEFAULT 'pending',
    
    -- Assignment and ownership
    assigned_agent VARCHAR(100) REFERENCES agents(id),
    claimed_by VARCHAR(100) REFERENCES agents(id),
    
    -- Timing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    -- Task metadata
    estimate_minutes INTEGER DEFAULT 0,
    requires_research BOOLEAN DEFAULT false,
    success_criteria JSONB DEFAULT '[]',
    subtasks JSONB DEFAULT '[]',
    
    -- Progress tracking
    completion_percentage INTEGER DEFAULT 0,
    actual_time_minutes INTEGER DEFAULT 0,
    complexity_score INTEGER DEFAULT 1,
    
    -- Parallel execution support
    can_parallelize BOOLEAN DEFAULT false,
    parallel_group VARCHAR(50) DEFAULT NULL,
    coordinator_task VARCHAR(50) REFERENCES tasks(id)
);
```

**MongoDB Schema**:
```javascript
{
  _id: "task_1755556336274_z6pn81ikf",
  projectId: "infinite-continue-stop-hook",
  title: "Manual Test Task A - Backend API",
  description: "Create REST API endpoints",
  category: "missing-feature",
  priority: "medium",
  mode: "DEVELOPMENT",
  status: "completed",
  
  assignedAgent: "development_session_1755641552331_1_general_43b03e03",
  claimedBy: "development_session_1755641552331_1_general_43b03e03",
  
  createdAt: ISODate("2025-08-18T22:32:16Z"),
  startedAt: ISODate("2025-08-19T22:13:06Z"),
  completedAt: ISODate("2025-08-19T22:18:00Z"),
  
  estimateMinutes: 30,
  requiresResearch: false,
  successCriteria: ["API endpoints created", "Tests passing"],
  
  dependencies: [
    {
      taskId: "task_dependency_id",
      type: "blocks",
      status: "satisfied"
    }
  ],
  
  parallelExecution: {
    canParallelize: false,
    parallelGroup: null,
    coordinatorTask: null
  },
  
  agentAssignmentHistory: [
    {
      agentId: "development_session_1755641552331_1_general_43b03e03",
      action: "claimed",
      timestamp: ISODate("2025-08-19T22:13:06Z"),
      reason: "Task claimed by agent"
    }
  ]
}
```

## Category-Based Priority System

The system implements a sophisticated priority system based on task categories:

### Priority Hierarchy (1 = Highest, 12 = Lowest)
1. **linter-error** - Code quality issues requiring immediate attention
2. **build-error** - Compilation and build failures
3. **start-error** - Application startup issues
4. **error** - General runtime errors and exceptions
5. **missing-feature** - Required functionality implementation
6. **bug** - Incorrect behavior fixes
7. **enhancement** - Feature improvements and optimizations
8. **refactor** - Code restructuring and technical debt
9. **documentation** - Documentation updates and API docs
10. **chore** - Maintenance tasks and administrative work
11. **research** - Investigation and exploration tasks
12. **missing-test** - Test coverage and testing infrastructure

### SQL Implementation
```sql
-- Category priority in ORDER BY clause
ORDER BY 
    CASE t.category
        WHEN 'linter-error' THEN 1
        WHEN 'build-error' THEN 2
        WHEN 'start-error' THEN 3
        WHEN 'error' THEN 4
        WHEN 'missing-feature' THEN 5
        WHEN 'bug' THEN 6
        WHEN 'enhancement' THEN 7
        WHEN 'refactor' THEN 8
        WHEN 'documentation' THEN 9
        WHEN 'chore' THEN 10
        WHEN 'research' THEN 11
        ELSE 12
    END,
    CASE t.priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
    END,
    t.created_at
```

### MongoDB Implementation
```javascript
{
  $addFields: {
    categoryPriority: {
      $switch: {
        branches: [
          { case: { $eq: ["$category", "linter-error"] }, then: 1 },
          { case: { $eq: ["$category", "build-error"] }, then: 2 },
          // ... additional cases
        ],
        default: 12
      }
    }
  }
},
{
  $sort: {
    categoryPriority: 1,
    priorityWeight: 1,
    createdAt: 1
  }
}
```

## Advanced Features

### 1. Dependency Management

**SQL Implementation**:
```sql
CREATE TABLE task_dependencies (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL REFERENCES tasks(id),
    dependency_task_id VARCHAR(50) NOT NULL REFERENCES tasks(id),
    dependency_type VARCHAR(20) DEFAULT 'blocks',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Get next task without blocking dependencies
SELECT t.* FROM tasks t
WHERE t.status = 'pending'
AND NOT EXISTS (
    SELECT 1 FROM task_dependencies td
    JOIN tasks dep_task ON td.dependency_task_id = dep_task.id
    WHERE td.task_id = t.id
    AND dep_task.status != 'completed'
);
```

**MongoDB Implementation**:
```javascript
// Dependencies embedded in task document
{
  dependencies: [
    {
      taskId: "dependency_task_id",
      type: "blocks",
      status: "pending"
    }
  ]
}

// Aggregation pipeline for dependency resolution
db.tasks.aggregate([
  { $match: { projectId: "PROJECT_ID", status: "pending" } },
  {
    $lookup: {
      from: "tasks",
      let: { taskDeps: "$dependencies.taskId" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $in: ["$_id", "$$taskDeps"] },
                { $ne: ["$status", "completed"] }
              ]
            }
          }
        }
      ],
      as: "blockingDependencies"
    }
  },
  { $match: { blockingDependencies: { $size: 0 } } }
]);
```

### 2. Multi-Agent Coordination

**Parallel Execution Support**:
```sql
-- SQL: Parallel execution tracking
CREATE TABLE parallel_execution_groups (
    group_id VARCHAR(50) PRIMARY KEY,
    coordinator_task VARCHAR(50) REFERENCES tasks(id),
    max_parallel_agents INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MongoDB: Embedded parallel execution config
{
  parallelExecution: {
    canParallelize: true,
    parallelGroup: "frontend_ui_group",
    coordinatorTask: "task_coordinator_id",
    parallelAgents: [
      "agent_frontend_1",
      "agent_frontend_2"
    ],
    maxParallelAgents: 3
  }
}
```

### 3. Performance Analytics

**Real-time Dashboard Views**:

**SQL View**:
```sql
CREATE VIEW project_dashboard_view AS
SELECT 
    p.*,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'pending' THEN t.id END) as pending_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
    COUNT(DISTINCT a.id) as total_agents,
    COUNT(DISTINCT CASE WHEN a.last_heartbeat > NOW() - INTERVAL '15 minutes' THEN a.id END) as active_agents,
    AVG(CASE WHEN t.status = 'completed' THEN t.actual_time_minutes END) as avg_completion_time
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
LEFT JOIN agents a ON p.id = a.project_id
WHERE p.is_active = true
GROUP BY p.id;
```

**MongoDB Aggregation**:
```javascript
const projectDashboardPipeline = [
  { $match: { _id: "PROJECT_ID" } },
  {
    $lookup: {
      from: "tasks",
      localField: "_id",
      foreignField: "projectId",
      as: "tasks"
    }
  },
  {
    $addFields: {
      taskSummary: {
        total: { $size: "$tasks" },
        pending: {
          $size: {
            $filter: {
              input: "$tasks",
              cond: { $eq: ["$$this.status", "pending"] }
            }
          }
        },
        completed: {
          $size: {
            $filter: {
              input: "$tasks",
              cond: { $eq: ["$$this.status", "completed"] }
            }
          }
        }
      }
    }
  }
];
```

## Data Migration and Conversion

The system includes comprehensive migration tools for converting between different database types:

### 1. JSON to SQL Migration
```bash
# Set target database
export DB_TYPE=postgresql
export DATABASE_URL=postgresql://user:pass@localhost/taskmanager

# Create schema and import data
node database/migrate.js create-schema
node database/migrate.js import ./TODO.json ./agent-registry.json
```

### 2. SQL to MongoDB Migration
```bash
# Export from SQL
export DB_TYPE=postgresql
node database/migrate.js export ./backup-todo.json ./backup-agents.json

# Import to MongoDB
export DB_TYPE=mongodb
export MONGODB_URI=mongodb://localhost:27017/taskmanager
node database/migrate.js import ./backup-todo.json ./backup-agents.json
```

### 3. Database Schema Versioning
```sql
CREATE TABLE schema_version (
    version VARCHAR(20) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);
```

## Performance Optimization

### 1. Index Strategy

**SQL Indexes**:
```sql
-- Critical performance indexes
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_category_priority ON tasks(category, priority);
CREATE INDEX idx_tasks_assigned_agent ON tasks(assigned_agent);
CREATE INDEX idx_agents_last_heartbeat ON agents(last_heartbeat);
CREATE INDEX idx_task_dependencies_task ON task_dependencies(task_id);
```

**MongoDB Indexes**:
```javascript
// Compound indexes for common queries
db.tasks.createIndex({ "projectId": 1, "status": 1, "category": 1 });
db.tasks.createIndex({ "assignedAgent": 1, "status": 1 });
db.tasks.createIndex({ "dependencies.taskId": 1 });
db.agents.createIndex({ "projectId": 1, "lastHeartbeat": 1 });
```

### 2. Data Archival Strategy

**Automatic Cleanup**:
```sql
-- Archive completed tasks older than 30 days
CREATE TABLE archived_tasks (LIKE tasks INCLUDING ALL);

-- Daily cleanup procedure
CREATE OR REPLACE FUNCTION archive_old_tasks()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Move old completed tasks to archive
    INSERT INTO archived_tasks 
    SELECT * FROM tasks 
    WHERE status = 'completed' 
    AND completed_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    -- Remove from main table
    DELETE FROM tasks 
    WHERE status = 'completed' 
    AND completed_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;
```

### 3. Real-time Updates

**PostgreSQL Change Notifications**:
```sql
-- Trigger for real-time updates
CREATE OR REPLACE FUNCTION notify_task_changes()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('task_changes', 
        json_build_object(
            'task_id', NEW.id,
            'action', TG_OP,
            'status', NEW.status,
            'assigned_agent', NEW.assigned_agent
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_change_notification
    AFTER INSERT OR UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION notify_task_changes();
```

**MongoDB Change Streams**:
```javascript
// Watch for task status changes
const taskChangeStream = db.tasks.watch([
  {
    $match: {
      "operationType": "update",
      "updateDescription.updatedFields.status": { $exists: true }
    }
  }
]);

taskChangeStream.on('change', (change) => {
  console.log('Task status changed:', change);
  // Emit real-time updates to connected clients
});
```

## Security Considerations

### 1. Data Protection
- **Encryption at Rest**: Database-level encryption for sensitive data
- **Connection Security**: TLS/SSL for all database connections
- **Access Control**: Role-based permissions and connection limiting
- **Audit Logging**: Complete audit trails for all data modifications

### 2. Input Validation
```sql
-- SQL constraints and validation
ALTER TABLE tasks ADD CONSTRAINT check_completion_percentage 
    CHECK (completion_percentage >= 0 AND completion_percentage <= 100);

ALTER TABLE tasks ADD CONSTRAINT check_complexity_score 
    CHECK (complexity_score >= 1 AND complexity_score <= 10);
```

```javascript
// MongoDB validation schema
db.createCollection("tasks", {
  validator: {
    $jsonSchema: {
      required: ["_id", "projectId", "title", "category", "status"],
      properties: {
        category: { 
          enum: ["linter-error", "build-error", "missing-feature", "bug", "enhancement"] 
        },
        status: { 
          enum: ["pending", "in_progress", "completed", "blocked"] 
        },
        completionPercentage: { 
          minimum: 0, 
          maximum: 100 
        }
      }
    }
  }
});
```

## Monitoring and Maintenance

### 1. Health Checks
```sql
-- Database health monitoring
SELECT 
    schemaname,
    tablename,
    n_tup_ins + n_tup_upd + n_tup_del as total_changes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public';
```

### 2. Performance Monitoring
```javascript
// MongoDB performance stats
db.runCommand({ "collStats": "tasks" });
db.tasks.getIndexes();
db.tasks.totalIndexSize();
```

## Deployment Recommendations

### Development Environment
- **Database**: JSON files (current system)
- **Backup**: Git version control
- **Monitoring**: File system monitoring

### Staging Environment  
- **Database**: PostgreSQL or MongoDB
- **Backup**: Daily automated backups
- **Monitoring**: Basic performance metrics

### Production Environment
- **Database**: PostgreSQL (primary) with MongoDB (analytics)
- **High Availability**: Master-slave replication
- **Backup**: Continuous backup with point-in-time recovery
- **Monitoring**: Comprehensive performance and security monitoring
- **Scaling**: Read replicas and connection pooling

## Migration Path

### Phase 1: Schema Design ✅
- Complete SQL and NoSQL schema designs
- Migration tooling and data conversion utilities
- Comprehensive documentation and testing

### Phase 2: Gradual Adoption
- Implement database adapters in TaskManager library
- Add configuration-based database selection
- Maintain backward compatibility with JSON files

### Phase 3: Production Deployment
- Deploy PostgreSQL for production environments
- Implement real-time analytics with MongoDB
- Complete migration from JSON file system

This database schema provides a robust, scalable foundation for the TaskManager system while maintaining flexibility for different deployment scenarios and future enhancements.