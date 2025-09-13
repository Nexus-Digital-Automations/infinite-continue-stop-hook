-- ============================================================================
-- Data Migration Script: JSON to Database Migration
-- Version: 003
-- Purpose: Migrate existing TODO.json data to relational database schema
-- ============================================================================

-- ============================================================================
-- MIGRATION PROCEDURES AND FUNCTIONS
-- ============================================================================

DELIMITER $$

-- Procedure to migrate agents from JSON structure
CREATE PROCEDURE MigrateAgents(IN json_agents JSON)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE agent_id VARCHAR(255);
    DECLARE agent_data JSON;
    DECLARE agent_keys CURSOR FOR 
        SELECT JSON_UNQUOTE(JSON_EXTRACT(json_agents, CONCAT('$."', jt.agent_key, '"'))) as id
        FROM JSON_TABLE(JSON_KEYS(json_agents), '$[*]' COLUMNS (agent_key VARCHAR(255) PATH '$')) AS jt;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN agent_keys;
    agent_loop: LOOP
        FETCH agent_keys INTO agent_id;
        IF done THEN
            LEAVE agent_loop;
        END IF;

        SET agent_data = JSON_EXTRACT(json_agents, CONCAT('$."', agent_id, '"'));

        -- Insert agent record
        INSERT INTO agents (
            id,
            session_id,
            role,
            specialization,
            last_heartbeat,
            status,
            task_count,
            created_at
        ) VALUES (
            agent_id,
            COALESCE(JSON_UNQUOTE(JSON_EXTRACT(agent_data, '$.sessionId')), SUBSTRING(agent_id, 1, 50)),
            COALESCE(JSON_UNQUOTE(JSON_EXTRACT(agent_data, '$.role')), 'general'),
            JSON_EXTRACT(agent_data, '$.specialization'),
            COALESCE(
                STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(agent_data, '$.lastHeartbeat')), '%Y-%m-%dT%H:%i:%s.%fZ'),
                NOW()
            ),
            CASE 
                WHEN JSON_UNQUOTE(JSON_EXTRACT(agent_data, '$.status')) = 'active' THEN 'active'
                WHEN JSON_UNQUOTE(JSON_EXTRACT(agent_data, '$.status')) = 'stale' THEN 'stale'
                ELSE 'inactive'
            END,
            COALESCE(JSON_EXTRACT(agent_data, '$.taskCount'), 0),
            COALESCE(
                STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(agent_data, '$.registeredAt')), '%Y-%m-%dT%H:%i:%s.%fZ'),
                NOW()
            )
        ) ON DUPLICATE KEY UPDATE
            last_heartbeat = VALUES(last_heartbeat),
            status = VALUES(status),
            task_count = VALUES(task_count);

    END LOOP;
    CLOSE agent_keys;
END$$

