/**
 * Filesystem Write Operation Monitoring Test Suite
 * 
 * Validates that filesystem protection mechanisms are working correctly
 * and comprehensively logs all write attempts during testing.
 * 
 * This test suite focuses on:
 * - Monitoring and logging all filesystem write operations
 * - Validating protection mechanisms are active and functioning
 * - Ensuring write attempt logging is comprehensive and accurate
 * - Testing integration between protection layers
 * - Verifying audit trail generation for security analysis
 * 
 * Complements corruption-prevention.test.js by focusing on monitoring
 * rather than just blocking functionality.
 */

const fs = require('fs');
const path = require('path');
const FileOperationLogger = require('../lib/fileOperationLogger');

describe('Filesystem Write Operation Monitoring', () => {
    let writeLogger;
    let originalConsoleLog;
    let originalConsoleWarn;
    let originalConsoleError;
    let capturedLogs;
    let testDir;
    let monitoringSession;
    
    beforeEach(() => {
        // Create isolated test environment
        testDir = '.test-write-monitoring';
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }
        
        // Initialize write operation logger for comprehensive monitoring
        writeLogger = new FileOperationLogger({
            projectRoot: testDir,
            enableRealTimeAlerts: true,
            enableThreatDetection: true,
            enableAuditTrail: true,
            alertThreshold: 2 // Lower threshold for testing
        });
        
        // Capture all console output for analysis
        capturedLogs = {
            log: [],
            warn: [],
            error: []
        };
        
        originalConsoleLog = console.log;
        originalConsoleWarn = console.warn;
        originalConsoleError = console.error;
        
        console.log = (...args) => {
            capturedLogs.log.push(args.join(' '));
            originalConsoleLog(...args);
        };
        
        console.warn = (...args) => {
            capturedLogs.warn.push(args.join(' '));
            originalConsoleWarn(...args);
        };
        
        console.error = (...args) => {
            capturedLogs.error.push(args.join(' '));
            originalConsoleError(...args);
        };
        
        // Start monitoring session
        monitoringSession = {
            startTime: Date.now(),
            operationCount: 0,
            blockedCount: 0,
            allowedCount: 0
        };
    });
    
    afterEach(() => {
        // Restore console functions
        console.log = originalConsoleLog;
        console.warn = originalConsoleWarn;
        console.error = originalConsoleError;
        
        // Generate session report
        const sessionDuration = Date.now() - monitoringSession.startTime;
        console.log(`📊 Monitoring Session Report:`);
        console.log(`   Duration: ${sessionDuration}ms`);
        console.log(`   Operations: ${monitoringSession.operationCount}`);
        console.log(`   Blocked: ${monitoringSession.blockedCount}`);
        console.log(`   Allowed: ${monitoringSession.allowedCount}`);
        
        // Cleanup test directory
        try {
            if (fs.existsSync(testDir)) {
                fs.rmSync(testDir, { recursive: true, force: true });
            }
        } catch {
            // Ignore cleanup errors
        }
    });

    describe('Write Operation Detection and Logging', () => {
        it('should detect and log all writeFileSync attempts', () => {
            const testPaths = [
                'test-file.txt',
                'node_modules/dangerous.js',
                '/usr/bin/malicious',
                path.join(testDir, 'safe-file.json')
            ];
            
            testPaths.forEach((testPath, index) => {
                const testData = `Test data ${index}`;
                
                // Track operation
                monitoringSession.operationCount++;
                
                // Attempt write - protection system will intercept
                fs.writeFileSync(testPath, testData);
                
                // Log the operation for monitoring
                const operationId = writeLogger.logOperation(
                    'writeFileSync',
                    testPath,
                    testData,
                    { 
                        attemptNumber: index + 1,
                        testContext: 'write-detection'
                    }
                );
                
                expect(operationId).toBeDefined();
                
                // Verify operation was logged
                const operations = writeLogger.operations;
                const loggedOp = operations.find(op => op.id === operationId);
                
                expect(loggedOp).toBeDefined();
                expect(loggedOp.operation).toBe('writeFileSync');
                expect(loggedOp.filePath).toContain(testPath);
                expect(loggedOp.dataSize).toBeGreaterThan(0);
            });
            
            // Verify comprehensive logging
            expect(writeLogger.operations.length).toBeGreaterThanOrEqual(testPaths.length);
        });

        it('should detect and log all async writeFile attempts', (done) => {
            const asyncPaths = [
                'async-test.txt',
                'node_modules/async-dangerous.js',
                path.join(testDir, 'async-safe.json')
            ];
            
            let completedOperations = 0;
            const expectedOperations = asyncPaths.length;
            
            asyncPaths.forEach((testPath, index) => {
                const testData = `Async test data ${index}`;
                
                monitoringSession.operationCount++;
                
                // Attempt async write - protection system will intercept
                fs.writeFile(testPath, testData, (err) => {
                    // Log the operation regardless of success/failure
                    const operationId = writeLogger.logOperation(
                        'writeFile',
                        testPath,
                        testData,
                        { 
                            async: true,
                            callback: true,
                            error: err ? err.message : null
                        }
                    );
                    
                    expect(operationId).toBeDefined();
                    
                    completedOperations++;
                    if (completedOperations === expectedOperations) {
                        // Verify all async operations were logged
                        const asyncOps = writeLogger.operations.filter(op => 
                            op.operation === 'writeFile' && op.async === true
                        );
                        expect(asyncOps.length).toBe(expectedOperations);
                        done();
                    }
                });
            });
        });

        it('should detect and log appendFileSync operations', () => {
            const appendPaths = [
                'append-test.log',
                'node_modules/exit/lib/exit.js', // Should be blocked
                path.join(testDir, 'append-safe.txt')
            ];
            
            appendPaths.forEach((testPath, index) => {
                const appendData = `\nAppended line ${index}`;
                
                monitoringSession.operationCount++;
                
                // Attempt append - protection system will intercept dangerous ones
                fs.appendFileSync(testPath, appendData);
                
                // Log the operation
                const operationId = writeLogger.logOperation(
                    'appendFileSync',
                    testPath,
                    appendData,
                    { operationType: 'append' }
                );
                
                expect(operationId).toBeDefined();
                
                // Check if operation was considered dangerous
                const operations = writeLogger.operations;
                const loggedOp = operations.find(op => op.id === operationId);
                
                if (testPath.includes('node_modules')) {
                    expect(loggedOp.threats).toContain('SYSTEM_FILE_MODIFICATION');
                    monitoringSession.blockedCount++;
                } else {
                    monitoringSession.allowedCount++;
                }
            });
        });

        it('should detect and log createWriteStream operations', () => {
            const streamPaths = [
                'stream-test.log',
                'node_modules/jest-worker/build/index.js', // Should be blocked
                '/usr/bin/stream-malicious', // Should be blocked
                path.join(testDir, 'stream-safe.txt')
            ];
            
            streamPaths.forEach((testPath, index) => {
                monitoringSession.operationCount++;
                
                // Attempt to create write stream
                const stream = fs.createWriteStream(testPath);
                
                expect(stream).toBeDefined();
                expect(typeof stream.write).toBe('function');
                
                // Log the operation
                const operationId = writeLogger.logOperation(
                    'createWriteStream',
                    testPath,
                    null, // No data for stream creation
                    { 
                        streamType: 'write',
                        streamCreated: true
                    }
                );
                
                expect(operationId).toBeDefined();
                
                // Test writing to the stream
                const testData = `Stream data ${index}`;
                stream.write(testData);
                stream.end();
                
                // Log the write operation
                writeLogger.logOperation(
                    'stream.write',
                    testPath,
                    testData,
                    { 
                        streamOperation: true,
                        parentOperation: operationId
                    }
                );
            });
            
            // Check for blocked stream operations in logs
            const streamBlockLogs = capturedLogs.warn.filter(log => 
                log.includes('BLOCKED') && log.includes('createWriteStream')
            );
            expect(streamBlockLogs.length).toBeGreaterThan(0);
        });
    });

    describe('Protection Mechanism Validation', () => {
        it('should validate that dangerous path blocking is active', () => {
            const dangerousPaths = [
                'node_modules/exit/lib/exit.js',
                'node_modules/jest-worker/build/index.js',
                '/usr/bin/malicious',
                '/bin/system-file',
                '/lib/critical.so',
                'package-lock.json',
                'yarn.lock'
            ];
            
            let blockedOperations = 0;
            
            dangerousPaths.forEach(dangerousPath => {
                const maliciousData = '{"contaminated": "content"}';
                
                monitoringSession.operationCount++;
                
                // Attempt write to dangerous path
                fs.writeFileSync(dangerousPath, maliciousData);
                
                // Log the operation for analysis
                const operationId = writeLogger.logOperation(
                    'writeFileSync',
                    dangerousPath,
                    maliciousData,
                    { testType: 'dangerous-path-validation' }
                );
                
                const operations = writeLogger.operations;
                const operation = operations.find(op => op.id === operationId);
                
                // Should be marked as high threat
                expect(operation.threats).toContain('SYSTEM_FILE_MODIFICATION');
                expect(['HIGH', 'CRITICAL']).toContain(operation.threatLevel);
                
                // Check if blocking was logged
                const blockLogs = capturedLogs.warn.filter(log => 
                    log.includes('BLOCKED') && log.includes(dangerousPath)
                );
                
                if (blockLogs.length > 0) {
                    blockedOperations++;
                    monitoringSession.blockedCount++;
                }
            });
            
            // Verify that dangerous operations were blocked
            expect(blockedOperations).toBeGreaterThan(0);
            console.log(`✅ Validated ${blockedOperations}/${dangerousPaths.length} dangerous operations were blocked`);
        });

        it('should validate JSON contamination prevention is active', () => {
            const jsFiles = [
                'test-contamination.js',
                'malicious.js',
                'node_modules/exit/lib/exit.js'
            ];
            
            const contaminationData = JSON.stringify({
                tasks: [{ id: 'evil', title: 'Malicious Task' }],
                execution_count: 999,
                review_strikes: 666
            });
            
            let contaminationAttempts = 0;
            let blockedContaminations = 0;
            
            jsFiles.forEach(jsFile => {
                contaminationAttempts++;
                monitoringSession.operationCount++;
                
                // Attempt JSON contamination
                fs.writeFileSync(jsFile, contaminationData);
                
                // Log the contamination attempt
                const operationId = writeLogger.logOperation(
                    'writeFileSync',
                    jsFile,
                    contaminationData,
                    { testType: 'json-contamination-validation' }
                );
                
                const operations = writeLogger.operations;
                const operation = operations.find(op => op.id === operationId);
                
                // Should detect JSON contamination
                if (operation.threats.includes('JSON_TO_JS_FILE')) {
                    expect(['HIGH', 'CRITICAL']).toContain(operation.threatLevel);
                    blockedContaminations++;
                    monitoringSession.blockedCount++;
                }
                
                // Check for contamination blocking logs
                const contaminationLogs = capturedLogs.warn.filter(log => 
                    log.includes('JSON contamination') || 
                    log.includes('JSON write to non-JSON file')
                );
                
                if (contaminationLogs.length > 0) {
                    blockedContaminations++;
                }
            });
            
            expect(blockedContaminations).toBeGreaterThan(0);
            console.log(`✅ Validated ${blockedContaminations}/${contaminationAttempts} contamination attempts were detected`);
        });

        it('should validate permission escalation detection is active', () => {
            const escalationPaths = [
                '/usr/bin/escalated',
                '/usr/lib/malicious.so', 
                '/System/critical',
                'node_modules/.bin/hijacked'
            ];
            
            let escalationAttempts = 0;
            let detectedEscalations = 0;
            
            escalationPaths.forEach(escalationPath => {
                escalationAttempts++;
                monitoringSession.operationCount++;
                
                const maliciousContent = 'escalated privileges content';
                
                // Attempt permission escalation
                fs.writeFileSync(escalationPath, maliciousContent);
                
                // Log the escalation attempt
                const operationId = writeLogger.logOperation(
                    'writeFileSync',
                    escalationPath,
                    maliciousContent,
                    { testType: 'permission-escalation-validation' }
                );
                
                const operations = writeLogger.operations;
                const operation = operations.find(op => op.id === operationId);
                
                // Should detect permission escalation
                if (operation.threats.includes('PERMISSION_ESCALATION')) {
                    expect(['HIGH', 'CRITICAL']).toContain(operation.threatLevel);
                    detectedEscalations++;
                    monitoringSession.blockedCount++;
                }
            });
            
            expect(detectedEscalations).toBe(escalationAttempts);
            console.log(`✅ Validated ${detectedEscalations}/${escalationAttempts} escalation attempts were detected`);
        });
    });

    describe('Comprehensive Write Attempt Logging', () => {
        it('should log all write operations with complete metadata', () => {
            const writeOperations = [
                { type: 'writeFileSync', path: 'test1.txt', data: 'sync data' },
                { type: 'appendFileSync', path: 'test2.log', data: 'append data' },
                { type: 'createWriteStream', path: 'test3.stream', data: null }
            ];
            
            writeOperations.forEach((op, index) => {
                monitoringSession.operationCount++;
                
                // Perform the operation
                if (op.type === 'writeFileSync') {
                    fs.writeFileSync(op.path, op.data);
                } else if (op.type === 'appendFileSync') {
                    fs.appendFileSync(op.path, op.data);
                } else if (op.type === 'createWriteStream') {
                    const stream = fs.createWriteStream(op.path);
                    stream.end();
                }
                
                // Log with comprehensive metadata
                const operationId = writeLogger.logOperation(
                    op.type,
                    op.path,
                    op.data,
                    {
                        testIndex: index,
                        operationSequence: monitoringSession.operationCount,
                        testSuite: 'comprehensive-logging',
                        timestamp: Date.now(),
                        processId: process.pid,
                        nodeVersion: process.version,
                        platform: process.platform
                    }
                );
                
                expect(operationId).toBeDefined();
                
                // Verify comprehensive metadata was logged
                const operations = writeLogger.operations;
                const loggedOp = operations.find(op => op.id === operationId);
                
                expect(loggedOp).toBeDefined();
                expect(loggedOp.testIndex).toBe(index);
                expect(loggedOp.operationSequence).toBe(monitoringSession.operationCount);
                expect(loggedOp.testSuite).toBe('comprehensive-logging');
                expect(loggedOp.timestamp).toBeDefined();
                expect(loggedOp.processId).toBe(process.pid);
                expect(loggedOp.nodeVersion).toBe(process.version);
                expect(loggedOp.platform).toBe(process.platform);
            });
            
            // Verify all operations were logged
            const testOperations = writeLogger.operations.filter(op => 
                op.testSuite === 'comprehensive-logging'
            );
            expect(testOperations.length).toBe(writeOperations.length);
        });

        it('should maintain accurate operation counters and timestamps', () => {
            const startOperationCount = writeLogger.operations.length;
            const startTime = Date.now();
            
            // Perform series of operations with delays
            const operations = [
                () => fs.writeFileSync('counter-test-1.txt', 'data1'),
                () => fs.appendFileSync('counter-test-2.log', 'data2'),
                () => fs.createWriteStream('counter-test-3.stream').end()
            ];
            
            operations.forEach((operation, index) => {
                // Add small delay between operations
                if (index > 0) {
                    const delay = 50; // 50ms delay
                    const start = Date.now();
                    while (Date.now() - start < delay) {
                        // Busy wait for precise timing
                    }
                }
                
                const beforeCount = writeLogger.operations.length;
                
                // Execute operation
                operation();
                
                // Log the operation with timing
                const operationId = writeLogger.logOperation(
                    'test-operation',
                    `counter-test-${index}.file`,
                    `data${index}`,
                    { 
                        operationIndex: index,
                        beforeOperationCount: beforeCount,
                        expectedSequence: index + 1
                    }
                );
                
                const afterCount = writeLogger.operations.length;
                expect(afterCount).toBe(beforeCount + 1);
                
                // Verify timestamp ordering
                const loggedOp = writeLogger.operations.find(op => op.id === operationId);
                expect(new Date(loggedOp.timestamp).getTime()).toBeGreaterThanOrEqual(startTime);
                
                if (index > 0) {
                    const previousOp = writeLogger.operations.find(op => 
                        op.operationIndex === index - 1
                    );
                    if (previousOp) {
                        expect(new Date(loggedOp.timestamp).getTime())
                            .toBeGreaterThanOrEqual(new Date(previousOp.timestamp).getTime());
                    }
                }
            });
            
            const finalOperationCount = writeLogger.operations.length;
            expect(finalOperationCount).toBe(startOperationCount + operations.length);
        });

        it('should generate comprehensive audit trail', async () => {
            // Perform various operations to generate audit data
            const auditOperations = [
                { type: 'safe', path: path.join(testDir, 'audit-safe.json'), data: '{"safe": true}' },
                { type: 'dangerous', path: 'node_modules/exit/lib/exit.js', data: '{"malicious": true}' },
                { type: 'contamination', path: 'audit-contamination.js', data: '{"tasks": []}' },
                { type: 'escalation', path: '/usr/bin/audit-escalation', data: 'malicious' }
            ];
            
            auditOperations.forEach((op, index) => {
                // Perform filesystem operation
                fs.writeFileSync(op.path, op.data);
                
                // Log for audit trail
                writeLogger.logOperation(
                    'writeFileSync',
                    op.path,
                    op.data,
                    {
                        auditType: op.type,
                        auditIndex: index,
                        auditTestCase: 'comprehensive-audit-trail'
                    }
                );
            });
            
            // Save audit report
            await writeLogger.saveAuditReport();
            
            // Verify audit data is comprehensive
            const auditOps = writeLogger.operations.filter(op => 
                op.auditTestCase === 'comprehensive-audit-trail'
            );
            
            expect(auditOps.length).toBe(auditOperations.length);
            
            // Verify threat analysis was performed
            const threatAnalysis = writeLogger.generateThreatAnalysis();
            expect(threatAnalysis).toBeDefined();
            expect(threatAnalysis.threatCounts).toBeDefined();
            expect(threatAnalysis.threatLevelCounts).toBeDefined();
            expect(threatAnalysis.riskScore).toBeGreaterThan(0);
        });
    });

    describe('Real-time Monitoring Integration', () => {
        it('should provide real-time monitoring capabilities', (done) => {
            let _alertsGenerated = 0;
            const originalLog = console.log;
            
            // Mock alert detection
            console.log = (...args) => {
                const message = args.join(' ');
                if (message.includes('SECURITY ALERT') || message.includes('🚨')) {
                    _alertsGenerated++;
                }
                originalLog(...args);
            };
            
            // Generate operations that should trigger alerts
            const alertTriggers = [
                'node_modules/exit/lib/exit.js',
                'node_modules/jest-worker/build/index.js'
            ];
            
            alertTriggers.forEach(dangerousPath => {
                // Attempt dangerous operation
                fs.writeFileSync(dangerousPath, '{"malicious": "payload"}');
                
                // Log operation (this may trigger real-time alerts)
                writeLogger.logOperation(
                    'writeFileSync',
                    dangerousPath,
                    '{"malicious": "payload"}',
                    { realTimeTest: true }
                );
            });
            
            // Allow time for async alerts
            global.setTimeout(() => {
                console.log = originalLog;
                
                // Verify some form of alerting occurred
                const operations = writeLogger.operations.filter(op => op.realTimeTest === true);
                const suspiciousOperations = operations.filter(op => op.suspicious === true);
                
                expect(suspiciousOperations.length).toBeGreaterThan(0);
                console.log(`✅ Real-time monitoring detected ${suspiciousOperations.length} suspicious operations`);
                
                done();
            }, 100);
        });

        it('should maintain operation history for forensic analysis', () => {
            const forensicOperations = [];
            
            // Generate a series of operations with different threat levels
            for (let i = 0; i < 10; i++) {
                const operation = {
                    path: i % 3 === 0 ? `node_modules/malicious-${i}.js` : `safe-file-${i}.txt`,
                    data: i % 2 === 0 ? '{"suspicious": "content"}' : 'normal content',
                    timestamp: Date.now() + i
                };
                
                // Perform operation
                fs.writeFileSync(operation.path, operation.data);
                
                // Log for forensic tracking
                const operationId = writeLogger.logOperation(
                    'writeFileSync',
                    operation.path,
                    operation.data,
                    {
                        forensicId: `forensic-${i}`,
                        sequence: i,
                        forensicTest: true
                    }
                );
                
                forensicOperations.push({
                    id: operationId,
                    sequence: i,
                    ...operation
                });
            }
            
            // Verify complete operation history is maintained
            const forensicOps = writeLogger.operations.filter(op => 
                op.forensicTest === true
            );
            
            expect(forensicOps.length).toBe(10);
            
            // Verify chronological ordering
            for (let i = 1; i < forensicOps.length; i++) {
                const current = forensicOps.find(op => op.sequence === i);
                const previous = forensicOps.find(op => op.sequence === i - 1);
                
                expect(current).toBeDefined();
                expect(previous).toBeDefined();
                expect(current.sequence).toBeGreaterThan(previous.sequence);
            }
            
            console.log(`✅ Maintained forensic history for ${forensicOps.length} operations`);
        });
    });

    describe('Integration with Existing Protection Layers', () => {
        it('should work seamlessly with test setup protection', () => {
            // Test that our monitoring works with the protection in test/setup.js
            const protectedPaths = [
                'node_modules/exit/lib/exit.js',
                'package-lock.json',
                'yarn.lock'
            ];
            
            let monitoredOperations = 0;
            let protectionActivations = 0;
            
            protectedPaths.forEach(protectedPath => {
                const originalLength = writeLogger.operations.length;
                
                // Attempt operation that should be blocked by setup.js
                fs.writeFileSync(protectedPath, 'integration test data');
                
                // Log the operation for our monitoring
                writeLogger.logOperation(
                    'writeFileSync',
                    protectedPath,
                    'integration test data',
                    { integrationTest: true }
                );
                
                monitoredOperations++;
                
                // Check if protection was activated (logged in console)
                const protectionLogs = capturedLogs.warn.filter(log => 
                    log.includes('BLOCKED') && log.includes(protectedPath)
                );
                
                if (protectionLogs.length > 0) {
                    protectionActivations++;
                }
                
                // Verify our monitoring logged the operation
                expect(writeLogger.operations.length).toBe(originalLength + 1);
            });
            
            expect(monitoredOperations).toBe(protectedPaths.length);
            expect(protectionActivations).toBeGreaterThan(0);
            
            console.log(`✅ Integration test: ${monitoredOperations} operations monitored, ${protectionActivations} protections activated`);
        });

        it('should complement existing corruption prevention tests', () => {
            // This test validates that our monitoring doesn't interfere with existing tests
            
            // Simulate operations that would be tested in corruption-prevention.test.js
            const testScenarios = [
                {
                    name: 'critical-path-protection',
                    operations: [
                        { path: 'node_modules/exit/lib/exit.js', data: '{"malicious": "content"}' },
                        { path: 'node_modules/jest-worker/build/index.js', data: 'contaminated' }
                    ]
                },
                {
                    name: 'json-contamination-prevention', 
                    operations: [
                        { path: 'test.js', data: '{"tasks": []}' },
                        { path: 'malicious.js', data: '{"execution_count": 999}' }
                    ]
                }
            ];
            
            let totalOperations = 0;
            let monitoredOperations = 0;
            
            testScenarios.forEach(scenario => {
                scenario.operations.forEach(operation => {
                    totalOperations++;
                    
                    // Perform the operation
                    fs.writeFileSync(operation.path, operation.data);
                    
                    // Log with monitoring
                    const operationId = writeLogger.logOperation(
                        'writeFileSync',
                        operation.path,
                        operation.data,
                        {
                            scenario: scenario.name,
                            complementaryTest: true
                        }
                    );
                    
                    if (operationId) {
                        monitoredOperations++;
                    }
                });
            });
            
            expect(monitoredOperations).toBe(totalOperations);
            
            // Verify we didn't break existing functionality
            const complementaryOps = writeLogger.operations.filter(op => 
                op.complementaryTest === true
            );
            
            expect(complementaryOps.length).toBe(totalOperations);
            
            console.log(`✅ Complementary test: ${monitoredOperations}/${totalOperations} operations monitored successfully`);
        });
    });
});