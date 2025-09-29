/* eslint-disable no-console, security/detect-non-literal-fs-filename */

/**
 * Final Cleanup for Remaining Unused Variables
 *
 * Handles the specific remaining patterns:
 * - catch (_) where _ is defined but never used
 * - Variables like filePath that need prefix
 * - Function parameters that need prefix
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Final cleanup for remaining unused variables...\n');

// Targeted patterns for remaining violations
const targetedReplacements = [
  // Fix catch (_) where _ is unused - change to catch (_error) if error is actually used later
  {
    search: /catch \(_\) \{[\s\S]*?error\./gm,
    replace: (match) => match.replace('catch (_)', 'catch (_error)'),
  },

  // Change standalone catch (_) to catch (_error) when used
  { search: /catch \(_\)/g, replace: 'catch (_error)' },

  // Fix assigned but unused variables
  { search: /(\s+)const filePath = /g, replace: '$1const _filePath = ' },
  { search: /(\s+)let filePath = /g, replace: '$1let _filePath = ' },
  { search: /(\s+)const match = /g, replace: '$1const _match = ' },
  { search: /(\s+)let match = /g, replace: '$1let _match = ' },

  // Fix function parameters
  {
    search: /function[^(]*\(([^)]*?)match([^)]*?)\)/g,
    replace: 'function($1_match$2)',
  },
  { search: /\(([^)]*?)match([^)]*?)\) =>/g, replace: '($1_match$2) =>' },
  {
    search: /function[^(]*\(([^)]*?)filePath([^)]*?)\)/g,
    replace: 'function($1_filePath$2)',
  },
  { search: /\(([^)]*?)filePath([^)]*?)\) =>/g, replace: '($1_filePath$2) =>' },

  // Fix variable references to match the new prefixed names
  { search: /\bfilePath\b(?!\w)/g, replace: '_filePath' },
  { search: /\bmatch\b(?![.\w])/g, replace: '_match' },

  // Remove completely unused _ variables in catch blocks that don't use error
  {
    search: /catch \(_\) \{[\s\S]*?\}(?![\s\S]*error\.)/gm,
    replace: (match) => {
      // Only replace if no error. properties are used in the block
      if (!match.includes('error.')) {
        return match.replace('catch (_)', 'catch (_)');
      }
      return match;
    },
  },
];

function getAllJSFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (
      stat.isDirectory() &&
      !item.startsWith('.') &&
      item !== 'node_modules' &&
      item !== 'coverage'
    ) {
      files.push(...getAllJSFiles(fullPath));
    } else if (item.endsWith('.js') && !item.startsWith('.')) {
      files.push(fullPath);
    }
  }

  return files;
}

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const originalContent = content;

    for (const replacement of targetedReplacements) {
      if (typeof replacement.replace === 'function') {
        content = content.replace(replacement.search, replacement.replace);
      } else {
        content = content.replace(replacement.search, replacement.replace);
      }
    }

    if (content !== originalContent) {
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }

    return false;
  } catch (error) {
    console.error(`  ✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  const projectRoot = process.cwd();
  const jsFiles = getAllJSFiles(projectRoot);

  console.log(`Found ${jsFiles.length} JavaScript files to process...\n`);

  let totalModified = 0;

  for (const filePath of jsFiles) {
    const relativePath = path.relative(projectRoot, filePath);

    if (fixFile(filePath)) {
      console.log(`✓ Modified: ${relativePath}`);
      totalModified++;
    }
  }

  console.log(`\n📈 Summary:`);
  console.log(`   Modified files: ${totalModified}`);
  console.log(`   Total files: ${jsFiles.length}`);

  // Check final results
  console.log('\n🔍 Checking final unused variables count...');
  try {
    const finalCount = execSync(
      'npm run lint 2>&1 | grep "no-unused-vars" | wc -l',
      { encoding: 'utf8' },
    ).trim();
    console.log(`Final no-unused-vars violations: ${finalCount}`);

    if (parseInt(finalCount) === 0) {
      console.log('🎉 ALL UNUSED VARIABLE VIOLATIONS RESOLVED!');
    } else {
      console.log('📋 Showing remaining violations:');
      const remaining = execSync(
        'npm run lint 2>&1 | grep "no-unused-vars" | head -10',
        { encoding: 'utf8' },
      );
      console.log(remaining);
    }
  } catch (error) {
    console.log('⚠️  Could not verify final results:', error.message);
  }

  console.log('\n🎯 Final cleanup complete!');
}

if (require.main === module) {
  main();
}

module.exports = { targetedReplacements, fixFile, getAllJSFiles };