-- Procedure to migrate tasks from JSON structure
CREATE PROCEDURE MigrateTasks(IN json_tasks JSON)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE task_index INT DEFAULT 0;
    DECLARE max_index INT;
    DECLARE task_data JSON;

    SET max_index = JSON_LENGTH(json_tasks) - 1;

    task_loop: WHILE task_index <= max_index DO
        SET task_data = JSON_EXTRACT(json_tasks, CONCAT('$[', task_index, ']'));
        
        -- Insert main task
        INSERT INTO tasks (
            id,
            title,
            description,
            priority,
            category,
            status,
            estimate,
            requires_research,
            auto_research_created,
            assigned_agent_id,
            claimed_by,
            parent_task_id,
            started_at,
            completed_at,
            created_at
        ) VALUES (
            JSON_UNQUOTE(JSON_EXTRACT(task_data, '$.id')),
            JSON_UNQUOTE(JSON_EXTRACT(task_data, '$.title')),
            JSON_UNQUOTE(JSON_EXTRACT(task_data, '$.description')),
            COALESCE(JSON_UNQUOTE(JSON_EXTRACT(task_data, '$.priority')), 'medium'),
            JSON_UNQUOTE(JSON_EXTRACT(task_data, '$.category')),
            COALESCE(JSON_UNQUOTE(JSON_EXTRACT(task_data, '$.status')), 'pending'),
            JSON_UNQUOTE(JSON_EXTRACT(task_data, '$.estimate')),
            COALESCE(JSON_EXTRACT(task_data, '$.requires_research'), false),
            COALESCE(JSON_EXTRACT(task_data, '$.auto_research_created'), false),
            JSON_UNQUOTE(JSON_EXTRACT(task_data, '$.assigned_agent')),
            JSON_UNQUOTE(JSON_EXTRACT(task_data, '$.claimed_by')),
            JSON_UNQUOTE(JSON_EXTRACT(task_data, '$.parent_task_id')),
            CASE 
                WHEN JSON_UNQUOTE(JSON_EXTRACT(task_data, '$.started_at')) IS NOT NULL 
                THEN STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(task_data, '$.started_at')), '%Y-%m-%dT%H:%i:%s.%fZ')
                ELSE NULL 
            END,
            CASE 
                WHEN JSON_UNQUOTE(JSON_EXTRACT(task_data, '$.completed_at')) IS NOT NULL 
                THEN STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(task_data, '$.completed_at')), '%Y-%m-%dT%H:%i:%s.%fZ')
                ELSE NULL 
            END,
            COALESCE(
                STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(task_data, '$.created_at')), '%Y-%m-%dT%H:%i:%s.%fZ'),
                NOW()
            )
        ) ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            assigned_agent_id = VALUES(assigned_agent_id),
            claimed_by = VALUES(claimed_by),
            started_at = VALUES(started_at),
            completed_at = VALUES(completed_at);

        -- Migrate task files (important_files array)
        CALL MigrateTaskFiles(JSON_UNQUOTE(JSON_EXTRACT(task_data, '$.id')), JSON_EXTRACT(task_data, '$.important_files'));

        -- Migrate task dependencies
        CALL MigrateTaskDependencies(JSON_UNQUOTE(JSON_EXTRACT(task_data, '$.id')), JSON_EXTRACT(task_data, '$.dependencies'));

        -- Migrate subtasks
        CALL MigrateSubtasks(JSON_UNQUOTE(JSON_EXTRACT(task_data, '$.id')), JSON_EXTRACT(task_data, '$.subtasks'));

        -- Migrate task-specific success criteria
        CALL MigrateTaskSuccessCriteria(JSON_UNQUOTE(JSON_EXTRACT(task_data, '$.id')), JSON_EXTRACT(task_data, '$.success_criteria'));

        SET task_index = task_index + 1;
    END WHILE;
END$$

