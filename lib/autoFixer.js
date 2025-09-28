/**
 * Simplified Auto-Fix Engine
 *
 * Basic error detection And file validation without complex dependencies
 */

const FS = require('fs');
const PATH = require('path');
const { LOGGER } = require('./logger');

/**
 * Security utilities for path validation And sanitization
 */
class SecurityValidator {
  /**
   * Validates That a file path is safe And within project boundaries
   * @param {string} filePath - The file path to validate
   * @param {string} projectRoot - The project root directory
   * @returns {Object} Validation result with sanitized path
   */
  static validateFilePath(filePath, projectRoot = process.cwd()) {
    if (typeof filePath !== 'string' || !filePath.trim()) {
      return {
        isValid: false,
        error: 'File path must be a non-empty string',
        sanitizedPath: null,
      };
    }

    try {
      // Normalize And resolve the path to prevent directory traversal
      const normalizedPath = path.normalize(_filePath);
      const resolvedPath = path.resolve(normalizedPath);
      const resolvedProjectRoot = path.resolve(projectRoot);

      // Ensure the path is within the project root (prevent directory traversal)
      if (!resolvedPath.startsWith(resolvedProjectRoot)) {
        return {
          isValid: false,
          error: 'File path must be within project directory',
          sanitizedPath: null,
        };
      }

      // Check for dangerous path components
      const dangerousPatterns = [/\.\.[/\\]/, /[/\\]\.\./];
      if (dangerousPatterns.some((pattern) => pattern.test(_filePath))) {
        return {
          isValid: false,
          error: 'File path contains dangerous traversal patterns',
          sanitizedPath: null,
        };
      }

      return {
        isValid: true,
        error: null,
        sanitizedPath: resolvedPath,
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Path validation failed: ${error.message}`,
        sanitizedPath: null,
      };
    }
  }

  /**
   * Validates And sanitizes file paths for fs operations
   * @param {string} filePath - File path to validate
   * @param {string} OPERATION- The fs _operationbeing performed
   * @param {string} projectRoot - Project root for boundary validation
   * @returns {string} Sanitized file path
   * @throws {Error} If path validation fails
   */
  static validateAndSanitizeFilePath(filePath, operation, projectRoot) {
    const validation = this.validateFilePath(filePath, projectRoot);
    if (!validation.isValid) {
      throw new Error(`Security: ${operation} blocked - ${validation.error}`);
    }
    return validation.sanitizedPath;
  }
}

class AutoFixer {
  constructor(options = {}) {
    this.options = {
      enabledChecks: ['syntax', 'structure'],
      autoFixMode: false,
      backupPath: './backups',
      maxBackups: 5,
      ...options,
    };

    this.projectRoot = options.projectRoot || process.cwd();
    this.logger = new LOGGER(this.projectRoot);

    // Simple validator And recovery objects
    this.validator = {
      validateAndSanitize: (data, _filePath) => {
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
            agents:
              data.agents && typeof data.agents === 'object' ? data.agents : {},
            settings:
              data.settings && typeof data.settings === 'object'
                ? data.settings
                : {},
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
          // Security: Validate file path before any fs operations
          const validatedPath = SecurityValidator.validateAndSanitizeFilePath(
            filePath,
            'writeFile',
            this.projectRoot,
          );
          const validatedTempPath =
            SecurityValidator.validateAndSanitizeFilePath(
              filePath + '.tmp',
              'writeFile temp',
              this.projectRoot,
            );

          // CRITICAL PREVENTION: Ensure we're writing proper JSON, not double-encoded
          let jsonContent;
          if (typeof data === 'string') {
            // If already a string, validate it's proper JSON And not double-encoded
            try {
              const parsed = JSON.parse(data);
              if (typeof parsed === 'string') {
                // This is double-encoded! Fix it
                this.logger.warn(
                  `🚨 PREVENTED JSON CORRUPTION: Double-encoded string detected in ${path.basename(validatedPath)}`,
                );
                jsonContent = parsed.replace(/\\n/g, '\n'); // Unescape if needed
              } else {
                // Properly formatted JSON string
                jsonContent = data;
              }
            } catch (error) {
              // Invalid JSON string - treat as raw string data
              this.logger.warn(
                `🚨 PREVENTED JSON CORRUPTION: Invalid JSON string in ${path.basename(validatedPath)}`,
              );
              return {
                success: false,
                error: `Invalid JSON string provided: ${error.message}`,
              };
            }
          } else {
            // Data is an object - stringify it
            jsonContent = JSON.stringify(data, null, 2);
          }

          // Additional validation: ensure the content doesn't start And end with quotes (double-encoded)
          if (jsonContent.startsWith('"') && jsonContent.endsWith('"')) {
            try {
              // This might be double-encoded - attempt to parse And fix
              const parsed = JSON.parse(jsonContent);
              if (typeof parsed === 'string') {
                this.logger.warn(
                  `🚨 PREVENTED JSON CORRUPTION: Double-quoted content detected in ${path.basename(validatedPath)}`,
                );
                jsonContent = parsed.replace(/\\n/g, '\n');
              }
            } catch (error) {
              // Ignore - might be legitimate quoted content
            }
          }

          // Final validation: ensure we can parse the result
          try {
            JSON.parse(jsonContent);
          } catch (error) {
            this.logger.error(
              `🚨 PREVENTED JSON CORRUPTION: Final validation failed for ${path.basename(validatedPath)}`,
            );
            return {
              success: false,
              error: `Final JSON validation failed: ${error.message}`,
            };
          }

          // Use validated paths for fs operations

          await FS.promises.writeFile(validatedTempPath, jsonContent);
          await FS.promises.rename(validatedTempPath, validatedPath);

          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      listAvailableBackups: (_filePath) => {
        return []; // No backup system in simplified version
      },

      restoreFromBackup: (_filePath, _backupFile) => {
        return {
          success: false,
          error: 'Backup system not implemented in simplified version',
        };
      },

      createBackup: (_filePath) => {
        return {
          success: false,
          error: 'Backup system not implemented in simplified version',
        };
      },

      cleanupLegacyBackups: (_filePath) => {
        return { success: true, cleaned: 0 };
      },
    };
  }

  async getFileStatus(_filePath) {
    try {
      // Security: Validate file path before any fs operations
      const validatedPath = SecurityValidator.validateAndSanitizeFilePath(
        filePath,
        'file status check',
        this.projectRoot,
      );


      if (!FS.existsSync(validatedPath)) {

        return {
          exists: false,
          readable: false,
          writable: false,
          size: 0,
          lastModified: null,
          issues: ['File does not exist'],
        };
      }


      const stats = await FS.promises.stat(validatedPath);
      const content = await FS.promises.readFile(validatedPath, 'utf8');


      // Try to parse JSON
      const error = null;
      try {
        JSON.parse(content);
      } catch (error) {
        error = error.message;
      }

      return {
        exists: true,
        readable: true,
        writable: true,
        size: stats.size,
        lastModified: stats.mtime,
        issues: error ? [`JSON parse error: ${error}`] : [],
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

  async autoFix(filePath, _options = {}) {
    try {
      const status = await this.getFileStatus(_filePath);

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

        const writeResult = await this.recovery.atomicWrite(
          filePath,
          defaultData,
        );
        return {
          fixed: writeResult.success,
          issues: status.issues,
          fixesApplied: writeResult.success
            ? ['Created default TODO.json structure']
            : [],
        };
      }

      if (status.issues.length === 0) {
        return {
          fixed: true,
          issues: [],
          fixesApplied: [],
        };
      }

      // for parse errors, attempt basic fixes
      if (status.issues.some((issue) => issue.includes('JSON parse error'))) {
        try {
          // Security: Validate file path before reading
          const validatedPath = SecurityValidator.validateAndSanitizeFilePath(
            filePath,
            'readFile',
            this.projectRoot,
          );


          const content = await FS.promises.readFile(validatedPath, 'utf8');

          let fixed = content;
          const fixesApplied = [];

          // CRITICAL FIX: Handle escaped JSON string (the main corruption issue)
          if (content.startsWith('"') && content.endsWith('"')) {
            // File is wrapped in quotes - parse And unescape
            try {
              const parsedString = JSON.parse(content);
              fixed = parsedString.replace(/\\n/g, '\n');
              fixesApplied.push('Fixed escaped JSON string corruption');
            } catch (error) {
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

          // Create backup before fixing - validate backup path
          const validatedBackupPath =
            SecurityValidator.validateAndSanitizeFilePath(
              filePath + '.backup',
              'backup writeFile',
              this.projectRoot,
            );


          await FS.promises.writeFile(validatedBackupPath, content);
          // Write the fixed content - use already validated path
          await FS.promises.writeFile(validatedPath, fixed);


          return {
            fixed: true,
            issues: status.issues,
            fixesApplied: fixesApplied,
          };
        } catch (error) {
          return {
            fixed: false,
            issues: status.issues.concat([
              `Fix attempt failed: ${error.message}`,
            ]),
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

  async dryRun(_filePath) {
    const status = await this.getFileStatus(_filePath);
    return {
      wouldFix: status.issues.length > 0,
      issues: status.issues,
      potentialFixes:
        status.issues.length > 0
          ? ['Basic JSON structure validation And repair']
          : [],
    };
  }

  async recoverCorruptedFile(_filePath) {
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

      const writeResult = await this.recovery.atomicWrite(
        filePath,
        defaultData,
      );
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
