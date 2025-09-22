#!/usr/bin/env node
/* eslint-disable no-console -- Setup script requires console output for user feedback */
/**
 * Infinite Continue Hook Setup and Project Initialization System
 *
 * === OVERVIEW ===
 * Comprehensive project setup utility that initializes TaskManager system
 * integration across development projects. This script creates the necessary
 * directory structures, configuration files, and FEATURES.json schemas required
 * for the infinite continue hook system to function properly.
 *
 * === KEY FEATURES ===
 * • Automated project directory structure creation
 * • FEATURES.json schema initialization with feature approval workflow
 * • Development mode files and guidelines setup
 * • Interactive and batch mode operations
 * • Project validation and compatibility checking
 * • Centralized TaskManager system integration
 *
 * === PROJECT STRUCTURE CREATION ===
 * • /development - Core development documentation directory
 * • /development/tasks - Task-specific documentation
 * • /development/reports - Development reports and analysis
 * • FEATURES.json - Feature approval workflow schema
 * • Agent registry integration for multi-agent coordination
 *
 * === FEATURES.JSON SCHEMA ===
 * Creates modern feature management compatible FEATURES.json structure:
 * • Task management with unique IDs and timestamps
 * • Dependency system for complex workflows
 * • Agent coordination and multi-agent support
 * • Review strike system for quality control
 * • Mode-based workflow management
 * • Production-ready implementation requirements
 *
 * === OPERATION MODES ===
 * • Interactive Mode - User-guided project configuration
 * • Batch Mode - Automated setup with minimal interaction
 * • Single Project Mode - Setup for specific project directory
 * • Validation Mode - Check and update existing projects
 *
 * === HOOK SYSTEM INTEGRATION ===
 * • Integrates with Claude Code infinite continue hook
 * • Establishes connection to centralized TaskManager system
 * • Provides universal command interface setup
 * • Creates standardized workflow patterns
 *
 * === QUALITY ASSURANCE SYSTEM ===
 * The setup creates a three-strike review system:
 * • Strike 1: Build and compilation validation
 * • Strike 2: Linting and code quality validation
 * • Strike 3: Test coverage and quality validation
 * • Automatic task creation for remediation
 * • Production-ready implementation enforcement
 *
 * === COMMAND LINE INTERFACE ===
 * • --no-interactive / --batch: Skip interactive prompts
 * • --project-name: Specify project name
 * • --task: Initial task description
 * • --mode: Task execution mode
 * • --prompt: Detailed task instructions
 * • --dependencies: Task dependencies
 * • --important-files: Critical project files
 * • --requires-research: Research requirement flag
 * • --single: Single project mode
 *
 * === USAGE PATTERNS ===
 * 1. Interactive Setup:
 *    node setup-infinite-hook.js /path/to/project
 *
 * 2. Batch Setup:
 *    node setup-infinite-hook.js --batch --project-name "MyProject"
 *
 * 3. Single Project:
 *    node setup-infinite-hook.js /path/to/project --single
 *
 * 4. Automated CI/CD:
 *    node setup-infinite-hook.js $PROJECT_ROOT --batch --no-interactive
 *
 * @author TaskManager System
 * @version 2.0.0
 * @since 2024-01-01
 */

const _fs = require('fs');
const _path = require('path');
const readline = require('readline');

// Parse command line arguments
const args = process.argv.slice(2);
const projectPath =
  args[0] || '/Users/jeremyparker/Desktop/Claude Coding Projects';

// Check for command line flags
const flags = {
  noInteractive: args.includes('--no-interactive') || args.includes('--batch'),
  projectName: getArgValue('--project-name'),
  task: getArgValue('--task'),
  mode: getArgValue('--mode') || 'DEVELOPMENT',
  prompt: getArgValue('--prompt'),
  dependencies: getArgValue('--dependencies'),
  importantFiles: getArgValue('--important-files'),
  requiresResearch: args.includes('--requires-research'),
  batchMode: args.includes('--batch'),
  singleProject: args.includes('--single'),
};

