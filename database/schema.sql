-- ============================================================================
-- TASKMANAGER DATABASE SCHEMA
-- ============================================================================
-- 
-- This schema supports the complete TaskManager system including:
-- - Task management with dependencies and categorization
-- - Agent registry and session tracking
-- - Multi-agent coordination and heartbeat monitoring
-- - Task history and audit trails
-- - System statistics and performance tracking
--
-- Database: PostgreSQL (recommended) or MySQL 8.0+
-- ============================================================================

-- Drop existing tables (for clean setup)
DROP TABLE IF EXISTS task_dependencies CASCADE;
DROP TABLE IF EXISTS task_files CASCADE;
DROP TABLE IF EXISTS task_history CASCADE;
DROP TABLE IF EXISTS agent_sessions CASCADE;
DROP TABLE IF EXISTS agent_heartbeats CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Projects table (supports multi-project TaskManager)
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

-- Agents table (centralized agent registry)
CREATE TABLE agents (
    id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
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

-- Tasks table (enhanced version of TODO.json structure)
CREATE TABLE tasks (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT DEFAULT '',
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    mode VARCHAR(50) DEFAULT 'DEVELOPMENT',
    status VARCHAR(20) DEFAULT 'pending',
    
    -- Assignment and ownership
    assigned_agent VARCHAR(100) REFERENCES agents(id) ON DELETE SET NULL,
    claimed_by VARCHAR(100) REFERENCES agents(id) ON DELETE SET NULL,
    
    -- Timing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    reverted_at TIMESTAMP NULL,
    
    -- Task metadata
    estimate_minutes INTEGER DEFAULT 0,
    requires_research BOOLEAN DEFAULT false,
    success_criteria JSONB DEFAULT '[]',
    subtasks JSONB DEFAULT '[]',
    
    -- Progress tracking
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    revert_reason TEXT DEFAULT '',
    
    -- Performance tracking
    actual_time_minutes INTEGER DEFAULT 0,
    complexity_score INTEGER DEFAULT 1 CHECK (complexity_score >= 1 AND complexity_score <= 10),
    
    -- Parallel execution support
    can_parallelize BOOLEAN DEFAULT false,
    parallel_group VARCHAR(50) DEFAULT NULL,
    coordinator_task VARCHAR(50) REFERENCES tasks(id) ON DELETE SET NULL,
    
    -- Audit fields
    created_by VARCHAR(100) DEFAULT 'system',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- RELATIONSHIP TABLES
-- ============================================================================

-- Task dependencies (many-to-many)
CREATE TABLE task_dependencies (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_task_id VARCHAR(50) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) DEFAULT 'blocks',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, dependency_task_id)
);

