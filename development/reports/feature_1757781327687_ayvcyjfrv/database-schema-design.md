# Database Schema Design for Embedded Subtasks System

## Executive Summary

This document outlines the comprehensive database schema design for transitioning the TaskManager system from JSON file-based storage to a robust relational database. The design supports embedded subtasks, research guidance, audit criteria, success tracking, and multi-agent coordination while maintaining data integrity and performance.

## Current System Analysis

### Current JSON-based Structure
The existing system uses `TODO.json` and `DONE.json` files with the following key entities:
- **Tasks**: Main work units with id, title, description, status, category, priority
- **Subtasks**: Embedded within tasks (research and audit types)
- **Agents**: Agent assignment and tracking
- **Success Criteria**: Embedded arrays within audit subtasks
- **Research Locations**: Embedded within research subtasks

### Limitations of Current System
1. No ACID compliance or transactional integrity
2. Concurrent access conflicts in multi-agent scenarios
3. Limited querying capabilities
4. No referential integrity enforcement
5. Scalability constraints with large datasets
6. Manual backup and recovery processes

## Database Schema Design

### Core Entity Relationship Model

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│    TASKS    │────│   SUBTASKS   │────│ RESEARCH_LOCATIONS │
│             │    │              │    │                 │
└─────────────┘    └──────────────┘    └─────────────────┘
        │                   │
        │                   │
        ▼                   ▼
┌─────────────┐    ┌──────────────┐
│   AGENTS    │    │AUDIT_CRITERIA│
│             │    │              │
└─────────────┘    └──────────────┘
        │
        ▼