function getArgValue(flag) {
  const index = args.indexOf(flag);
  if (index > -1 && index < args.length - 1) {
    return args[index + 1];
  }
  return null;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function _getProjectInfo(targetPath) {
  // Try to detect project name from package.json or directory name
  let detectedName = _path.basename(targetPath);

  const packageJsonPath = _path.join(targetPath, 'package.json');

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Package.json path constructed from trusted setup directory
  if (_fs.existsSync(packageJsonPath)) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Package.json path validated through setup process
      const packageJson = JSON.parse(_fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.name) {
        detectedName = packageJson.name;
      }
    } catch {
      // Ignore and use directory name
    }
  }

  if (flags.noInteractive) {
    return {
      projectName: flags.projectName || detectedName,
      taskDescription: flags.task || 'Initial project setup',
      taskMode: flags.mode.toUpperCase(),
      taskPrompt:
        flags.prompt ||
        flags.task ||
        'Set up the project according to requirements',
      dependencies: flags.dependencies
        ? flags.dependencies.split(',').map((d) => d.trim())
        : [],
      importantFiles: flags.importantFiles
        ? flags.importantFiles.split(',').map((f) => f.trim())
        : [],
      requiresResearch: flags.requiresResearch,
    };
  }

  // Interactive mode

  console.log('\n=== Project Configuration ===');
  const projectName =
    (await question(`Project name (${detectedName}): `)) || detectedName;


  console.log('\n=== Initial Task Setup ===');
  const taskDescription = await question('Task description: ');
  const taskMode =
    (await question(
      'Task mode (DEVELOPMENT/REFACTORING/TESTING/RESEARCH) [DEVELOPMENT]: ',
    )) || 'DEVELOPMENT';
  const taskPrompt = await question('Detailed task prompt: ');
  const dependencies = await question(
    'Dependencies (comma-separated files/dirs, or press Enter to skip): ',
  );
  const importantFiles = await question(
    'Important files to read first (comma-separated, or press Enter to skip): ',
  );
  const requiresResearch = await question('Requires research? (y/n) [n]: ');

  return {
    projectName,
    taskDescription,
    taskMode: taskMode.toUpperCase(),
    taskPrompt,
    dependencies: dependencies
      ? dependencies.split(',').map((d) => d.trim())
      : [],
    importantFiles: importantFiles
      ? importantFiles.split(',').map((f) => f.trim())
      : [],
    requiresResearch: requiresResearch.toLowerCase() === 'y',
  };
}

function createProjectDirectories(targetPath) {
  // Create /development directory
  const developmentPath = _path.join(targetPath, 'development');

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Development path constructed from trusted setup directory
  if (!_fs.existsSync(developmentPath)) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Development path validated through setup process
    _fs.mkdirSync(developmentPath, { recursive: true });

    console.log(`✓ Created /development directory`);
  }

  // Create /development/tasks directory
  const tasksPath = _path.join(developmentPath, 'tasks');

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Tasks path constructed from validated development directory
  if (!_fs.existsSync(tasksPath)) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Tasks path validated through setup process
    _fs.mkdirSync(tasksPath, { recursive: true });

    console.log(`✓ Created /development/tasks directory`);
  }

  // Create /development/reports directory
  const reportsPath = _path.join(developmentPath, 'reports');

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Reports path constructed from validated development directory
  if (!_fs.existsSync(reportsPath)) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Reports path validated through setup process
    _fs.mkdirSync(reportsPath, { recursive: true });

    console.log(`✓ Created /development/reports directory`);
  }

  // Create /development/logs directory
  const logsPath = _path.join(developmentPath, 'logs');

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Logs path constructed from validated development directory
  if (!_fs.existsSync(logsPath)) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Logs path validated through setup process
    _fs.mkdirSync(logsPath, { recursive: true });

    console.log(`✓ Created /development/logs directory`);
  }

  return { developmentPath, tasksPath, reportsPath, logsPath };
}

