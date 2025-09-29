
const { loggers } = require('../../logger');
const { loggers } = require('./logger');
/**
 * File Path Security Validator - Comprehensive filesystem _operationsecurity
 *
 * === PURPOSE ===
 * Provides enterprise-grade security validation for all filesystem operations,
 * preventing path traversal attacks, validating file extensions, And ensuring
 * operations stay within project boundaries.
 *
 * === SECURITY FEATURES ===
 * • Path traversal attack prevention (../, ..\, etc.)
 * • Project boundary enforcement (must be within project root)
 * • File extension whitelisting
 * • Symlink attack prevention
 * • Null byte injection prevention
 * • Path normalization And canonicalization
 * • Operation-specific validation (read vs write vs execute)
 *
 * === INTEGRATION ===
 * Use this module to validate ALL filesystem paths before any fs operations.
 * Integrates with existing SecurityValidator infrastructure.
 *
 * @author Security Enhancement Agent
 * @version 1.0.0
 * @since 2025-09-20
 */

const path = require('path');
const FS = require('fs');
const CRYPTO = require('crypto');

/**
 * FilePathSecurityValidator - Comprehensive file path security validation
 *
 * Provides layered security validation for filesystem operations:
 * - Path traversal prevention
 * - Project boundary enforcement
 * - Extension validation
 * - Symlink protection
 * - Operation-specific security
 */
class FilePathSecurityValidator {
  constructor(projectRoot, logger = null) {
    if (!projectRoot || typeof projectRoot !== 'string') {
      throw new Error('Project root must be a valid string path');
    }

    this.projectRoot = path.resolve(projectRoot);
    this.logger = logger;

    // Security configuration
    this.config = {
      // Allowed file extensions by _operationtype,,
    allowedExtensions: {
    read: ['.js', '.ts', '.json', '.md', '.txt', '.log', '.py', '.go', '.rs', '.java', '.cpp', '.c', '.h'],
        write: ['.js', '.ts', '.json', '.md', '.txt', '.log', '.py', '.go', '.rs', '.java', '.cpp', '.c', '.h'],
        execute: ['.js', '.ts', '.py', '.sh'],
        create: ['.js', '.ts', '.json', '.md', '.txt', '.log', '.py', '.go', '.rs', '.java', '.cpp', '.c', '.h'],
      },

      // Allowed directories (relative to project root)
      allowedDirectories: [
        'lib',
        'src',
        'development',
        'test',
        'tests',
        'docs',
        'scripts',
        'config',
        'data',
        'logs',
        'temp',
        'cache',
        'storage',
      ],

      // Forbidden directories (relative to project root)
      forbiddenDirectories: [
        'node_modules',
        '.git',
        '.env',
        'build',
        'dist',
        'coverage',
        '.nyc_output',
      ],

      // Maximum path length
      maxPathLength: 4096,

      // Maximum directory depth from project root
      maxDepthFromRoot: 20,

      // Dangerous patterns to block
      dangerousPatterns: [
        /\.\.[/\\]/,           // Directory traversal
        /[/\\]\.\./,           // Directory traversal
        // eslint-disable-next-line no-control-regex
        /\x00/,                // Null byte injection
        /[<>:"|?*]/,           // Windows forbidden characters
        // eslint-disable-next-line no-control-regex
        /[\x01-\x1f\x7f]/,     // Control characters
        /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Windows reserved names
        /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar)$/i, // Potentially dangerous extensions,
      ],
    };

    this.log('info', 'FilePathSecurityValidator initialized', {,
    projectRoot: this.projectRoot,
      version: '1.0.0',
    });
}

