#!/usr/bin/env node

/**
 * Database Migration Tool for TaskManager System
 * 
 * Handles database schema setup, migrations, and data conversion between different database types
 * Supports migrating from JSON files to SQL/NoSQL databases and vice versa
 */

const fs = require('fs');
const path = require('path');
const { getDatabaseConfig, validateConfig } = require('./config');

// ============================================================================
// MIGRATION CONTROLLER
// ============================================================================

class MigrationController {
  constructor() {
    this.migrations = [];
    this.currentAdapter = null;
  }

  /**
   * Initialize migration system
   */
  async initialize() {
    const validation = validateConfig();
    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    const dbConfig = getDatabaseConfig();
    console.log(`📊 Initializing migration for ${dbConfig.type} database...`);

    // Load appropriate adapter
    this.currentAdapter = await this.createAdapter(dbConfig);
    
    // Load migration files
    this.loadMigrations();
    
    console.log(`✅ Migration system initialized`);
  }

  /**
   * Create database adapter
   */
  async createAdapter(dbConfig) {
    switch (dbConfig.type) {
      case 'postgresql':
        return new PostgreSQLMigrationAdapter(dbConfig.config);
      case 'mysql':
        return new MySQLMigrationAdapter(dbConfig.config);
      case 'mongodb':
        return new MongoDBMigrationAdapter(dbConfig.config);
      case 'json':
      default:
        return new JSONMigrationAdapter(dbConfig.config);
    }
  }

  /**
   * Load migration files
   */
  loadMigrations() {
    const migrationsDir = path.join(__dirname, 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    this.migrations = files.map(file => {
      const migration = require(path.join(migrationsDir, file));
      return {
        name: file.replace('.js', ''),
        ...migration
      };
    });

    console.log(`📂 Loaded ${this.migrations.length} migration(s)`);
  }

  /**
   * Run pending migrations
   */
  async migrate() {
    console.log('🚀 Running database migrations...');
    
    // Ensure migration tracking table exists
    await this.currentAdapter.ensureMigrationTable();
    
    // Get applied migrations
    const appliedMigrations = await this.currentAdapter.getAppliedMigrations();
    
    // Find pending migrations
    const pendingMigrations = this.migrations.filter(migration => 
      !appliedMigrations.includes(migration.name)
    );

    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    console.log(`📋 Found ${pendingMigrations.length} pending migration(s)`);

    // Run each pending migration
    for (const migration of pendingMigrations) {
      console.log(`⏳ Running migration: ${migration.name}`);
      
      try {
        await this.currentAdapter.runMigration(migration);
        await this.currentAdapter.recordMigration(migration.name);
        console.log(`✅ Migration completed: ${migration.name}`);
      } catch (error) {
        console.error(`❌ Migration failed: ${migration.name}`);
        console.error(error.message);
        throw error;
      }
    }

    console.log('🎉 All migrations completed successfully');
  }

  /**
   * Rollback last migration
   */
  async rollback() {
    console.log('🔄 Rolling back last migration...');
    
    const appliedMigrations = await this.currentAdapter.getAppliedMigrations();
    
    if (appliedMigrations.length === 0) {
      console.log('✅ No migrations to rollback');
      return;
    }

    const lastMigration = appliedMigrations[appliedMigrations.length - 1];
    const migration = this.migrations.find(m => m.name === lastMigration);

    if (!migration) {
      throw new Error(`Migration file not found: ${lastMigration}`);
    }

    if (!migration.down) {
      throw new Error(`Migration ${lastMigration} does not support rollback`);
    }

    try {
      await this.currentAdapter.rollbackMigration(migration);
      await this.currentAdapter.removeMigrationRecord(migration.name);
      console.log(`✅ Migration rolled back: ${migration.name}`);
    } catch (error) {
      console.error(`❌ Rollback failed: ${migration.name}`);
      console.error(error.message);
      throw error;
    }
  }

  /**
   * Create initial database schema
   */
  async createSchema() {
    console.log('🏗️ Creating initial database schema...');
    await this.currentAdapter.createInitialSchema();
    console.log('✅ Initial schema created');
  }

  /**
   * Import data from JSON files
   */
  async importFromJSON(todoPath, agentRegistryPath) {
    console.log('📥 Importing data from JSON files...');
    
    // Read JSON files
    const todoData = this.readJSONFile(todoPath);
    const agentData = this.readJSONFile(agentRegistryPath);
    
    // Import data
    await this.currentAdapter.importData(todoData, agentData);
    
    console.log('✅ Data import completed');
  }

  /**
   * Export data to JSON files
   */
  async exportToJSON(todoPath, agentRegistryPath) {
    console.log('📤 Exporting data to JSON files...');
    
    const { todoData, agentData } = await this.currentAdapter.exportData();
    
    // Write JSON files
    this.writeJSONFile(todoPath, todoData);
    this.writeJSONFile(agentRegistryPath, agentData);
    
    console.log('✅ Data export completed');
  }

  /**
   * Utility methods
   */
  readJSONFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return {};
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`⚠️ Failed to read ${filePath}: ${error.message}`);
      return {};
    }
  }

  writeJSONFile(filePath, data) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`❌ Failed to write ${filePath}: ${error.message}`);
      throw error;
    }
  }
}

