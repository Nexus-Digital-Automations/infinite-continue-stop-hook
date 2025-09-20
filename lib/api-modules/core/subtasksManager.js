/**
 * Subtasks Manager Module
 *
 * Handles all subtask operations for embedded subtasks within tasks including:
 * - Creating subtasks (research, audit, implementation subtasks)
 * - Listing and filtering subtasks
 * - Updating subtask status and progress
 * - Deleting subtasks
 * - Validating subtask dependencies and relationships
 * - Managing subtask lifecycle and completion
 *
 * @author TaskManager System
 * @version 2.0.0
 */

class SubtasksManager {
  /**
   * Initialize SubtasksManager with required dependencies
   * @param {Object} dependencies - Dependency injection object
   * @param {Object} dependencies.taskManager - TaskManager instance
   * @param {Function} dependencies.withTimeout - Timeout wrapper function
   * @param {Function} dependencies.getGuideForError - Error guide function
   * @param {Function} dependencies.getFallbackGuide - Fallback guide function
   * @param {Function} dependencies.validateSubtask - Subtask validation function
   * @param {Function} dependencies.validateTaskExists - Task existence validator
   * @param {Function} dependencies.broadcastSubtaskUpdate - Subtask update broadcaster
   */
  constructor(dependencies) {
    this.taskManager = dependencies.taskManager;
    this.withTimeout = dependencies.withTimeout;
    this.getGuideForError = dependencies.getGuideForError;
    this.getFallbackGuide = dependencies.getFallbackGuide;
    this.validateSubtask = dependencies.validateSubtask || this._defaultSubtaskValidator.bind(this);
    this.validateTaskExists = dependencies.validateTaskExists || this._defaultTaskExistsValidator.bind(this);
    this.broadcastSubtaskUpdate = dependencies.broadcastSubtaskUpdate || (() => {});
  }

