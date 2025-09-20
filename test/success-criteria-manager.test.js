/**
 * Success Criteria Manager Unit Tests
 *
 * Comprehensive unit test suite for SuccessCriteriaManager class covering:
 * - CRUD operations for success criteria
 * - Template application and inheritance
 * - Validation logic and error handling
 * - Integration with TaskManager system
 * - Performance and reliability testing
 *
 * Target: >90% code coverage for all SuccessCriteriaManager functionality
 *
 * @author Testing Agent #6
 * @version 1.0.0
 */

const _SuccessCriteriaManager = require('../lib/api-modules/core/successCriteriaManager');

describe('SuccessCriteriaManager Unit Tests', () => {
  let _successCriteriaManager;
  let _mockDependencies;
  let _mockTaskManager;
  let _mockWithTimeout;
  let _mockGetGuideForError;
  let _mockGetFallbackGuide;
  let _mockValidateCriteria;
  let _mockValidateTaskExists;
  let _mockBroadcastCriteriaUpdate;

  beforeEach(() => {
    // Create comprehensive mocks for all dependencies
    mockTaskManager = {
      getTask: jest.fn(),
      updateTaskSuccessCriteria: jest.fn(),
    };

    mockWithTimeout = jest.fn((operation) => {
      if (typeof operation === 'function') {
        return operation();
      }
      return Promise.resolve(operation);
    });
    mockGetGuideForError = jest
      .fn()
      .mockResolvedValue({ type: 'success-criteria-guide' });
    mockGetFallbackGuide = jest
      .fn()
      .mockReturnValue({ type: 'fallback-guide' });
    mockValidateCriteria = jest
      .fn()
      .mockReturnValue({ valid: true, errors: [] });
    mockValidateTaskExists = jest.fn().mockResolvedValue({ valid: true });
    mockBroadcastCriteriaUpdate = jest.fn().mockResolvedValue();

    mockDependencies = {
      taskManager: mockTaskManager,
      withTimeout: mockWithTimeout,
      getGuideForError: mockGetGuideForError,
      getFallbackGuide: mockGetFallbackGuide,
      validateCriteria: mockValidateCriteria,
      validateTaskExists: mockValidateTaskExists,
      broadcastCriteriaUpdate: mockBroadcastCriteriaUpdate,
      projectRoot: '/test/project/root',
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    };

    successCriteriaManager = new SuccessCriteriaManager(mockDependencies);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with all required dependencies', () => {
      expect(successCriteriaManager.taskManager).toBe(mockTaskManager);
      expect(successCriteriaManager.withTimeout).toBe(mockWithTimeout);
      expect(successCriteriaManager.getGuideForError).toBe(
        mockGetGuideForError,
      );
      expect(successCriteriaManager.getFallbackGuide).toBe(
        mockGetFallbackGuide,
      );
    });

    test('should use default validators when not provided', () => {
      const _defaultDependencies = {
        taskManager: mockTaskManager,
        withTimeout: mockWithTimeout,
        getGuideForError: mockGetGuideForError,
        getFallbackGuide: mockGetFallbackGuide,
        projectRoot: '/test/project/root',
        logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
      };

      const _manager = new SuccessCriteriaManager(defaultDependencies);
      expect(typeof manager.validateCriteria).toBe('function');
      expect(typeof manager.validateTaskExists).toBe('function');
    });

    test('should have correct default criteria templates', () => {
      expect(successCriteriaManager.defaultCriteriaTemplates).toHaveProperty(
        'basic',
      );
      expect(successCriteriaManager.defaultCriteriaTemplates).toHaveProperty(
        'comprehensive',
      );
      expect(successCriteriaManager.defaultCriteriaTemplates).toHaveProperty(
        'enterprise',
      );

      // Verify basic template contains core criteria
      expect(successCriteriaManager.defaultCriteriaTemplates.basic).toContain(
        'Linter Perfection',
      );
      expect(successCriteriaManager.defaultCriteriaTemplates.basic).toContain(
        'Build Success',
      );
      expect(successCriteriaManager.defaultCriteriaTemplates.basic).toContain(
        'Runtime Success',
      );
      expect(successCriteriaManager.defaultCriteriaTemplates.basic).toContain(
        'Test Integrity',
      );
    });

    test('should have enterprise template with full 25-point criteria', () => {
      const enterpriseTemplate =
        successCriteriaManager.defaultCriteriaTemplates.enterprise;
      expect(enterpriseTemplate).toHaveLength(25);

      // Check that all major categories are covered
      expect(enterpriseTemplate).toContain('Security Review');
      expect(enterpriseTemplate).toContain('Performance Metrics');
      expect(enterpriseTemplate).toContain('Authentication/Authorization');
      expect(enterpriseTemplate).toContain('Regulatory Compliance');
    });
  });

  describe('addCriteria Method', () => {
    const testTaskId = 'test_1234567890_abcdef';
    const testCriteria = ['Test Criterion 1', 'Test Criterion 2'];

    beforeEach(() => {
      mockTaskManager.getTask.mockResolvedValue({
        id: testTaskId,
        success_criteria: [],
      });
      mockTaskManager.updateTaskSuccessCriteria.mockResolvedValue({
        success: true,
      });
    });

    test('should successfully add criteria to task with empty criteria', async () => {
      const _result = await successCriteriaManager.addCriteria(
        testTaskId,
        testCriteria,
      );

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(testTaskId);
      expect(result.criteria).toEqual(testCriteria);
      expect(result.addedCount).toBe(2);
      expect(result.totalCount).toBe(2);
      expect(mockBroadcastCriteriaUpdate).toHaveBeenCalledWith({
        action: 'added',
        taskId: testTaskId,
        criteria: testCriteria,
        addedCriteria: testCriteria,
        template: undefined,
      });
    });

    test('should append to existing criteria by default', async () => {
      const _existingCriteria = ['Existing Criterion'];
      mockTaskManager.getTask.mockResolvedValue({
        id: testTaskId,
        success_criteria: existingCriteria,
      });

      const _result = await successCriteriaManager.addCriteria(
        testTaskId,
        testCriteria,
      );

      expect(result.success).toBe(true);
      expect(result.criteria).toEqual([...existingCriteria, ...testCriteria]);
      expect(result.totalCount).toBe(3);
    });

    test('should replace existing criteria when replace option is true', async () => {
      const _existingCriteria = ['Existing Criterion'];
      mockTaskManager.getTask.mockResolvedValue({
        id: testTaskId,
        success_criteria: existingCriteria,
      });

      const _result = await successCriteriaManager.addCriteria(
        testTaskId,
        testCriteria,
        { replace: true },
      );

      expect(result.success).toBe(true);
      expect(result.criteria).toEqual(testCriteria);
      expect(result.totalCount).toBe(2);
    });

    test('should apply template when template option is provided', async () => {
      const _result = await successCriteriaManager.addCriteria(testTaskId, [], {
        template: 'basic',
      });

      expect(result.success).toBe(true);
      expect(result.criteria).toEqual(
        successCriteriaManager.defaultCriteriaTemplates.basic,
      );
      expect(mockBroadcastCriteriaUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'basic',
        }),
      );
    });

    test('should avoid duplicate criteria when appending', async () => {
      const _existingCriteria = ['Test Criterion 1'];
      const _newCriteria = ['Test Criterion 1', 'Test Criterion 2'];

      mockTaskManager.getTask.mockResolvedValue({
        id: testTaskId,
        success_criteria: existingCriteria,
      });

      const _result = await successCriteriaManager.addCriteria(
        testTaskId,
        newCriteria,
      );

      expect(result.success).toBe(true);
      expect(result.criteria).toEqual(['Test Criterion 1', 'Test Criterion 2']);
      expect(result.totalCount).toBe(2);
    });

    test('should handle single criterion string input', async () => {
      const _singleCriterion = 'Single Test Criterion';

      const _result = await successCriteriaManager.addCriteria(
        testTaskId,
        singleCriterion,
      );

      expect(result.success).toBe(true);
      expect(result.criteria).toEqual([singleCriterion]);
    });

    test('should return error when task does not exist', async () => {
      mockValidateTaskExists.mockResolvedValue({ valid: false });

      const _result = await successCriteriaManager.addCriteria(
        testTaskId,
        testCriteria,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found or invalid');
      expect(result.errorCode).toBe('TASK_NOT_FOUND');
    });

    test('should return error when criteria validation fails', async () => {
      mockValidateCriteria.mockReturnValue({
        valid: false,
        errors: ['Criterion too long', 'Empty criterion'],
      });

      const _result = await successCriteriaManager.addCriteria(
        testTaskId,
        testCriteria,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid success criteria');
      expect(result.errorCode).toBe('INVALID_CRITERIA');
    });

    test('should return error when task data retrieval fails', async () => {
      mockTaskManager.getTask.mockResolvedValue(null);

      const _result = await successCriteriaManager.addCriteria(
        testTaskId,
        testCriteria,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Could not retrieve task data');
      expect(result.errorCode).toBe('TASK_DATA_RETRIEVAL_FAILED');
    });

    test('should return error when criteria update fails', async () => {
      mockTaskManager.updateTaskSuccessCriteria.mockResolvedValue({
        success: false,
        error: 'Update operation failed',
      });

      const _result = await successCriteriaManager.addCriteria(
        testTaskId,
        testCriteria,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update success criteria');
      expect(result.errorCode).toBe('CRITERIA_UPDATE_FAILED');
    });

    test('should handle exceptions and return error response', async () => {
      mockWithTimeout.mockRejectedValue(new Error('Timeout occurred'));

      const _result = await successCriteriaManager.addCriteria(
        testTaskId,
        testCriteria,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Timeout occurred');
      expect(result.errorCode).toBe('CRITERIA_ADD_OPERATION_FAILED');
    });

    test('should include guide in response', async () => {
      const _result = await successCriteriaManager.addCriteria(
        testTaskId,
        testCriteria,
      );

      expect(result.guide).toBeDefined();
      expect(mockGetGuideForError).toHaveBeenCalledWith(
        'success-criteria-operations',
      );
    });

    test('should use fallback guide when guide retrieval fails', async () => {
      mockGetGuideForError.mockRejectedValue(new Error('Guide not found'));

      const _result = await successCriteriaManager.addCriteria(
        testTaskId,
        testCriteria,
      );

      expect(result.guide).toBeDefined();
      expect(mockGetFallbackGuide).toHaveBeenCalledWith(
        'success-criteria-operations',
      );
    });
  });

  describe('getCriteria Method', () => {
    const testTaskId = 'test_1234567890_abcdef';
    const testCriteria = ['Criterion 1', 'Criterion 2', 'Criterion 3'];

    beforeEach(() => {
      mockTaskManager.getTask.mockResolvedValue({
        id: testTaskId,
        success_criteria: testCriteria,
      });
    });

    test('should successfully retrieve criteria for existing task', async () => {
      const _result = await successCriteriaManager.getCriteria(testTaskId);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(testTaskId);
      expect(result.criteria).toEqual(testCriteria);
      expect(result.count).toBe(3);
      expect(mockValidateTaskExists).toHaveBeenCalledWith(testTaskId);
    });

    test('should return empty array for task with no criteria', async () => {
      mockTaskManager.getTask.mockResolvedValue({
        id: testTaskId,
        success_criteria: undefined,
      });

      const _result = await successCriteriaManager.getCriteria(testTaskId);

      expect(result.success).toBe(true);
      expect(result.criteria).toEqual([]);
      expect(result.count).toBe(0);
    });

    test('should detect applied template', async () => {
      mockTaskManager.getTask.mockResolvedValue({
        id: testTaskId,
        success_criteria: successCriteriaManager.defaultCriteriaTemplates.basic,
      });

      const _result = await successCriteriaManager.getCriteria(testTaskId);

      expect(result.success).toBe(true);
      expect(result.hasTemplate).toBe('basic');
    });

    test('should return null for hasTemplate when no template detected', async () => {
      const _result = await successCriteriaManager.getCriteria(testTaskId);

      expect(result.success).toBe(true);
      expect(result.hasTemplate).toBeNull();
    });

    test('should return error when task does not exist', async () => {
      mockValidateTaskExists.mockResolvedValue({ valid: false });

      const _result = await successCriteriaManager.getCriteria(testTaskId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      expect(result.errorCode).toBe('TASK_NOT_FOUND');
    });

    test('should return error when task data retrieval fails', async () => {
      mockTaskManager.getTask.mockResolvedValue(null);

      const _result = await successCriteriaManager.getCriteria(testTaskId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Could not retrieve task data');
      expect(result.errorCode).toBe('TASK_DATA_RETRIEVAL_FAILED');
    });

    test('should handle exceptions gracefully', async () => {
      mockWithTimeout.mockRejectedValue(new Error('Network timeout'));

      const _result = await successCriteriaManager.getCriteria(testTaskId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network timeout');
      expect(result.errorCode).toBe('CRITERIA_RETRIEVAL_FAILED');
    });
  });

  describe('updateCriteria Method', () => {
    test('should call addCriteria with replace option', async () => {
      const _testTaskId = 'test_1234567890_abcdef';
      const _newCriteria = ['New Criterion 1', 'New Criterion 2'];

      const _addCriteriaSpy = jest.spyOn(successCriteriaManager, 'addCriteria');
      addCriteriaSpy.mockResolvedValue({ success: true });

      await successCriteriaManager.updateCriteria(testTaskId, newCriteria);

      expect(addCriteriaSpy).toHaveBeenCalledWith(testTaskId, newCriteria, {
        replace: true,
      });
    });
  });

  describe('deleteCriterion Method', () => {
    const testTaskId = 'test_1234567890_abcdef';
    const testCriteria = ['Criterion 1', 'Criterion 2', 'Criterion 3'];

    beforeEach(() => {
      mockTaskManager.getTask.mockResolvedValue({
        id: testTaskId,
        success_criteria: testCriteria,
      });
      mockTaskManager.updateTaskSuccessCriteria.mockResolvedValue({
        success: true,
      });
    });

    test('should successfully delete existing criterion', async () => {
      const _criterionToDelete = 'Criterion 2';
      const _result = await successCriteriaManager.deleteCriterion(
        testTaskId,
        criterionToDelete,
      );

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(testTaskId);
      expect(result.deletedCriterion).toBe(criterionToDelete);
      expect(result.remainingCriteria).toEqual(['Criterion 1', 'Criterion 3']);
      expect(result.remainingCount).toBe(2);
      expect(mockBroadcastCriteriaUpdate).toHaveBeenCalledWith({
        action: 'deleted',
        taskId: testTaskId,
        criteria: ['Criterion 1', 'Criterion 3'],
        deletedCriterion: criterionToDelete,
      });
    });

    test('should return error when criterion does not exist', async () => {
      const _nonExistentCriterion = 'Non-existent Criterion';
      const _result = await successCriteriaManager.deleteCriterion(
        testTaskId,
        nonExistentCriterion,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found in task');
      expect(result.errorCode).toBe('CRITERION_NOT_FOUND');
    });

    test('should return error when task does not exist', async () => {
      mockValidateTaskExists.mockResolvedValue({ valid: false });

      const _result = await successCriteriaManager.deleteCriterion(
        testTaskId,
        'Any Criterion',
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('TASK_NOT_FOUND');
    });

    test('should return error when criteria update fails', async () => {
      mockTaskManager.updateTaskSuccessCriteria.mockResolvedValue({
        success: false,
        error: 'Database error',
      });

      const _result = await successCriteriaManager.deleteCriterion(
        testTaskId,
        'Criterion 1',
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update success criteria');
      expect(result.errorCode).toBe('CRITERIA_UPDATE_FAILED');
    });
  });

  describe('getProjectWideTemplates Method', () => {
    test('should return all available templates with descriptions', async () => {
      const _result = await successCriteriaManager.getProjectWideTemplates();

      expect(result.success).toBe(true);
      expect(result.templates).toHaveProperty('basic');
      expect(result.templates).toHaveProperty('comprehensive');
      expect(result.templates).toHaveProperty('enterprise');
      expect(result.availableTemplates).toEqual([
        'basic',
        'comprehensive',
        'enterprise',
      ]);

      // Check template structure
      expect(result.templates.basic).toHaveProperty('name', 'basic');
      expect(result.templates.basic).toHaveProperty('criteria');
      expect(result.templates.basic).toHaveProperty('count');
      expect(result.templates.basic).toHaveProperty('description');
      expect(result.templates.basic.count).toBe(4);
    });

    test('should include correct template descriptions', async () => {
      const _result = await successCriteriaManager.getProjectWideTemplates();

      expect(result.templates.basic.description).toContain(
        'Essential success criteria',
      );
      expect(result.templates.comprehensive.description).toContain(
        'Extended criteria',
      );
      expect(result.templates.enterprise.description).toContain(
        'Full enterprise-grade criteria',
      );
    });

    test('should handle exceptions in template retrieval', async () => {
      mockWithTimeout.mockRejectedValue(
        new Error('Template service unavailable'),
      );

      const _result = await successCriteriaManager.getProjectWideTemplates();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Template service unavailable');
      expect(result.errorCode).toBe('TEMPLATES_RETRIEVAL_FAILED');
    });
  });

  describe('applyProjectTemplate Method', () => {
    const testTaskId = 'test_1234567890_abcdef';

    test('should apply basic template successfully', async () => {
      const _addCriteriaSpy = jest.spyOn(successCriteriaManager, 'addCriteria');
      addCriteriaSpy.mockResolvedValue({ success: true });

      const _result = await successCriteriaManager.applyProjectTemplate(
        testTaskId,
        'basic',
        false,
      );

      expect(addCriteriaSpy).toHaveBeenCalledWith(
        testTaskId,
        successCriteriaManager.defaultCriteriaTemplates.basic,
        { replace: false, template: 'basic' },
      );
    });

    test('should apply template with replace option', async () => {
      const _addCriteriaSpy = jest.spyOn(successCriteriaManager, 'addCriteria');
      addCriteriaSpy.mockResolvedValue({ success: true });

      const _result = await successCriteriaManager.applyProjectTemplate(
        testTaskId,
        'enterprise',
        true,
      );

      expect(result.success).toBe(true);
      expect(addCriteriaSpy).toHaveBeenCalledWith(
        testTaskId,
        successCriteriaManager.defaultCriteriaTemplates.enterprise,
        { replace: true, template: 'enterprise' },
      );
    });

    test('should return error for unknown template', async () => {
      const _result = await successCriteriaManager.applyProjectTemplate(
        testTaskId,
        'unknown',
        false,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Template "unknown" not found');
      expect(result.errorCode).toBe('TEMPLATE_NOT_FOUND');
      expect(result.error).toContain(
        'Available templates: basic, comprehensive, enterprise',
      );
    });
  });

  describe('Private Helper Methods', () => {
    describe('_detectAppliedTemplate', () => {
      test('should detect basic template correctly', () => {
        const basicCriteria =
          successCriteriaManager.defaultCriteriaTemplates.basic;
        const detected =
          successCriteriaManager._detectAppliedTemplate(basicCriteria);
        expect(detected).toBe('basic');
      });

      test('should detect enterprise template correctly', () => {
        const enterpriseCriteria =
          successCriteriaManager.defaultCriteriaTemplates.enterprise;
        const detected =
          successCriteriaManager._detectAppliedTemplate(enterpriseCriteria);
        expect(detected).toBe('enterprise');
      });

      test('should return null for custom criteria', () => {
        const _customCriteria = ['Custom Criterion 1', 'Custom Criterion 2'];
        const detected =
          successCriteriaManager._detectAppliedTemplate(customCriteria);
        expect(detected).toBeNull();
      });

      test('should return null for partial template match', () => {
        const _partialCriteria = ['Linter Perfection', 'Build Success'];
        const detected =
          successCriteriaManager._detectAppliedTemplate(partialCriteria);
        expect(detected).toBeNull();
      });
    });

    describe('_getTemplateDescription', () => {
      test('should return correct descriptions for known templates', () => {
        expect(
          successCriteriaManager._getTemplateDescription('basic'),
        ).toContain('Essential');
        expect(
          successCriteriaManager._getTemplateDescription('comprehensive'),
        ).toContain('Extended');
        expect(
          successCriteriaManager._getTemplateDescription('enterprise'),
        ).toContain('Full enterprise');
      });

      test('should return default description for unknown template', () => {
        expect(successCriteriaManager._getTemplateDescription('unknown')).toBe(
          'Custom template',
        );
      });
    });

    describe('_defaultCriteriaValidator', () => {
      test('should validate correct criteria array', () => {
        const _validCriteria = ['Criterion 1', 'Criterion 2'];
        const result =
          successCriteriaManager._defaultCriteriaValidator(validCriteria);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should reject non-array input', () => {
        const result =
          successCriteriaManager._defaultCriteriaValidator('not an array');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Success criteria must be an array');
      });

      test('should reject empty array', () => {
        const _result = successCriteriaManager._defaultCriteriaValidator([]);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'At least one success criterion is required',
        );
      });

      test('should reject non-string criteria', () => {
        const _result = successCriteriaManager._defaultCriteriaValidator([
          'valid',
          123,
          'also valid',
        ]);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Success criterion at index 1 must be a string',
        );
      });

      test('should reject empty string criteria', () => {
        const _result = successCriteriaManager._defaultCriteriaValidator([
          'valid',
          '',
          'also valid',
        ]);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Success criterion at index 1 cannot be empty',
        );
      });

      test('should reject overly long criteria', () => {
        const _longCriterion = 'a'.repeat(201);
        const _result = successCriteriaManager._defaultCriteriaValidator([
          longCriterion,
        ]);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Success criterion at index 0 is too long (max 200 characters)',
        );
      });

      test('should reject duplicate criteria', () => {
        const _result = successCriteriaManager._defaultCriteriaValidator([
          'Criterion 1',
          'Criterion 2',
          'Criterion 1',
        ]);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Success criteria must be unique (no duplicates)',
        );
      });
    });

    describe('_defaultTaskExistsValidator', () => {
      test('should validate existing task', async () => {
        const _testTask = { id: 'test_123', title: 'Test Task' };
        mockTaskManager.getTask.mockResolvedValue(testTask);

        const result =
          await successCriteriaManager._defaultTaskExistsValidator('test_123');
        expect(result.valid).toBe(true);
        expect(result.task).toBe(testTask);
      });

      test('should invalidate non-existent task', async () => {
        mockTaskManager.getTask.mockResolvedValue(null);

        const result =
          await successCriteriaManager._defaultTaskExistsValidator('test_123');
        expect(result.valid).toBe(false);
      });

      test('should handle task retrieval errors', async () => {
        mockTaskManager.getTask.mockRejectedValue(
          new Error('Database connection failed'),
        );

        const result =
          await successCriteriaManager._defaultTaskExistsValidator('test_123');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Database connection failed');
      });
    });
  });

  describe('Performance and Reliability', () => {
    test('should handle concurrent criteria operations', async () => {
      const _testTaskId = 'test_1234567890_abcdef';
      const _operations = [];

      mockTaskManager.getTask.mockResolvedValue({
        id: testTaskId,
        success_criteria: [],
      });
      mockTaskManager.updateTaskSuccessCriteria.mockResolvedValue({
        success: true,
      });

      // Simulate concurrent operations
      for (let i = 0; i < 10; i++) {
        operations.push(
          successCriteriaManager.addCriteria(testTaskId, [`Criterion ${i}`]),
        );
      }

      const _results = await Promise.all(operations);
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });

    test('should maintain consistency under high load', async () => {
      const _testTaskId = 'test_1234567890_abcdef';
      let callCount = 0;

      mockTaskManager.getTask.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          id: testTaskId,
          success_criteria: [`Existing Criterion ${callCount}`],
        });
      });
      mockTaskManager.updateTaskSuccessCriteria.mockResolvedValue({
        success: true,
      });

      const _operations = Array.from({ length: 50 }, (_, i) =>
        successCriteriaManager.addCriteria(testTaskId, [`New Criterion ${i}`]),
      );

      const _results = await Promise.all(operations);

      // All operations should succeed
      expect(results.every((r) => r.success)).toBe(true);

      // TaskManager should be called for each operation
      expect(mockTaskManager.getTask).toHaveBeenCalledTimes(50);
      expect(mockTaskManager.updateTaskSuccessCriteria).toHaveBeenCalledTimes(
        50,
      );
    });

    test('should handle timeout scenarios gracefully', async () => {
      const _testTaskId = 'test_1234567890_abcdef';
      mockWithTimeout.mockImplementation((_operation) => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), 100);
        });
      });

      const _result = await successCriteriaManager.addCriteria(testTaskId, [
        'Test Criterion',
      ]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Operation timeout');
      expect(result.errorCode).toBe('CRITERIA_ADD_OPERATION_FAILED');
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    test('should handle malformed task data gracefully', async () => {
      const _testTaskId = 'test_1234567890_abcdef';
      mockTaskManager.getTask.mockResolvedValue({
        id: testTaskId,
        success_criteria: 'invalid_format', // Should be array
      });

      const _result = await successCriteriaManager.getCriteria(testTaskId);

      // Should still work but return the malformed data as-is
      expect(result.success).toBe(true);
      expect(result.criteria).toBe('invalid_format');
    });

    test('should handle extremely large criteria arrays', async () => {
      const _testTaskId = 'test_1234567890_abcdef';
      const _largeCriteriaArray = Array.from(
        { length: 1000 },
        (_, i) => `Criterion ${i}`,
      );

      mockTaskManager.getTask.mockResolvedValue({
        id: testTaskId,
        success_criteria: [],
      });
      mockTaskManager.updateTaskSuccessCriteria.mockResolvedValue({
        success: true,
      });

      const _result = await successCriteriaManager.addCriteria(
        testTaskId,
        largeCriteriaArray,
      );

      expect(result.success).toBe(true);
      expect(result.criteria).toHaveLength(1000);
    });

    test('should handle special characters in criteria text', async () => {
      const _testTaskId = 'test_1234567890_abcdef';
      const _specialCriteria = [
        'Criterion with "quotes"',
        "Criterion with 'single quotes'",
        'Criterion with \n newlines',
        'Criterion with émojis 🚀',
        'Criterion with <HTML> tags',
      ];

      mockTaskManager.getTask.mockResolvedValue({
        id: testTaskId,
        success_criteria: [],
      });
      mockTaskManager.updateTaskSuccessCriteria.mockResolvedValue({
        success: true,
      });

      const _result = await successCriteriaManager.addCriteria(
        testTaskId,
        specialCriteria,
      );

      expect(result.success).toBe(true);
      expect(result.criteria).toEqual(specialCriteria);
    });

    test('should handle network interruption scenarios', async () => {
      const _testTaskId = 'test_1234567890_abcdef';

      // Simulate network failure on task retrieval
      mockTaskManager.getTask.mockRejectedValue(
        new Error('Network unreachable'),
      );

      const _result = await successCriteriaManager.getCriteria(testTaskId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network unreachable');
      expect(result.errorCode).toBe('CRITERIA_RETRIEVAL_FAILED');
    });
  });

  describe('Integration Points', () => {
    test('should properly interact with timeout wrapper', async () => {
      const _testTaskId = 'test_1234567890_abcdef';
      const _testCriteria = ['Test Criterion'];

      mockTaskManager.getTask.mockResolvedValue({
        id: testTaskId,
        success_criteria: [],
      });
      mockTaskManager.updateTaskSuccessCriteria.mockResolvedValue({
        success: true,
      });

      await successCriteriaManager.addCriteria(testTaskId, testCriteria);

      expect(mockWithTimeout).toHaveBeenCalled();
      // Check that withTimeout was called with something that can be executed
      const _callArg = mockWithTimeout.mock.calls[0][0];
      expect(
        typeof callArg === 'function' ||
          (callArg && typeof callArg.then === 'function'),
      ).toBe(true);
    });

    test('should broadcast criteria updates correctly', async () => {
      const _testTaskId = 'test_1234567890_abcdef';
      const _testCriteria = ['Test Criterion'];

      mockTaskManager.getTask.mockResolvedValue({
        id: testTaskId,
        success_criteria: [],
      });
      mockTaskManager.updateTaskSuccessCriteria.mockResolvedValue({
        success: true,
      });

      await successCriteriaManager.addCriteria(testTaskId, testCriteria);

      expect(mockBroadcastCriteriaUpdate).toHaveBeenCalledWith({
        action: 'added',
        taskId: testTaskId,
        criteria: testCriteria,
        addedCriteria: testCriteria,
        template: undefined,
      });
    });

    test('should use custom validators when provided', async () => {
      const _customValidator = jest
        .fn()
        .mockReturnValue({ valid: true, errors: [] });

      const _customDependencies = {
        ...mockDependencies,
        validateCriteria: customValidator,
      };

      const _customManager = new SuccessCriteriaManager(customDependencies);

      mockTaskManager.getTask.mockResolvedValue({
        id: 'test_123',
        success_criteria: [],
      });
      mockTaskManager.updateTaskSuccessCriteria.mockResolvedValue({
        success: true,
      });

      await customManager.addCriteria('test_123', ['Test Criterion']);

      expect(customValidator).toHaveBeenCalledWith(['Test Criterion']);
    });
  });
});
