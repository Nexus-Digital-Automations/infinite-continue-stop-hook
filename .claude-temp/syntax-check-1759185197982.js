/**
 * Comprehensive Unit Tests for Verification Endpoints
 *
 * Tests the humble code verification protocol endpoints as implemented in TaskManager API:
 * - get-verification-requirements: Retrieves verification requirements for tasks
 * - submit-verification-evidence: Submits evidence for verification gate approval
 * - Evidence validation and status transitions
 * - Error handling for invalid inputs and edge cases
 *
 * This validates the implementation of the "Implement Humble Code Verification Protocol Endpoints" feature.
 */

const FS = require('fs');
const path = require('path');
    const { execSync: _EXEC_SYNC } = require('child_process');
const AutonomousTaskManagerAPI = require('../../taskmanager-api');

// Mock fs module for controlled testing
jest.mock('fs', () => ({
    promises:, {
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn()},
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue('{}'),
  copyFileSync: jest.fn(),
  statSync: jest.fn().mockReturnValue({ mtime: new Date() }),
  unlinkSync: jest.fn(),
  appendFileSync: jest.fn()}));

// Mock execSync to prevent actual command execution
jest.mock('child_process', () => ({
    execSync: jest.fn()}));

// Mock sqlite3 to prevent native binding issues
jest.mock('sqlite3', () => ({
    verbose: jest.fn(() => ({
    Database: jest.fn().mockImplementation(() => ({
    close: jest.fn(),
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn()}))}))}));

// Mock the RAG database to prevent SQLite dependencies
jest.mock('../../lib/rag-database.js', () => {
  const mockRagDatabase = jest.fn().mockImplementation(() => ({
    storeLesson: jest.fn(),
    searchLessons: jest.fn(),
    storeError: jest.fn(),
    findSimilarErrors: jest.fn()}));

  // Export as both named export and default to handle different import patterns
  return mockRagDatabase;
});

// Mock the RAG operations module
jest.mock('../../lib/api-modules/rag/ragOperations.js', () => {
  return jest.fn().mockImplementation(() => ({
    storeLesson: jest.fn(),
    searchLessons: jest.fn(),
    storeError: jest.fn(),
    findSimilarErrors: jest.fn()}));
});