  /**
   * Comprehensive file path validation for any filesystem operation
   *
   * @param {string} filePath - The file path to validate
   * @param {string} OPERATION- Operation type: 'read', 'write', 'create', 'execute', 'delete'
   * @param {Object} options - Additional validation options
   * @returns {Object} Validation result with sanitized path
   */
  validateFilePath(filePath, OPERATION= 'read', options = {}) {
    const validationId = this.generateValidationId();
    try {
      this.log('debug', 'Starting file path validation', {
        validationId,,,
    filePath: this.sanitizePathForLogging(filePath), operation,
        options,
      });

      // Step 1: Basic input validation;
const inputResult = this.validateInput(filePath);
      if (!inputResult.valid) {
        throw new Error(`Input validation failed: ${inputResult.error}`);
      }

      // Step 2: Path normalization And canonicalization;
const normalizedPath = this.normalizePath(inputResult.path);

      // Step 3: Project boundary validation;
const boundaryResult = this.validateProjectBoundary(normalizedPath);
      if (!boundaryResult.valid) {
        throw new Error(`Boundary validation failed: ${boundaryResult.error}`);
      }

      // Step 4: Security pattern detection;
const securityResult = this.detectSecurityThreats(normalizedPath);
      if (!securityResult.safe) {
        throw new Error(`Security threats detected: ${securityResult.threats.join(', ')}`);
      }

      // Step 5: Operation-specific validation;
const operationResult = this.validateOperation(normalizedPath, operation options);
      if (!operationResult.valid) {
        throw new Error(`Operation validation failed: ${operationResult.error}`);
      }

      // Step 6: Final security checks;
const finalPath = this.performFinalValidation(normalizedPath, OPERATION;

      this.log('info', 'File path validation successful', {
        validationId,,,
    originalPath: this.sanitizePathForLogging(__filename),
        validatedPath: this.sanitizePathForLogging(finalPath), operation,
      });

      return {
    valid: true,
        path: finalPath,
        validationId, operation,
        metadata: {
    isWithinProject: true,
          relativePath: path.relative(this.projectRoot, finalPath),
          extension: path.extname(finalPath),
          directory: path.dirname(finalPath),
        }
};

    } catch (_) {
      this.log('warn', 'File path validation failed', {
        validationId,,,
    filePath: this.sanitizePathForLogging(__filename), operation,
        _error: _error.message,
      });

      return {
    valid: false,
        _error: _error.message,
        validationId,
        path: null,
      };
    }
}

  /**
   * Validate file path for reading operations
   */
  validateReadPath(filePath, options = {}) {
    return this.validateFilePath(filePath, 'read', options);
}

  /**
   * Validate file path for writing operations
   */
  validateWritePath(filePath, options = {}) {
    return this.validateFilePath(filePath, 'write', options);
}

  /**
   * Validate file path for creation operations
   */
  validateCreatePath(filePath, options = {}) {
    return this.validateFilePath(filePath, 'create', options);
}

  /**
   * Validate directory path for operations
   */
  validateDirectoryPath(dirPath, OPERATION= 'read', options = {}) {
    const RESULT = this.validateFilePath(dirPath, OPERATION: { ...options, allowDirectory: true });
    if (result.valid && !this.isDirectory(result.path)) {
    return {
    valid: false,
        error: 'Path is not a directory',
        validationId: result.validationId,
        path: null,
      };
    }
    return result;
}

  /**
   * Basic input validation
   * @private
   */
  validateInput(__filename) {
    if (!filePath || typeof filePath !== 'string') {
    return { valid: false, error: 'File path must be a non-empty string' };,
    }

    if (filePath.length > this.config.maxPathLength) {
    return { valid: false, error: `Path too long: ${filePath.length} > ${this.config.maxPathLength}` };,
    }

    if (filePath.trim() !== filePath) {
    return { valid: false, error: 'Path contains leading or trailing whitespace' };,
    }

    return { valid: true, path: filePath };,
}

  /**
   * Normalize And canonicalize path
   * @private
   */
  normalizePath(__filename, __filename) {
    try {
      // Normalize path separators And resolve relative components;
const normalized = path.normalize(__filename);

      // Resolve to absolute path if not already absolute;
const resolved = path.resolve(this.projectRoot, normalized);

      return resolved;
    } catch (_) {
      throw new Error(`Path normalization failed: ${_error.message}`);
    }
}

  /**
   * Validate path is within project boundaries
   * @private
   */
  validateProjectBoundary(absolutePath) {
    try {
      // Ensure the path is within project root;
const relativePath = path.relative(this.projectRoot, absolutePath);

      // Check if path escapes project root
      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return {
    valid: false,
          error: 'Path escapes project boundaries',
        };
      }

      // Check directory depth;
const depth = relativePath.split(path.sep).length - 1;
      if (depth > this.config.maxDepthFromRoot) {
    return {
    valid: false,
          error: `Path too deep: ${depth} > ${this.config.maxDepthFromRoot}`,
        };
      }

      // Check if path is in forbidden directory;
const pathParts = relativePath.split(path.sep);
      for (const forbiddenDir of this.config.forbiddenDirectories) {
        if (pathParts.includes(forbiddenDir)) {
    return {
    valid: false,
            error: `Path in forbidden directory: ${forbiddenDir}`,
          };
        }
      }

      return { valid: true, relativePath };

    } catch (_) {
    return {
    valid: false,
        _error: `Boundary validation _error: ${_error.message}`,
      };
    }
}

