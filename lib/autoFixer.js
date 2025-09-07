/**
 * Simplified Auto-Fix Engine
 *
 * Basic error detection and file validation without complex dependencies
 */

const fs = require('fs');
const path = require('path');
const Logger = require('./logger');

class AutoFixer {
  constructor(options = {}) {
    this.options = {
      enabledChecks: ['syntax', 'structure'],
      autoFixMode: false,
      backupPath: './backups',
      maxBackups: 5,
      ...options,
    };

    this.logger = new Logger(process.cwd());

    // Simple validator and recovery objects
    this.validator = {
      validateAndSanitize: (data, filePath) => {
        try {
          // Basic JSON structure validation
          if (!data || typeof data !== 'object') {
            return {
              isValid: false,
              errors: ['Invalid data structure'],
              sanitizedData: { tasks: [], features: [], agents: {} },
            };
          }

          // Ensure required properties exist
          const sanitizedData = {
            tasks: Array.isArray(data.tasks) ? data.tasks : [],
            features: Array.isArray(data.features) ? data.features : [],
            agents: data.agents && typeof data.agents === 'object' ? data.agents : {},
            settings: data.settings && typeof data.settings === 'object' ? data.settings : {},
          };

          return {
            isValid: true,
            errors: [],
            sanitizedData,
          };
        } catch (error) {
          return {
            isValid: false,
            errors: [error.message],
            sanitizedData: { tasks: [], features: [], agents: {} },
          };
        }
      },
    };

    this.recovery = {
      atomicWrite: async (filePath, data) => {
        try {
          const tempPath = filePath + '.tmp';

          // CRITICAL PREVENTION: Ensure we're writing proper JSON, not double-encoded
          let jsonContent;
          if (typeof data === 'string') {
            // If already a string, validate it's proper JSON and not double-encoded
            try {
              const parsed = JSON.parse(data);
              if (typeof parsed === 'string') {
                // This is double-encoded! Fix it
                console.warn(`🚨 PREVENTED JSON CORRUPTION: Double-encoded string detected in ${filePath}`);
                jsonContent = parsed.replace(/\\n/g, '\n'); // Unescape if needed
              } else {
                // Properly formatted JSON string
                jsonContent = data;
              }
            } catch (parseError) {
              // Invalid JSON string - treat as raw string data
              console.warn(`🚨 PREVENTED JSON CORRUPTION: Invalid JSON string in ${filePath}`);
              return { success: false, error: `Invalid JSON string provided: ${parseError.message}` };
            }
          } else {
            // Data is an object - stringify it
            jsonContent = JSON.stringify(data, null, 2);
          }

          // Additional validation: ensure the content doesn't start and end with quotes (double-encoded)
          if (jsonContent.startsWith('"') && jsonContent.endsWith('"')) {
            try {
              // This might be double-encoded - attempt to parse and fix
              const parsed = JSON.parse(jsonContent);
              if (typeof parsed === 'string') {
                console.warn(`🚨 PREVENTED JSON CORRUPTION: Double-quoted content detected in ${filePath}`);
                jsonContent = parsed.replace(/\\n/g, '\n');
              }
            } catch (e) {
              // Ignore - might be legitimate quoted content
            }
          }

          // Final validation: ensure we can parse the result
          try {
            JSON.parse(jsonContent);
          } catch (finalParseError) {
            console.error(`🚨 PREVENTED JSON CORRUPTION: Final validation failed for ${filePath}`);
            return { success: false, error: `Final JSON validation failed: ${finalParseError.message}` };
          }

          await fs.promises.writeFile(tempPath, jsonContent);
          await fs.promises.rename(tempPath, filePath);
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      listAvailableBackups: async (filePath) => {
        return []; // No backup system in simplified version
      },

      restoreFromBackup: async (filePath, backupFile) => {
        return { success: false, error: 'Backup system not implemented in simplified version' };
      },

      createBackup: async (filePath) => {
        return { success: false, error: 'Backup system not implemented in simplified version' };
      },

      cleanupLegacyBackups: async (filePath) => {
        return { success: true, cleaned: 0 };
      },
    };
  }

  async getFileStatus(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return {
          exists: false,
          readable: false,
          writable: false,
          size: 0,
          lastModified: null,
          issues: ['File does not exist'],
        };
      }

      const stats = await fs.promises.stat(filePath);
      const content = await fs.promises.readFile(filePath, 'utf8');

      // Try to parse JSON
      let parseError = null;
      try {
        JSON.parse(content);
      } catch (error) {
        parseError = error.message;
      }

      return {
        exists: true,
        readable: true,
        writable: true,
        size: stats.size,
        lastModified: stats.mtime,
        issues: parseError ? [`JSON parse error: ${parseError}`] : [],
      };
    } catch (error) {
      return {
        exists: false,
        readable: false,
        writable: false,
        size: 0,
        lastModified: null,
        issues: [error.message],
      };
    }
  }

