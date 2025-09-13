-- ============================================================================
-- Database Schema Migration Script: Initial Schema Creation
-- Version: 001
-- Purpose: Create initial database schema for embedded subtasks system
-- ============================================================================

-- Create database if it doesn't exist
-- CREATE DATABASE IF NOT EXISTS taskmanager_db 
--   CHARACTER SET utf8mb4 
--   COLLATE utf8mb4_unicode_ci;

-- USE taskmanager_db;

-- ============================================================================
-- 1. AGENTS Table - Central agent registry
-- ============================================================================

CREATE TABLE agents (
    id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    role ENUM('development', 'testing', 'research', 'audit', 'general') DEFAULT 'general',
    specialization JSON COMMENT 'Array of specialization areas',
    last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive', 'stale') DEFAULT 'active',
    task_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Performance indexes
    INDEX idx_agents_session (session_id),
    INDEX idx_agents_role (role),
    INDEX idx_agents_status (status),
    INDEX idx_agents_last_heartbeat (last_heartbeat),
    INDEX idx_agents_status_heartbeat (status, last_heartbeat)
) ENGINE=InnoDB 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci 
  COMMENT='Agent registry for task management system';

-- ============================================================================
-- 2. TASKS Table - Main task entities
-- ============================================================================

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
    parent_task_id VARCHAR(255) COMMENT 'For hierarchical task structure',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    archived_at TIMESTAMP NULL,
    
    -- Performance indexes
    INDEX idx_tasks_status (status),
    INDEX idx_tasks_category (category),
    INDEX idx_tasks_assigned_agent (assigned_agent_id),
    INDEX idx_tasks_claimed_by (claimed_by),
    INDEX idx_tasks_parent_task (parent_task_id),
    INDEX idx_tasks_created_at (created_at),
    INDEX idx_tasks_priority_status (priority, status),
    INDEX idx_tasks_category_status (category, status),
    INDEX idx_tasks_status_created (status, created_at),
    
    -- Foreign key constraints
    FOREIGN KEY fk_tasks_assigned_agent (assigned_agent_id) 
        REFERENCES agents(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY fk_tasks_claimed_by (claimed_by) 
        REFERENCES agents(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY fk_tasks_parent_task (parent_task_id) 
        REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci 
  COMMENT='Main tasks table with hierarchical support';

-- ============================================================================
-- 3. SUBTASKS Table - Embedded subtasks (research/audit)
-- ============================================================================

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
    
    -- Performance indexes
    INDEX idx_subtasks_parent_task (parent_task_id),
    INDEX idx_subtasks_type (type),
    INDEX idx_subtasks_status (status),
    INDEX idx_subtasks_assigned_agent (assigned_agent_id),
    INDEX idx_subtasks_type_status (type, status),
    INDEX idx_subtasks_parent_status (parent_task_id, status),
    
    -- Foreign key constraints
    FOREIGN KEY fk_subtasks_parent_task (parent_task_id) 
        REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY fk_subtasks_assigned_agent (assigned_agent_id) 
        REFERENCES agents(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY fk_subtasks_original_implementer (original_implementer) 
        REFERENCES agents(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci 
  COMMENT='Subtasks table for research and audit tasks';

-- ============================================================================
-- 4. RESEARCH_LOCATIONS Table - Research task guidance
-- ============================================================================

CREATE TABLE research_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subtask_id VARCHAR(255) NOT NULL,
    type ENUM('codebase', 'internet', 'documentation') NOT NULL,
    paths JSON COMMENT 'Array of file paths for codebase type',
    keywords JSON COMMENT 'Array of search keywords for internet type',
    sources JSON COMMENT 'Array of documentation sources',
    focus TEXT COMMENT 'Description of research focus area',
    priority INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Performance indexes
    INDEX idx_research_locations_subtask (subtask_id),
    INDEX idx_research_locations_type (type),
    INDEX idx_research_locations_priority (priority),
    INDEX idx_research_locations_subtask_type (subtask_id, type),
    
    -- Foreign key constraints
    FOREIGN KEY fk_research_locations_subtask (subtask_id) 
        REFERENCES subtasks(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci 
  COMMENT='Research locations and guidance for research subtasks';

-- ============================================================================
-- 5. SUCCESS_CRITERIA Table - Task-specific and project-wide success criteria
-- ============================================================================

CREATE TABLE success_criteria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type ENUM('task', 'subtask', 'project') NOT NULL,
    entity_id VARCHAR(255) COMMENT 'NULL for project-wide criteria',
    criteria_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT TRUE,
    validation_method VARCHAR(255) COMMENT 'e.g., linter, build, test, manual',
    validation_command TEXT COMMENT 'Command to validate this criteria',
    priority INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Performance indexes
    INDEX idx_success_criteria_entity (entity_type, entity_id),
    INDEX idx_success_criteria_mandatory (is_mandatory),
    INDEX idx_success_criteria_name (criteria_name),
    INDEX idx_success_criteria_validation (validation_method),
    INDEX idx_success_criteria_entity_priority (entity_type, entity_id, priority),
    
    -- Unique constraint to prevent duplicate criteria per entity
    UNIQUE KEY uk_criteria_per_entity (entity_type, entity_id, criteria_name)
) ENGINE=InnoDB 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci 
  COMMENT='Success criteria for tasks, subtasks, and project-wide standards';

-- ============================================================================
-- 6. AUDIT_CRITERIA Table - Standard completion requirements
-- ============================================================================

CREATE TABLE audit_criteria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category ENUM('code_quality', 'security', 'performance', 'documentation', 'compliance') NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    validation_command TEXT,
    is_automated BOOLEAN DEFAULT TRUE,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    applies_to_categories JSON COMMENT 'Array of task categories this applies to',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Performance indexes
    INDEX idx_audit_criteria_category (category),
    INDEX idx_audit_criteria_severity (severity),
    INDEX idx_audit_criteria_active (is_active),
    INDEX idx_audit_criteria_automated (is_automated),
    INDEX idx_audit_criteria_category_active (category, is_active),
    
    -- Unique constraint on name
    UNIQUE KEY uk_audit_criteria_name (name)
) ENGINE=InnoDB 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci 
  COMMENT='Standard audit criteria and completion requirements';

-- ============================================================================
-- 7. TASK_DEPENDENCIES Table - Task dependency relationships
-- ============================================================================

CREATE TABLE task_dependencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id VARCHAR(255) NOT NULL,
    depends_on_task_id VARCHAR(255) NOT NULL,
    dependency_type ENUM('blocks', 'requires', 'suggests') DEFAULT 'blocks',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Performance indexes
    INDEX idx_task_deps_task (task_id),
    INDEX idx_task_deps_depends_on (depends_on_task_id),
    INDEX idx_task_deps_type (dependency_type),
    INDEX idx_task_deps_task_type (task_id, dependency_type),
    
    -- Foreign key constraints
    FOREIGN KEY fk_task_deps_task (task_id) 
        REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY fk_task_deps_depends_on (depends_on_task_id) 
        REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Business logic constraints
    UNIQUE KEY uk_task_dependency (task_id, depends_on_task_id),
    CHECK (task_id != depends_on_task_id)
) ENGINE=InnoDB 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci 
  COMMENT='Task dependency relationships and constraints';

-- ============================================================================
-- 8. TASK_FILES Table - Important files tracking
-- ============================================================================

CREATE TABLE task_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type ENUM('source', 'config', 'documentation', 'test', 'other') DEFAULT 'other',
    is_critical BOOLEAN DEFAULT FALSE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Performance indexes
    INDEX idx_task_files_task (task_id),
    INDEX idx_task_files_critical (is_critical),
    INDEX idx_task_files_type (file_type),
    INDEX idx_task_files_task_type (task_id, file_type),
    
    -- Foreign key constraints
    FOREIGN KEY fk_task_files_task (task_id) 
        REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci 
  COMMENT='Important files associated with tasks';

-- ============================================================================
-- 9. AGENT_ASSIGNMENTS Table - Historical tracking
-- ============================================================================

CREATE TABLE agent_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id VARCHAR(255) NOT NULL,
    agent_id VARCHAR(255) NOT NULL,
    assignment_type ENUM('claimed', 'assigned', 'released') NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP NULL,
    notes TEXT,
    
    -- Performance indexes
    INDEX idx_agent_assignments_task (task_id),
    INDEX idx_agent_assignments_agent (agent_id),
    INDEX idx_agent_assignments_type (assignment_type),
    INDEX idx_agent_assignments_assigned_at (assigned_at),
    INDEX idx_agent_assignments_task_agent (task_id, agent_id),
    
    -- Foreign key constraints
    FOREIGN KEY fk_agent_assignments_task (task_id) 
        REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY fk_agent_assignments_agent (agent_id) 
        REFERENCES agents(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci 
  COMMENT='Historical tracking of agent task assignments';

-- ============================================================================
-- 10. TASK_METRICS Table - Performance metrics tracking
-- ============================================================================

CREATE TABLE task_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id VARCHAR(255) NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    metric_value DECIMAL(10,4),
    metric_unit VARCHAR(50) COMMENT 'e.g., seconds, lines, files',
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    agent_id VARCHAR(255),
    
    -- Performance indexes
    INDEX idx_task_metrics_task (task_id),
    INDEX idx_task_metrics_name (metric_name),
    INDEX idx_task_metrics_measured_at (measured_at),
    INDEX idx_task_metrics_task_name (task_id, metric_name),
    
    -- Foreign key constraints
    FOREIGN KEY fk_task_metrics_task (task_id) 
        REFERENCES tasks(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY fk_task_metrics_agent (agent_id) 
        REFERENCES agents(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci 
  COMMENT='Performance metrics tracking for tasks';

-- ============================================================================
-- 11. TASK_TEMPLATES Table - Task templates system
-- ============================================================================

CREATE TABLE task_templates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('error', 'feature', 'subtask', 'test') NOT NULL,
    template_data JSON COMMENT 'Template structure for creating tasks',
    success_criteria_template JSON COMMENT 'Default success criteria',
    estimated_hours DECIMAL(4,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Performance indexes
    INDEX idx_task_templates_category (category),
    INDEX idx_task_templates_active (is_active),
    INDEX idx_task_templates_category_active (category, is_active),
    
    -- Unique constraint
    UNIQUE KEY uk_task_template_name (name)
) ENGINE=InnoDB 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci 
  COMMENT='Task templates for standardized task creation';

-- ============================================================================
-- MIGRATION VERIFICATION QUERIES
-- ============================================================================

-- Verify all tables were created
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME;

-- Verify all foreign key constraints
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- Verify all indexes
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;