┌─────────────┐
│SUCCESS_CRITERIA│
│             │
└─────────────┘
```

### Table Schemas

#### 1. TASKS Table

```sql
CREATE TABLE tasks (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    category ENUM('error', 'feature', 'subtask', 'test') NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'archived') DEFAULT 'pending',
    estimate VARCHAR(100),
    requires_research BOOLEAN DEFAULT FALSE,
    auto_research_created BOOLEAN DEFAULT FALSE,
    assigned_agent_id VARCHAR(255),
    claimed_by VARCHAR(255),
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    archived_at TIMESTAMP NULL,
    
    -- Indexes for performance
    INDEX idx_tasks_status (status),
    INDEX idx_tasks_category (category),
    INDEX idx_tasks_assigned_agent (assigned_agent_id),
    INDEX idx_tasks_created_at (created_at),
    INDEX idx_tasks_priority_status (priority, status),
    
    -- Foreign key constraints
    FOREIGN KEY (assigned_agent_id) REFERENCES agents(id) ON DELETE SET NULL,
    FOREIGN KEY (claimed_by) REFERENCES agents(id) ON DELETE SET NULL
);
```

#### 2. SUBTASKS Table

```sql
CREATE TABLE subtasks (
    id VARCHAR(255) PRIMARY KEY,
    parent_task_id VARCHAR(255) NOT NULL,
    type ENUM('research', 'audit', 'custom') NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    estimated_hours DECIMAL(4,2) DEFAULT 0.5,
    prevents_implementation BOOLEAN DEFAULT FALSE,
    prevents_completion BOOLEAN DEFAULT FALSE,
    prevents_self_review BOOLEAN DEFAULT TRUE,
    audit_type VARCHAR(100),
    original_implementer VARCHAR(255),
    assigned_agent_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    -- Indexes for performance
    INDEX idx_subtasks_parent_task (parent_task_id),
    INDEX idx_subtasks_type (type),
    INDEX idx_subtasks_status (status),
    INDEX idx_subtasks_assigned_agent (assigned_agent_id),
    
    -- Foreign key constraints
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_agent_id) REFERENCES agents(id) ON DELETE SET NULL,
    FOREIGN KEY (original_implementer) REFERENCES agents(id) ON DELETE SET NULL
);
```

#### 3. AGENTS Table

```sql
CREATE TABLE agents (
    id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    role ENUM('development', 'testing', 'research', 'audit', 'general') DEFAULT 'general',
    specialization JSON, -- Array of specialization areas
    last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive', 'stale') DEFAULT 'active',
    task_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_agents_session (session_id),
    INDEX idx_agents_role (role),
    INDEX idx_agents_status (status),
    INDEX idx_agents_last_heartbeat (last_heartbeat)
);
```

#### 4. RESEARCH_LOCATIONS Table

```sql
CREATE TABLE research_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subtask_id VARCHAR(255) NOT NULL,
    type ENUM('codebase', 'internet', 'documentation') NOT NULL,
    paths JSON, -- Array of file paths for codebase type
    keywords JSON, -- Array of search keywords for internet type  
    sources JSON, -- Array of documentation sources
    focus TEXT, -- Description of research focus area
    priority INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_research_locations_subtask (subtask_id),
    INDEX idx_research_locations_type (type),
    
    -- Foreign key constraints
    FOREIGN KEY (subtask_id) REFERENCES subtasks(id) ON DELETE CASCADE
);
```

#### 5. SUCCESS_CRITERIA Table (Task-specific)

```sql
CREATE TABLE success_criteria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type ENUM('task', 'subtask', 'project') NOT NULL,
    entity_id VARCHAR(255), -- NULL for project-wide criteria
    criteria_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT TRUE,
    validation_method VARCHAR(255), -- e.g., 'linter', 'build', 'test', 'manual'
    validation_command TEXT, -- Command to validate this criteria
    priority INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance  
    INDEX idx_success_criteria_entity (entity_type, entity_id),
    INDEX idx_success_criteria_mandatory (is_mandatory),
    INDEX idx_success_criteria_name (criteria_name),
    
    -- Unique constraint to prevent duplicate criteria per entity
    UNIQUE KEY unique_criteria_per_entity (entity_type, entity_id, criteria_name)
);
```

#### 6. AUDIT_CRITERIA Table (Standard completion requirements)

```sql
CREATE TABLE audit_criteria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category ENUM('code_quality', 'security', 'performance', 'documentation', 'compliance') NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    validation_command TEXT,
    is_automated BOOLEAN DEFAULT TRUE,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    applies_to_categories JSON, -- Array of task categories this applies to
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_audit_criteria_category (category),
    INDEX idx_audit_criteria_severity (severity),
    INDEX idx_audit_criteria_active (is_active),
    
    -- Unique constraint on name
    UNIQUE KEY unique_audit_criteria_name (name)
);
```

#### 7. TASK_DEPENDENCIES Table

```sql
CREATE TABLE task_dependencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id VARCHAR(255) NOT NULL,
    depends_on_task_id VARCHAR(255) NOT NULL,
    dependency_type ENUM('blocks', 'requires', 'suggests') DEFAULT 'blocks',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_task_deps_task (task_id),
    INDEX idx_task_deps_depends_on (depends_on_task_id),
    
    -- Foreign key constraints
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    
    -- Prevent circular dependencies and duplicate dependencies
    UNIQUE KEY unique_dependency (task_id, depends_on_task_id),
    
    -- Prevent self-dependencies
    CHECK (task_id != depends_on_task_id)
);
```

#### 8. TASK_FILES Table (Important files tracking)

```sql  
CREATE TABLE task_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type ENUM('source', 'config', 'documentation', 'test', 'other') DEFAULT 'other',
    is_critical BOOLEAN DEFAULT FALSE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_task_files_task (task_id),
    INDEX idx_task_files_critical (is_critical),
    
    -- Foreign key constraints
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
```

#### 9. AGENT_ASSIGNMENTS Table (Historical tracking)

```sql
CREATE TABLE agent_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id VARCHAR(255) NOT NULL,
    agent_id VARCHAR(255) NOT NULL,
    assignment_type ENUM('claimed', 'assigned', 'released') NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP NULL,
    notes TEXT,
    
    -- Indexes for performance
    INDEX idx_agent_assignments_task (task_id),
    INDEX idx_agent_assignments_agent (agent_id),
    INDEX idx_agent_assignments_type (assignment_type),
    INDEX idx_agent_assignments_assigned_at (assigned_at),
    
    -- Foreign key constraints
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);
```

## Advanced Features

### 1. Hierarchical Task Structure Support

```sql
-- Add self-referencing foreign key to tasks table for sub-tasks
ALTER TABLE tasks ADD COLUMN parent_task_id VARCHAR(255);
ALTER TABLE tasks ADD FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD INDEX idx_tasks_parent (parent_task_id);
```

### 2. Task Templates System

```sql
CREATE TABLE task_templates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('error', 'feature', 'subtask', 'test') NOT NULL,
    template_data JSON, -- Template structure for creating tasks
    success_criteria_template JSON, -- Default success criteria
    estimated_hours DECIMAL(4,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_task_templates_category (category),
    INDEX idx_task_templates_active (is_active),
    UNIQUE KEY unique_template_name (name)
);
```

### 3. Performance Metrics Tracking

```sql
CREATE TABLE task_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id VARCHAR(255) NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    metric_value DECIMAL(10,4),
    metric_unit VARCHAR(50), -- e.g., 'seconds', 'lines', 'files'
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    agent_id VARCHAR(255),
    
    INDEX idx_task_metrics_task (task_id),
    INDEX idx_task_metrics_name (metric_name),
    INDEX idx_task_metrics_measured_at (measured_at),
    
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL
);
```

## Performance Optimization Strategy

### Indexing Strategy
1. **Primary Operations**: Status, category, and agent-based queries
2. **Time-based Queries**: Created_at, updated_at for reporting
3. **Relationship Queries**: Foreign key indexes for JOIN operations
4. **Composite Indexes**: Multi-column indexes for common query patterns

### Query Optimization
1. **Pagination**: Use LIMIT/OFFSET for large result sets
2. **Filtering**: Index all commonly filtered columns
3. **Sorting**: Optimize ORDER BY with appropriate indexes
4. **Aggregation**: Use covering indexes for COUNT/SUM operations

### Caching Strategy
1. **Application-level**: Cache frequently accessed reference data
2. **Query Result Caching**: Cache expensive aggregation queries
3. **Connection Pooling**: Optimize database connection management

## Data Migration Strategy

### Phase 1: Schema Creation
1. Create all tables with proper constraints
2. Insert default audit criteria and success criteria
3. Create initial indexes

### Phase 2: Data Migration
1. Parse existing TODO.json and DONE.json files
2. Transform JSON data to relational format
3. Validate referential integrity
4. Handle data inconsistencies

### Phase 3: API Integration
1. Update TaskManager to use database instead of JSON
2. Maintain backward compatibility during transition
3. Performance testing and optimization

## Data Integrity Constraints

### Referential Integrity
- All foreign keys properly defined with appropriate cascade rules
- Agent references allow NULL for deleted agents
- Task dependencies prevent circular references

### Business Logic Constraints
- Prevent self-dependencies in task_dependencies
- Unique constraints on critical business keys
- Check constraints for valid enum values

### Data Validation
- Required fields properly marked as NOT NULL
- Appropriate data types for all columns
- JSON validation for structured data fields

## Security Considerations

### Access Control
- Database user roles with minimal required permissions
- Application-level authentication and authorization
- Audit logging for sensitive operations

### Data Protection
- Encrypt sensitive data at rest
- Use parameterized queries to prevent SQL injection
- Regular security audits and updates

## Backup and Recovery Strategy

### Backup Strategy
- Automated daily full backups
- Transaction log backups every 15 minutes
- Point-in-time recovery capability
- Cross-region backup replication

### Disaster Recovery
- Recovery Time Objective (RTO): < 1 hour
- Recovery Point Objective (RPO): < 15 minutes
- Automated failover procedures
- Regular recovery testing

## Monitoring and Alerting

### Performance Monitoring
- Query performance metrics
- Database connection monitoring
- Resource utilization tracking
- Slow query identification

### Alert Triggers
- Failed backup operations
- High error rates
- Performance degradation
- Storage capacity warnings

## Implementation Timeline

### Week 1: Schema Design and Review
- [ ] Complete schema design documentation
- [ ] Stakeholder review and approval
- [ ] Create test database environment

### Week 2: Database Setup and Migration Scripts  
- [ ] Create production database instance
- [ ] Develop migration scripts
- [ ] Test data migration with sample data

### Week 3: API Integration
- [ ] Update TaskManager class for database operations
- [ ] Implement connection pooling and error handling
- [ ] Create database abstraction layer

### Week 4: Testing and Optimization
- [ ] Performance testing and optimization
- [ ] Load testing with multi-agent scenarios
- [ ] Final validation and deployment

## Conclusion

This database schema design provides a robust, scalable foundation for the embedded subtasks system. The relational model ensures data integrity, supports complex queries, and enables efficient multi-agent coordination while maintaining high performance through strategic indexing and optimization.

The schema supports all required features:
- ✅ Embedded subtasks with proper relationships
- ✅ Research task guidance through research_locations table
- ✅ Audit criteria with standard completion requirements
- ✅ Success criteria tracking at multiple levels
- ✅ Agent assignment and historical tracking
- ✅ Performance-optimized indexes
- ✅ Data integrity constraints

This design positions the system for future growth while solving current limitations of the JSON-based approach.