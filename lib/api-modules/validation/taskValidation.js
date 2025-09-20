/**
 * Task Validation Module - Comprehensive validation helpers for TaskManager API
 *
 * === PURPOSE ===
 * Provides validation functions for task completion data, failure data, evidence,
 * agent scope permissions, and scope restrictions. All validation methods are pure
 * functions with no external dependencies for maximum testability and reusability.
 *
 * === VALIDATION CATEGORIES ===
 * • Completion Data Validation - Ensures task completion data integrity
 * • Failure Data Validation - Validates task failure information structure
 * • Evidence Validation - Validates structured evidence requirements
 * • Agent Scope Validation - Validates agent access permissions for tasks
 * • Scope Restrictions Validation - Validates scope restriction format/structure
 *
 * @author TaskManager System
 * @version 2.0.0
 * @since 2024-01-01
 */

/**
 * Validate and sanitize completion data to prevent JSON errors
 * @param {Object} completionData - Raw completion data to validate
 * @returns {Object} Validated and sanitized completion data
 * @throws {Error} If validation fails with specific error details
 */
function validateCompletionData(completionData) {
  // Handle null/undefined cases
  if (!completionData) {
    return {};
  }

  // Ensure it's an object
  if (typeof completionData !== 'object' || Array.isArray(completionData)) {
    throw new Error('Completion data must be a valid object');
  }

  const validated = {};

  // Validate and sanitize common fields
  const allowedFields = [
    'notes',
    'message',
    'outcome',
    'details',
    'files_modified',
    'evidence',
    'metrics',
  ];

  for (const [key, value] of Object.entries(completionData)) {
    if (!allowedFields.includes(key)) {
      // eslint-disable-next-line no-console -- Validation warning for completion data field
      console.warn(
        `[WARNING] Ignoring unknown completion data field: ${key}`,
      );
      continue;
    }

    // Sanitize string values
    if (typeof value === 'string') {
      // Check for truncation indicators
      if (value.includes('...') && value.length > 3) {
        throw new Error(
          `Completion data field "${key}" appears to be truncated (contains "...")`,
        );
      }

      // Limit string length to prevent excessively large data
      if (value.length > 10000) {
        throw new Error(
          `Completion data field "${key}" exceeds maximum length of 10,000 characters`,
        );
      }

      // Store sanitized string
      // eslint-disable-next-line security/detect-object-injection -- key is from Object.entries, safe iteration
      validated[key] = value.trim();
    } else if (Array.isArray(value)) {
      // Validate array contents
      // eslint-disable-next-line security/detect-object-injection -- key is from Object.entries, safe iteration
      validated[key] = value.filter(
        (item) =>
          typeof item === 'string' && item.length > 0 && item.length < 1000,
      );
    } else if (typeof value === 'object' && value !== null) {
      // Recursively validate nested objects (limited depth)
      try {
        // eslint-disable-next-line security/detect-object-injection -- key is from Object.entries, safe iteration
        validated[key] = JSON.parse(JSON.stringify(value)); // Deep clone and validate JSON serializability
      } catch (error) {
        throw new Error(
          `Completion data field "${key}" contains non-serializable data: ${error.message}`,
        );
      }
    } else {
      // Allow primitives (boolean, number)
      // eslint-disable-next-line security/detect-object-injection -- key is from Object.entries, safe iteration
      validated[key] = value;
    }
  }

  return validated;
}

/**
 * Validate and sanitize failure data to prevent JSON errors
 * @param {Object} failureData - Raw failure data to validate
 * @returns {Object} Validated and sanitized failure data
 * @throws {Error} If validation fails with specific error details
 */
