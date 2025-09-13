# Testing Strategy Implementation Examples

**Task ID**: feature_1757784276376_2xkwch91a  
**Document**: Practical Implementation Examples  
**Date**: 2025-09-13  

## Example Test Implementations

### 1. Enhanced Subtask API Testing

#### Complete Integration Test Example
```javascript
// test/integration/enhanced-subtask-api.test.js
const { EnhancedAPIExecutor } = require('../utils/enhanced-api-exec');
const { TestEnvironmentManager } = require('../utils/test-environment');
const { TestDataFactory } = require('../utils/test-data-factory');

describe('Enhanced Subtask API Integration', () => {
  let apiExec;
  let testEnv;
  let testAgent;

  beforeAll(async () => {
    // Setup isolated test environment
    testEnv = new TestEnvironmentManager('enhanced-subtask-api');
    const testDir = await testEnv.setup();
    apiExec = new EnhancedAPIExecutor(testDir);
    
    // Initialize test agent
    const agentResult = await apiExec.initAgent({
      role: 'testing',
      specialization: ['subtask_testing']
    });
    testAgent = agentResult.agentId;
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe('Subtask Creation Workflow', () => {
    test('should create feature task with auto-generated research subtask', async () => {
      // Create feature task requiring research
      const featureTask = TestDataFactory.createTaskData({
        title: 'Implement OAuth Integration',
        category: 'feature',
        requires_research: true,
        description: 'Add OAuth 2.0 authentication to the system'
      });

      const taskResult = await apiExec.createTask(featureTask);
      expect(taskResult.success).toBe(true);
      expect(taskResult.taskId).toMatch(/^feature_\d+_[a-z0-9]+$/);

      // Verify research subtask auto-generation
      const taskDetails = await apiExec.execCommand('get', [taskResult.taskId]);
      expect(taskDetails.task.subtasks).toBeDefined();
      expect(taskDetails.task.subtasks.length).toBeGreaterThan(0);
      
      const researchSubtask = taskDetails.task.subtasks.find(s => s.type === 'research');
      expect(researchSubtask).toBeDefined();
      expect(researchSubtask.status).toBe('pending');
      expect(researchSubtask.prevents_implementation).toBe(true);
    });

    test('should handle research subtask completion and enable implementation', async () => {
      // Create task with research requirement
      const taskData = TestDataFactory.createTaskData({
        requires_research: true
      });
      const taskResult = await apiExec.createTask(taskData);
      
      // Get research subtask
      const taskDetails = await apiExec.execCommand('get', [taskResult.taskId]);
      const researchSubtask = taskDetails.task.subtasks.find(s => s.type === 'research');
      
      // Complete research subtask
      const completionResult = await apiExec.execCommand('complete-subtask', [
        researchSubtask.id,
        JSON.stringify({
          findings: 'Research completed successfully',
          recommendations: ['Use OAuth 2.0 flow', 'Implement JWT tokens'],
          references: ['https://oauth.net/2/']
        })
      ]);
      
      expect(completionResult.success).toBe(true);
      
      // Verify main task is now claimable
      const claimResult = await apiExec.claimTask(taskResult.taskId, testAgent);
      expect(claimResult.success).toBe(true);
    });
  });

  describe('Success Criteria Management', () => {
    test('should create and validate task-specific success criteria', async () => {
      const taskData = TestDataFactory.createTaskData();
      const taskResult = await apiExec.createTask(taskData);
      
      // Create success criteria
      const criteria = TestDataFactory.createSuccessCriteria('task', {
        criteria: [
          'Implementation passes all unit tests',
          'Code coverage >= 80%',
          'No linting violations',
          'Performance benchmarks met'
        ],
        validation_method: 'automated',
        required_approvals: 1
      });
      
      const criteriaResult = await apiExec.execCommand('create-success-criteria', [
        taskResult.taskId,
        JSON.stringify(criteria)
      ]);
      
      expect(criteriaResult.success).toBe(true);
      expect(criteriaResult.criteria_id).toBeDefined();
      
      // Retrieve and validate criteria
      const retrievedCriteria = await apiExec.execCommand('get-success-criteria', [
        taskResult.taskId
      ]);
      
      expect(retrievedCriteria.success).toBe(true);
      expect(retrievedCriteria.criteria.length).toBeGreaterThan(0);
    });

    test('should enforce success criteria before task completion', async () => {
      const taskData = TestDataFactory.createTaskData();
      const taskResult = await apiExec.createTask(taskData);
      
      // Add strict success criteria
      const criteria = {
        criteria: ['All tests must pass', 'Code review approved'],
        enforcement_level: 'strict',
        validation_method: 'manual'
      };
      
      await apiExec.execCommand('create-success-criteria', [
        taskResult.taskId,
        JSON.stringify(criteria)
      ]);
      
      // Claim task
      await apiExec.claimTask(taskResult.taskId, testAgent);
      
      // Attempt to complete without meeting criteria (should fail)
      await expect(
        apiExec.completeTask(taskResult.taskId, 'Implementation complete')
      ).rejects.toThrow(/success criteria not met/i);
    });
  });

  describe('Multi-Agent Coordination', () => {
    test('should handle concurrent subtask creation by multiple agents', async () => {
      // Initialize multiple agents
      const agent1 = (await apiExec.initAgent({ role: 'research' })).agentId;
      const agent2 = (await apiExec.initAgent({ role: 'implementation' })).agentId;
      
      const taskData = TestDataFactory.createTaskData();
      const taskResult = await apiExec.createTask(taskData);
      
      // Concurrent subtask creation
      const subtask1Promise = apiExec.execCommand('create-subtask', [
        JSON.stringify(TestDataFactory.createSubtaskData(taskResult.taskId, 'research'))
      ]);
      
      const subtask2Promise = apiExec.execCommand('create-subtask', [
        JSON.stringify(TestDataFactory.createSubtaskData(taskResult.taskId, 'audit'))
      ]);
      
      const [subtask1Result, subtask2Result] = await Promise.all([
        subtask1Promise,
        subtask2Promise
      ]);
      
      expect(subtask1Result.success).toBe(true);
      expect(subtask2Result.success).toBe(true);
      expect(subtask1Result.subtask.id).not.toBe(subtask2Result.subtask.id);
    });

    test('should prevent conflicting subtask operations', async () => {
      const taskData = TestDataFactory.createTaskData();
      const taskResult = await apiExec.createTask(taskData);
      
      // Create subtask
      const subtaskData = TestDataFactory.createSubtaskData(taskResult.taskId, 'research');
      const subtaskResult = await apiExec.execCommand('create-subtask', [
        JSON.stringify(subtaskData)
      ]);
      
      const subtaskId = subtaskResult.subtask.id;
      
      // Attempt concurrent completion by different agents
      const agent1 = (await apiExec.initAgent()).agentId;
      const agent2 = (await apiExec.initAgent()).agentId;
      
      const completion1Promise = apiExec.execCommand('complete-subtask', [
        subtaskId,
        JSON.stringify({ completed_by: agent1 })
      ]);
      
      const completion2Promise = apiExec.execCommand('complete-subtask', [
        subtaskId,
        JSON.stringify({ completed_by: agent2 })
      ]);
      
      // One should succeed, one should fail
      const results = await Promise.allSettled([completion1Promise, completion2Promise]);
      const successes = results.filter(r => r.status === 'fulfilled').length;
      const failures = results.filter(r => r.status === 'rejected').length;
      
      expect(successes).toBe(1);
      expect(failures).toBe(1);
    });
  });
});
```

