const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Test the findClaudeProjectRoot function in various scenarios
function testFindFunction() {
  console.log("=== TESTING findClaudeProjectRoot FUNCTION ===");
  
  // Copy the function from stop-hook.js
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

  // Test scenarios
  const testCases = [
    {
      name: "Current project root",
      path: "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook"
    },
    {
      name: "Demo subdirectory", 
      path: "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/demo"
    },
    {
      name: "Deep subdirectory",
      path: "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/development/reports"
    },
    {
      name: "Outside Claude Coding Projects",
      path: "/Users/jeremyparker/Desktop"
    },
    {
      name: "Root directory (edge case)",
      path: "/"
    }
  ];

  testCases.forEach(testCase => {
    console.log(`\nTest: ${testCase.name}`);
    console.log(`Input path: ${testCase.path}`);
    
    try {
      const result = findClaudeProjectRoot(testCase.path);
      console.log(`Result: ${result}`);
      
      const todoPath = path.join(result, "TODO.json");
      const exists = fs.existsSync(todoPath);
      console.log(`TODO.json exists at result path: ${exists}`);
      
      if (exists) {
        console.log(`✅ SUCCESS: Found TODO.json at ${todoPath}`);
      } else {
        console.log(`❌ ISSUE: No TODO.json at ${todoPath}`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
  });
}

testFindFunction();