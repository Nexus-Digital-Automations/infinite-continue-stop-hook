/**
 * Comprehensive fix for all unused error and template literal issues
 */

const fs = require('fs');
const path = require('path');
const { loggers } = require('./lib/logger');

// Define root directory for security validation
const rootDir = '/Users/jeremyparker/infinite-continue-stop-hook';

const fixes = [
  // Fix unused errors - prefix with underscore
  { pattern: /catch \(error\)/g, replacement: 'catch (_error)' },
  { pattern: /catch\(error\)/g, replacement: 'catch(_error)' },
  { pattern: /\}\s*catch\s*\(\s*error\s*\)/g, replacement: '} catch (_error)' },

  // Fix template literal issues
  { pattern: /`([^`]*)\$\{([^}]*)\s*`/g, replacement: '`$1${$2}`' },
  {
    pattern: /details:\s*`([^`]*)\$\{([^}]*)\s*-/g,
    replacement: 'details: `$1${$2} -',
  },

  // Fix specific template literal patterns that might be malformed
  {
    pattern:
      /`Linting configuration found \(\$\{config\}\) - assuming linting would pass with proper setup`/g,
    replacement:
      '`Linting configuration found (${config}) - assuming linting would pass with proper setup`',
  },

  // Fix unused variables - prefix with underscore
  { pattern: /\(\s*error\s*,/g, replacement: '(_error,' },
  {
    pattern: /function[^(]*\([^)]*error[^)]*\)/g,
    replacement: (match) => match.replace(/\berror\b/g, '_error'),
  },
];

function fixFile(filePath) {
  // Security: Validate file path to prevent directory traversal
  const normalizedPath = path.normalize(filePath);
  if (normalizedPath.includes('..') || !normalizedPath.startsWith(rootDir)) {
    loggers.app.warn(
      `Security: Rejected potentially unsafe file path: ${filePath}`
    );
    return false;
  }

  try {
    // Justification: File path is validated above to ensure it's within project directory
    let content = fs.readFileSync(normalizedPath, 'utf8');
    let modified = false;

    fixes.forEach((fix) => {
      const originalContent = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (content !== originalContent) {
        modified = true;
        loggers.app.info(`Applied fix: ${fix.pattern}`);
      }
    });

    if (modified) {
      // Justification: File path is validated above to ensure it's within project directory
      fs.writeFileSync(normalizedPath, content, 'utf8');
      loggers.app.info(`✅ Fixed: ${filePath}`);
      return true;
    }

    return false;
  } catch {
    loggers.app.error(`❌ Error fixing ${filePath}:`, { error: error.message });
    return false;
  }
}

// Fix the main taskmanager-api.js file
loggers.app.info(
  '🚀 Starting comprehensive error and template literal fixes...'
);
const result = fixFile('./taskmanager-api.js');

if (result) {
  loggers.app.info('✨ Comprehensive fixes completed!');
} else {
  loggers.app.info('📝 No fixes needed');
}