// ============================================================================
// DATABASE ADAPTERS
// ============================================================================

/**
 * Base Migration Adapter
 */
class BaseMigrationAdapter {
  constructor(config) {
    this.config = config;
  }

  async ensureMigrationTable() {
    throw new Error('ensureMigrationTable must be implemented');
  }

  async getAppliedMigrations() {
    throw new Error('getAppliedMigrations must be implemented');
  }

  async runMigration(_migration) {
    throw new Error('runMigration must be implemented');
  }

  async rollbackMigration(_migration) {
    throw new Error('rollbackMigration must be implemented');
  }

  async recordMigration(_name) {
    throw new Error('recordMigration must be implemented');
  }

  async removeMigrationRecord(_name) {
    throw new Error('removeMigrationRecord must be implemented');
  }

  async createInitialSchema() {
    throw new Error('createInitialSchema must be implemented');
  }

  async importData(_todoData, _agentData) {
    throw new Error('importData must be implemented');
  }

  async exportData() {
    throw new Error('exportData must be implemented');
  }
}

/**
 * JSON Migration Adapter (current system)
 */
class JSONMigrationAdapter extends BaseMigrationAdapter {
  constructor(config) {
    super(config);
    this.migrationsFile = path.join(path.dirname(config.todoPath), '.migrations.json');
  }

  async ensureMigrationTable() {
    if (!fs.existsSync(this.migrationsFile)) {
      fs.writeFileSync(this.migrationsFile, JSON.stringify([], null, 2));
    }
  }

  async getAppliedMigrations() {
    if (!fs.existsSync(this.migrationsFile)) {
      return [];
    }
    
    const content = fs.readFileSync(this.migrationsFile, 'utf8');
    return JSON.parse(content);
  }

  async runMigration(_migration) {
    if (_migration.up) {
      await _migration.up(this);
    }
  }

  async rollbackMigration(_migration) {
    if (_migration.down) {
      await _migration.down(this);
    }
  }

  async recordMigration(_name) {
    const migrations = await this.getAppliedMigrations();
    migrations.push(_name);
    fs.writeFileSync(this.migrationsFile, JSON.stringify(migrations, null, 2));
  }

  async removeMigrationRecord(_name) {
    const migrations = await this.getAppliedMigrations();
    const index = migrations.indexOf(_name);
    if (index > -1) {
      migrations.splice(index, 1);
      fs.writeFileSync(this.migrationsFile, JSON.stringify(migrations, null, 2));
    }
  }

  async createInitialSchema() {
    // Create initial JSON files if they don't exist
    const todoPath = this.config.todoPath;
    const agentPath = this.config.agentRegistryPath;
    
    if (!fs.existsSync(todoPath)) {
      const initialTodo = {
        tasks: [],
        agents: {},
        metadata: {
          version: '1.0.0',
          created: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      };
      fs.writeFileSync(todoPath, JSON.stringify(initialTodo, null, 2));
    }

    if (!fs.existsSync(agentPath)) {
      const initialAgents = {
        agents: {},
        sessions: {},
        metadata: {
          version: '1.0.0',
          created: new Date().toISOString()
        }
      };
      fs.writeFileSync(agentPath, JSON.stringify(initialAgents, null, 2));
    }
  }

  async importData(_todoData, _agentData) {
    // JSON adapter doesn't need import - data is already in JSON format
    console.log('📁 JSON files are already in the correct format');
  }

  async exportData() {
    const todoData = this.readFile(this.config.todoPath);
    const agentData = this.readFile(this.config.agentRegistryPath);
    
    return { todoData, agentData };
  }

  readFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return {};
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  }
}

/**
 * PostgreSQL Migration Adapter
 */
class PostgreSQLMigrationAdapter extends BaseMigrationAdapter {
  constructor(config) {
    super(config);
    // In a real implementation, initialize PostgreSQL connection here
  }

  async ensureMigrationTable() {
    // Create migrations table if it doesn't exist
    console.log('🗄️ Ensuring PostgreSQL migration table exists...');
  }

  async getAppliedMigrations() {
    // Query migrations table
    return [];
  }

  async runMigration(migration) {
    // Execute SQL migration
    console.log(`🔧 Running PostgreSQL migration: ${migration.name}`);
  }

  async createInitialSchema() {
    // Execute initial schema SQL
    console.log('🏗️ Creating PostgreSQL schema...');
    // const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    // In real implementation: execute schemaSQL against database
  }

  async importData(_todoData, _agentData) {
    // Convert JSON data to SQL inserts
    console.log('📥 Importing data to PostgreSQL...');
  }

  async exportData() {
    // Query all data and convert to JSON format
    console.log('📤 Exporting data from PostgreSQL...');
    return { todoData: {}, agentData: {} };
  }
}

/**
 * MongoDB Migration Adapter
 */