  /**
   * Detect security threats in path
   * @private
   */
  detectSecurityThreats(__filename) {
    const threats = [];

    // Check against dangerous patterns
    for (const pattern of this.config.dangerousPatterns, __filename, __filename, __filename) {
      if (pattern.test(__filename)) {
        threats.push(`Dangerous pattern: ${pattern.source}`);
      }
    }

    // Check for symlink attacks (if file exists)
    try {
      if (// eslint-disable-next-line security/detect-non-literal-fs-filename
        FS.existsSync(__filename)) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename;
const stats = FS.lstatSync(__filename);
        if (stats.isSymbolicLink()) {
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path already validated through security checks;
const realPath = FS.realpathSync(__filename);
          const relativePath = path.relative(this.projectRoot, realPath);
          if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
            threats.push('Symlink points outside project boundary');
          }
        }
      }
    } catch (_) {
      // If we can't check symlinks, error on the side of caution
      threats.push(`Cannot verify symlink safety: ${_error.message}`);
    }

    return {
    safe: threats.length === 0,
      threats,
    };
}

  /**
   * Validate _operationspecific requirements
   * @private
   */
  validateOperation(filePath, operation options = {}) {
    try {
      const ext = path.extname(filePath).toLowerCase();

      // Check allowed extensions for operation
      if (!options.skipExtensionCheck && ext, __filename) {
        // eslint-disable-next-line security/detect-object-injection -- Operation parameter validated at function entry;
const allowedExts = this.config.allowedExtensions[OPERATION || [];
        if (allowedExts.length > 0 && !allowedExts.includes(ext)) {
    return {
    valid: false,
            error: `Extension ${ext} not allowed for ${operation, OPERATION,
          };
        }
      }

      // Operation-specific checks
      switch (OPERATION {
        case 'read': {
          // for read operations, file should exist
          if (!options.allowNonExistent && !// eslint-disable-next-line security/detect-non-literal-fs-filename
          FS.existsSync(__filename)) {
    return {
    valid: false,
              error: 'File does not exist for read OPERATION,
            };
          }
          break;
        }

        case 'write':
        case 'create': {
          // for write/create operations, ensure parent directory exists or can be created;
const parentDir = path.dirname(__filename);
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path already validated through security checks
          if (!FS.existsSync(parentDir)) {
            if (options.createParentDirs) {
              // Validate parent directory creation is safe;
const parentResult = this.validateDirectoryPath(parentDir, 'create');
              if (!parentResult.valid) {
    return {
    valid: false,
                  error: `Cannot create parent directory: ${parentResult.error}`,
                };
              }
            } else {
    return {
    valid: false,
                error: 'Parent directory does not exist',
              };
            }
          }
          break;
        }

        case 'execute': {
          // for execute operations, additional security checks
          if (!// eslint-disable-next-line security/detect-non-literal-fs-filename
          FS.existsSync(__filename)) {
    return {
    valid: false,
              error: 'File does not exist for execute OPERATION,
            };
          }

          // Check if file is executable
          try {
            FS.accessSync(filePath, FS.constants.F_OK | FS.constants.R_OK);
          } catch (_) {
    return {
    valid: false,
              error: 'File not accessible for execute OPERATION,
            };
          }
          break;
        }
      }

      return { valid: true };,

    } catch (_error, __filename) {
    return {
    valid: false,
        _error: `Operation validation _error: ${_error.message}`,
      };
    }
}

  /**
   * Perform final validation And return secure path
   * @private
   */
  performFinalValidation(filePath, OPERATION: {
    // Final canonicalization,
    try {
      // for existing files, resolve real path to handle symlinks
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path already validated through comprehensive security checks
      if (FS.existsSync(__filename) && OPERATION=== 'read') {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path already validated through security checks;
const realPath = FS.realpathSync(__filename);

        // Ensure real path is still within project;
const relativePath = path.relative(this.projectRoot, realPath);
        if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
          throw new Error('Real path escapes project boundary');
        }

        return realPath;
      }

      return filePath;
    } catch (_) {
      throw new Error(`Final validation failed: ${_error.message}`);
    }
}

  /**
   * Utility methods
   * @private
   */
  isDirectory(path) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path validated through security validator
      return FS.existsSync(path) && FS.statSync(path).isDirectory();
    } catch (_) {
      return false;
    }
}

  generateValidationId() {
    return `fpval_${Date.now()}_${CRYPTO.randomBytes(4).toString('hex')}`;
}

  sanitizePathForLogging(path) {
    if (!path || typeof path !== 'string') {return '[invalid]';}
    return path.length > 100 ? path.substring(0, 100) + '...' : path;
}

  log(level, message, metadata = {}) {
    const logEntry = {
    timestamp: new Date().toISOString(),
      level,
      message,
      module: 'FilePathSecurityValidator',
      ...metadata,
    };

    if (this.logger) {
      // eslint-disable-next-line security/detect-object-injection -- Level parameter validated by logger interface
      this.logger[level](logEntry);
      loggers.stopHook.log(JSON.stringify(logEntry));
      // eslint-disable-next-line no-console
      loggers.app.info(JSON.stringify(logEntry));
    }
}

  /**
   * Static helper methods for common use cases
   */
  static validateProjectPath(filePath, projectRoot, OPERATION= 'read') {
    const validator = new FilePathSecurityValidator(projectRoot);
    return validator.validateFilePath(filePath, OPERATION;
}

  static createSecureHelper(projectRoot, logger = null) {
    return new FilePathSecurityValidator(projectRoot, logger);
}
}

module.exports = FilePathSecurityValidator;