-- Procedure to migrate subtasks
CREATE PROCEDURE MigrateSubtasks(IN parent_task_id VARCHAR(255), IN subtasks_json JSON)
BEGIN
    DECLARE subtask_index INT DEFAULT 0;
    DECLARE max_index INT;
    DECLARE subtask_data JSON;

    IF subtasks_json IS NULL OR JSON_LENGTH(subtasks_json) = 0 THEN
        RETURN;
    END IF;

    SET max_index = JSON_LENGTH(subtasks_json) - 1;

    subtask_loop: WHILE subtask_index <= max_index DO
        SET subtask_data = JSON_EXTRACT(subtasks_json, CONCAT('$[', subtask_index, ']'));

        -- Insert subtask
        INSERT INTO subtasks (
            id,
            parent_task_id,
            type,
            title,
            description,
            status,
            estimated_hours,
            prevents_implementation,
            prevents_completion,
            prevents_self_review,
            audit_type,
            original_implementer,
            assigned_agent_id,
            created_at,
            completed_at
        ) VALUES (
            JSON_UNQUOTE(JSON_EXTRACT(subtask_data, '$.id')),
            parent_task_id,
            JSON_UNQUOTE(JSON_EXTRACT(subtask_data, '$.type')),
            JSON_UNQUOTE(JSON_EXTRACT(subtask_data, '$.title')),
            JSON_UNQUOTE(JSON_EXTRACT(subtask_data, '$.description')),
            COALESCE(JSON_UNQUOTE(JSON_EXTRACT(subtask_data, '$.status')), 'pending'),
            COALESCE(JSON_EXTRACT(subtask_data, '$.estimated_hours'), 0.5),
            COALESCE(JSON_EXTRACT(subtask_data, '$.prevents_implementation'), false),
            COALESCE(JSON_EXTRACT(subtask_data, '$.prevents_completion'), false),
            COALESCE(JSON_EXTRACT(subtask_data, '$.prevents_self_review'), true),
            JSON_UNQUOTE(JSON_EXTRACT(subtask_data, '$.audit_type')),
            JSON_UNQUOTE(JSON_EXTRACT(subtask_data, '$.original_implementer')),
            JSON_UNQUOTE(JSON_EXTRACT(subtask_data, '$.assigned_agent_id')),
            COALESCE(
                STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(subtask_data, '$.created_at')), '%Y-%m-%dT%H:%i:%s.%fZ'),
                NOW()
            ),
            CASE 
                WHEN JSON_UNQUOTE(JSON_EXTRACT(subtask_data, '$.completed_at')) IS NOT NULL 
                THEN STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(subtask_data, '$.completed_at')), '%Y-%m-%dT%H:%i:%s.%fZ')
                ELSE NULL 
            END
        ) ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            assigned_agent_id = VALUES(assigned_agent_id),
            completed_at = VALUES(completed_at);

        -- Migrate research locations if this is a research subtask
        IF JSON_UNQUOTE(JSON_EXTRACT(subtask_data, '$.type')) = 'research' THEN
            CALL MigrateResearchLocations(
                JSON_UNQUOTE(JSON_EXTRACT(subtask_data, '$.id')), 
                JSON_EXTRACT(subtask_data, '$.research_locations')
            );
        END IF;

        -- Migrate subtask success criteria if this is an audit subtask
        IF JSON_UNQUOTE(JSON_EXTRACT(subtask_data, '$.type')) = 'audit' THEN
            CALL MigrateSubtaskSuccessCriteria(
                JSON_UNQUOTE(JSON_EXTRACT(subtask_data, '$.id')), 
                JSON_EXTRACT(subtask_data, '$.success_criteria')
            );
        END IF;

        SET subtask_index = subtask_index + 1;
    END WHILE;
END$$

-- Procedure to migrate research locations
CREATE PROCEDURE MigrateResearchLocations(IN subtask_id VARCHAR(255), IN locations_json JSON)
BEGIN
    DECLARE location_index INT DEFAULT 0;
    DECLARE max_index INT;
    DECLARE location_data JSON;

    IF locations_json IS NULL OR JSON_LENGTH(locations_json) = 0 THEN
        RETURN;
    END IF;

    SET max_index = JSON_LENGTH(locations_json) - 1;

    location_loop: WHILE location_index <= max_index DO
        SET location_data = JSON_EXTRACT(locations_json, CONCAT('$[', location_index, ']'));

        INSERT INTO research_locations (
            subtask_id,
            type,
            paths,
            keywords,
            sources,
            focus,
            priority
        ) VALUES (
            subtask_id,
            JSON_UNQUOTE(JSON_EXTRACT(location_data, '$.type')),
            JSON_EXTRACT(location_data, '$.paths'),
            JSON_EXTRACT(location_data, '$.keywords'),
            JSON_EXTRACT(location_data, '$.sources'),
            JSON_UNQUOTE(JSON_EXTRACT(location_data, '$.focus')),
            COALESCE(JSON_EXTRACT(location_data, '$.priority'), 1)
        );

        SET location_index = location_index + 1;
    END WHILE;
END$$

