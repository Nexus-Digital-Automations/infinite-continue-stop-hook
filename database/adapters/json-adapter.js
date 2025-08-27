/**
 * JSON File Database Adapter for TaskManager System
 * 
 * This adapter provides database-like operations using JSON files
 * Currently the primary database implementation for the TaskManager system
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

class JSONAdapter {
    constructor(config) {
        this.config = {
            todoPath: config.todoPath || path.join(process.cwd(), 'TODO.json'),
            agentRegistryPath: config.agentRegistryPath || path.join(process.cwd(), 'agent-registry.json'),
            backupEnabled: config.backupEnabled !== false,
            backupInterval: config.backupInterval || 300000, // 5 minutes
            maxBackups: config.maxBackups || 10,
            ...config
        };
        
        this.type = 'json';
        this.connected = false;
        this.operationId = 0;
        
        // Initialize logging
        this.logger = console; // Basic console logging
    }

    /**
     * Initialize the JSON database system
     */
    async connect() {
        const operationId = this.generateOperationId();
        this.logger.info(`[JSON-Adapter] [${operationId}] Initializing JSON database system`);
        
        try {
            // Ensure database files exist
            await this.ensureFileExists(this.config.todoPath, this.getDefaultTodoStructure());
            await this.ensureFileExists(this.config.agentRegistryPath, this.getDefaultAgentRegistryStructure());
            
            // Validate file structure
            await this.validateFileStructure(this.config.todoPath, 'TODO');
            await this.validateFileStructure(this.config.agentRegistryPath, 'AGENT_REGISTRY');
            
            // Setup backup system if enabled
            if (this.config.backupEnabled) {
                await this.setupBackupSystem();
            }
            
            this.connected = true;
            this.logger.info(`[JSON-Adapter] [${operationId}] JSON database system initialized successfully`);
            
            return {
                success: true,
                type: this.type,
                config: {
                    todoPath: this.config.todoPath,
                    agentRegistryPath: this.config.agentRegistryPath,
                    backupEnabled: this.config.backupEnabled
                },
                operationId
            };
            
        } catch (error) {
            this.logger.error(`[JSON-Adapter] [${operationId}] Failed to initialize JSON database`, error);
            throw new Error(`JSON database initialization failed: ${error.message}`);
        }
    }

    /**
     * Check connection status
     */
    async isConnected() {
        return this.connected && await this.validateConnectivity();
    }

    /**
     * Validate connectivity by checking file accessibility
     */
    async validateConnectivity() {
        try {
            await fs.access(this.config.todoPath, fsSync.constants.R_OK | fsSync.constants.W_OK);
            await fs.access(this.config.agentRegistryPath, fsSync.constants.R_OK | fsSync.constants.W_OK);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Ensure a JSON file exists with default structure
     */
    async ensureFileExists(filePath, defaultStructure) {
        try {
            await fs.access(filePath);
        } catch {
            // File doesn't exist, create it
            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(filePath, JSON.stringify(defaultStructure, null, 2), 'utf8');
        }
    }

    /**
     * Validate JSON file structure
     */
    async validateFileStructure(filePath, fileType) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(content);
            
            switch (fileType) {
                case 'TODO':
                    if (!data.tasks || !Array.isArray(data.tasks)) {
                        throw new Error('Invalid TODO structure: missing tasks array');
                    }
                    break;
                    
                case 'AGENT_REGISTRY':
                    if (!data.agents) {
                        throw new Error('Invalid Agent Registry structure: missing agents property');
                    }
                    // Accept both array and object formats for backward compatibility
                    if (!Array.isArray(data.agents) && typeof data.agents !== 'object') {
                        throw new Error('Invalid Agent Registry structure: agents must be array or object');
                    }
                    break;
            }
            
            return true;
        } catch (error) {
            throw new Error(`File structure validation failed for ${filePath}: ${error.message}`);
        }
    }

    /**
     * Setup backup system for JSON files
     */
    async setupBackupSystem() {
        const backupDir = path.join(path.dirname(this.config.todoPath), 'backups', 'database');
        await fs.mkdir(backupDir, { recursive: true });
        
        // Create initial backup
        await this.createBackup();
        
        // Setup periodic backups if interval is configured
        if (this.config.backupInterval > 0) {
            this.backupInterval = setInterval(() => {
                this.createBackup().catch(error => {
                    this.logger.error('[JSON-Adapter] Backup failed:', error);
                });
            }, this.config.backupInterval);
        }
    }

    /**
     * Create backup of current JSON files
     */
    async createBackup() {
        const operationId = this.generateOperationId();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        try {
            const backupDir = path.join(path.dirname(this.config.todoPath), 'backups', 'database', timestamp);
            await fs.mkdir(backupDir, { recursive: true });
            
            // Backup TODO.json
            const todoContent = await fs.readFile(this.config.todoPath, 'utf8');
            await fs.writeFile(path.join(backupDir, 'TODO.json'), todoContent, 'utf8');
            
            // Backup agent registry
            const agentContent = await fs.readFile(this.config.agentRegistryPath, 'utf8');
            await fs.writeFile(path.join(backupDir, 'agent-registry.json'), agentContent, 'utf8');
            
            // Cleanup old backups
            await this.cleanupOldBackups();
            
            this.logger.debug(`[JSON-Adapter] [${operationId}] Backup created: ${backupDir}`);
            
        } catch (error) {
            this.logger.error(`[JSON-Adapter] [${operationId}] Backup failed:`, error);
        }
    }

    /**
     * Cleanup old backup files
     */
    async cleanupOldBackups() {
        try {
            const backupBaseDir = path.join(path.dirname(this.config.todoPath), 'backups', 'database');
            const backupDirs = await fs.readdir(backupBaseDir);
            
            if (backupDirs.length > this.config.maxBackups) {
                // Sort by creation time and remove oldest
                const sortedDirs = backupDirs
                    .map(dir => ({
                        name: dir,
                        path: path.join(backupBaseDir, dir)
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name)); // Timestamp sorting
                
                const dirsToDelete = sortedDirs.slice(0, sortedDirs.length - this.config.maxBackups);
                
                for (const dirInfo of dirsToDelete) {
                    await fs.rm(dirInfo.path, { recursive: true, force: true });
                }
            }
        } catch (error) {
            this.logger.warn('[JSON-Adapter] Backup cleanup failed:', error);
        }
    }

    /**
     * Get default TODO.json structure
     */
    getDefaultTodoStructure() {
        return {
            project: "taskmanager-project",
            tasks: [],
            agents: {},
            metadata: {
                created_at: new Date().toISOString(),
                schema_version: "1.0.0",
                database_type: "json"
            }
        };
    }

    /**
     * Get default agent registry structure
     */
    getDefaultAgentRegistryStructure() {
        return {
            agents: [],
            sessions: {},
            metadata: {
                created_at: new Date().toISOString(),
                schema_version: "1.0.0"
            }
        };
    }

    /**
     * Execute database health check
     */
    async healthCheck() {
        const operationId = this.generateOperationId();
        const health = {
            status: 'healthy',
            type: 'json',
            operationId,
            timestamp: new Date().toISOString(),
            checks: []
        };

        try {
            // Check file accessibility
            const todoAccessible = await fs.access(this.config.todoPath).then(() => true).catch(() => false);
            const agentAccessible = await fs.access(this.config.agentRegistryPath).then(() => true).catch(() => false);
            
            health.checks.push({
                name: 'file_accessibility',
                status: todoAccessible && agentAccessible ? 'healthy' : 'unhealthy',
                details: {
                    todoPath: { path: this.config.todoPath, accessible: todoAccessible },
                    agentRegistryPath: { path: this.config.agentRegistryPath, accessible: agentAccessible }
                }
            });

            // Check file structure
            try {
                await this.validateFileStructure(this.config.todoPath, 'TODO');
                await this.validateFileStructure(this.config.agentRegistryPath, 'AGENT_REGISTRY');
                
                health.checks.push({
                    name: 'file_structure',
                    status: 'healthy'
                });
            } catch (error) {
                health.status = 'unhealthy';
                health.checks.push({
                    name: 'file_structure',
                    status: 'unhealthy',
                    error: error.message
                });
            }

            // Check disk space (basic check)
            const todoStats = await fs.stat(this.config.todoPath);
            const agentStats = await fs.stat(this.config.agentRegistryPath);
            
            health.checks.push({
                name: 'file_stats',
                status: 'healthy',
                details: {
                    todoSize: todoStats.size,
                    agentRegistrySize: agentStats.size,
                    lastModified: {
                        todo: todoStats.mtime,
                        agentRegistry: agentStats.mtime
                    }
                }
            });

        } catch (error) {
            health.status = 'unhealthy';
            health.error = error.message;
        }

        return health;
    }

    /**
     * Get database statistics
     */
    async getStatistics() {
        const operationId = this.generateOperationId();
        
        try {
            // Read TODO file
            const todoContent = await fs.readFile(this.config.todoPath, 'utf8');
            const todoData = JSON.parse(todoContent);
            
            // Read agent registry
            const agentContent = await fs.readFile(this.config.agentRegistryPath, 'utf8');
            const agentData = JSON.parse(agentContent);
            
            const stats = {
                operationId,
                timestamp: new Date().toISOString(),
                files: {
                    todoPath: this.config.todoPath,
                    agentRegistryPath: this.config.agentRegistryPath
                },
                tasks: {
                    total: todoData.tasks?.length || 0,
                    byStatus: this.groupBy(todoData.tasks || [], 'status'),
                    byCategory: this.groupBy(todoData.tasks || [], 'category'),
                    byPriority: this.groupBy(todoData.tasks || [], 'priority')
                },
                agents: {
                    total: Array.isArray(agentData.agents) 
                        ? agentData.agents.length 
                        : Object.keys(agentData.agents || {}).length,
                    active: Array.isArray(agentData.agents)
                        ? agentData.agents.filter(a => a.isActive !== false).length
                        : Object.values(agentData.agents || {}).filter(a => a.isActive !== false).length
                },
                fileSizes: {
                    todoBytes: (await fs.stat(this.config.todoPath)).size,
                    agentRegistryBytes: (await fs.stat(this.config.agentRegistryPath)).size
                }
            };
            
            return stats;
            
        } catch (error) {
            throw new Error(`Failed to get database statistics: ${error.message}`);
        }
    }

    /**
     * Close database connections and cleanup
     */
    async disconnect() {
        const operationId = this.generateOperationId();
        this.logger.info(`[JSON-Adapter] [${operationId}] Closing JSON database connections`);
        
        // Clear backup interval
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
            this.backupInterval = null;
        }
        
        // Create final backup
        if (this.config.backupEnabled && this.connected) {
            await this.createBackup();
        }
        
        this.connected = false;
        this.logger.info(`[JSON-Adapter] [${operationId}] JSON database closed successfully`);
    }

    /**
     * Utility method to group array by property
     */
    groupBy(array, property) {
        return array.reduce((groups, item) => {
            const key = item[property] || 'unknown';
            groups[key] = (groups[key] || 0) + 1;
            return groups;
        }, {});
    }

    /**
     * Generate operation ID for logging
     */
    generateOperationId() {
        return `json_op_${Date.now()}_${++this.operationId}`;
    }
}

module.exports = JSONAdapter;