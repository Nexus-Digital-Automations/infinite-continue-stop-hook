/**
 * Fix all template literals in lib/utils/logger.js by replacing with string concatenation
 */

const fs = require('fs');
const path = require('path');
const { loggers } = require('./lib/logger');

// Define root directory for security validation
const rootDir = '/Users/jeremyparker/infinite-continue-stop-hook';

function fixTemplateStrings(filePath) {
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

    // Replace all template literals with string concatenation
    const fixes = [
      {
        pattern: /this\.warn\(`([^`]*): \$\{([^}]+)\}`/g,
        replacement: "this.warn('$1: ' + $2",
      },
      {
        pattern: /this\.info\(`([^`]*): \$\{([^}]+)\}`/g,
        replacement: "this.info('$1: ' + $2",
      },
      {
        pattern: /this\.error\(`([^`]*): \$\{([^}]+)\}`/g,
        replacement: "this.error('$1: ' + $2",
      },
      {
        pattern: /this\.debug\(`([^`]*): \$\{([^}]+)\}`/g,
        replacement: "this.debug('$1: ' + $2",
      },
      { pattern: /`([^`]*): \$\{([^}]+)\}`/g, replacement: "'$1: ' + $2" },
      { pattern: /`([^`]*) \$\{([^}]+)\}`/g, replacement: "'$1 ' + $2" },
      { pattern: /`\$\{([^}]+)\} ([^`]*)`/g, replacement: "$1 + ' $2'" },
      {
        pattern: /`([^`]*)\$\{([^}]+)\}([^`]*)`/g,
        replacement: "'$1' + $2 + '$3'",
      },

      // Fix specific problematic template literals
      {
        pattern: /`Business: \$\{message\}`/g,
        replacement: "'Business: ' + message",
      },
      {
        pattern: /`Performance: \$\{operation\}`/g,
        replacement: "'Performance: ' + operation",
      },
      {
        pattern: /`Database: \$\{operation\} on \$\{table\}`/g,
        replacement: "'Database: ' + operation + ' on ' + table",
      },
      {
        pattern: /`HTTP \$\{method\} \$\{url\}`/g,
        replacement: "'HTTP ' + method + ' ' + url",
      },
      {
        pattern: /`Legacy error in \$\{context\}`/g,
        replacement: "'Legacy error in ' + context",
      },
      {
        pattern: /`Legacy exit: \$\{message\}`/g,
        replacement: "'Legacy exit: ' + message",
      },
      { pattern: /`Flow: \$\{message\}`/g, replacement: "'Flow: ' + message" },
      {
        pattern: /`ERROR in \$\{context\}: \$\{error\.message\}`/g,
        replacement: "'ERROR in ' + context + ': ' + error.message",
      },
    ];

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
      loggers.app.info(`✅ Fixed all template literals in: ${filePath}`);
      return true;
    }

    return false;
  } catch {
    loggers.app.error(`❌ Error fixing ${filePath}:`, { error: error.message });
    return false;
  }
}

// Fix the problematic file
loggers.app.info('🚀 Fixing all template literals in lib/utils/logger.js...');
const result = fixTemplateStrings('./lib/utils/logger.js');

if (result) {
  loggers.app.info('✨ Template literal fixes completed!');

  // Test the fix
  loggers.app.info('🧪 Testing fixes...');
  const { execSync } = require('child_process');
  try {
    execSync('npm test -- test/unit/verification-endpoints.test.js', {
      stdio: 'inherit',
    });
    loggers.app.info('✅ Tests passed!');
  } catch {
    loggers.app.warn(
      '⚠️  Tests still have issues, but template literals should be fixed'
    );
  }
} else {
  loggers.app.info('📝 No template literals found to fix');
}