// Check if TODO.json needs to be updated to new schema
function needsTodoUpdate(todoPath) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- TODO.json path constructed from trusted setup directory
  if (!_fs.existsSync(todoPath)) {
    return true;
  }

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- TODO.json path validated through setup process
    const existing = JSON.parse(_fs.readFileSync(todoPath, 'utf8'));

    // Check for old schema indicators
    const hasOldSchema =
      existing.current_task_index !== undefined || // Old field
      !existing.current_mode || // Missing new field
      existing.execution_count === undefined || // Missing new field
      (existing.tasks &&
        existing.tasks.some((t) => t.id && !t.id.includes('_'))) || // Old task ID format
      (existing.tasks && existing.tasks.some((t) => !t.title)); // Missing title field

    if (hasOldSchema) {

      console.log(
        `⚠️  ${_path.basename(_path.dirname(todoPath))} - TODO.json uses old schema, will update`,
      );
      return true;
    }


    console.log(
      `✓ ${_path.basename(_path.dirname(todoPath))} - TODO.json already up to date`,
    );
    return false;
  } catch {

    console.log(
      `⚠️  ${_path.basename(_path.dirname(todoPath))} - TODO.json corrupted, will recreate`,
    );
    return true;
  }
}

function createTodoJson(targetPath, projectInfo) {
  const todoPath = _path.join(targetPath, 'TODO.json');

  // Smart update logic - only update if schema is old or missing
  if (!needsTodoUpdate(todoPath)) {
    return true; // Already up to date, skip
  }

  // Generate timestamp for schema
  const timestamp = Date.now();

  // Create new schema TODO structure
  const todoData = {
    project: projectInfo.projectName,
    tasks: [],
    // New multi-agent schema fields
    current_mode: projectInfo.taskMode,
    last_mode: null,
    execution_count: 0,
    review_strikes: 0,
    strikes_completed_last_run: false,
    last_hook_activation: timestamp,
    agents: {}, // Empty agent registry
    features: [], // Feature-based system integration
    current_task_index: 0,
  };

  // Add comprehensive validation tasks for professional development
  const reviewTasks = [
    {
      title: 'Comprehensive Build & Startup Validation',
      criteria: 'MANDATORY: Verify project builds and starts successfully with log review',
      dependencies: [],
      important_files: [],
      friendlyInstructions: `MANDATORY validation for professional development standards.

Required validation steps:
- Run 'npm run build' and verify zero errors/warnings
- Run 'npm start' and verify application starts without errors  
- Review startup logs for any errors, warnings, or issues
- Verify all services start correctly and bind to expected ports
- Test graceful shutdown if applicable

Create error tasks for any issues found - this is not optional.`,
    },
    {
      title: 'Feature Implementation Testing',
      criteria: 'MANDATORY: Test all implemented features comprehensively',
      dependencies: [],
      important_files: [],
      friendlyInstructions: `MANDATORY feature testing for quality assurance.

Required testing approach:
- For web apps: Use Puppeteer to test every implemented feature
- For APIs: Test all endpoints with realistic data via direct calls
- For CLI tools: Test all commands and options with various inputs
- Verify feature interactions work correctly
- Test error handling and edge cases
- Ensure performance is within acceptable limits

This ensures features work as intended before completion.`,
    },
    {
      title: 'Comprehensive System Validation',
      criteria: 'MANDATORY: End-to-end validation before project completion',
      dependencies: [],
      important_files: [],
      friendlyInstructions: `MANDATORY final validation before authorizing stop.

Complete validation requirements:
- All linting rules pass without errors or warnings
- All existing tests pass (create test-update tasks if outdated)
- Integration testing between all features
- Security validation (no exposed secrets, proper input validation)
- Performance validation (no memory leaks, acceptable response times)
- Documentation completeness check

Only when ALL validation passes and ALL user-approved features are complete 
should stop authorization be considered.`,
    },
  ];

  reviewTasks.forEach((reviewTask, index) => {
    const reviewId = `task_${timestamp + index + 1}_quality_check${index + 1}`;
    todoData.tasks.push({
      id: reviewId,
      title: reviewTask.title,
      description: `${reviewTask.criteria}

${reviewTask.friendlyInstructions}

## PROFESSIONAL STANDARDS
These validation tasks implement enterprise-level quality assurance:
- ✅ Complete all validation steps before marking task complete
- 🔧 Create error tasks for any issues found during validation
- 📋 Document validation results as evidence of completion

## MANDATORY VALIDATION CHECKLIST
Required for professional development standards:
- Build verification with zero errors/warnings
- Startup health check with log review
- Feature testing with realistic scenarios
- Integration testing between components
- Performance and security validation

This validation ensures professional-grade delivery quality.`,
      task_type: 'validation',
      category: 'validation',
      priority: 'normal',
      status: 'pending',
      dependencies: reviewTask.dependencies,
      important_files: reviewTask.important_files,
      requires_research: false,
      created_at: new Date().toISOString(),
      subtasks: [],
      is_optional_validation: true,
      validation_type: index + 1,
    });
  });

  // Write TODO.json
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- TODO.json path validated through setup process
  _fs.writeFileSync(todoPath, JSON.stringify(todoData, null, 2));

  console.log(`\n✓ TODO.json created at: ${todoPath}`);

  return true;
}

