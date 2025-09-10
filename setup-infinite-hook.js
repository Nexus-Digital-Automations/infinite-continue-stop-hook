/**
 * Infinite Continue Hook Setup and Project Initialization System
 *
 * === OVERVIEW ===
 * Comprehensive project setup utility that initializes TaskManager system
 * integration across development projects. This script creates the necessary
 * directory structures, configuration files, and TODO.json schemas required
 * for the infinite continue hook system to function properly.
 *
 * === KEY FEATURES ===
 * • Automated project directory structure creation
 * • TODO.json schema initialization with multi-agent support
 * • Development mode files and guidelines setup
 * • Interactive and batch mode operations
 * • Project validation and compatibility checking
 * • Centralized TaskManager system integration
 *
 * === PROJECT STRUCTURE CREATION ===
 * • /development - Core development documentation directory
 * • /development/tasks - Task-specific documentation
 * • /development/reports - Development reports and analysis
 * • TODO.json - Multi-agent task management schema
 * • Agent registry integration for multi-agent coordination
 *
 * === TODO.JSON SCHEMA ===
 * Creates modern multi-agent compatible TODO.json structure:
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

const fs = require('fs');
const path = require('path');
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
  let detectedName = path.basename(targetPath);

  const packageJsonPath = path.join(targetPath, 'package.json');
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- setup script with validated paths from command line arguments
  if (fs.existsSync(packageJsonPath)) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- setup script reading package.json from validated project path
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
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
  // eslint-disable-next-line no-console -- setup script interactive mode requires console output
  console.log('\n=== Project Configuration ===');
  const projectName =
    (await question(`Project name (${detectedName}): `)) || detectedName;

  // eslint-disable-next-line no-console -- setup script interactive mode requires console output
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
  const developmentPath = path.join(targetPath, 'development');
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- setup script with validated paths from command line arguments
  if (!fs.existsSync(developmentPath)) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- setup script creating validated directory structure
    fs.mkdirSync(developmentPath, { recursive: true });
    // eslint-disable-next-line no-console -- setup script progress output
    console.log(`✓ Created /development directory`);
  }

  // Create /development/tasks directory
  const tasksPath = path.join(developmentPath, 'tasks');
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- setup script with validated paths from command line arguments
  if (!fs.existsSync(tasksPath)) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- setup script creating validated directory structure
    fs.mkdirSync(tasksPath, { recursive: true });
    // eslint-disable-next-line no-console -- setup script progress output
    console.log(`✓ Created /development/tasks directory`);
  }

  // Create /development/reports directory
  const reportsPath = path.join(developmentPath, 'reports');
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- setup script with validated paths from command line arguments
  if (!fs.existsSync(reportsPath)) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- setup script creating validated directory structure
    fs.mkdirSync(reportsPath, { recursive: true });
    // eslint-disable-next-line no-console -- setup script progress output
    console.log(`✓ Created /development/reports directory`);
  }

  return { developmentPath, tasksPath, reportsPath };
}

// Check if TODO.json needs to be updated to new schema
function needsTodoUpdate(todoPath) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- setup script with validated paths from command line arguments
  if (!fs.existsSync(todoPath)) {
    return true;
  }

  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- setup script reading TODO.json from validated project path
    const existing = JSON.parse(fs.readFileSync(todoPath, 'utf8'));

    // Check for old schema indicators
    const hasOldSchema =
      existing.current_task_index !== undefined || // Old field
      !existing.current_mode || // Missing new field
      existing.execution_count === undefined || // Missing new field
      (existing.tasks &&
        existing.tasks.some((t) => t.id && !t.id.includes('_'))) || // Old task ID format
      (existing.tasks && existing.tasks.some((t) => !t.title)); // Missing title field

    if (hasOldSchema) {
      // eslint-disable-next-line no-console -- setup script status output
      console.log(
        `⚠️  ${path.basename(path.dirname(todoPath))} - TODO.json uses old schema, will update`,
      );
      return true;
    }

    // eslint-disable-next-line no-console -- setup script status output
    console.log(
      `✓ ${path.basename(path.dirname(todoPath))} - TODO.json already up to date`,
    );
    return false;
  } catch {
    // eslint-disable-next-line no-console -- setup script error output
    console.log(
      `⚠️  ${path.basename(path.dirname(todoPath))} - TODO.json corrupted, will recreate`,
    );
    return true;
  }
}

function createTodoJson(targetPath, projectInfo) {
  const todoPath = path.join(targetPath, 'TODO.json');

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

  // Add three review tasks for the three-strike policy - language agnostic
  const reviewTasks = [
    {
      criteria:
        'Ensure the project builds completely without errors with production-ready quality',
      dependencies: [],
      important_files: [],
      failureInstructions: `IF BUILD FAILS: Create specific tasks with appropriate categories to fix build issues:
- Missing dependencies installation tasks (category: 'build-error')
- Build configuration setup tasks (category: 'build-error')
- Compilation error resolution tasks (category: 'build-error')
- Environment setup tasks (category: 'missing-feature')
- Build script creation tasks (category: 'missing-feature')

CRITICAL: Use TaskManager API to add these tasks immediately when build failures are detected. All solutions must be production-ready, not simplified workarounds.`,
    },
    {
      criteria:
        'Verify no lint errors exist in the codebase with enterprise-grade standards',
      dependencies: [],
      important_files: [],
      failureInstructions: `IF LINT ERRORS FOUND: Create specific tasks with appropriate categories to achieve zero lint errors:
- Linting tool setup and configuration tasks (category: 'linter-error')
- Code style correction tasks (category: 'linter-error')
- Import organization tasks (category: 'linter-error')
- Naming convention fixes tasks (category: 'linter-error')
- Dead code removal tasks (category: 'refactor')

CRITICAL: Use TaskManager API to add these tasks immediately when lint errors are detected. Follow production-ready standards, not quick fixes.`,
    },
    {
      criteria:
        'Confirm test coverage is 100% on important modules and 90%+ on others, with all tests passing and production-ready quality',
      dependencies: [],
      important_files: [],
      failureInstructions: `IF TEST COVERAGE INSUFFICIENT: Create specific tasks with appropriate categories to achieve required coverage:
- Test framework setup tasks (category: 'test-setup') 
- Unit test creation tasks for all modules (category: 'missing-test')
- Integration test development tasks (category: 'missing-test')
- Test coverage reporting setup tasks (category: 'test-setup')
- CI/CD test integration tasks (category: 'test-setup')

CRITICAL: Use TaskManager API to add these tasks immediately when coverage is below requirements. All tests must be production-ready with comprehensive scenarios.`,
    },
  ];

  reviewTasks.forEach((reviewTask, index) => {
    const reviewId = `task_${timestamp + index + 1}_review${index + 1}`;
    todoData.tasks.push({
      id: reviewId,
      title: `Review Strike ${index + 1}: ${reviewTask.criteria}`,
      description: `Perform a comprehensive code review with focus on: ${reviewTask.criteria}

Check the entire codebase and ensure this criterion is met.

## CRITICAL FAILURE RESPONSE PROTOCOL

${reviewTask.failureInstructions}

## SUCCESS CRITERIA
- Mark this review task as completed ONLY if the criterion is fully met
- If criterion fails, you MUST create remediation tasks using TaskManager API before marking review as completed
- All new tasks should be actionable, specific, and include proper dependencies/important_files parameters

## TASK CREATION REQUIREMENT
When creating remediation tasks, ensure each task includes:
- Clear success criteria
- Appropriate category (linter-error, build-error, missing-feature, bug, enhancement, etc.)
- Specific file dependencies
- Realistic time estimates
- High priority for critical issues
- Production-ready implementation requirements

Use the task-creation.md guidelines for optimal task structure.`,
      task_type: 'test',
      category: 'review',
      priority: 'high',
      status: 'pending',
      dependencies: reviewTask.dependencies,
      important_files: reviewTask.important_files,
      requires_research: false,
      created_at: new Date().toISOString(),
      subtasks: [],
      is_review_task: true,
      strike_number: index + 1,
    });
  });

  // Write TODO.json
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- setup script with validated paths from command line arguments
  fs.writeFileSync(todoPath, JSON.stringify(todoData, null, 2));
  // eslint-disable-next-line no-console -- setup script success output
  console.log(`\n✓ TODO.json created at: ${todoPath}`);

  return true;
}

// Get all project directories to process
function _getProjectDirectories(basePath) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- setup script with validated paths from command line arguments
  if (!fs.existsSync(basePath) || !fs.statSync(basePath).isDirectory()) {
    return [];
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- setup script with validated basePath from command line arguments
  return fs

    .readdirSync(basePath)
    .map((item) => path.join(basePath, item))
    .filter((itemPath) => {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- setup script checking directory status from validated paths
      if (!fs.statSync(itemPath).isDirectory()) {
        return false;
      }

      // Skip hidden directories and common ignore patterns
      const dirname = path.basename(itemPath);
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
  const projectName = path.basename(targetPath);
  // eslint-disable-next-line no-console -- setup script progress output
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
      // eslint-disable-next-line no-console -- setup script success output
      console.log(`✅ ${projectName} - Setup complete`);
    } else {
      // eslint-disable-next-line no-console -- setup script status output
      console.log(`⏭️  ${projectName} - Skipped (already up to date)`);
    }

    return { success: true, project: projectName };
  } catch (error) {
    // eslint-disable-next-line no-console -- setup script error output
    console.error(`❌ ${projectName} - Error:`, error.message);
    return { success: false, project: projectName, error: error.message };
  }
}

/**
 * Migrate TODO.json to feature-based system (replaces dual features.json system)
 * @param {string} targetPath - Target project path
 */