  async autoFix(filePath, options = {}) {
    try {
      const status = await this.getFileStatus(filePath);

      if (!status.exists) {
        // Create minimal TODO.json structure
        const defaultData = {
          tasks: [],
          features: [],
          agents: {},
          settings: {
            version: '1.0.0',
            created: new Date().toISOString(),
          },
        };

        const writeResult = await this.recovery.atomicWrite(filePath, defaultData);
        return {
          fixed: writeResult.success,
          issues: status.issues,
          fixesApplied: writeResult.success ? ['Created default TODO.json structure'] : [],
        };
      }

      if (status.issues.length === 0) {
        return {
          fixed: true,
          issues: [],
          fixesApplied: [],
        };
      }

      // For parse errors, attempt basic fixes
      if (status.issues.some(issue => issue.includes('JSON parse error'))) {
        try {
          const content = await fs.promises.readFile(filePath, 'utf8');
          let fixed = content;
          const fixesApplied = [];

          // CRITICAL FIX: Handle escaped JSON string (the main corruption issue)
          if (content.startsWith('"') && content.endsWith('"')) {
            // File is wrapped in quotes - parse and unescape
            try {
              const parsedString = JSON.parse(content);
              fixed = parsedString.replace(/\\n/g, '\n');
              fixesApplied.push('Fixed escaped JSON string corruption');
            } catch (parseError) {
              // Fallback for malformed escaped string
              fixed = content
                .slice(1, -1) // Remove outer quotes
                .replace(/\\"/g, '"') // Unescape quotes
                .replace(/\\n/g, '\n') // Unescape newlines
                .replace(/\\\\/g, '\\'); // Unescape backslashes
              fixesApplied.push('Fixed malformed escaped JSON string');
            }
          }

          // Additional standard JSON fixes
          fixed = fixed
            .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
            .replace(/([^\\])'([^']*[^\\]?)'/g, '$1"$2"'); // Replace single quotes with double quotes

          if (fixesApplied.length === 0) {
            fixesApplied.push('Fixed JSON syntax errors');
          }

          // Validate the fixed JSON
          JSON.parse(fixed);

          // Create backup before fixing
          const backupPath = filePath + '.backup';
          await fs.promises.writeFile(backupPath, content);

          // Write the fixed content
          await fs.promises.writeFile(filePath, fixed);

          return {
            fixed: true,
            issues: status.issues,
            fixesApplied: fixesApplied,
          };
        } catch (error) {
          return {
            fixed: false,
            issues: status.issues.concat([`Fix attempt failed: ${error.message}`]),
            fixesApplied: [],
          };
        }
      }

      return {
        fixed: false,
        issues: status.issues,
        fixesApplied: [],
      };
    } catch (error) {
      return {
        fixed: false,
        issues: [error.message],
        fixesApplied: [],
      };
    }
  }

  async dryRun(filePath) {
    const status = await this.getFileStatus(filePath);
    return {
      wouldFix: status.issues.length > 0,
      issues: status.issues,
      potentialFixes: status.issues.length > 0 ? ['Basic JSON structure validation and repair'] : [],
    };
  }

  async recoverCorruptedFile(filePath) {
    try {
      // Simple recovery: try to create a minimal valid structure
      const defaultData = {
        tasks: [],
        features: [],
        agents: {},
        settings: {
          version: '1.0.0',
          recovered: new Date().toISOString(),
          recovery_reason: 'File corruption detected',
        },
      };

      const writeResult = await this.recovery.atomicWrite(filePath, defaultData);
      return {
        recovered: writeResult.success,
        method: 'default_structure',
        dataLoss: true,
      };
    } catch (error) {
      return {
        recovered: false,
        error: error.message,
        dataLoss: true,
      };
    }
  }
}

module.exports = AutoFixer;