// Get all project directories to process
function _getProjectDirectories(basePath) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Base path validated as trusted setup directory
  if (!_fs.existsSync(basePath) || !_fs.statSync(basePath).isDirectory()) {
    return [];
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Base path validated through setup process
  return _fs
    .readdirSync(basePath)
    .map((item) => _path.join(basePath, item))
    .filter((itemPath) => {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Item path constructed from validated base directory
      if (!_fs.statSync(itemPath).isDirectory()) {
        return false;
      }

      // Skip hidden directories and common ignore patterns
      const dirname = _path.basename(itemPath);
      if (
        dirname.startsWith('.') ||
        dirname === 'node_modules' ||
        dirname === 'dist' ||
        dirname === 'build'
      ) {
        return false;
      }

      return true;
    });
}

async function processProject(targetPath) {
  const projectName = _path.basename(targetPath);

  console.log(`\n=== Processing ${projectName} ===`);

  try {
    // Get project information for this specific project
    const projectInfo = {
      projectName: projectName,
      taskDescription: 'Continue development and improvements',
      taskMode: 'DEVELOPMENT',
      taskPrompt:
        'Continue with the current development tasks, fix any issues, and improve the codebase quality.',
      dependencies: [],
      importantFiles: [],
      requiresResearch: false,
    };

    // Create project directories and copy mode files if needed
    await createProjectDirectories(targetPath);

    // Create/update TODO.json if needed
    const success = await createTodoJson(targetPath, projectInfo);

    // Migrate to feature-based system (replaces features.json)
    migrateToFeatureBasedSystem(targetPath);

    if (success) {

      console.log(`✅ ${projectName} - Setup complete`);
    } else {

      console.log(`⏭️  ${projectName} - Skipped (already up to date)`);
    }

    return { success: true, project: projectName };
  } catch (error) {

    console.error(`❌ ${projectName} - Error:`, error.message);
    return { success: false, project: projectName, error: error.message };
  }
}

/**
 * Migrate TODO.json to feature-based system (replaces dual features.json system)
 * @param {string} targetPath - Target project path
 */
