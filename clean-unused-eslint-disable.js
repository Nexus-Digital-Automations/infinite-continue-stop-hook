/* eslint-disable no-console, security/detect-non-literal-fs-filename, security/detect-object-injection */

/**
 * Clean up unused eslint-disable directives
 */

const fs = require('fs');
const { execSync } = require('child_process');

function getUnusedDirectives() {
  let output;
  try {
    output = execSync('npm run lint 2>&1', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  } catch (error) {
    output = error.stdout || error.output?.join('') || '';
  }

  const lines = output.split('\n');
  const unusedDirectives = new Map();

  let currentFile = '';
  for (const line of lines) {
    if (line.startsWith('/Users/') && line.endsWith('.js')) {
      currentFile = line.trim();
      if (!unusedDirectives.has(currentFile)) {
        unusedDirectives.set(currentFile, []);
      }
    } else if (currentFile && line.includes('Unused eslint-disable directive')) {
      const match = line.match(/^\s+(\d+):(\d+)\s+warning\s+Unused eslint-disable directive/);
      if (match) {
        const lineNum = parseInt(match[1]);
        unusedDirectives.get(currentFile).push(lineNum);
      }
    }
  }

  // Filter out files with no unused directives
  for (const [file, lines] of unusedDirectives.entries()) {
    if (lines.length === 0) {
      unusedDirectives.delete(file);
    }
  }

  return unusedDirectives;
}

function removeUnusedDirectives(filePath, lineNumbers) {
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping non-existent file: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Sort line numbers in descending order to avoid offset issues
  const sortedLines = [...lineNumbers].sort((a, b) => b - a);

  let modified = false;

  for (const lineNum of sortedLines) {
    const lineIndex = lineNum - 1;

    if (lineIndex < 0 || lineIndex >= lines.length) {
      continue;
    }

    const line = lines[lineIndex];

    // Check if this line is an eslint-disable comment
    if (line.includes('eslint-disable') && line.includes('security/')) {
      // Remove the line
      lines.splice(lineIndex, 1);
      modified = true;
      console.log(`Removed unused directive at ${filePath}:${lineNum}`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log(`Modified: ${filePath}`);
  }
}

function main() {
  console.log('Cleaning up unused eslint-disable directives...\n');

  const unusedDirectives = getUnusedDirectives();

  console.log(`Found ${unusedDirectives.size} files with unused directives\n`);

  let totalCleaned = 0;
  for (const [filePath, lineNumbers] of unusedDirectives) {
    // Skip node_modules, coverage, and backup files
    if (filePath.includes('node_modules') ||
        filePath.includes('coverage') ||
        filePath.includes('.backup') ||
        filePath.includes('.claude-backups')) {
      continue;
    }

    console.log(`\nProcessing: ${filePath}`);
    console.log(`  ${lineNumbers.length} unused directives found`);

    totalCleaned += lineNumbers.length;
    removeUnusedDirectives(filePath, lineNumbers);
  }

  console.log(`\n\nTotal unused directives cleaned: ${totalCleaned}`);
  console.log('\nRunning linter to verify...');

  try {
    execSync('npm run lint 2>&1 | grep "Unused eslint-disable.*security" | wc -l', {
      encoding: 'utf8',
      stdio: 'inherit',
    });
  } catch {
    // Ignore linter errors
  }

  console.log('\nCleanup complete!');
}

main();
