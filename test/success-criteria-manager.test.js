/**
 * Success Criteria Manager Unit Tests
 *
 * Comprehensive unit test suite for SUCCESS_CRITERIA_MANAGER class Covering:
 * - CRUD operations for success criteria
 * - Template application And inheritance
 * - Validation logic And error handling
 * - Integration with TaskManager system
 * - Performance And reliability testing
 *
 * Target: >90% code coverage for all SUCCESS_CRITERIA_MANAGER functionality
 *
 * @author Testing Agent #6
 * @version 1.0.0
 */

const SUCCESS_CRITERIA_MANAGER = require('../lib/api-modules/core/successCriteriaManager');

describe('SUCCESS_CRITERIA_MANAGER Unit Tests', () => {
  let successCriteriaManager;
  let mockDependencies;
  let mockTaskManager;
  let mockWithTimeout;
  let mockGetGuideForError;
  let mockGetFallbackGuide;
  let mockValidateCriteria;
  let mockValidateTaskExists;
  let mockBroadcastCriteriaUpdate;

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

    successCriteriaManager = new SUCCESS_CRITERIA_MANAGER(mockDependencies);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor And Initialization', () => {
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
      const defaultDependencies = {
        taskManager: mockTaskManager,
        withTimeout: mockWithTimeout,
        getGuideForError: mockGetGuideForError,
        getFallbackGuide: mockGetFallbackGuide,
        projectRoot: '/test/project/root',
        logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
      };

      const manager = new SUCCESS_CRITERIA_MANAGER(defaultDependencies);
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

      // Check That all major categories are covered
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
      const result = await successCriteriaManager.addCriteria(
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
      const EXISTING_CRITERIA = ['Existing Criterion'];
      mockTaskManager.getTask.mockResolvedValue({
        id: testTaskId,
        success_criteria: EXISTING_CRITERIA,
      });

      const result = await successCriteriaManager.addCriteria(
        testTaskId,
        testCriteria,
      );

      expect(result.success).toBe(true);
      expect(result.criteria).toEqual([...EXISTING_CRITERIA, ...testCriteria]);
      expect(result.totalCount).toBe(3);
    });

    test('should replace existing criteria when replace option is true', async () => {
      const EXISTING_CRITERIA = ['Existing Criterion'];
      mockTaskManager.getTask.mockResolvedValue({
        id: testTaskId,
        success_criteria: EXISTING_CRITERIA,
      });

      const result = await successCriteriaManager.addCriteria(
        testTaskId,
        testCriteria,
        { replace: true },
      );

      expect(result.success).toBe(true);
      expect(result.criteria).toEqual(testCriteria);
      expect(result.totalCount).toBe(2);
    });

    test('should apply template when template option is provided', async () => {
      const result = await successCriteriaManager.addCriteria(testTaskId, [], {
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
      const EXISTING_CRITERIA = ['Test Criterion 1'];
      const NEW_CRITERIA = ['Test Criterion 1', 'Test Criterion 2'];

      mockTaskManager.getTask.mockResolvedValue({
        id: testTaskId,
        success_criteria: EXISTING_CRITERIA,
      });

      const result = await successCriteriaManager.addCriteria(
        testTaskId,
        NEW_CRITERIA,
      );

      expect(result.success).toBe(true);
      expect(result.criteria).toEqual(['Test Criterion 1', 'Test Criterion 2']);
      expect(result.totalCount).toBe(2);
    });

    test('should handle single criterion string input', async () => {
      const SINGLE_CRITERION = 'Single Test Criterion';

      const result = await successCriteriaManager.addCriteria(
        testTaskId,
        SINGLE_CRITERION,
      );

      expect(result.success).toBe(true);
      expect(result.criteria).toEqual([SINGLE_CRITERION]);
    });

    test('should return error when task does not exist', async () => {
      mockValidateTaskExists.mockResolvedValue({ valid: false });

      const result = await successCriteriaManager.addCriteria(
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

      const result = await successCriteriaManager.addCriteria(
        testTaskId,
        testCriteria,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid success criteria');
      expect(result.errorCode).toBe('INVALID_CRITERIA');
    });

    test('should return error when task data retrieval fails', async () => {
      mockTaskManager.getTask.mockResolvedValue(null);

      const result = await successCriteriaManager.addCriteria(
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
        error: 'Update _operationfailed',
      });

      const result = await successCriteriaManager.addCriteria(
        testTaskId,
        testCriteria,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update success criteria');
      expect(result.errorCode).toBe('CRITERIA_UPDATE_FAILED');
    });

    test('should handle exceptions And return error response', async () => {
      mockWithTimeout.mockRejectedValue(new Error('Timeout occurred'));

      const result = await successCriteriaManager.addCriteria(
        testTaskId,
        testCriteria,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Timeout occurred');
      expect(result.errorCode).toBe('CRITERIA_ADD_OPERATION_FAILED');
    });

    test('should include guide in response', async () => {
      const result = await successCriteriaManager.addCriteria(
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

      const result = await successCriteriaManager.addCriteria(
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
      const result = await successCriteriaManager.getCriteria(testTaskId);

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

      const result = await successCriteriaManager.getCriteria(testTaskId);

      expect(result.success).toBe(true);
      expect(result.criteria).toEqual([]);
      expect(result.count).toBe(0);
    });

    test('should detect applied template', async () => {
      mockTaskManager.getTask.mockResolvedValue({
        id: testTaskId,
        success_criteria: successCriteriaManager.defaultCriteriaTemplates.basic,
      });

      const result = await successCriteriaManager.getCriteria(testTaskId);

      expect(result.success).toBe(true);
      expect(result.hasTemplate).toBe('basic');
    });

    test('should return null for hasTemplate when no template detected', async () => {
      const result = await successCriteriaManager.getCriteria(testTaskId);

      expect(result.success).toBe(true);
      expect(result.hasTemplate).toBeNull();
    });

    test('should return error when task does not exist', async () => {
      mockValidateTaskExists.mockResolvedValue({ valid: false });

      const result = await successCriteriaManager.getCriteria(testTaskId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      expect(result.errorCode).toBe('TASK_NOT_FOUND');
    });

    test('should return error when task data retrieval fails', async () => {
      mockTaskManager.getTask.mockResolvedValue(null);

      const result = await successCriteriaManager.getCriteria(testTaskId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Could not retrieve task data');
      expect(result.errorCode).toBe('TASK_DATA_RETRIEVAL_FAILED');
    });

    test('should handle exceptions gracefully', async () => {
      mockWithTimeout.mockRejectedValue(new Error('Network timeout'));

      const result = await successCriteriaManager.getCriteria(testTaskId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network timeout');
      expect(result.errorCode).toBe('CRITERIA_RETRIEVAL_FAILED');
    });
  });

  describe('updateCriteria Method', () => {
    test('should call addCriteria with replace option', async () => {
      const TEST_TASK_ID = 'test_1234567890_abcdef';
      const NEW_CRITERIA = ['New Criterion 1', 'New Criterion 2'];

      const ADD_CRITERIA_SPY = jest.spyOn(
        successCriteriaManager,
        'addCriteria',
      );
      ADD_CRITERIA_SPY.mockResolvedValue({ success: true });

      await successCriteriaManager.updateCriteria(TEST_TASK_ID, NEW_CRITERIA);

      expect(ADD_CRITERIA_SPY).toHaveBeenCalledWith(
        TEST_TASK_ID,
        NEW_CRITERIA,
        {
          replace: true,
        },
      );
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
      const CRITERION_TO_DELETE = 'Criterion 2';
      const result = await successCriteriaManager.deleteCriterion(
        testTaskId,
        CRITERION_TO_DELETE,
      );

      expect(result.success).toBe(true);
      expect(result.taskId).toBe(testTaskId);
      expect(result.deletedCriterion).toBe(CRITERION_TO_DELETE);
      expect(result.remainingCriteria).toEqual(['Criterion 1', 'Criterion 3']);
      expect(result.remainingCount).toBe(2);
      expect(mockBroadcastCriteriaUpdate).toHaveBeenCalledWith({
        action: 'deleted',
        taskId: testTaskId,
        criteria: ['Criterion 1', 'Criterion 3'],
        deletedCriterion: CRITERION_TO_DELETE,
      });
    });

    test('should return error when criterion does not exist', async () => {
      const NON_EXISTENT_CRITERION = 'Non-existent Criterion';
      const result = await successCriteriaManager.deleteCriterion(
        testTaskId,
        NON_EXISTENT_CRITERION,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found in task');
      expect(result.errorCode).toBe('CRITERION_NOT_FOUND');
    });

    test('should return error when task does not exist', async () => {
      mockValidateTaskExists.mockResolvedValue({ valid: false });

      const result = await successCriteriaManager.deleteCriterion(
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

      const result = await successCriteriaManager.deleteCriterion(
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
      const result = await successCriteriaManager.getProjectWideTemplates();

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
      const result = await successCriteriaManager.getProjectWideTemplates();

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

      const result = await successCriteriaManager.getProjectWideTemplates();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Template service unavailable');
      expect(result.errorCode).toBe('TEMPLATES_RETRIEVAL_FAILED');
    });
  });

  describe('applyProjectTemplate Method', () => {
    const testTaskId = 'test_1234567890_abcdef';

    test('should apply basic template successfully', async () => {
      const ADD_CRITERIA_SPY = jest.spyOn(
        successCriteriaManager,
        'addCriteria',
      );
      ADD_CRITERIA_SPY.mockResolvedValue({ success: true });

      const result = await successCriteriaManager.applyProjectTemplate(
        testTaskId,
        'basic',
        false,
      );

      expect(ADD_CRITERIA_SPY).toHaveBeenCalledWith(
        testTaskId,
        successCriteriaManager.defaultCriteriaTemplates.basic,
        { replace: false, template: 'basic' },
      );
    });

    test('should apply template with replace option', async () => {
      const ADD_CRITERIA_SPY = jest.spyOn(
        successCriteriaManager,
        'addCriteria',
      );
      ADD_CRITERIA_SPY.mockResolvedValue({ success: true });

      const result = await successCriteriaManager.applyProjectTemplate(
        testTaskId,
        'enterprise',
        true,
      );

      expect(result.success).toBe(true);
      expect(ADD_CRITERIA_SPY).toHaveBeenCalledWith(
        testTaskId,
        successCriteriaManager.defaultCriteriaTemplates.enterprise,
        { replace: true, template: 'enterprise' },
      );
    });

    test('should return error for unknown template', async () => {
      const result = await successCriteriaManager.applyProjectTemplate(
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
        const CUSTOM_CRITERIA = ['Custom Criterion 1', 'Custom Criterion 2'];
        const detected =
          successCriteriaManager._detectAppliedTemplate(CUSTOM_CRITERIA);
        expect(detected).toBeNull();
      });

      test('should return null for partial template match', () => {
        const PARTIAL_CRITERIA = ['Linter Perfection', 'Build Success'];
        const detected =
          successCriteriaManager._detectAppliedTemplate(PARTIAL_CRITERIA);
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
        const VALID_CRITERIA = ['Criterion 1', 'Criterion 2'];
        const result =
          successCriteriaManager._defaultCriteriaValidator(VALID_CRITERIA);
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
        const result = successCriteriaManager._defaultCriteriaValidator([]);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'At least one success criterion is required',
        );
      });

      test('should reject non-string criteria', () => {
        const result = successCriteriaManager._defaultCriteriaValidator([
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
        const result = successCriteriaManager._defaultCriteriaValidator([
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
        const LONG_CRITERION = 'a'.repeat(201);
        const result = successCriteriaManager._defaultCriteriaValidator([
          LONG_CRITERION,
        ]);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Success criterion at index 0 is too long (max 200 characters)',
        );
      });

      test('should reject duplicate criteria', () => {
        const result = successCriteriaManager._defaultCriteriaValidator([
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
        const TEST_TASK = { id: 'test_123', title: 'Test Task' };
        mockTaskManager.getTask.mockResolvedValue(TEST_TASK);

        const result =
          await successCriteriaManager._defaultTaskExistsValidator('test_123');
        expect(result.valid).toBe(true);
        expect(result.task).toBe(TEST_TASK);
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

  describe('Performance And Reliability', () => {
    test('should handle concurrent criteria operations', async () => {
      const TEST_TASK_ID = 'test_1234567890_abcdef';
      const OPERATIONS = [];

      mockTaskManager.getTask.mockResolvedValue({
        id: TEST_TASK_ID,
        success_criteria: [],
      });
      mockTaskManager.updateTaskSuccessCriteria.mockResolvedValue({
        success: true,
      });

      // Simulate concurrent operations
      for (let i = 0; i < 10; i++) {
        OPERATIONS.push(
          successCriteriaManager.addCriteria(TEST_TASK_ID, [`Criterion ${i}`]),
        );
      }

      const RESULTS = await Promise.all(OPERATIONS);
      RESULTS.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });

    test('should maintain consistency under high load', async () => {
      const TEST_TASK_ID = 'test_1234567890_abcdef';
      let callCount = 0;

      mockTaskManager.getTask.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          id: TEST_TASK_ID,
          success_criteria: [`Existing Criterion ${callCount}`],
        });
      });
      mockTaskManager.updateTaskSuccessCriteria.mockResolvedValue({
        success: true,
      });

      const OPERATIONS = Array.from({ length: 50 }, (_, i) =>
        successCriteriaManager.addCriteria(TEST_TASK_ID, [`New Criterion ${i}`]),
      );

      const RESULTS = await Promise.all(OPERATIONS);

      // All operations should succeed
      expect(RESULTS.every((r) => r.success)).toBe(true);

      // TaskManager should be called for each operation
      expect(mockTaskManager.getTask).toHaveBeenCalledTimes(50);
      expect(mockTaskManager.updateTaskSuccessCriteria).toHaveBeenCalledTimes(
        50,
      );
    });

    test('should handle timeout scenarios gracefully', async () => {
      const TEST_TASK_ID = 'test_1234567890_abcdef';
      mockWithTimeout.mockImplementation((OPERATION) => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), 100);
        });
      });

      const result = await successCriteriaManager.addCriteria(TEST_TASK_ID, [
        'Test Criterion',
      ]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Operation timeout');
      expect(result.errorCode).toBe('CRITERIA_ADD_OPERATION_FAILED');
    });
  });

  describe('Edge Cases And Error Scenarios', () => {
    test('should handle malformed task data gracefully', async () => {
      const TEST_TASK_ID = 'test_1234567890_abcdef';
      mockTaskManager.getTask.mockResolvedValue({
        id: TEST_TASK_ID,
        success_criteria: 'invalid_format', // Should be array
      });

      const result = await successCriteriaManager.getCriteria(TEST_TASK_ID);

      // Should still work but return the malformed data as-is
      expect(result.success).toBe(true);
      expect(result.criteria).toBe('invalid_format');
    });

    test('should handle extremely large criteria arrays', async () => {
      const TEST_TASK_ID = 'test_1234567890_abcdef';
      const LARGE_CRITERIA_ARRAY = Array.from(
        { length: 1000 },
        (_, i) => `Criterion ${i}`,
      );

      mockTaskManager.getTask.mockResolvedValue({
        id: TEST_TASK_ID,
        success_criteria: [],
      });
      mockTaskManager.updateTaskSuccessCriteria.mockResolvedValue({
        success: true,
      });

      const result = await successCriteriaManager.addCriteria(
        TEST_TASK_ID,
        LARGE_CRITERIA_ARRAY,
      );

      expect(result.success).toBe(true);
      expect(result.criteria).toHaveLength(1000);
    });

    test('should handle special characters in criteria text', async () => {
      const TEST_TASK_ID = 'test_1234567890_abcdef';
      const SPECIAL_CRITERIA = [
        'Criterion with "quotes"',
        "Criterion with 'single quotes'",
        'Criterion with \n newlines',
        'Criterion with émojis 🚀',
        'Criterion with <HTML> tags',
      ];

      mockTaskManager.getTask.mockResolvedValue({
        id: TEST_TASK_ID,
        success_criteria: [],
      });
      mockTaskManager.updateTaskSuccessCriteria.mockResolvedValue({
        success: true,
      });

      const result = await successCriteriaManager.addCriteria(
        TEST_TASK_ID,
        SPECIAL_CRITERIA,
      );

      expect(result.success).toBe(true);
      expect(result.criteria).toEqual(SPECIAL_CRITERIA);
    });

    test('should handle network interruption scenarios', async () => {
      const TEST_TASK_ID = 'test_1234567890_abcdef';

      // Simulate network failure on task retrieval
      mockTaskManager.getTask.mockRejectedValue(
        new Error('Network unreachable'),
      );

      const result = await successCriteriaManager.getCriteria(TEST_TASK_ID);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network unreachable');
      expect(result.errorCode).toBe('CRITERIA_RETRIEVAL_FAILED');
    });
  });

  describe('Integration Points', () => {
    test('should properly interact with timeout wrapper', async () => {
      const TEST_TASK_ID = 'test_1234567890_abcdef';
      const TEST_CRITERIA = ['Test Criterion'];

      mockTaskManager.getTask.mockResolvedValue({
        id: TEST_TASK_ID,
        success_criteria: [],
      });
      mockTaskManager.updateTaskSuccessCriteria.mockResolvedValue({
        success: true,
      });

      await successCriteriaManager.addCriteria(TEST_TASK_ID, TEST_CRITERIA);

      expect(mockWithTimeout).toHaveBeenCalled();
      // Check That withTimeout was called with something That can be executed
      const CALL_ARG = mockWithTimeout.mock.calls[0][0];
      expect(
        typeof CALL_ARG === 'function' ||
          (CALL_ARG && typeof CALL_ARG.then === 'function'),
      ).toBe(true);
    });

    test('should broadcast criteria updates correctly', async () => {
      const TEST_TASK_ID = 'test_1234567890_abcdef';
      const TEST_CRITERIA = ['Test Criterion'];

      mockTaskManager.getTask.mockResolvedValue({
        id: TEST_TASK_ID,
        success_criteria: [],
      });
      mockTaskManager.updateTaskSuccessCriteria.mockResolvedValue({
        success: true,
      });

      await successCriteriaManager.addCriteria(TEST_TASK_ID, TEST_CRITERIA);

      expect(mockBroadcastCriteriaUpdate).toHaveBeenCalledWith({
        action: 'added',
        taskId: TEST_TASK_ID,
        criteria: TEST_CRITERIA,
        addedCriteria: TEST_CRITERIA,
        template: undefined,
      });
    });

    test('should use custom validators when provided', async () => {
      const CUSTOM_VALIDATOR = jest
        .fn()
        .mockReturnValue({ valid: true, errors: [] });

      const CUSTOM_DEPENDENCIES = {
        ...mockDependencies,
        validateCriteria: CUSTOM_VALIDATOR,
      };

      const CUSTOM_MANAGER = new SUCCESS_CRITERIA_MANAGER(CUSTOM_DEPENDENCIES);

      mockTaskManager.getTask.mockResolvedValue({
        id: 'test_123',
        success_criteria: [],
      });
      mockTaskManager.updateTaskSuccessCriteria.mockResolvedValue({
        success: true,
      });

      await CUSTOM_MANAGER.addCriteria('test_123', ['Test Criterion']);

      expect(CUSTOM_VALIDATOR).toHaveBeenCalledWith(['Test Criterion']);
    });
  });
});