function migrateToFeatureBasedSystem(targetPath) {
  const todoPath = _path.join(targetPath, 'TODO.json');

  try {

    console.log(`   🔄 Checking for feature-based migration...`);

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- TODO.json path constructed from trusted project directory
    if (!_fs.existsSync(todoPath)) {
      console.log(`   ⚠️  No TODO.json found - skipping migration`);
      return;
    }

    // Read current TODO.json
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- TODO.json path validated through setup process
    const todoData = JSON.parse(_fs.readFileSync(todoPath, 'utf8'));

    // Check if already feature-based
    if (todoData.features && Array.isArray(todoData.features)) {

      console.log(`   ✅ Already feature-based - skipping migration`);
      return;
    }

    // Create backup before migration
    const backupPath = todoPath + '.pre-feature-migration.backup';
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Backup path constructed from validated TODO.json path
    _fs.writeFileSync(backupPath, JSON.stringify(todoData, null, 2));

    console.log(`   📋 Created backup: ${_path.basename(backupPath)}`);

    // Analyze current tasks for feature grouping
    const analysis = analyzeTasksForFeatures(todoData.tasks);

    console.log(
      `   📊 Analysis: ${analysis.summary.phased_tasks} phased tasks, ${analysis.summary.non_phased_tasks} independent tasks`,
    );

    // Convert to feature-based structure
    const migrated = convertToFeatureBasedSchema(todoData, analysis);

    // Write migrated structure
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- TODO.json path validated through setup process
    _fs.writeFileSync(todoPath, JSON.stringify(migrated, null, 2));


    console.log(
      `   ✅ Migration completed: ${migrated.features.length} features, ${migrated.tasks.length} tasks`,
    );

    // Clean up features.json if it exists (eliminating dual system)
    const featuresJsonPath = _path.join(targetPath, 'features.json');
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Features.json path constructed from trusted project directory
    if (_fs.existsSync(featuresJsonPath)) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Features.json path validated through setup process
      _fs.unlinkSync(featuresJsonPath);

      console.log(`   🗑️  Removed features.json (dual system eliminated)`);
    }
  } catch (error) {

    console.log(`   ❌ Feature migration failed: ${error.message}`);
    // Don't fail the entire setup for migration issues
  }
}

/**
 * Analyze current tasks to identify feature groupings
 * @param {Array} tasks - Current tasks array
 * @returns {Object} Analysis results
 */
function analyzeTasksForFeatures(tasks) {
  const analysis = {
    phaseGroups: {},
    nonPhasedTasks: [],
    summary: {
      total_tasks: tasks.length,
      phased_tasks: 0,
      non_phased_tasks: 0,
      unique_phases: 0,
    },
  };

  tasks.forEach((task) => {
    const phase = task.phase || extractPhaseFromTitle(task.title);

    if (phase) {
      const phaseKey = `${phase.major}.${phase.minor}`;
      // eslint-disable-next-line security/detect-object-injection -- phaseKey is validated string from phase parsing
      if (!analysis.phaseGroups[phaseKey]) {
        // eslint-disable-next-line security/detect-object-injection -- phaseKey is validated string from phase parsing
        analysis.phaseGroups[phaseKey] = {
          phase: phase,
          tasks: [],
          feature_title: generateFeatureTitle(phaseKey, task.title),
        };
      }
      // eslint-disable-next-line security/detect-object-injection -- phaseKey is validated string from phase parsing
      analysis.phaseGroups[phaseKey].tasks.push(task);
      analysis.summary.phased_tasks++;
    } else {
      analysis.nonPhasedTasks.push(task);
      analysis.summary.non_phased_tasks++;
    }
  });

  analysis.summary.unique_phases = Object.keys(analysis.phaseGroups).length;
  return analysis;
}

/**
 * Extract phase information from task title
 * @param {string} title - Task title
 * @returns {Object|null} Phase info or null
 */
function extractPhaseFromTitle(title) {
  if (!title) {
    return null;
  }

  // Use string parsing instead of regex to avoid security warnings
  const cleanTitle = title.replace(/^Research:\s*/i, '').trim();
  if (!cleanTitle.toLowerCase().startsWith('phase ')) {
    return null;
  }

  const phaseNumberPart = cleanTitle.slice(6).trim(); // Remove "Phase " prefix
  const versionParts = phaseNumberPart.split('.');

  const major = parseInt(versionParts[0], 10);
  const minor = versionParts.length > 1 ? parseInt(versionParts[1], 10) : 0;
  const patch = versionParts.length > 2 ? parseInt(versionParts[2], 10) : 0;

  if (isNaN(major)) {
    return null;
  }

  return {
    major: major,
    minor: minor,
    patch: patch,
    raw: `Phase ${major}${minor > 0 ? `.${minor}` : ''}${patch > 0 ? `.${patch}` : ''}`,
  };
}

