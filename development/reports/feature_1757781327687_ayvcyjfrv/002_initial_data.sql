-- ============================================================================
-- Database Initial Data Script: Default Audit and Success Criteria
-- Version: 002
-- Purpose: Populate database with standard audit criteria and success criteria
-- ============================================================================

-- ============================================================================
-- 1. AUDIT_CRITERIA - Standard completion requirements
-- ============================================================================

INSERT INTO audit_criteria (
    category,
    name,
    description,
    validation_command,
    is_automated,
    severity,
    applies_to_categories,
    is_active
) VALUES
-- Code Quality Criteria
(
    'code_quality',
    'Linter Perfection',
    'All linting rules pass with zero violations across the entire codebase',
    'npm run lint 2>&1 | grep -E "(error|warning)" && echo "FAIL" || echo "PASS"',
    true,
    'high',
    JSON_ARRAY('feature', 'subtask'),
    true
),
(
    'code_quality',
    'Build Success',
    'Project builds successfully without errors or warnings',
    'npm run build 2>&1 | grep -E "(error|Error|ERROR)" && echo "FAIL" || echo "PASS"',
    true,
    'critical',
    JSON_ARRAY('feature', 'subtask'),
    true
),
(
    'code_quality',
    'Runtime Success',
    'Application starts and runs without errors',
    'timeout 30s npm start > /dev/null 2>&1 && echo "PASS" || echo "FAIL"',
    true,
    'critical',
    JSON_ARRAY('feature', 'subtask'),
    true
),
(
    'code_quality',
    'Test Integrity',
    'All existing tests pass and new features include appropriate test coverage',
    'npm test 2>&1 | grep -E "(failed|error)" && echo "FAIL" || echo "PASS"',
    true,
    'high',
    JSON_ARRAY('feature', 'subtask'),
    true
),

-- Documentation Criteria
(
    'documentation',
    'Function Documentation',
    'All public functions and classes have comprehensive documentation with parameters, return values, and examples',
    'grep -r "TODO\\|FIXME" src/ && echo "FAIL" || echo "PASS"',
    false,
    'medium',
    JSON_ARRAY('feature', 'subtask'),
    true
),
(
    'documentation',
    'API Documentation',
    'All public interfaces documented with usage examples and clear specifications',
    'find src/ -name "*.js" -o -name "*.ts" | xargs grep -L "@param\\|@returns\\|@example" | wc -l | awk "{if ($1 > 0) print \"FAIL\"; else print \"PASS\"}"',
    false,
    'medium',
    JSON_ARRAY('feature'),
    true
),
(
    'documentation',
    'Architecture Documentation',
    'System design decisions, data flow, and integration patterns are documented',
    'test -f docs/architecture.md || test -f README.md && echo "PASS" || echo "FAIL"',
    false,
    'medium',
    JSON_ARRAY('feature'),
    true
),
(
    'documentation',
    'Decision Rationale',
    'Major technical decisions include reasoning and alternative approaches considered',
    'find docs/ development/ -name "*.md" | xargs grep -l "decision\\|rationale\\|approach" | wc -l | awk "{if ($1 > 0) print \"PASS\"; else print \"FAIL\"}"',
    false,
    'low',
    JSON_ARRAY('feature'),
    true
),

-- Security Criteria
(
    'security',
    'No Credential Exposure',
    'No hardcoded passwords, API keys, or sensitive data in source code',
    'grep -r -E "(password|api[_-]?key|secret|token)\\s*[:=]\\s*[\"'"'"'][^\"'"'"'\\s]{8,}" src/ && echo "FAIL" || echo "PASS"',
    true,
    'critical',
    JSON_ARRAY('feature', 'subtask'),
    true
),
(
    'security',
    'Input Validation',
    'All user inputs are validated and sanitized to prevent injection attacks',
    'grep -r "req\\." src/ | grep -v "validate\\|sanitize\\|escape" && echo "NEEDS_REVIEW" || echo "PASS"',
    false,
    'high',
    JSON_ARRAY('feature'),
    true
),
(
    'security',
    'Output Encoding',
    'All dynamic outputs are properly encoded to prevent XSS attacks',
    'grep -r "innerHTML\\|document\\.write" src/ && echo "NEEDS_REVIEW" || echo "PASS"',
    false,
    'high',
    JSON_ARRAY('feature'),
    true
),
(
    'security',
    'Authentication/Authorization',
    'Proper authentication and authorization controls are implemented where required',
    'grep -r "auth" src/ | grep -E "(middleware|guard|check)" && echo "PASS" || echo "NEEDS_REVIEW"',
    false,
    'high',
    JSON_ARRAY('feature'),
    true
),
(
    'security',
    'Security Review',
    'Security implications reviewed and documented',
    'find docs/ development/ -name "*.md" | xargs grep -l "security" | wc -l | awk "{if ($1 > 0) print \"PASS\"; else print \"NEEDS_REVIEW\"}"',
    false,
    'medium',
    JSON_ARRAY('feature'),
    true
),

