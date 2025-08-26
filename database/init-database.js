#!/usr/bin/env node

/**
 * Database Initialization Script for TaskManager System
 * 
 * This script sets up and validates the database configuration based on the
 * environment and database type specified in configuration
 */

const path = require('path');
const fs = require('fs').promises;
const { getConfig, getDatabaseConfig, validateConfig, createDatabaseAdapter } = require('./config');

class DatabaseInitializer {
    constructor() {
        this.config = getConfig();
        this.dbConfig = getDatabaseConfig();
        this.operationId = this.generateOperationId();
        
        console.log(`[DatabaseInit] [${this.operationId}] Initializing database setup`);
    }

    /**
     * Initialize the database system
     */
    async initialize() {
        try {
            console.log(`[DatabaseInit] [${this.operationId}] Starting database initialization`);
            console.log(`[DatabaseInit] [${this.operationId}] Database type: ${this.dbConfig.type}`);
            console.log(`[DatabaseInit] [${this.operationId}] Environment: ${process.env.NODE_ENV || 'development'}`);

            // Step 1: Validate configuration
            await this.validateConfiguration();
            
            // Step 2: Create database adapter
            const adapter = await this.createAdapter();
            
            // Step 3: Initialize/connect to database
            const connectionResult = await this.connectToDatabase(adapter);
            
            // Step 4: Run health check
            const healthResult = await this.runHealthCheck(adapter);
            
            // Step 5: Get database statistics
            const statsResult = await this.getDatabaseStats(adapter);
            
            // Step 6: Clean up
            await adapter.disconnect();
            
            // Generate final report
            const report = this.generateInitializationReport({
                connectionResult,
                healthResult,
                statsResult
            });
            
            console.log(`[DatabaseInit] [${this.operationId}] Database initialization completed successfully`);
            return report;
            
        } catch (error) {
            console.error(`[DatabaseInit] [${this.operationId}] Database initialization failed:`, error);
            throw error;
        }
    }

    /**
     * Validate database configuration
     */
    async validateConfiguration() {
        console.log(`[DatabaseInit] [${this.operationId}] Validating configuration...`);
        
        const validation = validateConfig();
        
        if (!validation.isValid) {
            const errors = validation.errors.join(', ');
            throw new Error(`Configuration validation failed: ${errors}`);
        }
        
        console.log(`[DatabaseInit] [${this.operationId}] ✅ Configuration validation passed`);
        
        // Log configuration details
        console.log(`[DatabaseInit] [${this.operationId}] Configuration details:`);
        console.log(`  - Database Type: ${this.config.database.type}`);
        console.log(`  - Host: ${this.config.database.host || 'N/A'}`);
        console.log(`  - Port: ${this.config.database.port || 'N/A'}`);
        console.log(`  - Database: ${this.config.database.name || 'N/A'}`);
        console.log(`  - Caching: ${this.config.cache.enabled ? 'enabled' : 'disabled'}`);
        console.log(`  - Logging Level: ${this.config.logging.level}`);
    }

    /**
     * Create database adapter
     */
    async createAdapter() {
        console.log(`[DatabaseInit] [${this.operationId}] Creating database adapter...`);
        
        try {
            const adapter = await createDatabaseAdapter();
            console.log(`[DatabaseInit] [${this.operationId}] ✅ ${adapter.type} adapter created successfully`);
            return adapter;
        } catch (error) {
            // If adapter creation fails, provide helpful error message
            console.error(`[DatabaseInit] [${this.operationId}] ❌ Failed to create adapter:`, error.message);
            
            if (error.message.includes('Cannot find module')) {
                console.log(`[DatabaseInit] [${this.operationId}] 💡 Note: Some database adapters may not be implemented yet.`);
                console.log(`[DatabaseInit] [${this.operationId}] 💡 Currently supported: JSON file system`);
            }
            
            throw error;
        }
    }

    /**
     * Connect to database
     */
    async connectToDatabase(adapter) {
        console.log(`[DatabaseInit] [${this.operationId}] Connecting to database...`);
        
        const connectionResult = await adapter.connect();
        
        if (connectionResult.success) {
            console.log(`[DatabaseInit] [${this.operationId}] ✅ Database connection established`);
            console.log(`[DatabaseInit] [${this.operationId}] Connection details:`, 
                JSON.stringify(connectionResult.config, null, 2));
        } else {
            throw new Error('Database connection failed');
        }
        
        return connectionResult;
    }

    /**
     * Run database health check
     */
    async runHealthCheck(adapter) {
        console.log(`[DatabaseInit] [${this.operationId}] Running health check...`);
        
        const healthResult = await adapter.healthCheck();
        
        if (healthResult.status === 'healthy') {
            console.log(`[DatabaseInit] [${this.operationId}] ✅ Health check passed`);
            console.log(`[DatabaseInit] [${this.operationId}] Health details:`, JSON.stringify(healthResult, null, 2));
        } else {
            console.warn(`[DatabaseInit] [${this.operationId}] ⚠️  Health check issues found:`, healthResult);
        }
        
        return healthResult;
    }