### 2. Performance Testing Implementation

#### Load Testing Example
```javascript
// test/performance/subtask-performance.test.js
const { EnhancedAPIExecutor } = require('../utils/enhanced-api-exec');
const { TestEnvironmentManager } = require('../utils/test-environment');
const { TestDataFactory } = require('../utils/test-data-factory');

describe('Subtask Performance Testing', () => {
  let apiExec;
  let testEnv;
  
  const PERFORMANCE_TARGETS = {
    subtaskCreation: 300,    // ms per operation
    bulkOperations: 5000,    // ms for 100 operations
    concurrentAgents: 10,    // max concurrent agents
    queryResponse: 100       // ms for retrieval operations
  };

  beforeAll(async () => {
    testEnv = new TestEnvironmentManager('subtask-performance');
    const testDir = await testEnv.setup();
    apiExec = new EnhancedAPIExecutor(testDir);
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe('Subtask Creation Performance', () => {
    test('single subtask creation meets performance target', async () => {
      const taskData = TestDataFactory.createTaskData();
      const taskResult = await apiExec.createTask(taskData);
      
      const subtaskData = TestDataFactory.createSubtaskData(taskResult.taskId, 'research');
      
      const startTime = performance.now();
      const result = await apiExec.execCommand('create-subtask', [
        JSON.stringify(subtaskData)
      ]);
      const duration = performance.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_TARGETS.subtaskCreation);
    });

    test('bulk subtask creation performance', async () => {
      // Create parent tasks
      const taskPromises = Array.from({ length: 20 }, () =>
        apiExec.createTask(TestDataFactory.createTaskData())
      );
      const tasks = await Promise.all(taskPromises);
      
      // Create subtasks for each task
      const subtaskPromises = tasks.map(task =>
        apiExec.execCommand('create-subtask', [
          JSON.stringify(TestDataFactory.createSubtaskData(task.taskId, 'research'))
        ])
      );
      
      const startTime = performance.now();
      const results = await Promise.all(subtaskPromises);
      const duration = performance.now() - startTime;
      
      expect(results.every(r => r.success)).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_TARGETS.bulkOperations);
      
      // Log performance metrics
      const opsPerSecond = (results.length / duration) * 1000;
      console.log(`Subtask creation rate: ${opsPerSecond.toFixed(2)} ops/sec`);
    });
  });

  describe('Query Performance', () => {
    test('subtask retrieval performance under load', async () => {
      // Setup: Create task with multiple subtasks
      const taskData = TestDataFactory.createTaskData();
      const taskResult = await apiExec.createTask(taskData);
      
      // Create 50 subtasks
      const subtaskPromises = Array.from({ length: 50 }, (_, i) =>
        apiExec.execCommand('create-subtask', [
          JSON.stringify(TestDataFactory.createSubtaskData(
            taskResult.taskId,
            i % 3 === 0 ? 'research' : i % 3 === 1 ? 'audit' : 'implementation'
          ))
        ])
      );
      await Promise.all(subtaskPromises);
      
      // Performance test: Retrieve subtasks
      const startTime = performance.now();
      const result = await apiExec.execCommand('get-subtasks', [taskResult.taskId]);
      const duration = performance.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(result.subtasks.length).toBe(50);
      expect(duration).toBeLessThan(PERFORMANCE_TARGETS.queryResponse);
    });

    test('filtered subtask queries performance', async () => {
      const taskData = TestDataFactory.createTaskData();
      const taskResult = await apiExec.createTask(taskData);
      
      // Create mixed subtasks
      const subtaskTypes = ['research', 'audit', 'implementation'];
      const subtaskPromises = Array.from({ length: 30 }, (_, i) =>
        apiExec.execCommand('create-subtask', [
          JSON.stringify(TestDataFactory.createSubtaskData(
            taskResult.taskId,
            subtaskTypes[i % 3]
          ))
        ])
      );
      await Promise.all(subtaskPromises);
      
      // Test filtered queries
      const filters = [
        { type: 'research' },
        { status: 'pending' },
        { type: 'audit', status: 'pending' }
      ];
      
      for (const filter of filters) {
        const startTime = performance.now();
        const result = await apiExec.execCommand('get-subtasks', [
          taskResult.taskId,
          JSON.stringify(filter)
        ]);
        const duration = performance.now() - startTime;
        
        expect(result.success).toBe(true);
        expect(duration).toBeLessThan(PERFORMANCE_TARGETS.queryResponse);
      }
    });
  });

  describe('Concurrent Agent Performance', () => {
    test('multiple agents creating subtasks concurrently', async () => {
      // Initialize multiple agents
      const agentPromises = Array.from({ length: 5 }, () =>
        apiExec.initAgent()
      );
      const agents = await Promise.all(agentPromises);
      
      // Create parent tasks
      const taskPromises = Array.from({ length: 20 }, () =>
        apiExec.createTask(TestDataFactory.createTaskData())
      );
      const tasks = await Promise.all(taskPromises);
      
      // Concurrent subtask creation by different agents
      const startTime = performance.now();
      const concurrentPromises = tasks.map((task, index) => {
        const agentIndex = index % agents.length;
        return apiExec.execCommand('create-subtask', [
          JSON.stringify({
            ...TestDataFactory.createSubtaskData(task.taskId, 'research'),
            created_by: agents[agentIndex].agentId
          })
        ]);
      });
      
      const results = await Promise.all(concurrentPromises);
      const duration = performance.now() - startTime;
      
      expect(results.every(r => r.success)).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_TARGETS.bulkOperations);
    });
  });
});
```