-- Performance Criteria
(
    'performance',
    'Performance Metrics',
    'Execution timing and bottleneck identification implemented',
    'grep -r "console\\.time\\|performance\\." src/ && echo "PASS" || echo "NEEDS_REVIEW"',
    false,
    'medium',
    JSON_ARRAY('feature'),
    true
),
(
    'performance',
    'Error Handling',
    'Comprehensive error handling with proper logging and user feedback',
    'grep -r "try\\|catch\\|throw" src/ && echo "PASS" || echo "NEEDS_REVIEW"',
    false,
    'high',
    JSON_ARRAY('feature', 'subtask'),
    true
),

-- Compliance Criteria
(
    'compliance',
    'Architectural Consistency',
    'New code follows established architectural patterns and conventions',
    'echo "MANUAL_REVIEW_REQUIRED"',
    false,
    'medium',
    JSON_ARRAY('feature'),
    true
),
(
    'compliance',
    'Dependency Validation',
    'All new dependencies are necessary, secure, and properly licensed',
    'npm audit --audit-level moderate 2>&1 | grep -E "(high|critical)" && echo "FAIL" || echo "PASS"',
    true,
    'high',
    JSON_ARRAY('feature'),
    true
),
(
    'compliance',
    'Version Compatibility',
    'Changes maintain backward compatibility and version requirements',
    'echo "MANUAL_REVIEW_REQUIRED"',
    false,
    'medium',
    JSON_ARRAY('feature'),
    true
),
(
    'compliance',
    'Cross-Platform',
    'Code works across supported platforms and environments',
    'echo "MANUAL_REVIEW_REQUIRED"',
    false,
    'low',
    JSON_ARRAY('feature'),
    true
),
(
    'compliance',
    'Environment Variables',
    'Environment-specific configurations use proper environment variables',
    'grep -r "process\\.env" src/ && echo "PASS" || echo "NEEDS_REVIEW"',
    false,
    'medium',
    JSON_ARRAY('feature'),
    true
),
(
    'compliance',
    'Configuration',
    'Configuration files are properly structured and documented',
    'test -f config.json || test -f .env.example && echo "PASS" || echo "NEEDS_REVIEW"',
    false,
    'low',
    JSON_ARRAY('feature'),
    true
),
(
    'compliance',
    'License Compliance',
    'All code and dependencies comply with project licensing requirements',
    'npm ls --depth=0 2>&1 | grep -E "(UNMET|missing)" && echo "FAIL" || echo "PASS"',
    true,
    'medium',
    JSON_ARRAY('feature'),
    true
),
(
    'compliance',
    'Data Privacy',
    'Data handling complies with privacy requirements and regulations',
    'echo "MANUAL_REVIEW_REQUIRED"',
    false,
    'high',
    JSON_ARRAY('feature'),
    true
),
(
    'compliance',
    'Regulatory Compliance',
    'Implementation meets all applicable regulatory requirements',
    'echo "MANUAL_REVIEW_REQUIRED"',
    false,
    'medium',
    JSON_ARRAY('feature'),
    true
);

-- ============================================================================
-- 2. SUCCESS_CRITERIA - Project-wide success criteria
-- ============================================================================

INSERT INTO success_criteria (
    entity_type,
    entity_id,
    criteria_name,
    description,
    is_mandatory,
    validation_method,
    validation_command,
    priority
) VALUES
-- Project-wide mandatory criteria
(
    'project',
    NULL,
    'Clean Build',
    'Project must build without errors or warnings',
    true,
    'build',
    'npm run build',
    1
),
(
    'project',
    NULL,
    'Linting Standards',
    'All code must pass linting without violations',
    true,
    'linter',
    'npm run lint',
    1
),
(
    'project',
    NULL,
    'Test Coverage',
    'All existing tests must continue to pass',
    true,
    'test',
    'npm test',
    1
),
(
    'project',
    NULL,
    'Runtime Stability',
    'Application must start and run without critical errors',
    true,
    'runtime',
    'npm start',
    1
),

-- Project-wide optional criteria
(
    'project',
    NULL,
    'Documentation Currency',
    'Documentation should be up-to-date with implementation',
    false,
    'manual',
    NULL,
    2
),
(
    'project',
    NULL,
    'Performance Baseline',
    'Performance should not degrade from established baselines',
    false,
    'performance',
    'npm run benchmark',
    2
),
(
    'project',
    NULL,
    'Security Compliance',
    'No new security vulnerabilities introduced',
    false,
    'security',
    'npm audit',
    2
);

-- ============================================================================
-- 3. TASK_TEMPLATES - Common task templates
-- ============================================================================