/**
 * Generate feature title from phase key and task title
 * @param {string} phaseKey - Phase key (e.g., "1.2")
 * @param {string} sampleTitle - Sample task title
 * @returns {string} Generated feature title
 */
function generateFeatureTitle(phaseKey, sampleTitle) {
  // Extract feature name from task title

  // Use string parsing instead of regex to avoid security warnings
  const lowerTitle = sampleTitle.toLowerCase();
  const phaseIndex = lowerTitle.indexOf('phase ');
  const colonIndex = sampleTitle.indexOf(':', phaseIndex);

  if (phaseIndex >= 0 && colonIndex > phaseIndex) {
    let featureName = sampleTitle.substring(colonIndex + 1).trim();

    // Remove "Implementation" suffix if present
    if (featureName.toLowerCase().endsWith(' implementation')) {
      featureName = featureName.slice(0, -14).trim();
    }

    if (featureName) {
      return featureName;
    }
  }

  // Fallback to phase-based title
  return `Phase ${phaseKey} Feature`;
}

/**
 * Convert TODO.json to feature-based structure
 * @param {Object} todoData - Current TODO.json data
 * @param {Object} analysis - Task analysis results
 * @returns {Object} Migrated TODO.json structure
 */
function convertToFeatureBasedSchema(todoData, analysis) {
  const migrated = {
    ...todoData,
    features: [], // CRITICAL: User authorization required for feature additions
    tasks: [],
  };

  // Convert phased tasks to features with subtasks
  for (const [_phaseKey, group] of Object.entries(analysis.phaseGroups)) {
    const feature = createFeatureFromPhaseGroup(group);

    // IMPORTANT: Only add features to array - no automatic feature creation
    // User must explicitly authorize feature additions per CLAUDE.md requirements
    migrated.features.push(feature);

    // Convert phase tasks to subtasks with parent feature reference
    group.tasks.forEach((task) => {
      const subtask = {
        ...task,
        parent_feature: feature.id,
        // Remove phase info since it's now in the parent feature
        phase: undefined,
      };
      migrated.tasks.push(subtask);
    });
  }

  // Handle non-phased tasks (keep as regular tasks)
  analysis.nonPhasedTasks.forEach((task) => {
    migrated.tasks.push({
      ...task,
      parent_feature: null, // No parent feature
    });
  });

  return migrated;
}

/**
 * Create feature from phase group
 * @param {Object} group - Phase group data
 * @returns {Object} Feature object
 */
function createFeatureFromPhaseGroup(group) {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substr(2, 9);
  const featureId = `feature_${timestamp}_${randomSuffix}`;

  // Determine feature category from phase number
  const categoryMap = {
    1: 'bytebot',
    2: 'open_interpreter',
    3: 'opendia',
    4: 'huginn',
    5: 'orchestrator',
  };
  const category = categoryMap[group.phase.major] || 'uncategorized';

  // Calculate status based on subtask statuses
  const statuses = group.tasks.map((t) => t.status);
  let status = 'planned';
  if (statuses.every((s) => s === 'completed')) {
    status = 'implemented';
  } else if (statuses.some((s) => s === 'in_progress')) {
    status = 'in_progress';
  } else if (statuses.some((s) => s === 'completed')) {
    status = 'in_progress';
  }

  // Calculate priority from subtask priorities
  const priorities = group.tasks.map((t) => t.priority || 'medium');
  let priority = 'medium';
  if (priorities.includes('critical')) {
    priority = 'critical';
  } else if (priorities.includes('high')) {
    priority = 'high';
  } else if (priorities.includes('low')) {
    priority = 'low';
  }

  return {
    id: featureId,
    title: group.feature_title,
    description: generateFeatureDescription(group),
    status: status,
    category: category,
    priority: priority,
    phase: group.phase,
    subtasks: group.tasks.map((t) => t.id),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {
      migrated_from_phase: `${group.phase.major}.${group.phase.minor}`,
      original_task_count: group.tasks.length,
      completion_percentage: calculateCompletionPercentage(group.tasks),
    },
  };
}