function validateFailureData(failureData) {
  // Handle null/undefined cases
  if (!failureData) {
    return {};
  }

  // Ensure it's an object
  if (typeof failureData !== 'object' || Array.isArray(failureData)) {
    throw new Error('Failure data must be a valid object');
  }

  const validated = {};

  // Validate and sanitize common failure fields
  const allowedFields = [
    'reason',
    'error',
    'notes',
    'details',
    'stackTrace',
    'source',
  ];

  for (const [key, value] of Object.entries(failureData)) {
    if (!allowedFields.includes(key)) {
      // eslint-disable-next-line no-console -- Validation warning for failure data field
      console.warn(`[WARNING] Ignoring unknown failure data field: ${key}`);
      continue;
    }

    // Sanitize string values
    if (typeof value === 'string') {
      // Check for truncation indicators
      if (value.includes('...') && value.length > 3) {
        throw new Error(
          `Failure data field "${key}" appears to be truncated (contains "...")`,
        );
      }

      // Limit string length to prevent excessively large data
      if (value.length > 10000) {
        throw new Error(
          `Failure data field "${key}" exceeds maximum length of 10,000 characters`,
        );
      }

      // Store sanitized string
      // eslint-disable-next-line security/detect-object-injection -- key is from Object.entries, safe iteration
      validated[key] = value.trim();
    } else if (Array.isArray(value)) {
      // Validate array contents
      // eslint-disable-next-line security/detect-object-injection -- key is from Object.entries, safe iteration
      validated[key] = value.filter(
        (item) =>
          typeof item === 'string' && item.length > 0 && item.length < 1000,
      );
    } else if (typeof value === 'object' && value !== null) {
      // Recursively validate nested objects (limited depth)
      try {
        // eslint-disable-next-line security/detect-object-injection -- key is from Object.entries, safe iteration
        validated[key] = JSON.parse(JSON.stringify(value)); // Deep clone and validate JSON serializability
      } catch (error) {
        throw new Error(
          `Failure data field "${key}" contains non-serializable data: ${error.message}`,
        );
      }
    } else {
      // Allow primitives (boolean, number)
      // eslint-disable-next-line security/detect-object-injection -- key is from Object.entries, safe iteration
      validated[key] = value;
    }
  }

  return validated;
}

/**
 * Validate structured evidence requirements for task completion
 * @param {Object} completionData - Validated completion data to check for evidence
 * @returns {Object} Evidence validation result with isValid flag and errors array
 */
function validateTaskEvidence(completionData) {
  const validation = {
    isValid: true,
    errors: [],
    evidenceChecks: {},
  };

  // If no evidence is provided, issue warning but allow completion
  if (!completionData.evidence) {
    validation.evidenceChecks.hasEvidence = false;
    validation.errors.push(
      'No evidence provided - consider adding completion evidence for better tracking',
    );
    return validation; // Allow completion without evidence for backwards compatibility
  }

  const evidence = completionData.evidence;
  validation.evidenceChecks.hasEvidence = true;

  // Validate common evidence fields
  const recommendedFields = [
    'files_modified',
    'tests_passed',
    'build_status',
    'linter_status',
    'commit_hash',
  ];

  let foundRecommendedFields = 0;
  for (const field of recommendedFields) {
    // eslint-disable-next-line security/detect-object-injection -- Safe: field from predefined recommendedFields array
    if (evidence[field] !== undefined) {
      foundRecommendedFields++;
      // eslint-disable-next-line security/detect-object-injection -- Safe: field from predefined recommendedFields array
      validation.evidenceChecks[field] = true;

      // Validate specific evidence types
      switch (field) {
        case 'files_modified':
          // eslint-disable-next-line security/detect-object-injection -- Safe: field from predefined recommendedFields array
          if (!Array.isArray(evidence[field])) {
            validation.errors.push(
              'files_modified must be an array of file paths',
            );
            validation.isValid = false;
          }
          break;
        case 'tests_passed':
        case 'build_status':
        case 'linter_status':
          // eslint-disable-next-line security/detect-object-injection -- Safe: field from predefined recommendedFields array
          if (typeof evidence[field] !== 'boolean') {
            validation.errors.push(`${field} must be a boolean (true/false)`);
            validation.isValid = false;
          }
          break;
        case 'commit_hash':
          if (
            // eslint-disable-next-line security/detect-object-injection -- Safe: field from predefined recommendedFields array
            typeof evidence[field] !== 'string' ||
            // eslint-disable-next-line security/detect-object-injection -- Safe: field from predefined recommendedFields array
            !/^[a-f0-9]{7,40}$/i.test(evidence[field])
          ) {
            validation.errors.push(
              'commit_hash must be a valid git commit hash (7-40 hex characters)',
            );
            validation.isValid = false;
          }
          break;
      }
    } else {
      // eslint-disable-next-line security/detect-object-injection -- Safe: field from predefined recommendedFields array
      validation.evidenceChecks[field] = false;
    }
  }

  // Encourage evidence completeness
  if (foundRecommendedFields === 0) {
    validation.errors.push(
      'Consider providing structured evidence: files_modified, tests_passed, build_status, linter_status, commit_hash',
    );
  }

  validation.evidenceChecks.completeness = foundRecommendedFields;
  validation.evidenceChecks.recommendedTotal = recommendedFields.length;

  return validation;
}