-- Procedure to migrate task files
CREATE PROCEDURE MigrateTaskFiles(IN task_id VARCHAR(255), IN files_json JSON)
BEGIN
    DECLARE file_index INT DEFAULT 0;
    DECLARE max_index INT;
    DECLARE file_path TEXT;

    IF files_json IS NULL OR JSON_LENGTH(files_json) = 0 THEN
        RETURN;
    END IF;

    SET max_index = JSON_LENGTH(files_json) - 1;

    file_loop: WHILE file_index <= max_index DO
        SET file_path = JSON_UNQUOTE(JSON_EXTRACT(files_json, CONCAT('$[', file_index, ']')));

        INSERT INTO task_files (
            task_id,
            file_path,
            file_type,
            is_critical
        ) VALUES (
            task_id,
            file_path,
            CASE 
                WHEN file_path LIKE '%.test.%' OR file_path LIKE '%/tests/%' OR file_path LIKE '%/__tests__/%' THEN 'test'
                WHEN file_path LIKE '%.md' OR file_path LIKE '%/docs/%' THEN 'documentation'
                WHEN file_path LIKE '%.json' OR file_path LIKE '%.config.%' OR file_path LIKE '%.yml' OR file_path LIKE '%.yaml' THEN 'config'
                WHEN file_path LIKE '%.js' OR file_path LIKE '%.ts' OR file_path LIKE '%.py' OR file_path LIKE '%.go' THEN 'source'
                ELSE 'other'
            END,
            false
        );

        SET file_index = file_index + 1;
    END WHILE;
END$$

-- Procedure to migrate task dependencies
CREATE PROCEDURE MigrateTaskDependencies(IN task_id VARCHAR(255), IN dependencies_json JSON)
BEGIN
    DECLARE dep_index INT DEFAULT 0;
    DECLARE max_index INT;
    DECLARE dependency_id VARCHAR(255);

    IF dependencies_json IS NULL OR JSON_LENGTH(dependencies_json) = 0 THEN
        RETURN;
    END IF;

    SET max_index = JSON_LENGTH(dependencies_json) - 1;

    dep_loop: WHILE dep_index <= max_index DO
        SET dependency_id = JSON_UNQUOTE(JSON_EXTRACT(dependencies_json, CONCAT('$[', dep_index, ']')));

        INSERT IGNORE INTO task_dependencies (
            task_id,
            depends_on_task_id,
            dependency_type
        ) VALUES (
            task_id,
            dependency_id,
            'blocks'
        );

        SET dep_index = dep_index + 1;
    END WHILE;
END$$

-- Procedure to migrate task success criteria
CREATE PROCEDURE MigrateTaskSuccessCriteria(IN task_id VARCHAR(255), IN criteria_json JSON)
BEGIN
    DECLARE criteria_index INT DEFAULT 0;
    DECLARE max_index INT;
    DECLARE criteria_name VARCHAR(255);

    IF criteria_json IS NULL OR JSON_LENGTH(criteria_json) = 0 THEN
        RETURN;
    END IF;

    SET max_index = JSON_LENGTH(criteria_json) - 1;

    criteria_loop: WHILE criteria_index <= max_index DO
        SET criteria_name = JSON_UNQUOTE(JSON_EXTRACT(criteria_json, CONCAT('$[', criteria_index, ']')));

        INSERT IGNORE INTO success_criteria (
            entity_type,
            entity_id,
            criteria_name,
            is_mandatory,
            priority
        ) VALUES (
            'task',
            task_id,
            criteria_name,
            true,
            1
        );

        SET criteria_index = criteria_index + 1;
    END WHILE;
END$$

-- Procedure to migrate subtask success criteria
CREATE PROCEDURE MigrateSubtaskSuccessCriteria(IN subtask_id VARCHAR(255), IN criteria_json JSON)
BEGIN
    DECLARE criteria_index INT DEFAULT 0;
    DECLARE max_index INT;
    DECLARE criteria_name VARCHAR(255);

    IF criteria_json IS NULL OR JSON_LENGTH(criteria_json) = 0 THEN
        RETURN;
    END IF;

    SET max_index = JSON_LENGTH(criteria_json) - 1;

    criteria_loop: WHILE criteria_index <= max_index DO
        SET criteria_name = JSON_UNQUOTE(JSON_EXTRACT(criteria_json, CONCAT('$[', criteria_index, ']')));

        INSERT IGNORE INTO success_criteria (
            entity_type,
            entity_id,
            criteria_name,
            is_mandatory,
            priority
        ) VALUES (
            'subtask',
            subtask_id,
            criteria_name,
            true,
            1
        );

        SET criteria_index = criteria_index + 1;
    END WHILE;
