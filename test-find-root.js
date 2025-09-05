const path = require("path");
const fs = require("fs");

function findClaudeProjectRoot(startDir = process.cwd()) {
  let currentDir = startDir;

  // Look for "Claude Coding Projects" in the path and check for TODO.json
  while (currentDir !== path.dirname(currentDir)) {
    // Not at filesystem root
    // Check if we're in or found "Claude Coding Projects"
    if (currentDir.includes("Claude Coding Projects")) {
      // Look for TODO.json in potential project roots
      const segments = currentDir.split(path.sep);
      const claudeIndex = segments.findIndex((segment) =>
        segment.includes("Claude Coding Projects"),
      );

      if (claudeIndex !== -1 && claudeIndex < segments.length - 1) {
        // Try the next directory after "Claude Coding Projects"
        const projectDir = segments.slice(0, claudeIndex + 2).join(path.sep);
        if (fs.existsSync(path.join(projectDir, "TODO.json"))) {
          return projectDir;
        }
      }

      // Also check current directory
      if (fs.existsSync(path.join(currentDir, "TODO.json"))) {
        return currentDir;
      }
    }

    currentDir = path.dirname(currentDir);
  }

  // Fallback to original behavior
  return startDir;
}

const workingDir = findClaudeProjectRoot();
console.log("Working directory:", workingDir);
console.log("TODO.json path:", path.join(workingDir, "TODO.json"));
console.log("TODO.json exists:", fs.existsSync(path.join(workingDir, "TODO.json")));
console.log("Current working directory:", process.cwd());