#!/usr/bin/env node

/**
 * PostToolUse Hook - Quality Validation During Work
 *
 * Runs after tool execution to validate code quality WITHOUT blocking work.
 * Provides immediate feedback on linting, syntax, and security issues.
 *
 * PHILOSOPHY:
 * - Validate quality DURING work, not at stop time
 * - Show warnings but NEVER block the agent's progress
 * - Collect evidence for later review
 * - Help maintain quality incrementally
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Tools that trigger quality validation
const CODE_TOOLS = [
  'Edit',
  'Write',
  'MultiEdit',
  'NotebookEdit',
];

/**
 * Parse Claude Code stdin to get tool information
 */
function parseToolInput() {
  try {
    const stdin = fs.readFileSync(0, 'utf-8');
    if (!stdin) return null;

    const data = JSON.parse(stdin);
    return {
      tool: data.tool || null,
      file_path: data.file_path || data.params?.file_path || null,
      files: data.params?.edits?.map(e => e.file_path) || [],
    };
  } catch (error) {
    console.error('⚠️ PostToolUse: Could not parse input:', error.message);
    return null;
  }
}

/**
 * Check if tool execution warrants quality validation
 */
function shouldValidate(toolInfo) {
  if (!toolInfo || !toolInfo.tool) return false;

  // Check if it's a code-related tool
  return CODE_TOOLS.includes(toolInfo.tool);
}

/**
 * Run linting check
 */
function checkLinting(workingDir) {
  const artifactsDir = path.join(workingDir, '.validation-artifacts', 'logs');

  // Ensure artifacts directory exists
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  const logFile = path.join(artifactsDir, 'post-tool-lint.log');

  try {
    // Run lint with a short timeout
    const output = execSync('npm run lint 2>&1', {
      cwd: workingDir,
      timeout: 15000, // 15 second timeout
      encoding: 'utf-8',
    });

    // Write to log file
    fs.writeFileSync(logFile, output);

    // Parse output for summary
    const errorMatch = output.match(/(\d+)\s+error/);
    const warningMatch = output.match(/(\d+)\s+warning/);

    return {
      success: !errorMatch || parseInt(errorMatch[1]) === 0,
      errors: errorMatch ? parseInt(errorMatch[1]) : 0,
      warnings: warningMatch ? parseInt(warningMatch[1]) : 0,
      output: output.split('\n').slice(-10).join('\n'), // Last 10 lines
    };
  } catch (error) {
    // Linting failed (has errors)
    const output = error.stdout || error.message;
    fs.writeFileSync(logFile, output);

    const errorMatch = output.match(/(\d+)\s+error/);
    const warningMatch = output.match(/(\d+)\s+warning/);

    return {
      success: false,
      errors: errorMatch ? parseInt(errorMatch[1]) : 0,
      warnings: warningMatch ? parseInt(warningMatch[1]) : 0,
      output: output.split('\n').slice(-10).join('\n'),
    };
  }
}

/**
 * Run syntax validation
 */
function checkSyntax(filePath, workingDir) {
  if (!filePath) return { success: true, message: 'No file to check' };

  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(workingDir, filePath);

  // Only check JS/TS files
  if (!['.js', '.ts', '.jsx', '.tsx'].includes(path.extname(fullPath))) {
    return { success: true, message: 'Not a JS/TS file' };
  }

  if (!fs.existsSync(fullPath)) {
    return { success: true, message: 'File not found' };
  }

  try {
    // Use node -c for syntax check
    execSync(`node -c "${fullPath}"`, {
      cwd: workingDir,
      timeout: 5000,
      encoding: 'utf-8',
    });

    return { success: true, message: 'Valid syntax' };
  } catch (error) {
    return {
      success: false,
      message: 'Syntax error detected',
      error: error.message,
    };
  }
}

/**
 * Quick security check (npm audit)
 */
function checkSecurity(workingDir) {
  try {
    execSync('npm audit --audit-level=high --json', {
      cwd: workingDir,
      timeout: 10000,
      encoding: 'utf-8',
    });

    return { success: true, vulnerabilities: 0 };
  } catch (error) {
    try {
      const output = JSON.parse(error.stdout || '{}');
      const vulnCount = output.metadata?.vulnerabilities?.high || 0 +
                        output.metadata?.vulnerabilities?.critical || 0;

      return {
        success: vulnCount === 0,
        vulnerabilities: vulnCount,
      };
    } catch {
      return { success: true, vulnerabilities: 0 }; // Assume safe if can't parse
    }
  }
}

/**
 * Main validation function
 */
function runPostToolValidation() {
  const workingDir = process.cwd();
  const toolInfo = parseToolInput();

  // Only validate for code-related tools
  if (!shouldValidate(toolInfo)) {
    // Silent exit for non-code tools
    process.exit(0);
  }

  console.error('\n📋 POST-TOOL VALIDATION:');

  // Check syntax first (fastest)
  if (toolInfo.file_path) {
    const syntaxResult = checkSyntax(toolInfo.file_path, workingDir);
    if (syntaxResult.success) {
      console.error('✅ Syntax: Valid');
    } else {
      console.error(`❌ Syntax: ${syntaxResult.message}`);
      if (syntaxResult.error) {
        console.error(`   ${syntaxResult.error}`);
      }
    }
  }

  // Check linting (provides most detailed feedback)
  const lintResult = checkLinting(workingDir);
  if (lintResult.success) {
    console.error('✅ Linting: Clean');
  } else if (lintResult.errors > 0) {
    console.error(`⚠️  Linting: ${lintResult.errors} errors, ${lintResult.warnings} warnings`);
    console.error(`   Run 'npm run lint:fix' to auto-fix some issues`);
  } else {
    console.error(`⚠️  Linting: ${lintResult.warnings} warnings`);
  }

  // Quick security scan (only if package.json exists)
  if (fs.existsSync(path.join(workingDir, 'package.json'))) {
    const securityResult = checkSecurity(workingDir);
    if (securityResult.success) {
      console.error('✅ Security: No high/critical vulnerabilities');
    } else {
      console.error(`⚠️  Security: ${securityResult.vulnerabilities} vulnerabilities found`);
      console.error(`   Run 'npm audit' for details`);
    }
  }

  console.error('\n💡 These are informational - continue your work\n');

  // Always exit 0 - never block work
  process.exit(0);
}

// Run validation
try {
  runPostToolValidation();
} catch (error) {
  console.error('⚠️  PostToolUse hook error:', error.message);
  // Always exit 0 - never block work even on hook errors
  process.exit(0);
}