  /**
   * Create a new subtask within a parent task
   * @param {string} taskId - Parent task ID
   * @param {Object} subtaskData - Subtask data object
   * @param {string} subtaskData.type - Subtask type (research, audit, implementation, etc.)
   * @param {string} subtaskData.title - Subtask title
   * @param {string} subtaskData.description - Detailed description
   * @param {number} [subtaskData.estimated_hours] - Estimated completion hours
   * @param {boolean} [subtaskData.prevents_implementation] - Whether subtask blocks implementation
   * @param {boolean} [subtaskData.prevents_completion] - Whether subtask blocks task completion
   * @returns {Promise<Object>} Response with created subtask or error
   */
  async createSubtask(taskId, subtaskData) {
    // Get guide information for all responses
    let guide = null;
    try {
      guide = await this.getGuideForError('subtasks-operations');
    } catch {
      // Continue with operation without guide if guide fails
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          // Validate parent task exists
          const taskExists = await this.validateTaskExists(taskId);
          if (!taskExists.valid) {
            return {
              success: false,
              error: `Parent task ${taskId} not found or invalid`,
              errorCode: 'PARENT_TASK_NOT_FOUND',
            };
          }

          // Validate subtask data
          const validationResult = await this.validateSubtask(subtaskData);
          if (!validationResult.valid) {
            return {
              success: false,
              error: `Invalid subtask data: ${validationResult.errors.join(', ')}`,
              errorCode: 'INVALID_SUBTASK_DATA',
            };
          }

          // Generate unique subtask ID
          const subtaskId = this._generateSubtaskId(subtaskData.type);

          // Create subtask object with required fields
          const subtask = {
            id: subtaskId,
            type: subtaskData.type,
            title: subtaskData.title,
            description: subtaskData.description,
            status: 'pending',
            estimated_hours: subtaskData.estimated_hours || 1,
            prevents_implementation: subtaskData.prevents_implementation || false,
            prevents_completion: subtaskData.prevents_completion || false,
            created_at: new Date().toISOString(),
            ...(subtaskData.research_locations && { research_locations: subtaskData.research_locations }),
            ...(subtaskData.deliverables && { deliverables: subtaskData.deliverables }),
            ...(subtaskData.success_criteria && { success_criteria: subtaskData.success_criteria }),
          };

          // Add subtask to parent task
          const addResult = await this.taskManager.addSubtaskToTask(taskId, subtask);
          if (!addResult.success) {
            return {
              success: false,
              error: `Failed to add subtask to parent task: ${addResult.error}`,
              errorCode: 'SUBTASK_CREATION_FAILED',
            };
          }

          // Broadcast subtask creation
          await this.broadcastSubtaskUpdate({
            action: 'created',
            taskId,
            subtaskId,
            subtask,
          });

          return {
            success: true,
            subtask,
            taskId,
            message: 'Subtask created successfully',
          };
        })(),
      );

      return {
        ...result,
        guide: guide || this.getFallbackGuide('subtasks-operations'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'SUBTASK_OPERATION_FAILED',
        guide: guide || this.getFallbackGuide('subtasks-operations'),
      };
    }
  }

  /**
   * Get all subtasks for a specific parent task
   * @param {string} taskId - Parent task ID
   * @param {Object} [filter] - Optional filtering options
   * @param {string} [filter.status] - Filter by subtask status
   * @param {string} [filter.type] - Filter by subtask type
   * @returns {Promise<Object>} Response with subtasks array or error
   */
  async getSubtasks(taskId, filter = {}) {
    let guide = null;
    try {
      guide = await this.getGuideForError('subtasks-operations');
    } catch {
      // Continue without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          // Validate parent task exists
          const taskExists = await this.validateTaskExists(taskId);
          if (!taskExists.valid) {
            return {
              success: false,
              error: `Task ${taskId} not found`,
              errorCode: 'TASK_NOT_FOUND',
            };
          }

          // Get task data
          const taskData = await this.taskManager.getTask(taskId);
          if (!taskData) {
            return {
              success: false,
              error: `Could not retrieve task data for ${taskId}`,
              errorCode: 'TASK_DATA_RETRIEVAL_FAILED',
            };
          }

          let subtasks = taskData.subtasks || [];

          // Apply filters
          if (filter.status) {
            subtasks = subtasks.filter(st => st.status === filter.status);
          }
          if (filter.type) {
            subtasks = subtasks.filter(st => st.type === filter.type);
          }

          return {
            success: true,
            subtasks,
            taskId,
            count: subtasks.length,
            filter,
          };
        })(),
      );

      return {
        ...result,
        guide: guide || this.getFallbackGuide('subtasks-operations'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'SUBTASKS_RETRIEVAL_FAILED',
        guide: guide || this.getFallbackGuide('subtasks-operations'),
      };
    }
  }

  /**
   * Update an existing subtask
   * @param {string} subtaskId - Subtask ID to update
   * @param {Object} updateData - Data to update
   * @param {string} [updateData.status] - New status
   * @param {string} [updateData.description] - Updated description
   * @param {number} [updateData.estimated_hours] - Updated time estimate
   * @returns {Promise<Object>} Response with updated subtask or error
   */
  async updateSubtask(subtaskId, updateData) {
    let guide = null;
    try {
      guide = await this.getGuideForError('subtasks-operations');
    } catch {
      // Continue without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          // Find parent task and subtask
          const { taskId, subtask } = await this._findSubtaskByIdAcrossTasks(subtaskId);
          if (!subtask) {
            return {
              success: false,
              error: `Subtask ${subtaskId} not found`,
              errorCode: 'SUBTASK_NOT_FOUND',
            };
          }

          // Validate update data
          const allowedUpdates = ['status', 'description', 'estimated_hours', 'completed_by'];
          const updateKeys = Object.keys(updateData);
          const invalidKeys = updateKeys.filter(key => !allowedUpdates.includes(key));

          if (invalidKeys.length > 0) {
            return {
              success: false,
              error: `Invalid update fields: ${invalidKeys.join(', ')}. Allowed: ${allowedUpdates.join(', ')}`,
              errorCode: 'INVALID_UPDATE_FIELDS',
            };
          }

          // Apply updates
          const updatedSubtask = { ...subtask };

          // Security: Use explicit whitelist to prevent object injection
          if (updateKeys.includes('status') && updateData.status !== undefined) {
            updatedSubtask.status = updateData.status;
          }
          if (updateKeys.includes('description') && updateData.description !== undefined) {
            updatedSubtask.description = updateData.description;
          }
          if (updateKeys.includes('estimated_hours') && updateData.estimated_hours !== undefined) {
            updatedSubtask.estimated_hours = updateData.estimated_hours;
          }
          if (updateKeys.includes('completed_by') && updateData.completed_by !== undefined) {
            updatedSubtask.completed_by = updateData.completed_by;
          }

          // Add completion timestamp if status is completed
          if (updateData.status === 'completed' && subtask.status !== 'completed') {
            updatedSubtask.completed_at = new Date().toISOString();
          }

          // Update subtask in parent task
          const updateResult = await this.taskManager.updateSubtaskInTask(taskId, subtaskId, updatedSubtask);
          if (!updateResult.success) {
            return {
              success: false,
              error: `Failed to update subtask: ${updateResult.error}`,
              errorCode: 'SUBTASK_UPDATE_FAILED',
            };
          }

          // Broadcast subtask update
          await this.broadcastSubtaskUpdate({
            action: 'updated',
            taskId,
            subtaskId,
            subtask: updatedSubtask,
            changes: updateData,
          });

          return {
            success: true,
            subtask: updatedSubtask,
            taskId,
            message: 'Subtask updated successfully',
          };
        })(),
      );

      return {
        ...result,
        guide: guide || this.getFallbackGuide('subtasks-operations'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'SUBTASK_UPDATE_OPERATION_FAILED',
        guide: guide || this.getFallbackGuide('subtasks-operations'),
      };
    }
  }

  /**
   * Delete a subtask from its parent task
   * @param {string} subtaskId - Subtask ID to delete
   * @returns {Promise<Object>} Response confirming deletion or error
   */
  async deleteSubtask(subtaskId) {
    let guide = null;
    try {
      guide = await this.getGuideForError('subtasks-operations');
    } catch {
      // Continue without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          // Find parent task and subtask
          const { taskId, subtask } = await this._findSubtaskByIdAcrossTasks(subtaskId);
          if (!subtask) {
            return {
              success: false,
              error: `Subtask ${subtaskId} not found`,
              errorCode: 'SUBTASK_NOT_FOUND',
            };
          }

          // Check if subtask can be deleted (e.g., not completed or in progress)
          if (subtask.status === 'in_progress') {
            return {
              success: false,
              error: 'Cannot delete subtask that is currently in progress',
              errorCode: 'SUBTASK_IN_PROGRESS',
            };
          }

          // Remove subtask from parent task
          const deleteResult = await this.taskManager.removeSubtaskFromTask(taskId, subtaskId);
          if (!deleteResult.success) {
            return {
              success: false,
              error: `Failed to delete subtask: ${deleteResult.error}`,
              errorCode: 'SUBTASK_DELETION_FAILED',
            };
          }

          // Broadcast subtask deletion
          await this.broadcastSubtaskUpdate({
            action: 'deleted',
            taskId,
            subtaskId,
            subtask,
          });

          return {
            success: true,
            subtaskId,
            taskId,
            message: 'Subtask deleted successfully',
          };
        })(),
      );

      return {
        ...result,
        guide: guide || this.getFallbackGuide('subtasks-operations'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errorCode: 'SUBTASK_DELETE_OPERATION_FAILED',
        guide: guide || this.getFallbackGuide('subtasks-operations'),
      };
    }
  }

  /**
   * Private method to generate unique subtask ID
   * @param {string} type - Subtask type
   * @returns {string} Generated subtask ID
   */
  _generateSubtaskId(type) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${type}_${timestamp}_${random}`;
  }

  /**
   * Private method to find subtask by ID across all tasks
   * @param {string} subtaskId - Subtask ID to find
   * @returns {Promise<Object>} Object with taskId and subtask, or null values if not found
   */
  async _findSubtaskByIdAcrossTasks(subtaskId) {
    try {
      const allTasks = await this.taskManager.listTasks({});

      for (const task of allTasks) {
        if (task.subtasks && task.subtasks.length > 0) {
          const subtask = task.subtasks.find(st => st.id === subtaskId);
          if (subtask) {
            return { taskId: task.id, subtask };
          }
        }
      }

      return { taskId: null, subtask: null };
    } catch {
      return { taskId: null, subtask: null };
    }
  }

  /**
   * Default subtask validator
   * @param {Object} subtaskData - Subtask data to validate
   * @returns {Object} Validation result
   */
  _defaultSubtaskValidator(subtaskData) {
    const errors = [];

    if (!subtaskData.type) {errors.push('Subtask type is required');}
    if (!subtaskData.title) {errors.push('Subtask title is required');}
    if (!subtaskData.description) {errors.push('Subtask description is required');}

    const validTypes = ['research', 'audit', 'implementation', 'testing', 'documentation', 'review'];
    if (subtaskData.type && !validTypes.includes(subtaskData.type)) {
      errors.push(`Invalid subtask type. Must be one of: ${validTypes.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Default task existence validator
   * @param {string} taskId - Task ID to validate
   * @returns {Promise<Object>} Validation result
   */
  async _defaultTaskExistsValidator(taskId) {
    try {
      const task = await this.taskManager.getTask(taskId);
      return {
        valid: !!task,
        task,
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }
}

module.exports = SubtasksManager;