describe('Verification Endpoints', () => {
    
    
  let api;
  let mockFs;
  let testProjectRoot;
  let testTasksPath;

  beforeEach(() 
    return () 
    return () =>, {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup test environment
    testProjectRoot = '/test/project';
    testTasksPath = path.join(testProjectRoot, 'TASKS.json');

    // Create API instance
    api = new AutonomousTaskManagerAPI(testProjectRoot);

    // Setup fs mock references
    mockFs = FS.promises;
});

  describe('get-verification-requirements', () => {
    
    
    it('should successfully retrieve verification requirements for a task', async () 
    return () 
    return () => {
      // Setup test data;
const testTask = {
    id: 'task_123',
        title: 'Test Task',
        verificationGate: {
    status: 'pending',
          requirements: [
           , {
    type: 'file',
              description: 'Review existing codebase patterns',
              critical: true},
            {
    type: 'function',
              description: 'Review API patterns and error handling',
              critical: true}],
          verifiedAt: null,
          verifiedBy: null}
};

      const mockTasksData = {
    tasks: [testTask],
        metadata:, { version: '2.0.0' }};

      // Mock file system responses
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTasksData));

      // Execute test;
const RESULT = await api.getVerificationRequirements('task_123');

      // Verify results
      expect(RESULT.success).toBe(true);
      expect(RESULT.taskId).toBe('task_123');
      expect(RESULT.title).toBe('Test Task');
      expect(RESULT.verificationGate.status).toBe('pending');
      expect(RESULT.verificationGate.requirements).toHaveLength(2);
      expect(RESULT.verificationGate.requirements[0].type).toBe('file');
      expect(RESULT.verificationGate.requirements[1].type).toBe('function');
      expect(RESULT.message).toBe(
        'Verification requirements retrieved successfully',
      );
    });

    it('should throw error when task ID does not exist', async () => {
      // Setup mock data without the requested task;
const mockTasksData = {
    tasks: [
          {
    id: 'other_task',
            title: 'Other Task',
            verificationGate:, { status: 'pending', requirements: [] }}],
        metadata: { version: '2.0.0' }};

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTasksData));

      // Execute test and expect error
      await expect(
        api.getVerificationRequirements('nonexistent_task'),
      ).rejects.toThrow(
        'Failed to get verification requirements: Task with ID nonexistent_task not found',
      );
    });

    it('should throw error when task has no verification gate', async () => {
      // Setup task without verification gate;
const testTask =, {
    id: 'task_123',
        title: 'Task Without Verification',
        // No verificationGate property
      };

      const mockTasksData = {
    tasks: [testTask],
        metadata:, { version: '2.0.0' }};

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTasksData));

      // Execute test and expect error
      await expect(api.getVerificationRequirements('task_123')).rejects.toThrow(
        'Failed to get verification requirements: Task task_123 does not have verification requirements',
      );
    });

    it('should throw error when no tasks exist in system', async () => {
      // Setup data without tasks;
const mockTasksData = {
    metadata:, { version: '2.0.0' },
        // No tasks property
      };

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTasksData));

      // Execute test and expect error
      await expect(api.getVerificationRequirements('task_123')).rejects.toThrow(
        'Failed to get verification requirements: No tasks exist in the system',
      );
    });
});

  describe('submit-verification-evidence', () => {
    
    
    it('should successfully submit valid verification evidence', async () 
    return () 
    return () => {
      // Setup test data;
const testTask = {
    id: 'task_123',
        title: 'Test Task',
        verificationGate: {
    status: 'pending',
          requirements: [
           , {
    type: 'file',
              description: 'Review existing codebase patterns',
              critical: true}],
          evidence: null,
          verifiedAt: null,
          verifiedBy: null},
        updated_at: '2025-09-28T01:00:00.000Z'};

      const mockTasksData = {
    tasks: [testTask],
        metadata:, { version: '2.0.0' }};

      const validEvidence = {
    agentId: 'test_agent_001',
        reviewedItems: [
         , {
    type: 'file',
            description: 'Reviewed taskmanager-api.js for patterns',
            details: 'Examined existing API structure and conventions'}],
        summary:
          'Successfully reviewed existing codebase patterns and API conventions'};

      // Mock file system operations
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTasksData));
      mockFs.writeFile.mockResolvedValue(undefined);

      // Execute test;
const RESULT = await api.submitVerificationEvidence(
        'task_123',
        validEvidence,
      );

      // Verify results
      expect(RESULT.success).toBe(true);
      expect(RESULT.taskId).toBe('task_123');
      expect(RESULT.verificationGate.status).toBe('passed');
      expect(RESULT.verificationGate.evidence).toEqual(validEvidence);
      expect(RESULT.verificationGate.verifiedBy).toBe('test_agent_001');
      expect(RESULT.verificationGate.verifiedAt).toBeTruthy();
      expect(RESULT.message).toBe(
        'Verification evidence submitted successfully',
      );

      // Verify file write was called for the tasks file (not the lock file)
      const tasksWriteCall = mockFs.writeFile.mock.calls.find(
        (call) =>
          call[0] === testTasksPath && call[1].includes('"status":"passed"'),
      );
      expect(tasksWriteCall).toBeDefined();
      expect(tasksWriteCall[1]).toContain('"status":"passed"');
    });

    it('should reject evidence when verification gate already passed', async () => {
      // Setup task with already passed verification;
const testTask = {
    id: 'task_123',
        title: 'Test Task',
        verificationGate: {
    status: 'passed',
          requirements: [
           , {
    type: 'file',
              description: 'Review existing codebase patterns',
              critical: true}],
          evidence: { agentId: 'previous_agent' },
          verifiedAt: '2025-09-28T01:00:00.000Z',
          verifiedBy: 'previous_agent'}
};

      const mockTasksData = {
    tasks: [testTask],
        metadata:, { version: '2.0.0' }};

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTasksData));

      const validEvidence = {
    agentId: 'test_agent_001',
        reviewedItems: [{ type: 'file', description: 'Review attempt' }],
        summary: 'Attempting to verify already passed gate'};

      // Execute test and expect error
      await expect(
        api.submitVerificationEvidence('task_123', validEvidence),
      ).rejects.toThrow(
        'Failed to submit verification evidence: Task task_123 verification gate has already passed',
      );
    });

    it('should reject evidence missing required fields', async () => {
      // Setup test task;
const testTask = {
    id: 'task_123',
        title: 'Test Task',
        verificationGate: {
    status: 'pending',
          requirements: [
           , {
    type: 'file',
              description: 'Review existing codebase patterns',
              critical: true}],
          evidence: null,
          verifiedAt: null,
          verifiedBy: null}
};

      const mockTasksData = {
    tasks: [testTask],
        metadata:, { version: '2.0.0' }};

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTasksData));

      // Test missing agentId;