### 3. Security Testing Implementation

#### Security Validation Tests
```javascript
// test/security/subtask-security.test.js
const { EnhancedAPIExecutor } = require('../utils/enhanced-api-exec');
const { TestEnvironmentManager } = require('../utils/test-environment');
const { TestDataFactory } = require('../utils/test-data-factory');

describe('Subtask Security Testing', () => {
  let apiExec;
  let testEnv;
  let authorizedAgent;
  let unauthorizedAgent;

  beforeAll(async () => {
    testEnv = new TestEnvironmentManager('subtask-security');
    const testDir = await testEnv.setup();
    apiExec = new EnhancedAPIExecutor(testDir);
    
    // Setup authorized and unauthorized agents
    authorizedAgent = (await apiExec.initAgent({ 
      role: 'developer',
      permissions: ['subtask_management'] 
    })).agentId;
    
    unauthorizedAgent = (await apiExec.initAgent({ 
      role: 'viewer',
      permissions: ['read_only'] 
    })).agentId;
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe('Authentication and Authorization', () => {
    test('should reject unauthenticated subtask creation', async () => {
      const taskData = TestDataFactory.createTaskData();
      const taskResult = await apiExec.createTask(taskData);
      
      const subtaskData = TestDataFactory.createSubtaskData(taskResult.taskId, 'research');
      
      // Attempt creation without agent authentication
      await expect(
        apiExec.execCommand('create-subtask', [
          JSON.stringify(subtaskData)
        ])
      ).rejects.toThrow(/authentication required/i);
    });

    test('should enforce agent ownership for subtask operations', async () => {
      const taskData = TestDataFactory.createTaskData();
      const taskResult = await apiExec.createTask(taskData);
      
      // Claim task with authorized agent
      await apiExec.claimTask(taskResult.taskId, authorizedAgent);
      
      // Create subtask with authorized agent
      const subtaskData = TestDataFactory.createSubtaskData(taskResult.taskId, 'research');
      const subtaskResult = await apiExec.execCommand('create-subtask', [
        JSON.stringify({ ...subtaskData, agent_id: authorizedAgent })
      ]);
      
      expect(subtaskResult.success).toBe(true);
      
      // Attempt to modify subtask with unauthorized agent
      await expect(
        apiExec.execCommand('update-subtask', [
          subtaskResult.subtask.id,
          JSON.stringify({ status: 'completed', agent_id: unauthorizedAgent })
        ])
      ).rejects.toThrow(/unauthorized/i);
    });

    test('should validate success criteria modification permissions', async () => {
      const taskData = TestDataFactory.createTaskData();
      const taskResult = await apiExec.createTask(taskData);
      
      // Authorized agent creates criteria
      const criteria = TestDataFactory.createSuccessCriteria();
      const criteriaResult = await apiExec.execCommand('create-success-criteria', [
        taskResult.taskId,
        JSON.stringify({ ...criteria, created_by: authorizedAgent })
      ]);
      
      expect(criteriaResult.success).toBe(true);
      
      // Unauthorized agent attempts modification
      await expect(
        apiExec.execCommand('update-success-criteria', [
          criteriaResult.criteria_id,
          JSON.stringify({ criteria: ['Modified criteria'], modified_by: unauthorizedAgent })
        ])
      ).rejects.toThrow(/insufficient permissions/i);
    });
  });

  describe('Input Validation Security', () => {
    test('should sanitize subtask titles and descriptions', async () => {
      const taskData = TestDataFactory.createTaskData();
      const taskResult = await apiExec.createTask(taskData);
      
      // Attempt XSS injection in subtask data
      const maliciousSubtask = {
        type: 'research',
        title: '<script>alert("XSS")</script>Research Task',
        description: 'Task description with <img src=x onerror=alert("XSS")>',
        taskId: taskResult.taskId
      };
      
      const result = await apiExec.execCommand('create-subtask', [
        JSON.stringify({ ...maliciousSubtask, agent_id: authorizedAgent })
      ]);
      
      expect(result.success).toBe(true);
      // Verify script tags are sanitized
      expect(result.subtask.title).not.toContain('<script>');
      expect(result.subtask.description).not.toContain('<img');
    });

    test('should validate research location parameters', async () => {
      const taskData = TestDataFactory.createTaskData();
      const taskResult = await apiExec.createTask(taskData);
      
      // Attempt path traversal in research locations
      const maliciousResearch = {
        type: 'research',
        title: 'Research Task',
        taskId: taskResult.taskId,
        research_locations: [
          {
            type: 'codebase',
            paths: ['../../../etc/passwd', '../../../../windows/system32'],
            focus: 'System files'
          }
        ]
      };
      
      const result = await apiExec.execCommand('create-subtask', [
        JSON.stringify({ ...maliciousResearch, agent_id: authorizedAgent })
      ]);
      
      // Should either reject or sanitize dangerous paths
      if (result.success) {
        expect(result.subtask.research_locations[0].paths).not.toContain('../../../etc/passwd');
      }
    });

    test('should prevent injection attacks in criteria definitions', async () => {
      const taskData = TestDataFactory.createTaskData();
      const taskResult = await apiExec.createTask(taskData);
      
      // Attempt SQL injection in criteria
      const maliciousCriteria = {
        criteria: [
          'Test passes; DROP TABLE tasks; --',
          'Coverage >= 80%\'; DELETE FROM agents WHERE id = \'1'
        ],
        validation_method: 'automated'
      };
      
      const result = await apiExec.execCommand('create-success-criteria', [
        taskResult.taskId,
        JSON.stringify({ ...maliciousCriteria, created_by: authorizedAgent })
      ]);
      
      if (result.success) {
        // Verify SQL injection patterns are sanitized
        result.criteria.criteria.forEach(criterion => {
          expect(criterion).not.toContain('DROP TABLE');
          expect(criterion).not.toContain('DELETE FROM');
        });
      }
    });
  });

  describe('Rate Limiting and DoS Protection', () => {
    test('should enforce rate limiting for subtask creation', async () => {
      const taskData = TestDataFactory.createTaskData();
      const taskResult = await apiExec.createTask(taskData);
      
      // Attempt rapid subtask creation
      const rapidRequests = Array.from({ length: 100 }, (_, i) =>
        apiExec.execCommand('create-subtask', [
          JSON.stringify({
            ...TestDataFactory.createSubtaskData(taskResult.taskId, 'research'),
            title: `Rapid Task ${i}`,
            agent_id: authorizedAgent
          })
        ])
      );
      
      // Should not allow all requests to succeed due to rate limiting
      const results = await Promise.allSettled(rapidRequests);
      const rejectedCount = results.filter(r => r.status === 'rejected').length;
      
      expect(rejectedCount).toBeGreaterThan(0);
    });

    test('should limit concurrent operations per agent', async () => {
      const tasks = await Promise.all(
        Array.from({ length: 20 }, () => 
          apiExec.createTask(TestDataFactory.createTaskData())
        )
      );
      
      // Attempt concurrent operations by single agent
      const concurrentOps = tasks.map(task =>
        apiExec.execCommand('create-subtask', [
          JSON.stringify({
            ...TestDataFactory.createSubtaskData(task.taskId, 'research'),
            agent_id: authorizedAgent
          })
        ])
      );
      
      const results = await Promise.allSettled(concurrentOps);
      const failures = results.filter(r => r.status === 'rejected').length;
      
      // Should limit concurrent operations
      expect(failures).toBeGreaterThan(0);
    });
  });
});
```