    /**
     * Get database statistics
     */
    async getDatabaseStats(adapter) {
        console.log(`[DatabaseInit] [${this.operationId}] Collecting database statistics...`);
        
        try {
            const statsResult = await adapter.getStatistics();
            
            console.log(`[DatabaseInit] [${this.operationId}] ✅ Statistics collected`);
            console.log(`[DatabaseInit] [${this.operationId}] Database statistics:`);
            console.log(`  - Total Tasks: ${statsResult.tasks?.total || 0}`);
            console.log(`  - Total Agents: ${statsResult.agents?.total || 0}`);
            console.log(`  - Active Agents: ${statsResult.agents?.active || 0}`);
            
            if (statsResult.tasks?.byStatus) {
                console.log(`  - Tasks by Status:`, statsResult.tasks.byStatus);
            }
            
            return statsResult;
        } catch (error) {
            console.warn(`[DatabaseInit] [${this.operationId}] ⚠️  Failed to collect statistics:`, error.message);
            return null;
        }
    }

    /**
     * Generate initialization report
     */
    generateInitializationReport(results) {
        const report = {
            operationId: this.operationId,
            timestamp: new Date().toISOString(),
            success: true,
            database: {
                type: this.dbConfig.type,
                config: this.dbConfig.config
            },
            environment: process.env.NODE_ENV || 'development',
            results: {
                connection: results.connectionResult,
                health: results.healthResult,
                statistics: results.statsResult
            },
            summary: {
                databaseType: this.dbConfig.type,
                connectionSuccessful: results.connectionResult?.success || false,
                healthStatus: results.healthResult?.status || 'unknown',
                totalTasks: results.statsResult?.tasks?.total || 0,
                totalAgents: results.statsResult?.agents?.total || 0
            }
        };
        
        // Save report to file
        this.saveReportToFile(report);
        
        return report;
    }

    /**
     * Save initialization report to file
     */
    async saveReportToFile(report) {
        try {
            const reportsDir = path.join(process.cwd(), 'database', 'reports');
            await fs.mkdir(reportsDir, { recursive: true });
            
            const filename = `database-init-${this.operationId}.json`;
            const filepath = path.join(reportsDir, filename);
            
            await fs.writeFile(filepath, JSON.stringify(report, null, 2), 'utf8');
            console.log(`[DatabaseInit] [${this.operationId}] 📄 Initialization report saved: ${filepath}`);
        } catch (error) {
            console.warn(`[DatabaseInit] [${this.operationId}] ⚠️  Failed to save report:`, error.message);
        }
    }

    /**
     * Generate operation ID
     */
    generateOperationId() {
        return `dbinit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
    const args = process.argv.slice(2);
    
    // Parse command line arguments
    const options = {
        verbose: args.includes('--verbose') || args.includes('-v'),
        help: args.includes('--help') || args.includes('-h'),
        env: args.find(arg => arg.startsWith('--env='))?.split('=')[1],
        type: args.find(arg => arg.startsWith('--type='))?.split('=')[1]
    };
    
    if (options.help) {
        console.log(`
TaskManager Database Initialization Tool

Usage: node init-database.js [options]

Options:
  --help, -h       Show this help message
  --verbose, -v    Enable verbose logging
  --env=ENV        Set environment (development, test, production)
  --type=TYPE      Override database type (json, postgresql, mysql, mongodb)

Examples:
  node init-database.js
  node init-database.js --verbose
  node init-database.js --env=production --type=postgresql
  node init-database.js --env=test --verbose

Environment Variables:
  NODE_ENV         Set environment (overrides --env)
  DB_TYPE          Set database type (overrides --type)
  DB_HOST          Database host
  DB_PORT          Database port
  DB_NAME          Database name
  DB_USERNAME      Database username
  DB_PASSWORD      Database password

For more configuration options, see database/config.js
        `);
        process.exit(0);
    }
    
    // Override environment variables if specified
    if (options.env) {
        process.env.NODE_ENV = options.env;
    }
    if (options.type) {
        process.env.DB_TYPE = options.type;
    }
    
    try {
        console.log('🚀 TaskManager Database Initialization');
        console.log('=====================================');
        
        const initializer = new DatabaseInitializer();
        const report = await initializer.initialize();
        
        console.log('=====================================');
        console.log('✅ Database initialization completed successfully!');
        console.log(`📊 Summary: ${report.summary.totalTasks} tasks, ${report.summary.totalAgents} agents`);
        console.log(`🔍 Health: ${report.summary.healthStatus}`);
        console.log(`💾 Database: ${report.summary.databaseType}`);
        console.log('=====================================');
        
        process.exit(0);
        
    } catch (error) {
        console.error('=====================================');
        console.error('❌ Database initialization failed!');
        console.error('Error:', error.message);
        
        if (options.verbose) {
            console.error('Stack trace:', error.stack);
        }
        
        console.error('=====================================');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    DatabaseInitializer,
    main
};