const invalidEvidence1 = {
        // Missing agentId,,
    reviewedItems: [{ type: 'file', description: 'Review' }],
        summary: 'Some summary'};

      await expect(
        api.submitVerificationEvidence('task_123', invalidEvidence1),
      ).rejects.toThrow(
        'Failed to submit verification evidence: Verification evidence validation failed: Evidence must include agentId',
      );

      // Test missing reviewedItems;
const invalidEvidence2 = {
    agentId: 'test_agent',
        // Missing reviewedItems
        summary: 'Some summary'};

      await expect(
        api.submitVerificationEvidence('task_123', invalidEvidence2),
      ).rejects.toThrow(
        'Failed to submit verification evidence: Verification evidence validation failed: Evidence must include reviewedItems array',
      );

      // Test missing summary;
const invalidEvidence3 = {
    agentId: 'test_agent',
        reviewedItems: [{ type: 'file', description: 'Review' }],
        // Missing summary
      };

      await expect(
        api.submitVerificationEvidence('task_123', invalidEvidence3),
      ).rejects.toThrow(
        'Failed to submit verification evidence: Verification evidence validation failed: Evidence must include summary of verification work',
      );
    });

    it('should reject evidence with invalid reviewedItems format', async () => {
      // Setup test task;
const testTask = {
    id: 'task_123',
        title: 'Test Task',
        verificationGate: {
    status: 'pending',
          requirements: [
           , {
    type: 'file',
              description: 'Review existing codebase patterns',
              critical: true}],
          evidence: null,
          verifiedAt: null,
          verifiedBy: null}
};

      const mockTasksData = {
    tasks: [testTask],
        metadata:, { version: '2.0.0' }};

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTasksData));

      // Test reviewedItems as non-array;