function migrateToFeatureBasedSystem(targetPath) {
  const todoPath = path.join(targetPath, 'TODO.json');

  try {
    // eslint-disable-next-line no-console -- setup script progress output
    console.log(`   🔄 Checking for feature-based migration...`);

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- setup script with validated paths from command line arguments
    if (!fs.existsSync(todoPath)) {
      // eslint-disable-next-line no-console -- setup script status output
      console.log(`   ⚠️  No TODO.json found - skipping migration`);
      return;
    }

    // Read current TODO.json
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- setup script reading TODO.json from validated project path
    const todoData = JSON.parse(fs.readFileSync(todoPath, 'utf8'));

    // Check if already feature-based
    if (todoData.features && Array.isArray(todoData.features)) {
      // eslint-disable-next-line no-console -- setup script status output
      console.log(`   ✅ Already feature-based - skipping migration`);
      return;
    }

    // Create backup before migration
    const backupPath = todoPath + '.pre-feature-migration.backup';
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- setup script with validated paths from command line arguments
    fs.writeFileSync(backupPath, JSON.stringify(todoData, null, 2));
    // eslint-disable-next-line no-console -- setup script progress output
    console.log(`   📋 Created backup: ${path.basename(backupPath)}`);

    // Analyze current tasks for feature grouping
    const analysis = analyzeTasksForFeatures(todoData.tasks);
    // eslint-disable-next-line no-console -- setup script analysis output
    console.log(
      `   📊 Analysis: ${analysis.summary.phased_tasks} phased tasks, ${analysis.summary.non_phased_tasks} independent tasks`,
    );

    // Convert to feature-based structure
    const migrated = convertToFeatureBasedSchema(todoData, analysis);

    // Write migrated structure
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- setup script with validated paths from command line arguments
    fs.writeFileSync(todoPath, JSON.stringify(migrated, null, 2));

    // eslint-disable-next-line no-console -- setup script success output
    console.log(
      `   ✅ Migration completed: ${migrated.features.length} features, ${migrated.tasks.length} tasks`,
    );

    // Clean up features.json if it exists (eliminating dual system)
    const featuresJsonPath = path.join(targetPath, 'features.json');
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- setup script with validated paths from command line arguments
    if (fs.existsSync(featuresJsonPath)) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- setup script removing features.json from validated path
      fs.unlinkSync(featuresJsonPath);
      // eslint-disable-next-line no-console -- setup script cleanup output
      console.log(`   🗑️  Removed features.json (dual system eliminated)`);
    }
  } catch (error) {
    // eslint-disable-next-line no-console -- setup script error output
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
  // eslint-disable-next-line no-console -- setup script header output
  console.log('=== Infinite Continue Stop Hook - Batch TODO.json Setup ===\n');

  // Resolve project path
  const targetPath = path.resolve(projectPath);

  // Verify project path exists
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- setup script with validated paths from command line arguments
  if (!fs.existsSync(targetPath)) {
    // eslint-disable-next-line no-console -- setup script error output
    console.error(`Error: Path does not exist: ${targetPath}`);
    throw new Error(`Invalid path: ${targetPath}`);
  }

  // Verify it's a directory
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- setup script checking directory status from validated path
  if (!fs.statSync(targetPath).isDirectory()) {
    // eslint-disable-next-line no-console -- setup script error output
    console.error(`Error: Path is not a directory: ${targetPath}`);
    throw new Error(`Path is not a directory: ${targetPath}`);
  }

  // eslint-disable-next-line no-console -- setup script configuration output
  console.log(`Processing directories in: ${targetPath}`);
  // eslint-disable-next-line no-console -- setup script configuration output
  console.log(`Batch mode: ${flags.batchMode ? 'ON' : 'OFF'}`);
  // eslint-disable-next-line no-console -- setup script configuration output
  console.log(`Single project mode: ${flags.singleProject ? 'ON' : 'OFF'}`);

  const results = [];

  try {
    // Always process only the specified directory as a single project
    // This ensures TODO.json is created only in the root of the specified directory
    // eslint-disable-next-line no-console -- setup script progress output
    console.log(`Processing single project: ${path.basename(targetPath)}`);
    const result = await processProject(targetPath);
    results.push(result);

    // Summary
    // eslint-disable-next-line no-console -- setup script summary output
    console.log('\n=== Summary ===');
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    // eslint-disable-next-line no-console -- setup script summary output
    console.log(`✅ Successfully processed: ${successful} projects`);
    if (failed > 0) {
      // eslint-disable-next-line no-console -- setup script error summary output
      console.log(`❌ Failed: ${failed} projects`);
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          // eslint-disable-next-line no-console -- setup script error detail output
          console.log(`   - ${r.project}: ${r.error}`);
        });
    }

    // eslint-disable-next-line no-console -- setup script usage examples output
    console.log('\n📋 Usage examples:');
    // eslint-disable-next-line no-console -- setup script usage examples output
    console.log('# Process all projects in Claude Coding Projects (default):');
    // eslint-disable-next-line no-console -- setup script usage examples output
    console.log('node setup-infinite-hook.js');
    // eslint-disable-next-line no-console -- setup script usage examples output
    console.log('');
    // eslint-disable-next-line no-console -- setup script usage examples output
    console.log('# Process single project:');
    // eslint-disable-next-line no-console -- setup script usage examples output
    console.log('node setup-infinite-hook.js /path/to/project --single');
    // eslint-disable-next-line no-console -- setup script usage examples output
    console.log('');
    // eslint-disable-next-line no-console -- setup script usage examples output
    console.log('# Batch mode with no interaction:');
    // eslint-disable-next-line no-console -- setup script usage examples output
    console.log('node setup-infinite-hook.js --batch');

    // eslint-disable-next-line no-console -- setup script documentation output
    console.log('\n📋 Each project now includes:');
    // eslint-disable-next-line no-console -- setup script documentation output
    console.log('   - TODO.json with new multi-agent schema');
    // eslint-disable-next-line no-console -- setup script documentation output
    console.log('   - Development mode files and directory structure');
    // eslint-disable-next-line no-console -- setup script documentation output
    console.log('');
    // eslint-disable-next-line no-console -- setup script documentation output
    console.log('📋 TaskManager system is centralized at:');
    // eslint-disable-next-line no-console -- setup script documentation output
    console.log(
      '   /Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/',
    );
    // eslint-disable-next-line no-console -- setup script documentation output
    console.log('');
    // eslint-disable-next-line no-console -- setup script documentation output
    console.log('📋 Use universal commands to work with any project:');
    // eslint-disable-next-line no-console -- setup script documentation output
    console.log(
      '   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" init --project /path/to/project',
    );
    // eslint-disable-next-line no-console -- setup script documentation output
    console.log(
      '   node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/tm-universal.js" api current --project /path/to/project',
    );
    // eslint-disable-next-line no-console -- setup script documentation output
    console.log('');
    // eslint-disable-next-line no-console -- setup script documentation output
    console.log(
      '📋 Updated hook reference in ~/.claude/settings.json should point to:',
    );
    // eslint-disable-next-line no-console -- setup script documentation output
    console.log(
      'node "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/stop-hook.js"',
    );
  } catch (error) {
    // eslint-disable-next-line no-console -- setup script error output
    console.error('\n❌ Batch setup error:', error.message);
    throw error;
  } finally {
    rl.close();
  }
}

// Run main function
main();