-- Task files (important files associated with tasks)
CREATE TABLE task_files (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    file_path VARCHAR(1000) NOT NULL,
    file_type VARCHAR(50) DEFAULT 'source',
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- AUDIT AND HISTORY TABLES
-- ============================================================================

-- Task history (complete audit trail)
CREATE TABLE task_history (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    agent_id VARCHAR(100) REFERENCES agents(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    previous_assignee VARCHAR(100),
    new_assignee VARCHAR(100),
    notes TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent sessions (track agent activity sessions)
CREATE TABLE agent_sessions (
    id SERIAL PRIMARY KEY,
    agent_id VARCHAR(100) NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP NULL,
    tasks_completed INTEGER DEFAULT 0,
    total_active_time_minutes INTEGER DEFAULT 0,
    session_type VARCHAR(50) DEFAULT 'standard',
    metadata JSONB DEFAULT '{}'
);

-- Agent heartbeats (detailed activity tracking)
CREATE TABLE agent_heartbeats (
    id SERIAL PRIMARY KEY,
    agent_id VARCHAR(100) NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    heartbeat_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_task VARCHAR(50) REFERENCES tasks(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active',
    cpu_usage DECIMAL(5,2) DEFAULT 0.0,
    memory_usage DECIMAL(5,2) DEFAULT 0.0,
    activity_type VARCHAR(50) DEFAULT 'working',
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_assigned_agent ON tasks(assigned_agent);
CREATE INDEX idx_tasks_category_priority ON tasks(category, priority);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_status_started_at ON tasks(status, started_at);

-- Agent indexes
CREATE INDEX idx_agents_project_active ON agents(project_id, is_active);
CREATE INDEX idx_agents_last_heartbeat ON agents(last_heartbeat);
CREATE INDEX idx_agents_role ON agents(role);

-- History and audit indexes
CREATE INDEX idx_task_history_task_created ON task_history(task_id, created_at);
CREATE INDEX idx_task_history_agent ON task_history(agent_id);
CREATE INDEX idx_agent_heartbeats_agent_time ON agent_heartbeats(agent_id, heartbeat_time);

-- Dependency indexes
CREATE INDEX idx_task_dependencies_task ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_dependency ON task_dependencies(dependency_task_id);

-- File indexes
CREATE INDEX idx_task_files_task ON task_files(task_id);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active tasks with agent details
CREATE VIEW active_tasks_view AS
SELECT 
    t.*,
    a.role as agent_role,
    a.specialization as agent_specialization,
    a.last_heartbeat as agent_last_heartbeat,
    p.name as project_name,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.started_at))/60 as minutes_in_progress
FROM tasks t
LEFT JOIN agents a ON t.assigned_agent = a.id
LEFT JOIN projects p ON t.project_id = p.id
WHERE t.status IN ('in_progress', 'blocked');

-- Task statistics by category
CREATE VIEW task_stats_by_category AS
SELECT 
    project_id,
    category,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_tasks,
    AVG(actual_time_minutes) as avg_completion_time_minutes,
    AVG(complexity_score) as avg_complexity
FROM tasks
GROUP BY project_id, category;

-- Agent performance view
CREATE VIEW agent_performance_view AS
SELECT 
    a.*,
    COUNT(t.id) as total_tasks_assigned,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as tasks_completed,
    COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as tasks_in_progress,
    AVG(CASE WHEN t.status = 'completed' THEN t.actual_time_minutes END) as avg_completion_time,
    SUM(CASE WHEN t.status = 'completed' THEN t.actual_time_minutes END) as total_work_time_minutes
FROM agents a
LEFT JOIN tasks t ON a.id = t.assigned_agent
GROUP BY a.id;

-- Project dashboard view
CREATE VIEW project_dashboard_view AS
SELECT 
    p.*,
    ts.total_tasks,
    ts.pending_tasks,
    ts.in_progress_tasks,
    ts.completed_tasks,
    ts.blocked_tasks,
    COUNT(DISTINCT a.id) as total_agents,
    COUNT(DISTINCT CASE WHEN a.last_heartbeat > CURRENT_TIMESTAMP - INTERVAL '15 minutes' THEN a.id END) as active_agents
FROM projects p
LEFT JOIN (
    SELECT 
        project_id,
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_tasks
    FROM tasks
    GROUP BY project_id
) ts ON p.id = ts.project_id
LEFT JOIN agents a ON p.id = a.project_id
WHERE p.is_active = true
GROUP BY p.id, ts.total_tasks, ts.pending_tasks, ts.in_progress_tasks, ts.completed_tasks, ts.blocked_tasks;

-- ============================================================================
-- STORED PROCEDURES AND FUNCTIONS
-- ============================================================================

-- Function to get next pending task with dependency check
CREATE OR REPLACE FUNCTION get_next_pending_task(p_project_id VARCHAR(50), p_agent_id VARCHAR(100))
RETURNS TABLE(task_id VARCHAR(50), title VARCHAR(500), category VARCHAR(50), priority VARCHAR(20)) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.title, t.category, t.priority
    FROM tasks t
    WHERE t.project_id = p_project_id
    AND t.status = 'pending'
    AND NOT EXISTS (
        -- Check for blocking dependencies
        SELECT 1 FROM task_dependencies td
        JOIN tasks dep_task ON td.dependency_task_id = dep_task.id
        WHERE td.task_id = t.id
        AND dep_task.status != 'completed'
    )
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
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to claim a task
CREATE OR REPLACE FUNCTION claim_task(p_task_id VARCHAR(50), p_agent_id VARCHAR(100))
RETURNS BOOLEAN AS $$
DECLARE
    task_exists BOOLEAN;
    task_available BOOLEAN;
BEGIN
    -- Check if task exists and is pending
    SELECT 
        EXISTS(SELECT 1 FROM tasks WHERE id = p_task_id),
        EXISTS(SELECT 1 FROM tasks WHERE id = p_task_id AND status = 'pending' AND assigned_agent IS NULL)
    INTO task_exists, task_available;
    
    IF NOT task_exists THEN
        RAISE EXCEPTION 'Task not found: %', p_task_id;
    END IF;
    
    IF NOT task_available THEN
        RAISE EXCEPTION 'Task not available for claiming: %', p_task_id;
    END IF;
    
    -- Claim the task
    UPDATE tasks SET 
        assigned_agent = p_agent_id,
        claimed_by = p_agent_id,
        status = 'in_progress',
        started_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_task_id;
    
    -- Log the action
    INSERT INTO task_history (task_id, agent_id, action, new_status, new_assignee, notes)
    VALUES (p_task_id, p_agent_id, 'claimed', 'in_progress', p_agent_id, 'Task claimed by agent');
    
    -- Update agent heartbeat
    UPDATE agents SET last_heartbeat = CURRENT_TIMESTAMP WHERE id = p_agent_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to update task status
CREATE OR REPLACE FUNCTION update_task_status(
    p_task_id VARCHAR(50), 
    p_new_status VARCHAR(20), 
    p_agent_id VARCHAR(100), 
    p_notes TEXT DEFAULT ''
)
RETURNS BOOLEAN AS $$
DECLARE
    old_status VARCHAR(20);
    completion_time INTEGER;
BEGIN
    -- Get current status
    SELECT status INTO old_status FROM tasks WHERE id = p_task_id;
    
    IF old_status IS NULL THEN
        RAISE EXCEPTION 'Task not found: %', p_task_id;
    END IF;
    
    -- Calculate completion time if task is being completed
    IF p_new_status = 'completed' AND old_status = 'in_progress' THEN
        SELECT EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))/60 
        INTO completion_time 
        FROM tasks WHERE id = p_task_id;
    END IF;
    
    -- Update task
    UPDATE tasks SET 
        status = p_new_status,
        completed_at = CASE WHEN p_new_status = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END,
        actual_time_minutes = COALESCE(completion_time, actual_time_minutes),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_task_id;
    
    -- Log the action
    INSERT INTO task_history (task_id, agent_id, action, previous_status, new_status, notes)
    VALUES (p_task_id, p_agent_id, 'status_update', old_status, p_new_status, p_notes);
    
    -- Update agent statistics if task completed
    IF p_new_status = 'completed' THEN
        UPDATE agents SET 
            total_tasks_completed = total_tasks_completed + 1,
            avg_completion_time_minutes = (
                SELECT AVG(actual_time_minutes) 
                FROM tasks 
                WHERE assigned_agent = p_agent_id AND status = 'completed'
            ),
            last_heartbeat = CURRENT_TIMESTAMP
        WHERE id = p_agent_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Trigger to update task updated_at timestamp
CREATE OR REPLACE FUNCTION update_task_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_timestamp
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_task_timestamp();

-- Trigger to automatically log task changes
CREATE OR REPLACE FUNCTION log_task_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log significant changes
    IF OLD.status != NEW.status OR OLD.assigned_agent != NEW.assigned_agent THEN
        INSERT INTO task_history (
            task_id, agent_id, action, previous_status, new_status, 
            previous_assignee, new_assignee, notes
        ) VALUES (
            NEW.id, NEW.assigned_agent, 'automatic_log', OLD.status, NEW.status,
            OLD.assigned_agent, NEW.assigned_agent, 'Automatic change log'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_task_changes
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION log_task_changes();

-- ============================================================================
-- SAMPLE DATA INSERTION
-- ============================================================================

-- Insert sample project
INSERT INTO projects (id, name, description, root_path) VALUES 
('infinite-continue-stop-hook', 'Infinite Continue Stop Hook', 'TaskManager automation system for Claude Code', '/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook');

-- Insert sample categories with proper priority ordering
-- This ensures the category-based priority system works correctly

-- Sample task categories (following the priority system):
-- 1. linter-error (highest priority)
-- 2. build-error
-- 3. start-error  
-- 4. error
-- 5. missing-feature
-- 6. bug
-- 7. enhancement
-- 8. refactor
-- 9. documentation
-- 10. chore
-- 11. research
-- 12. missing-test (lowest priority)

-- ============================================================================
-- PERFORMANCE OPTIMIZATIONS
-- ============================================================================

-- Partitioning for large task history tables (PostgreSQL 10+)
-- CREATE TABLE task_history_y2025 PARTITION OF task_history
-- FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Archival strategy for old completed tasks
-- CREATE TABLE archived_tasks (LIKE tasks INCLUDING ALL);
-- CREATE TABLE archived_task_history (LIKE task_history INCLUDING ALL);

-- ============================================================================
-- BACKUP AND MAINTENANCE
-- ============================================================================

-- Regular cleanup of old heartbeats (keep last 7 days)
-- DELETE FROM agent_heartbeats WHERE heartbeat_time < CURRENT_TIMESTAMP - INTERVAL '7 days';

-- Vacuum and analyze for performance
-- VACUUM ANALYZE tasks;
-- VACUUM ANALYZE agents;
-- VACUUM ANALYZE task_history;

-- ============================================================================
-- SCHEMA VERSIONING
-- ============================================================================

CREATE TABLE schema_version (
    version VARCHAR(20) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

INSERT INTO schema_version (version, description) VALUES 
('1.0.0', 'Initial TaskManager database schema with full feature support');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================