### 4. End-to-End Workflow Testing

#### Complete Feature Development Workflow
```javascript
// test/e2e/feature-development-workflow.test.js
const { EnhancedAPIExecutor } = require('../utils/enhanced-api-exec');
const { TestEnvironmentManager } = require('../utils/test-environment');
const { TestDataFactory } = require('../utils/test-data-factory');

describe('End-to-End Feature Development Workflow', () => {
  let apiExec;
  let testEnv;
  let devAgent;
  let researchAgent;
  let auditAgent;

  beforeAll(async () => {
    testEnv = new TestEnvironmentManager('e2e-workflow');
    const testDir = await testEnv.setup();
    apiExec = new EnhancedAPIExecutor(testDir);
    
    // Initialize specialized agents
    devAgent = (await apiExec.initAgent({ 
      role: 'development', 
      specialization: ['javascript', 'api_development'] 
    })).agentId;
    
    researchAgent = (await apiExec.initAgent({ 
      role: 'research', 
      specialization: ['technology_analysis', 'documentation'] 
    })).agentId;
    
    auditAgent = (await apiExec.initAgent({ 
      role: 'audit', 
      specialization: ['quality_assurance', 'security'] 
    })).agentId;
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  test('complete feature development with research and audit workflow', async () => {
    // Phase 1: Feature Task Creation
    const featureData = TestDataFactory.createTaskData({
      title: 'Implement User Profile Management',
      category: 'feature',
      requires_research: true,
      description: 'Add comprehensive user profile management with CRUD operations',
      priority: 'high',
      estimate: '8h'
    });

    const featureResult = await apiExec.createTask(featureData);
    expect(featureResult.success).toBe(true);
    
    const featureTaskId = featureResult.taskId;
    console.log(`✓ Feature task created: ${featureTaskId}`);

    // Phase 2: Verify Auto-Generated Research Subtask
    const taskDetails = await apiExec.execCommand('get', [featureTaskId]);
    expect(taskDetails.success).toBe(true);
    
    const researchSubtask = taskDetails.task.subtasks.find(s => s.type === 'research');
    expect(researchSubtask).toBeDefined();
    expect(researchSubtask.prevents_implementation).toBe(true);
    
    console.log(`✓ Research subtask auto-generated: ${researchSubtask.id}`);

    // Phase 3: Research Agent Claims and Completes Research
    const researchClaimResult = await apiExec.execCommand('claim-subtask', [
      researchSubtask.id,
      researchAgent
    ]);
    expect(researchClaimResult.success).toBe(true);
    
    // Complete research with findings
    const researchFindings = {
      findings: 'User profile management best practices researched',
      recommendations: [
        'Use RESTful API design patterns',
        'Implement data validation with Joi',
        'Add avatar upload functionality',
        'Include privacy controls'
      ],
      references: [
        'https://restfulapi.net/resource-naming/',
        'https://github.com/sideway/joi'
      ],
      estimated_implementation_time: '6h'
    };

    const researchCompleteResult = await apiExec.execCommand('complete-subtask', [
      researchSubtask.id,
      JSON.stringify(researchFindings)
    ]);
    expect(researchCompleteResult.success).toBe(true);
    
    console.log(`✓ Research completed by ${researchAgent}`);

    // Phase 4: Development Agent Claims Main Feature Task
    const featureClaimResult = await apiExec.claimTask(featureTaskId, devAgent);
    expect(featureClaimResult.success).toBe(true);
    
    console.log(`✓ Feature task claimed by development agent: ${devAgent}`);

    // Phase 5: Add Success Criteria for Feature
    const successCriteria = TestDataFactory.createSuccessCriteria('task', {
      criteria: [
        'All CRUD operations implemented for user profiles',
        'Input validation implemented with comprehensive error handling',
        'Avatar upload functionality working correctly',
        'Privacy controls implemented and tested',
        'API endpoints return proper HTTP status codes',
        'Unit tests cover all new functionality with 90%+ coverage',
        'Integration tests validate complete user workflows',
        'Security validation passes for all endpoints',
        'Performance meets requirements (< 200ms response time)',
        'Documentation updated with API specifications'
      ],
      validation_method: 'automated_and_manual',
      required_approvals: 1
    });

    const criteriaResult = await apiExec.execCommand('create-success-criteria', [
      featureTaskId,
      JSON.stringify(successCriteria)
    ]);
    expect(criteriaResult.success).toBe(true);
    
    console.log(`✓ Success criteria defined with ${successCriteria.criteria.length} requirements`);

    // Phase 6: Simulate Feature Implementation
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work time
    
    const implementationDetails = {
      implementation_summary: 'User profile CRUD operations implemented',
      files_modified: [
        'routes/user-profile.js',
        'controllers/profileController.js',
        'models/UserProfile.js',
        'middleware/validation.js'
      ],
      tests_added: [
        'test/unit/profileController.test.js',
        'test/integration/user-profile-api.test.js'
      ],
      api_endpoints: [
        'GET /api/profile/:userId',
        'PUT /api/profile/:userId',
        'POST /api/profile/:userId/avatar',
        'DELETE /api/profile/:userId'
      ]
    };

    // Phase 7: Complete Feature Task
    const featureCompleteResult = await apiExec.completeTask(
      featureTaskId,
      JSON.stringify(implementationDetails)
    );
    expect(featureCompleteResult.success).toBe(true);
    
    console.log(`✓ Feature implementation completed`);

    // Phase 8: Verify Audit Subtask Creation
    const updatedTaskDetails = await apiExec.execCommand('get', [featureTaskId]);
    const auditSubtask = updatedTaskDetails.task.subtasks.find(s => s.type === 'audit');
    expect(auditSubtask).toBeDefined();
    expect(auditSubtask.prevents_completion).toBe(true);
    
    console.log(`✓ Audit subtask auto-generated: ${auditSubtask.id}`);

    // Phase 9: Audit Agent Performs Quality Review
    const auditClaimResult = await apiExec.execCommand('claim-subtask', [
      auditSubtask.id,
      auditAgent
    ]);
    expect(auditClaimResult.success).toBe(true);
    
    // Simulate comprehensive audit
    const auditResults = {
      audit_summary: 'Comprehensive quality audit completed',
      criteria_validation: {
        implementation_complete: true,
        validation_implemented: true,
        avatar_upload_working: true,
        privacy_controls_implemented: true,
        http_status_codes_proper: true,
        unit_tests_coverage: 92,
        integration_tests_passing: true,
        security_validation_passed: true,
        performance_requirements_met: true,
        documentation_updated: true
      },
      quality_score: 95,
      recommendations: [
        'Consider adding rate limiting for avatar uploads',
        'Add more edge case tests for validation'
      ],
      approved: true
    };

    const auditCompleteResult = await apiExec.execCommand('complete-subtask', [
      auditSubtask.id,
      JSON.stringify(auditResults)
    ]);
    expect(auditCompleteResult.success).toBe(true);
    
    console.log(`✓ Quality audit completed with score: ${auditResults.quality_score}`);

    // Phase 10: Verify Complete Workflow
    const finalTaskDetails = await apiExec.execCommand('get', [featureTaskId]);
    expect(finalTaskDetails.task.status).toBe('completed');
    expect(finalTaskDetails.task.subtasks.every(s => s.status === 'completed')).toBe(true);
    
    console.log(`✓ Complete workflow validation passed`);

    // Phase 11: Verify Task in DONE.json
    const doneData = await testEnv.getDoneData();
    const completedTask = doneData.completed_tasks.find(t => t.id === featureTaskId);
    expect(completedTask).toBeDefined();
    expect(completedTask.completion_type).toBe('success');
    
    console.log(`✓ Task properly archived in DONE.json`);
  });

  test('multi-agent collaboration with task handoffs', async () => {
    // Create complex feature requiring multiple specializations
    const complexFeatureData = TestDataFactory.createTaskData({
      title: 'Implement Multi-Factor Authentication System',
      category: 'feature',
      requires_research: true,
      description: 'Comprehensive MFA system with SMS, email, and TOTP options',
      priority: 'critical'
    });

    const taskResult = await apiExec.createTask(complexFeatureData);
    const taskId = taskResult.taskId;

    // Research phase
    const taskDetails = await apiExec.execCommand('get', [taskId]);
    const researchSubtask = taskDetails.task.subtasks.find(s => s.type === 'research');
    
    await apiExec.execCommand('claim-subtask', [researchSubtask.id, researchAgent]);
    await apiExec.execCommand('complete-subtask', [
      researchSubtask.id,
      JSON.stringify({
        findings: 'MFA implementation strategies analyzed',
        security_considerations: [
          'TOTP secret key management',
          'SMS rate limiting',
          'Backup code generation'
        ]
      })
    ]);

    // Development phase with multiple subtasks
    await apiExec.claimTask(taskId, devAgent);
    
    // Create implementation subtasks
    const implementationSubtasks = [
      { title: 'Implement TOTP authentication', type: 'implementation' },
      { title: 'Implement SMS verification', type: 'implementation' },
      { title: 'Implement email verification', type: 'implementation' }
    ];

    const subtaskIds = [];
    for (const subtaskData of implementationSubtasks) {
      const result = await apiExec.execCommand('create-subtask', [
        JSON.stringify({ ...subtaskData, taskId, agent_id: devAgent })
      ]);
      subtaskIds.push(result.subtask.id);
    }

    // Complete implementation subtasks
    for (const subtaskId of subtaskIds) {
      await apiExec.execCommand('complete-subtask', [
        subtaskId,
        JSON.stringify({ status: 'implemented', tests: 'included' })
      ]);
    }

    // Complete main task
    await apiExec.completeTask(taskId, 'MFA system implemented with all three methods');

    // Audit phase
    const finalTaskDetails = await apiExec.execCommand('get', [taskId]);
    const auditSubtask = finalTaskDetails.task.subtasks.find(s => s.type === 'audit');
    
    await apiExec.execCommand('claim-subtask', [auditSubtask.id, auditAgent]);
    await apiExec.execCommand('complete-subtask', [
      auditSubtask.id,
      JSON.stringify({ audit_passed: true, security_score: 98 })
    ]);

    // Verify complete workflow
    const completedTask = await apiExec.execCommand('get', [taskId]);
    expect(completedTask.task.status).toBe('completed');
    expect(completedTask.task.subtasks.length).toBeGreaterThan(4); // research + 3 impl + audit
    expect(completedTask.task.subtasks.every(s => s.status === 'completed')).toBe(true);
    
    console.log(`✓ Multi-agent collaboration workflow completed successfully`);
  });
});
```

## Implementation Priority Matrix

### Immediate (Week 1)
1. **Fix EPIPE Errors** - Critical infrastructure issue
2. **Enhanced Test Utils** - Foundation for all other tests
3. **Basic Integration Tests** - Core functionality validation

### Short Term (Week 2)
1. **Security Testing Suite** - Critical for production readiness
2. **Performance Benchmarks** - Establish baseline metrics
3. **CI/CD Integration** - Automated quality gates

### Medium Term (Week 3-4)
1. **End-to-End Workflows** - Complete feature validation
2. **Load Testing** - Scalability validation
3. **Analytics Dashboard** - Continuous monitoring

### Long Term (Ongoing)
1. **Test Maintenance** - Keep tests updated with features
2. **Performance Optimization** - Continuous improvement
3. **Documentation Updates** - Maintain test documentation

This comprehensive implementation provides practical, working examples of the testing strategy, demonstrating how to test TaskManager API enhancements effectively while maintaining code quality and system reliability.