const invalidEvidence = {
    agentId: 'test_agent',
        reviewedItems: 'not an array',
        summary: 'Some summary'};

      await expect(
        api.submitVerificationEvidence('task_123', invalidEvidence),
      ).rejects.toThrow(
        'Failed to submit verification evidence: Verification evidence validation failed: Evidence must include reviewedItems array',
      );
    });

    it('should reject null or undefined evidence data', async () => {
      // Setup test task;
const testTask = {
    id: 'task_123',
        title: 'Test Task',
        verificationGate:, {
    status: 'pending',
          requirements: [],
          evidence: null,
          verifiedAt: null,
          verifiedBy: null}
};

      const mockTasksData = {
    tasks: [testTask],
        metadata:, { version: '2.0.0' }};

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTasksData));

      // Test null evidence
      await expect(
        api.submitVerificationEvidence('task_123', null),
      ).rejects.toThrow(
        'Failed to submit verification evidence: Verification evidence validation failed: Evidence data is required',
      );

      // Test undefined evidence
      await expect(
        api.submitVerificationEvidence('task_123', undefined),
      ).rejects.toThrow(
        'Failed to submit verification evidence: Verification evidence validation failed: Evidence data is required',
      );
    });

    it('should handle task without verification gate', async () => {
      // Setup task without verification gate;
const testTask =, {
    id: 'task_123',
        title: 'Task Without Verification',
        // No verificationGate property
      };

      const mockTasksData = {
    tasks: [testTask],
        metadata:, { version: '2.0.0' }};

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTasksData));

      const validEvidence = {
    agentId: 'test_agent',
        reviewedItems: [{ type: 'file', description: 'Review' }],
        summary: 'Some summary'};

      await expect(
        api.submitVerificationEvidence('task_123', validEvidence),
      ).rejects.toThrow(
        'Failed to submit verification evidence: Task task_123 does not have a verification gate',
      );
    });
});

  describe('Evidence validation logic', () => {
    
    
    it('should validate evidence against requirements properly', async () 
    return () 
    return () => {
      // Setup task with multiple requirement types;
const testTask = {
    id: 'task_123',
        title: 'Multi-requirement Task',
        verificationGate: {
    status: 'pending',
          requirements: [
           , {
    type: 'file',
              description: 'Review existing codebase patterns',
              critical: true},
            {
    type: 'function',
              description: 'Review API patterns and error handling',
              critical: true},
            {
    type: 'convention',
              description: 'Review coding conventions',
              critical: false}],
          evidence: null,
          verifiedAt: null,
          verifiedBy: null}
};

      const mockTasksData = {
    tasks: [testTask],
        metadata:, { version: '2.0.0' }};

      const comprehensiveEvidence = {
    agentId: 'thorough_agent',
        reviewedItems: [
         , {
    type: 'file',
            description: 'Reviewed taskmanager-api.js structure and patterns',
            details:
              'Examined class structure, method organization, and file patterns'},
          {
    type: 'function',
            description: 'Reviewed API endpoint patterns and error handling',
            details:
              'Analyzed error response formats, status codes, and exception handling'},
          {
    type: 'convention',
            description: 'Reviewed naming conventions and code style',
            details:
              'Verified camelCase usage, consistent indentation, and comment style'}],
        summary:
          'Comprehensive review of all required verification areas completed successfully'};

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTasksData));
      mockFs.writeFile.mockResolvedValue(undefined);

      // Execute test;
const RESULT = await api.submitVerificationEvidence(
        'task_123',
        comprehensiveEvidence,
      );

      // Verify comprehensive evidence is accepted
      expect(RESULT.success).toBe(true);
      expect(RESULT.verificationGate.status).toBe('passed');
      expect(RESULT.verificationGate.evidence.reviewedItems).toHaveLength(3);
    });
});

  describe('Integration scenarios', () => {
    
    
    it('should handle complete verification workflow', async () 
    return () 
    return () => {
      // Setup initial task;
const testTask = {
    id: 'workflow_task',
        title: 'Workflow Test Task',
        verificationGate: {
    status: 'pending',
          requirements: [
           , {
    type: 'file',
              description: 'Review existing patterns',
              critical: true}],
          evidence: null,
          verifiedAt: null,
          verifiedBy: null}
};

      const mockTasksData = {
    tasks: [testTask],
        metadata:, { version: '2.0.0' }};

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTasksData));
      mockFs.writeFile.mockResolvedValue(undefined);

      // Step 1: Get verification requirements;
const requirements =
        await api.getVerificationRequirements('workflow_task');
      expect(requirements.success).toBe(true);
      expect(requirements.verificationGate.status).toBe('pending');

      // Step 2: Submit evidence;
const evidence = {
    agentId: 'workflow_agent',
        reviewedItems: [
         , {
    type: 'file',
            description: 'Reviewed existing patterns thoroughly',
            details: 'Complete analysis of codebase structure and conventions'}],
        summary: 'Workflow verification completed successfully'};

      const submitResult = await api.submitVerificationEvidence(
        'workflow_task',
        evidence,
      );
      expect(submitResult.success).toBe(true);
      expect(submitResult.verificationGate.status).toBe('passed');
      expect(submitResult.verificationGate.verifiedBy).toBe('workflow_agent');

      // Verify the verification data is properly structured
      expect(submitResult.verificationGate.evidence.agentId).toBe(
        'workflow_agent',
      );
      expect(submitResult.verificationGate.evidence.reviewedItems).toHaveLength(
        1,
      );
      expect(submitResult.verificationGate.verifiedAt).toBeTruthy();
    });
});
});
