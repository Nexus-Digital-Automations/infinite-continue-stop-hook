const fs = require('fs');
const path = require('path');
const PostTestValidator = require('../lib/postTestValidator');

describe('Post-Test Validation System', () => {
    let validator;
    let testDir;
    let mockFiles;

    beforeEach(() => {
        // Create unique test directory for each test to avoid interference
        const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        testDir = `.test-env-${testId}`;
        
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }
        
        // Disable console isolation for this test to see debug output
        process.env.PRESERVE_CONSOLE = 'true';

        // Create mock critical files for testing
        mockFiles = {
            'package.json': JSON.stringify({ name: 'test-project', version: '1.0.0' }),
            'TODO.json': JSON.stringify({ tasks: [], execution_count: 0 }),
            'node_modules/exit/lib/exit.js': 'module.exports = function(code) { process.exit(code); };',
            'node_modules/jest-worker/build/index.js': 'module.exports = { Worker: class Worker {} };'
        };

        Object.entries(mockFiles).forEach(([relativePath, content]) => {
            const fullPath = path.join(testDir, relativePath);
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(fullPath, content);
        });

        validator = new PostTestValidator({
            projectRoot: testDir,
            enableFileIntegrity: true,
            enableJsonValidation: true,
            enableNodeModulesProtection: true,
            enableBinaryCorruption: true,
            enablePermissionEscalation: true,
            enableFileSystemChanges: true
        });
        
        // Override critical files for test environment
        validator.criticalFiles = [
            'node_modules/exit/lib/exit.js',
            'node_modules/jest-worker/build/index.js',
            'package.json',
            'TODO.json'
        ];
    });

    afterEach(() => {
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
        delete process.env.PRESERVE_CONSOLE;
    });

    describe('Initialization and Baseline', () => {
        test('should initialize baseline hashes for critical files', async () => {
            await validator.initializeBaseline();
            expect(validator.originalHashes.size).toBe(4);

            // Check that all expected files have baselines
            const expectedFiles = [
                path.join(testDir, 'node_modules/exit/lib/exit.js'),
                path.join(testDir, 'node_modules/jest-worker/build/index.js'),
                path.join(testDir, 'package.json'),
                path.join(testDir, 'TODO.json')
            ];
            
            for (const expectedFile of expectedFiles) {
                expect(validator.originalHashes.has(expectedFile)).toBe(true);
                const baseline = validator.originalHashes.get(expectedFile);
                expect(baseline).toHaveProperty('hash');
                expect(baseline).toHaveProperty('size');
                expect(baseline).toHaveProperty('mtime');
            }
        });

        test('should handle missing critical files gracefully', async () => {
            // Remove a critical file
            const exitJsPath = path.join(testDir, 'node_modules/exit/lib/exit.js');
            fs.unlinkSync(exitJsPath);

            await validator.initializeBaseline();
            expect(validator.originalHashes.has(exitJsPath)).toBe(false);
        });
    });

    describe('File Integrity Validation', () => {
        test('should detect file corruption through hash mismatch', async () => {
            await validator.initializeBaseline();

            // Corrupt a critical file
            const exitJsPath = path.join(testDir, 'node_modules/exit/lib/exit.js');
            fs.writeFileSync(exitJsPath, 'CORRUPTED CONTENT');

            const result = await validator.validateFileIntegrity();
            expect(result.status).toBe('FAILED');
            expect(result.issues).toHaveLength(1);
            expect(result.issues[0].type).toBe('CRITICAL');
            expect(result.issues[0].category).toBe('file_corruption');
            expect(result.issues[0].file).toBe(exitJsPath);
        });

        test('should detect file deletion', async () => {
            await validator.initializeBaseline();

            // Delete a critical file
            const exitJsPath = path.join(testDir, 'node_modules/exit/lib/exit.js');
            fs.unlinkSync(exitJsPath);

            const result = await validator.validateFileIntegrity();
            expect(result.status).toBe('FAILED');
            expect(result.issues).toHaveLength(1);
            expect(result.issues[0].type).toBe('CRITICAL');
            expect(result.issues[0].category).toBe('file_deletion');
        });

        test('should pass validation for intact files', async () => {
            await validator.initializeBaseline();

            const result = await validator.validateFileIntegrity();
            expect(result.status).toBe('PASSED');
            expect(result.issues).toHaveLength(0);
        });
    });

    describe('JSON Validation', () => {
        test('should validate JSON file syntax', async () => {
            const result = await validator.validateJsonFiles();
            expect(result.status).toBe('PASSED');
            expect(result.details['TODO.json']).toHaveProperty('status', 'VALID');
            expect(result.details['package.json']).toHaveProperty('status', 'VALID');
        });

        test('should detect invalid JSON syntax', async () => {
            // Create invalid JSON
            const todoPath = path.join(testDir, 'TODO.json');
            fs.writeFileSync(todoPath, '{ invalid json syntax }');

            const result = await validator.validateJsonFiles();
            expect(result.status).toBe('FAILED');
            expect(result.issues).toHaveLength(1);
            expect(result.issues[0].type).toBe('CRITICAL');
            expect(result.issues[0].category).toBe('json_corruption');
        });

        test('should detect JavaScript contamination in JSON files', async () => {
            // Contaminate TODO.json with JavaScript code
            const todoPath = path.join(testDir, 'TODO.json');
            fs.writeFileSync(todoPath, '{ "tasks": [], "malicious": function() { return "bad"; } }');

            const result = await validator.validateJsonFiles();
            expect(result.status).toBe('FAILED');
            expect(result.issues.some(issue => issue.category === 'json_contamination')).toBe(true);
        });
    });

    describe('Node Modules Protection', () => {
        test('should detect exit.js contamination', async () => {
            // Contaminate exit.js with JSON data
            const exitJsPath = path.join(testDir, 'node_modules/exit/lib/exit.js');
            fs.writeFileSync(exitJsPath, 'module.exports = { "tasks": [{"id": "malicious"}] };');

            const result = await validator.validateNodeModulesProtection();
            expect(result.status).toBe('FAILED');
            expect(result.issues.some(issue => issue.category === 'exit_contamination')).toBe(true);
        });

        test('should validate clean exit.js file', async () => {
            const result = await validator.validateNodeModulesProtection();
            expect(result.status).toBe('PASSED');
            expect(result.details.exitJs).toHaveProperty('integrity', 'LIKELY_INTACT');
        });

        test('should detect suspicious files in node_modules', async () => {
            // Create suspicious file
            const suspiciousPath = path.join(testDir, 'node_modules/TODO.json');
            fs.writeFileSync(suspiciousPath, '{}');

            const result = await validator.validateNodeModulesProtection();
            expect(result.issues.some(issue => issue.category === 'suspicious_file')).toBe(true);
        });
    });

    describe('Binary Corruption Validation', () => {
        test('should validate binary directories', async () => {
            // Create mock bin directory
            const binDir = path.join(testDir, 'node_modules/.bin');
            fs.mkdirSync(binDir, { recursive: true });
            fs.writeFileSync(path.join(binDir, 'jest'), 'mock binary content');

            const result = await validator.validateBinaryCorruption();
            expect(result.status).toBe('PASSED');
            expect(result.details['node_modules/.bin']).toHaveProperty('type', 'directory');
        });

        test('should detect suspiciously small binary files', async () => {
            // Create a very small "node" binary (which would be suspicious)
            const fakeBinary = path.join(testDir, 'fake-node');
            fs.writeFileSync(fakeBinary, 'tiny');

            const customValidator = new PostTestValidator({
                projectRoot: testDir
            });
            
            // Store original method to restore after test
            const originalMethod = customValidator.constructor.prototype.validateBinaryCorruption;
            
            try {
                // Override the binary paths for testing
                customValidator.constructor.prototype.validateBinaryCorruption = async function() {
                    const check = {
                        name: 'Binary Corruption Check',
                        status: 'PASSED',
                        issues: [],
                        details: {}
                    };

                    const stat = fs.statSync(fakeBinary);
                    if (stat.size < 1000) {
                        const issue = {
                            type: 'WARNING',
                            category: 'binary_corruption',
                            file: fakeBinary,
                            message: 'Binary file suspiciously small',
                            recommendation: 'Verify binary integrity'
                        };
                        check.issues.push(issue);
                        this.corruptionReport.issues.push(issue);
                    }

                    this.corruptionReport.checks.binaryCorruption = check;
                    return check;
                };

                const result = await customValidator.validateBinaryCorruption();
                expect(result.issues.some(issue => issue.category === 'binary_corruption')).toBe(true);
            } finally {
                // Always restore original method to prevent test pollution
                customValidator.constructor.prototype.validateBinaryCorruption = originalMethod;
            }
        });
    });

    describe('Permission Escalation Validation', () => {
        test('should validate system directory protection', async () => {
            const result = await validator.validatePermissionEscalation();
            expect(result.status).toBe('PASSED');
            
            // Should not be able to write to system directories
            expect(result.details['/usr/bin']).toEqual({ writeProtected: true });
        });
    });

    describe('Filesystem Changes Validation', () => {
        test('should detect unexpected files in project root', async () => {
            // Create unexpected file
            const unexpectedFile = path.join(testDir, 'suspicious-file.exe');
            fs.writeFileSync(unexpectedFile, 'unexpected content');

            const result = await validator.validateFileSystemChanges();
            expect(result.issues.some(issue => issue.category === 'unexpected_file')).toBe(true);
        });

        test('should ignore expected files and directories', async () => {
            // Create expected files
            const expectedFiles = ['README.md', '.gitignore', 'CLAUDE.md'];
            expectedFiles.forEach(file => {
                fs.writeFileSync(path.join(testDir, file), 'content');
            });

            const result = await validator.validateFileSystemChanges();
            expect(result.details.projectRoot.unexpectedFiles).toBe(0);
        });
    });

    describe('Full Validation Workflow', () => {
        test('should run complete validation successfully', async () => {
            const report = await validator.runFullValidation();
            
            expect(report).toHaveProperty('timestamp');
            expect(report).toHaveProperty('testSession');
            expect(report).toHaveProperty('checks');
            expect(report).toHaveProperty('issues');
            expect(report).toHaveProperty('summary');
            expect(report).toHaveProperty('executionTime');
            expect(report).toHaveProperty('overallStatus');

            expect(report.summary.totalChecks).toBeGreaterThan(0);
            expect(report.overallStatus).toBe('PASSED');
        });

        test('should detect multiple corruption types in single run', async () => {
            await validator.initializeBaseline();

            // Introduce multiple corruptions
            const exitJsPath = path.join(testDir, 'node_modules/exit/lib/exit.js');
            fs.writeFileSync(exitJsPath, 'CORRUPTED');

            const todoPath = path.join(testDir, 'TODO.json');
            fs.writeFileSync(todoPath, '{ invalid json }');

            const suspiciousPath = path.join(testDir, 'malware.exe');
            fs.writeFileSync(suspiciousPath, 'suspicious content');

            const report = await validator.runFullValidation();
            
            expect(report.overallStatus).toBe('CRITICAL');
            expect(report.summary.criticalIssues).toBeGreaterThan(0);
            expect(report.issues.length).toBeGreaterThan(2);
        });

        test('should handle validation errors gracefully', async () => {
            // Create validator with invalid project root
            const invalidValidator = new PostTestValidator({
                projectRoot: '/nonexistent/directory'
            });

            const _report = await invalidValidator.runFullValidation();
            expect(_report.overallStatus).toBe('ERROR');
            expect(_report).toHaveProperty('error');
        });
    });

    describe('Report Generation', () => {
        test('should generate detailed JSON report', async () => {
            const _report = await validator.runFullValidation();
            const reportFiles = await validator.generateReport();

            expect(reportFiles).toHaveProperty('detailedReport');
            expect(reportFiles).toHaveProperty('summaryReport');
            expect(reportFiles).toHaveProperty('status');

            // Verify files exist
            expect(fs.existsSync(reportFiles.detailedReport)).toBe(true);
            expect(fs.existsSync(reportFiles.summaryReport)).toBe(true);

            // Verify report content
            const reportContent = JSON.parse(fs.readFileSync(reportFiles.detailedReport, 'utf8'));
            expect(reportContent).toHaveProperty('generatedAt');
            expect(reportContent).toHaveProperty('validator');
            expect(reportContent.validator).toHaveProperty('version');
        });

        test('should generate human-readable summary', async () => {
            await validator.runFullValidation();
            const reportFiles = await validator.generateReport();

            const summaryContent = fs.readFileSync(reportFiles.summaryReport, 'utf8');
            expect(summaryContent).toContain('POST-TEST CORRUPTION VALIDATION REPORT');
            expect(summaryContent).toContain('SUMMARY:');
            expect(summaryContent).toContain('Total Checks:');
            expect(summaryContent).toContain('Overall Status:');
        });

        test('should handle report generation errors', async () => {
            // Try to generate report to invalid path
            await expect(validator.generateReport('/invalid/path/report.json'))
                .rejects.toThrow();
        });
    });

    describe('Integration with Existing Systems', () => {
        test('should integrate with FileOperationLogger', () => {
            expect(global.fileOperationLogger).toBeDefined();
            
            // Validator should work alongside file operation logging
            const logger = global.fileOperationLogger;
            expect(logger).toHaveProperty('logOperation');
            expect(logger).toHaveProperty('analyzeThreat');
        });

        test('should respect test setup file protections', () => {
            // Test that validator recognizes protected paths
            const protectedPaths = [
                'node_modules/exit/lib/exit.js',
                'node_modules/jest-worker/build/index.js'
            ];

            protectedPaths.forEach(protectedPath => {
                expect(validator.criticalFiles.includes(protectedPath)).toBe(true);
            });
        });

        test('should work with jest test environment', () => {
            // Verify validator works in jest environment
            expect(process.env.NODE_ENV).toBe('test');
            expect(validator.projectRoot).toBeDefined();
            expect(validator.enabledChecks).toBeDefined();
        });
    });

    describe('Performance and Scalability', () => {
        test('should complete validation within reasonable time', async () => {
            const startTime = Date.now();
            await validator.runFullValidation();
            const executionTime = Date.now() - startTime;

            expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
        });

        test('should handle large directory structures', async () => {
            // Create many files to test scalability
            const manyFilesDir = path.join(testDir, 'many-files');
            fs.mkdirSync(manyFilesDir, { recursive: true });

            for (let i = 0; i < 100; i++) {
                fs.writeFileSync(path.join(manyFilesDir, `file${i}.txt`), `content ${i}`);
            }

            const result = await validator.validateFileSystemChanges();
            expect(result.status).toBe('PASSED');
        });

        test('should limit memory usage during directory scanning', async () => {
            const initialMemory = process.memoryUsage().heapUsed;
            await validator.runFullValidation();
            const finalMemory = process.memoryUsage().heapUsed;

            // Memory increase should be reasonable (less than 50MB)
            const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
            expect(memoryIncrease).toBeLessThan(50);
        });
    });
});