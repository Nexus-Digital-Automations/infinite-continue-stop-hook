#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const FILES_TO_FIX = [
  '/Users/jeremyparker/infinite-continue-stop-hook/lib/api-modules/core/taskOperations.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/lib/api-modules/rag/adaptiveLearningPaths.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/lib/api-modules/rag/lessonDeprecation.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/lib/api-modules/rag/lessonQualityScoring.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/lib/api-modules/rag/ragOperations.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/lib/api-modules/success-criteria/templateManager.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/lib/database/setup.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/lib/test/comprehensive-validation-test.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/lib/trend-analyzer.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/lib/validation-audit-trail-manager.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/migration-script.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/scripts/coverage-monitor.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/scripts/jest-cicd-reporter.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/temp-fix-scripts/final-audit-fix.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/temp-fix-scripts/final-systematic-result-fix.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/temp-fix-scripts/fix-all-catch-blocks.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/temp-fix-scripts/fix-catch-blocks.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/temp-fix-scripts/fix-taskmanager-catch-blocks.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/test-audit-override-fix.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/test/e2e/e2e-utils.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/test/integration/feature-7-taskmanager-integration.test.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/test/integration/feature-8-performance-metrics-integration.test.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/test/integration/file-operations.test.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/test/rag-system/setup/test-setup.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/test/success-criteria-regression.test.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/test/success-criteria-validation.test.js',
  '/Users/jeremyparker/infinite-continue-stop-hook/test/unit/feature-8-performance-metrics.test.js',
];

async function fixFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    const originalContent = content;
    let fixCount = 0;

    // Pattern 1: } catch { followed by _error usage - add (_error) parameter
    // This is the most common pattern
    const lines = content.split('\n');
    const newLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if this line has "} catch {" without parameter
      if (line.match(/}\s*catch\s*{\s*$/)) {
        // Look ahead to see if _error is used in the catch block
        let usesError = false;
        let blockDepth = 1;

        for (let j = i + 1; j < lines.length && blockDepth > 0; j++) {
          const checkLine = lines[j];

          // Count braces to track block depth
          blockDepth += (checkLine.match(/{/g) || []).length;
          blockDepth -= (checkLine.match(/}/g) || []).length;

          // Check if _error is used
          if (checkLine.includes('_error')) {
            usesError = true;
            break;
          }
        }

        if (usesError) {
          // Replace } catch { with } catch (_error) {
          newLines.push(line.replace(/}\s*catch\s*{\s*$/, '} catch (_error) {'));
          fixCount++;
        } else {
          newLines.push(line);
        }
      } else {
        newLines.push(line);
      }
    }

    content = newLines.join('\n');

    if (fixCount > 0) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✓ Fixed ${fixCount} _error issues in ${path.basename(filePath)}`);
      return fixCount;
    } else {
      console.log(`- No _error issues found in ${path.basename(filePath)}`);
      return 0;
    }
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
    return 0;
  }
}

async function main() {
  console.log('Starting systematic _error undefined fix...\n');

  let totalFixed = 0;
  let filesFixed = 0;

  for (const filePath of FILES_TO_FIX) {
    const fixCount = await fixFile(filePath);
    if (fixCount > 0) {
      totalFixed += fixCount;
      filesFixed++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Fixed ${totalFixed} _error issues in ${filesFixed} files`);
  console.log(`========================================`);
}

main().catch(console.error);