END$$

DELIMITER ;

-- ============================================================================
-- MIGRATION EXECUTION SCRIPT
-- ============================================================================

-- Example usage - Replace with actual TODO.json content
-- This would typically be called from the application migration script

/*
-- Load JSON data from file (this would be done in application code)
SET @json_data = '{
    "project": "example-project",
    "tasks": [...],
    "agents": {...},
    "features": [...]
}';

-- Extract and migrate agents
SET @agents_json = JSON_EXTRACT(@json_data, '$.agents');
CALL MigrateAgents(@agents_json);

-- Extract and migrate tasks
SET @tasks_json = JSON_EXTRACT(@json_data, '$.tasks');
CALL MigrateTasks(@tasks_json);
*/

-- ============================================================================
-- POST-MIGRATION VALIDATION QUERIES
-- ============================================================================

-- Validation query to check migration completeness
CREATE VIEW migration_summary AS
SELECT 
    'tasks' as entity_type,
    COUNT(*) as total_count,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
    SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count
FROM tasks
UNION ALL
SELECT 
    'subtasks' as entity_type,
    COUNT(*) as total_count,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
    SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count
FROM subtasks
UNION ALL
SELECT 
    'agents' as entity_type,
    COUNT(*) as total_count,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
    SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_count,
    SUM(CASE WHEN status = 'stale' THEN 1 ELSE 0 END) as stale_count
FROM agents;

-- Validation query for data integrity
CREATE VIEW data_integrity_check AS
SELECT 
    'orphaned_subtasks' as check_type,
    COUNT(*) as issue_count
FROM subtasks s 
LEFT JOIN tasks t ON s.parent_task_id = t.id 
WHERE t.id IS NULL
UNION ALL
SELECT 
    'invalid_agent_references' as check_type,
    COUNT(*) as issue_count
FROM tasks t 
LEFT JOIN agents a ON t.assigned_agent_id = a.id 
WHERE t.assigned_agent_id IS NOT NULL AND a.id IS NULL
UNION ALL
SELECT 
    'circular_dependencies' as check_type,
    COUNT(*) as issue_count
FROM task_dependencies td1
JOIN task_dependencies td2 ON td1.task_id = td2.depends_on_task_id 
    AND td1.depends_on_task_id = td2.task_id;

-- Query to show migration statistics
SELECT * FROM migration_summary;
SELECT * FROM data_integrity_check;

-- ============================================================================
-- CLEANUP PROCEDURES
-- ============================================================================

-- Procedure to clean up migration artifacts
DELIMITER $$
CREATE PROCEDURE CleanupMigration()
BEGIN
    -- Drop temporary views
    DROP VIEW IF EXISTS migration_summary;
    DROP VIEW IF EXISTS data_integrity_check;
    
    -- Drop migration procedures (optional - keep for future use)
    -- DROP PROCEDURE IF EXISTS MigrateAgents;
    -- DROP PROCEDURE IF EXISTS MigrateTasks;
    -- DROP PROCEDURE IF EXISTS MigrateSubtasks;
    -- DROP PROCEDURE IF EXISTS MigrateResearchLocations;
    -- DROP PROCEDURE IF EXISTS MigrateTaskFiles;
    -- DROP PROCEDURE IF EXISTS MigrateTaskDependencies;
    -- DROP PROCEDURE IF EXISTS MigrateTaskSuccessCriteria;
    -- DROP PROCEDURE IF EXISTS MigrateSubtaskSuccessCriteria;
END$$
DELIMITER ;

-- Note: Uncomment the following line after successful migration
-- CALL CleanupMigration();