INSERT INTO task_templates (
    id,
    name,
    description,
    category,
    template_data,
    success_criteria_template,
    estimated_hours,
    is_active
) VALUES
(
    'feature_api_endpoint',
    'API Endpoint Implementation',
    'Template for implementing new API endpoints with validation and documentation',
    'feature',
    JSON_OBJECT(
        'requires_research', true,
        'important_files', JSON_ARRAY('src/routes/', 'src/controllers/', 'docs/api.md'),
        'default_priority', 'medium'
    ),
    JSON_ARRAY(
        'Input Validation',
        'Error Handling',
        'API Documentation',
        'Authentication Check',
        'Response Format Consistency'
    ),
    4.0,
    true
),
(
    'feature_database_schema',
    'Database Schema Changes',
    'Template for database schema modifications with migration scripts',
    'feature',
    JSON_OBJECT(
        'requires_research', true,
        'important_files', JSON_ARRAY('migrations/', 'models/', 'docs/database.md'),
        'default_priority', 'high'
    ),
    JSON_ARRAY(
        'Migration Script Validation',
        'Data Integrity Check',
        'Rollback Procedure',
        'Performance Impact Assessment',
        'Documentation Update'
    ),
    6.0,
    true
),
(
    'feature_ui_component',
    'UI Component Implementation',
    'Template for creating reusable UI components with proper testing',
    'feature',
    JSON_OBJECT(
        'requires_research', false,
        'important_files', JSON_ARRAY('src/components/', 'src/styles/', 'tests/'),
        'default_priority', 'medium'
    ),
    JSON_ARRAY(
        'Component Reusability',
        'Accessibility Compliance',
        'Cross-Browser Compatibility',
        'Unit Test Coverage',
        'Style Guide Adherence'
    ),
    3.0,
    true
),
(
    'error_linting_fix',
    'Linting Error Resolution',
    'Template for fixing code quality and linting violations',
    'error',
    JSON_OBJECT(
        'requires_research', false,
        'important_files', JSON_ARRAY(),
        'default_priority', 'high'
    ),
    JSON_ARRAY(
        'All Violations Fixed',
        'No New Violations Introduced',
        'Code Functionality Preserved'
    ),
    1.0,
    true
),
(
    'error_build_failure',
    'Build Failure Resolution',
    'Template for resolving compilation and build errors',
    'error',
    JSON_OBJECT(
        'requires_research', true,
        'important_files', JSON_ARRAY('package.json', 'webpack.config.js', 'tsconfig.json'),
        'default_priority', 'critical'
    ),
    JSON_ARRAY(
        'Build Success',
        'Dependency Resolution',
        'Configuration Validation',
        'No Regression Introduced'
    ),
    2.0,
    true
);

-- ============================================================================
-- 4. Default Research Location Templates (for research subtask generation)
-- ============================================================================

-- Create a reference table for research location patterns
CREATE TEMPORARY TABLE research_patterns (
    task_category VARCHAR(50),
    keywords TEXT,
    codebase_paths TEXT,
    documentation_sources TEXT
);

INSERT INTO research_patterns VALUES
('database', 'database,schema,migration,SQL,ORM,model', '/models,/migrations,/database,/db', 'README.md,docs/database.md,package.json'),
('api', 'API,endpoint,REST,GraphQL,route,controller', '/api,/routes,/controllers,/middleware', 'README.md,docs/api.md,package.json'),
('auth', 'authentication,authorization,security,jwt,session', '/auth,/middleware,/security', 'README.md,docs/security.md,package.json'),
('ui', 'component,interface,frontend,react,vue,angular', '/components,/views,/pages,/styles', 'README.md,docs/ui.md,package.json'),
('test', 'testing,jest,mocha,cypress,unit,integration', '/tests,/spec,/__tests__', 'README.md,docs/testing.md,package.json'),
('performance', 'performance,optimization,caching,benchmark', '/cache,/utils,/lib', 'README.md,docs/performance.md,package.json'),
('security', 'security,validation,sanitization,encryption', '/security,/auth,/validation', 'README.md,docs/security.md,package.json');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify audit criteria were inserted
SELECT 
    category,
    COUNT(*) as criteria_count,
    SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_count
FROM audit_criteria 
GROUP BY category
ORDER BY category;

-- Verify success criteria were inserted
SELECT 
    entity_type,
    COUNT(*) as criteria_count,
    SUM(CASE WHEN is_mandatory = true THEN 1 ELSE 0 END) as mandatory_count
FROM success_criteria 
GROUP BY entity_type
ORDER BY entity_type;

-- Verify task templates were inserted
SELECT 
    category,
    COUNT(*) as template_count,
    SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_count
FROM task_templates 
GROUP BY category
ORDER BY category;

-- Show sample audit criteria by severity
SELECT 
    name,
    category,
    severity,
    is_automated,
    applies_to_categories
FROM audit_criteria 
WHERE is_active = true
ORDER BY 
    FIELD(severity, 'critical', 'high', 'medium', 'low'),
    category,
    name;

-- Clean up temporary table
DROP TEMPORARY TABLE research_patterns;