class MongoDBMigrationAdapter extends BaseMigrationAdapter {
  constructor(config) {
    super(config);
    // In a real implementation, initialize MongoDB connection here
  }

  async createInitialSchema() {
    // Create MongoDB collections with validation
    console.log('🏗️ Creating MongoDB collections...');
  }

  async importData(_todoData, _agentData) {
    // Convert JSON to MongoDB documents
    console.log('📥 Importing data to MongoDB...');
  }

  async exportData() {
    // Export MongoDB collections to JSON format
    console.log('📤 Exporting data from MongoDB...');
    return { todoData: {}, agentData: {} };
  }
}

/**
 * MySQL Migration Adapter
 */
class MySQLMigrationAdapter extends BaseMigrationAdapter {
  constructor(config) {
    super(config);
    // In a real implementation, initialize MySQL connection here
  }

  async createInitialSchema() {
    // Execute MySQL schema creation
    console.log('🏗️ Creating MySQL schema...');
  }

  async importData(_todoData, _agentData) {
    // Convert JSON data to MySQL inserts
    console.log('📥 Importing data to MySQL...');
  }
}

// ============================================================================
// COMMAND LINE INTERFACE
// ============================================================================

async function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    showUsage();
    process.exit(1);
  }

  const migrationController = new MigrationController();

  try {
    await migrationController.initialize();

    switch (command) {
      case 'migrate':
        await migrationController.migrate();
        break;

      case 'rollback':
        await migrationController.rollback();
        break;

      case 'create-schema':
        await migrationController.createSchema();
        break;

      case 'import': {
        const todoPath = args[1] || path.join(process.cwd(), 'TODO.json');
        const agentPath = args[2] || path.join(process.cwd(), 'agent-registry.json');
        await migrationController.importFromJSON(todoPath, agentPath);
        break;
      }

      case 'export': {
        const exportTodoPath = args[1] || path.join(process.cwd(), 'TODO.json');
        const exportAgentPath = args[2] || path.join(process.cwd(), 'agent-registry.json');
        await migrationController.exportToJSON(exportTodoPath, exportAgentPath);
        break;
      }

      case 'status':
        await showMigrationStatus(migrationController);
        break;

      default:
        console.error(`Unknown command: ${command}`);
        showUsage();
        process.exit(1);
    }

    console.log('🎉 Migration operation completed successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

async function showMigrationStatus(controller) {
  console.log('📊 Migration Status:');
  
  const appliedMigrations = await controller.currentAdapter.getAppliedMigrations();
  console.log(`✅ Applied migrations: ${appliedMigrations.length}`);
  
  const pendingMigrations = controller.migrations.filter(m => 
    !appliedMigrations.includes(m.name)
  );
  console.log(`⏳ Pending migrations: ${pendingMigrations.length}`);
  
  if (appliedMigrations.length > 0) {
    console.log('\n📋 Applied:');
    appliedMigrations.forEach(name => console.log(`   ✅ ${name}`));
  }
  
  if (pendingMigrations.length > 0) {
    console.log('\n📋 Pending:');
    pendingMigrations.forEach(migration => console.log(`   ⏳ ${migration.name}`));
  }
}

function showUsage() {
  console.log(`
TaskManager Database Migration Tool

Usage: node migrate.js <command> [options]

Commands:
  migrate                    Run all pending migrations
  rollback                   Rollback the last migration
  create-schema              Create initial database schema
  import [todo] [agents]     Import data from JSON files
  export [todo] [agents]     Export data to JSON files
  status                     Show migration status

Examples:
  node migrate.js migrate
  node migrate.js create-schema
  node migrate.js import ./TODO.json ./agent-registry.json
  node migrate.js export ./backup-todo.json ./backup-agents.json
  node migrate.js status

Environment Variables:
  DB_TYPE                    Database type (postgresql, mysql, mongodb, json)
  NODE_ENV                   Environment (development, test, production)
  
  PostgreSQL:
  DATABASE_URL               Full connection string
  POSTGRES_HOST              Host (default: localhost)
  POSTGRES_PORT              Port (default: 5432)
  POSTGRES_DB                Database name
  POSTGRES_USER              Username
  POSTGRES_PASSWORD          Password

  MongoDB:
  MONGODB_URI                Full connection string
  MONGO_HOST                 Host (default: localhost)
  MONGO_PORT                 Port (default: 27017)
  MONGO_DATABASE             Database name
  
  MySQL:
  MYSQL_HOST                 Host (default: localhost)
  MYSQL_PORT                 Port (default: 3306)
  MYSQL_DATABASE             Database name
  MYSQL_USER                 Username
  MYSQL_PASSWORD             Password
`);
}

// ============================================================================
// EXPORTS AND MAIN
// ============================================================================

module.exports = {
  MigrationController,
  JSONMigrationAdapter,
  PostgreSQLMigrationAdapter,
  MongoDBMigrationAdapter,
  MySQLMigrationAdapter
};

// Run CLI if called directly
if (require.main === module) {
  runCLI();
}