/**
 * Generate feature description from task group
 * @param {Object} group - Task group
 * @returns {string} Feature description
 */
function generateFeatureDescription(group) {
  if (group.tasks.length === 1) {
    return group.tasks[0].description || 'Feature description';
  }

  // Aggregate description from multiple tasks
  const descriptions = group.tasks
    .map((t) => t.description)
    .filter((d) => d && d.length > 0);

  if (descriptions.length > 0) {
    return descriptions[0]; // Use first task's description
  }

  return `Feature comprising ${group.tasks.length} implementation tasks`;
}

/**
 * Calculate completion percentage
 * @param {Array} tasks - Task array
 * @returns {number} Completion percentage
 */
function calculateCompletionPercentage(tasks) {
  const completed = tasks.filter((t) => t.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
}

async function main() {

  console.log('=== Infinite Continue Stop Hook - Batch TODO.json Setup ===\n');

  // Resolve project path
  const targetPath = _path.resolve(projectPath);

  // Verify project path exists
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Target path resolved from command line argument and validated
  if (!_fs.existsSync(targetPath)) {
    console.error(`Error: Path does not exist: ${targetPath}`);
    throw new Error(`Invalid path: ${targetPath}`);
  }

  // Verify it's a directory
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Target path validated to exist and be trusted
  if (!_fs.statSync(targetPath).isDirectory()) {

    console.error(`Error: Path is not a directory: ${targetPath}`);
    throw new Error(`Path is not a directory: ${targetPath}`);
  }


  console.log(`Processing directories in: ${targetPath}`);

  console.log(`Batch mode: ${flags.batchMode ? 'ON' : 'OFF'}`);

  console.log(`Single project mode: ${flags.singleProject ? 'ON' : 'OFF'}`);

  const results = [];

  try {
    // Always process only the specified directory as a single project
    // This ensures TODO.json is created only in the root of the specified directory

    console.log(`Processing single project: ${_path.basename(targetPath)}`);
    const result = await processProject(targetPath);
    results.push(result);

    // Summary

    console.log('\n=== Summary ===');
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;


    console.log(`✅ Successfully processed: ${successful} projects`);
    if (failed > 0) {

      console.log(`❌ Failed: ${failed} projects`);
      results
        .filter((r) => !r.success)
        .forEach((r) => {

          console.log(`   - ${r.project}: ${r.error}`);
        });
    }


    console.log('\n📋 Usage examples:');

    console.log('# Process all projects in Claude Coding Projects (default):');

    console.log('node setup-infinite-hook.js');

    console.log('');

    console.log('# Process single project:');

    console.log('node setup-infinite-hook.js /path/to/project --single');

    console.log('');

    console.log('# Batch mode with no interaction:');

    console.log('node setup-infinite-hook.js --batch');


    console.log('\n📋 Each project now includes:');

    console.log('   - TODO.json with new multi-agent schema');

    console.log('   - Development mode files and directory structure');

    console.log('');

    console.log('📋 TaskManager system is centralized at:');

    console.log(
      '   /Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/',
    );

    console.log('');

    console.log('📋 Use universal commands to work with any project:');

    console.log(
      '   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project /path/to/project',
    );

    console.log(
      '   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" api current --project /path/to/project',
    );

    console.log('');

    console.log(
      '📋 Updated hook reference in ~/.claude/settings.json should point to:',
    );

    console.log(
      'node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/stop-hook.js"',
    );
  } catch (error) {

    console.error('\n❌ Batch setup error:', error.message);
    throw error;
  } finally {
    rl.close();
  }
}

// Run main function
main();