/**
 * Validate scope restrictions format and structure during task creation
 * @param {Object} scopeRestrictions - Scope restrictions object from task data
 * @returns {Object} Validation result with isValid flag and restriction types
 */
function validateScopeRestrictions(scopeRestrictions) {
  const validation = {
    isValid: true,
    errors: [],
    restrictionTypes: [],
  };

  if (!scopeRestrictions || typeof scopeRestrictions !== 'object') {
    validation.isValid = false;
    validation.errors.push('scope_restrictions must be a valid object');
    return validation;
  }

  // Validate restricted_files
  if (scopeRestrictions.restricted_files !== undefined) {
    if (!Array.isArray(scopeRestrictions.restricted_files)) {
      validation.errors.push('restricted_files must be an array');
      validation.isValid = false;
    } else {
      validation.restrictionTypes.push('restricted_files');
      for (const file of scopeRestrictions.restricted_files) {
        if (typeof file !== 'string') {
          validation.errors.push(
            `Invalid file path in restricted_files: ${file}`,
          );
          validation.isValid = false;
        }
      }
    }
  }

  // Validate restricted_folders - NEW FEATURE
  if (scopeRestrictions.restricted_folders !== undefined) {
    if (!Array.isArray(scopeRestrictions.restricted_folders)) {
      validation.errors.push('restricted_folders must be an array');
      validation.isValid = false;
    } else {
      validation.restrictionTypes.push('restricted_folders');
      for (const folder of scopeRestrictions.restricted_folders) {
        if (typeof folder !== 'string') {
          validation.errors.push(
            `Invalid folder path in restricted_folders: ${folder}`,
          );
          validation.isValid = false;
        }
      }
    }
  }

  // Validate allowed_files
  if (scopeRestrictions.allowed_files !== undefined) {
    if (!Array.isArray(scopeRestrictions.allowed_files)) {
      validation.errors.push('allowed_files must be an array');
      validation.isValid = false;
    } else {
      validation.restrictionTypes.push('allowed_files');
      for (const file of scopeRestrictions.allowed_files) {
        if (typeof file !== 'string') {
          validation.errors.push(
            `Invalid file path in allowed_files: ${file}`,
          );
          validation.isValid = false;
        }
      }
    }
  }

  // Validate allowed_folders - NEW FEATURE
  if (scopeRestrictions.allowed_folders !== undefined) {
    if (!Array.isArray(scopeRestrictions.allowed_folders)) {
      validation.errors.push('allowed_folders must be an array');
      validation.isValid = false;
    } else {
      validation.restrictionTypes.push('allowed_folders');
      for (const folder of scopeRestrictions.allowed_folders) {
        if (typeof folder !== 'string') {
          validation.errors.push(
            `Invalid folder path in allowed_folders: ${folder}`,
          );
          validation.isValid = false;
        }
      }
    }
  }

  // Validate for conflicts between restricted and allowed
  if (scopeRestrictions.restricted_files && scopeRestrictions.allowed_files) {
    const conflicts = scopeRestrictions.restricted_files.filter((file) =>
      scopeRestrictions.allowed_files.includes(file),
    );
    if (conflicts.length > 0) {
      validation.errors.push(
        `Files cannot be both restricted and allowed: ${conflicts.join(', ')}`,
      );
      validation.isValid = false;
    }
  }

  if (
    scopeRestrictions.restricted_folders &&
    scopeRestrictions.allowed_folders
  ) {
    const conflicts = scopeRestrictions.restricted_folders.filter(
      (folder) => {
        const normalizedRestricted = folder.endsWith('/')
          ? folder
          : `${folder}/`;
        return scopeRestrictions.allowed_folders.some((allowed) => {
          const normalizedAllowed = allowed.endsWith('/')
            ? allowed
            : `${allowed}/`;
          return normalizedRestricted === normalizedAllowed;
        });
      },
    );
    if (conflicts.length > 0) {
      validation.errors.push(
        `Folders cannot be both restricted and allowed: ${conflicts.join(', ')}`,
      );
      validation.isValid = false;
    }
  }

  return validation;
}

module.exports = {
  validateCompletionData,
  validateFailureData,
  validateTaskEvidence,
  validateScopeRestrictions,
};
