/**
 * Database Migration Test Suite
 * 
 * Tests for the database migration system including migration controller,
 * adapters, schema creation, and data import/export functionality
 */

jest.mock('fs');
jest.mock('path');

const fs = require('fs');
const path = require('path');

// Mock the config module
jest.mock('../database/config', () => ({
  getDatabaseConfig: jest.fn(),
  validateConfig: jest.fn()
}));

const { getDatabaseConfig, validateConfig } = require('../database/config');

const {
  MigrationController,
  JSONMigrationAdapter,
  PostgreSQLMigrationAdapter,
  MongoDBMigrationAdapter,
  MySQLMigrationAdapter
} = require('../database/migrate');

describe('Database Migration System', () => {
  let migrationController;
  let mockFS;

  beforeEach(() => {
    // Setup file system mocks
    mockFS = {
      existsSync: jest.fn(),
      readFileSync: jest.fn(),
      writeFileSync: jest.fn(),
      mkdirSync: jest.fn(),
      readdirSync: jest.fn()
    };

    Object.assign(fs, mockFS);
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mocks
    validateConfig.mockReturnValue({ isValid: true, errors: [] });
    getDatabaseConfig.mockReturnValue({
      type: 'json',
      config: {
        todoPath: './TODO.json',
        agentRegistryPath: './agent-registry.json'
      }
    });

    migrationController = new MigrationController();
  });

  describe('MigrationController', () => {
    describe('initialize()', () => {
      test('should initialize successfully with valid config', async () => {
        mockFS.existsSync.mockReturnValue(false);
        mockFS.readdirSync.mockReturnValue([]);

        await migrationController.initialize();

        expect(validateConfig).toHaveBeenCalled();
        expect(getDatabaseConfig).toHaveBeenCalled();
        expect(migrationController.currentAdapter).toBeDefined();
      });

      test('should fail with invalid config', async () => {
        validateConfig.mockReturnValue({ 
          isValid: false, 
          errors: ['Invalid database type'] 
        });

        await expect(migrationController.initialize()).rejects.toThrow(
          'Invalid configuration: Invalid database type'
        );
      });

      test('should load migration files from directory', async () => {
        mockFS.existsSync.mockReturnValue(true);
        mockFS.readdirSync.mockReturnValue(['001_initial.js', '002_add_indexes.js']);

        // Mock require calls for migration files
        jest.doMock('../database/migrations/001_initial.js', () => ({
          up: jest.fn(),
          down: jest.fn()
        }), { virtual: true });

        jest.doMock('../database/migrations/002_add_indexes.js', () => ({
          up: jest.fn(),
          down: jest.fn()
        }), { virtual: true });

        await migrationController.initialize();

        expect(migrationController.migrations).toHaveLength(2);
        expect(migrationController.migrations[0].name).toBe('001_initial');
        expect(migrationController.migrations[1].name).toBe('002_add_indexes');
      });

      test('should create migrations directory if it doesn\'t exist', async () => {
        mockFS.existsSync.mockReturnValue(false);
        mockFS.readdirSync.mockReturnValue([]);

        await migrationController.initialize();

        expect(mockFS.mkdirSync).toHaveBeenCalledWith(
          expect.stringContaining('migrations'),
          { recursive: true }
        );
      });
    });

    describe('migrate()', () => {
      beforeEach(async () => {
        mockFS.existsSync.mockReturnValue(false);
        mockFS.readdirSync.mockReturnValue([]);
        await migrationController.initialize();
      });

      test('should run pending migrations', async () => {
        const mockMigration = {
          name: 'test_migration',
          up: jest.fn().mockResolvedValue(),
          down: jest.fn().mockResolvedValue()
        };

        migrationController.migrations = [mockMigration];
        migrationController.currentAdapter.getAppliedMigrations = jest.fn().mockResolvedValue([]);
        migrationController.currentAdapter.ensureMigrationTable = jest.fn().mockResolvedValue();
        migrationController.currentAdapter.runMigration = jest.fn().mockResolvedValue();
        migrationController.currentAdapter.recordMigration = jest.fn().mockResolvedValue();

        await migrationController.migrate();

        expect(migrationController.currentAdapter.runMigration).toHaveBeenCalledWith(mockMigration);
        expect(migrationController.currentAdapter.recordMigration).toHaveBeenCalledWith('test_migration');
      });

      test('should skip already applied migrations', async () => {
        const mockMigration = {
          name: 'applied_migration',
          up: jest.fn(),
          down: jest.fn()
        };

        migrationController.migrations = [mockMigration];
        migrationController.currentAdapter.getAppliedMigrations = jest.fn().mockResolvedValue(['applied_migration']);
        migrationController.currentAdapter.ensureMigrationTable = jest.fn().mockResolvedValue();

        await migrationController.migrate();

        expect(migrationController.currentAdapter.runMigration).not.toHaveBeenCalled();
      });

      test('should handle migration failure', async () => {
        const mockMigration = {
          name: 'failing_migration',
          up: jest.fn().mockRejectedValue(new Error('Migration failed'))
        };

        migrationController.migrations = [mockMigration];
        migrationController.currentAdapter.getAppliedMigrations = jest.fn().mockResolvedValue([]);
        migrationController.currentAdapter.ensureMigrationTable = jest.fn().mockResolvedValue();
        migrationController.currentAdapter.runMigration = jest.fn().mockRejectedValue(new Error('Migration failed'));

        await expect(migrationController.migrate()).rejects.toThrow('Migration failed');
      });
    });

    describe('rollback()', () => {
      beforeEach(async () => {
        mockFS.existsSync.mockReturnValue(false);
        mockFS.readdirSync.mockReturnValue([]);
        await migrationController.initialize();
      });

      test('should rollback last migration', async () => {
        const mockMigration = {
          name: 'last_migration',
          up: jest.fn(),
          down: jest.fn().mockResolvedValue()
        };

        migrationController.migrations = [mockMigration];
        migrationController.currentAdapter.getAppliedMigrations = jest.fn().mockResolvedValue(['last_migration']);
        migrationController.currentAdapter.rollbackMigration = jest.fn().mockResolvedValue();
        migrationController.currentAdapter.removeMigrationRecord = jest.fn().mockResolvedValue();

        await migrationController.rollback();

        expect(migrationController.currentAdapter.rollbackMigration).toHaveBeenCalledWith(mockMigration);
        expect(migrationController.currentAdapter.removeMigrationRecord).toHaveBeenCalledWith('last_migration');
      });

      test('should handle no migrations to rollback', async () => {
        migrationController.currentAdapter.getAppliedMigrations = jest.fn().mockResolvedValue([]);

        // Should not throw
        await migrationController.rollback();
      });

      test('should handle missing migration file', async () => {
        migrationController.migrations = [];
        migrationController.currentAdapter.getAppliedMigrations = jest.fn().mockResolvedValue(['missing_migration']);

        await expect(migrationController.rollback()).rejects.toThrow(
          'Migration file not found: missing_migration'
        );
      });

      test('should handle migration without rollback support', async () => {
        const mockMigration = {
          name: 'no_rollback_migration',
          up: jest.fn()
          // No down function
        };

        migrationController.migrations = [mockMigration];
        migrationController.currentAdapter.getAppliedMigrations = jest.fn().mockResolvedValue(['no_rollback_migration']);

        await expect(migrationController.rollback()).rejects.toThrow(
          'Migration no_rollback_migration does not support rollback'
        );
      });
    });
  });

  describe('JSONMigrationAdapter', () => {
    let adapter;
    let migrationsFile;

    beforeEach(() => {
      const config = {
        todoPath: './TODO.json',
        agentRegistryPath: './agent-registry.json'
      };
      adapter = new JSONMigrationAdapter(config);
      migrationsFile = path.join(path.dirname(config.todoPath), '.migrations.json');
    });

    describe('ensureMigrationTable()', () => {
      test('should create migrations file if it doesn\'t exist', async () => {
        mockFS.existsSync.mockReturnValue(false);

        await adapter.ensureMigrationTable();

        expect(mockFS.writeFileSync).toHaveBeenCalledWith(
          migrationsFile,
          JSON.stringify([], null, 2)
        );
      });

      test('should not create migrations file if it exists', async () => {
        mockFS.existsSync.mockReturnValue(true);

        await adapter.ensureMigrationTable();

        expect(mockFS.writeFileSync).not.toHaveBeenCalled();
      });
    });

    describe('getAppliedMigrations()', () => {
      test('should return applied migrations from file', async () => {
        mockFS.existsSync.mockReturnValue(true);
        mockFS.readFileSync.mockReturnValue(JSON.stringify(['migration1', 'migration2']));

        const applied = await adapter.getAppliedMigrations();

        expect(applied).toEqual(['migration1', 'migration2']);
      });

      test('should return empty array if file doesn\'t exist', async () => {
        mockFS.existsSync.mockReturnValue(false);

        const applied = await adapter.getAppliedMigrations();

        expect(applied).toEqual([]);
      });
    });

    describe('recordMigration()', () => {
      test('should add migration to file', async () => {
        mockFS.existsSync.mockReturnValue(true);
        mockFS.readFileSync.mockReturnValue(JSON.stringify(['existing_migration']));

        await adapter.recordMigration('new_migration');

        expect(mockFS.writeFileSync).toHaveBeenCalledWith(
          migrationsFile,
          JSON.stringify(['existing_migration', 'new_migration'], null, 2)
        );
      });
    });

    describe('removeMigrationRecord()', () => {
      test('should remove migration from file', async () => {
        mockFS.existsSync.mockReturnValue(true);
        mockFS.readFileSync.mockReturnValue(JSON.stringify(['migration1', 'migration2']));

        await adapter.removeMigrationRecord('migration1');

        expect(mockFS.writeFileSync).toHaveBeenCalledWith(
          migrationsFile,
          JSON.stringify(['migration2'], null, 2)
        );
      });

      test('should handle removing non-existent migration', async () => {
        mockFS.existsSync.mockReturnValue(true);
        mockFS.readFileSync.mockReturnValue(JSON.stringify(['migration1']));

        await adapter.removeMigrationRecord('nonexistent');

        expect(mockFS.writeFileSync).toHaveBeenCalledWith(
          migrationsFile,
          JSON.stringify(['migration1'], null, 2)
        );
      });
    });

    describe('createInitialSchema()', () => {
      test('should create initial JSON files', async () => {
        mockFS.existsSync.mockReturnValue(false);

        await adapter.createInitialSchema();

        expect(mockFS.writeFileSync).toHaveBeenCalledWith(
          './TODO.json',
          expect.stringContaining('"tasks": []')
        );

        expect(mockFS.writeFileSync).toHaveBeenCalledWith(
          './agent-registry.json',
          expect.stringContaining('"agents": {}')
        );
      });

      test('should not overwrite existing files', async () => {
        mockFS.existsSync.mockReturnValue(true);

        await adapter.createInitialSchema();

        expect(mockFS.writeFileSync).not.toHaveBeenCalled();
      });
    });

    describe('exportData()', () => {
      test('should read and return JSON data', async () => {
        const todoData = { tasks: [], agents: {} };
        const agentData = { agents: {}, sessions: {} };

        mockFS.existsSync.mockReturnValue(true);
        mockFS.readFileSync
          .mockReturnValueOnce(JSON.stringify(todoData))
          .mockReturnValueOnce(JSON.stringify(agentData));

        const result = await adapter.exportData();

        expect(result).toEqual({
          todoData,
          agentData
        });
      });

      test('should handle missing files', async () => {
        mockFS.existsSync.mockReturnValue(false);

        const result = await adapter.exportData();

        expect(result).toEqual({
          todoData: {},
          agentData: {}
        });
      });
    });
  });

  describe('PostgreSQLMigrationAdapter', () => {
    let adapter;

    beforeEach(() => {
      adapter = new PostgreSQLMigrationAdapter({
        host: 'localhost',
        database: 'testdb'
      });
    });

    test('should create adapter with config', () => {
      expect(adapter.config.host).toBe('localhost');
      expect(adapter.config.database).toBe('testdb');
    });

    test('should have required methods', () => {
      expect(typeof adapter.createInitialSchema).toBe('function');
      expect(typeof adapter.importData).toBe('function');
      expect(typeof adapter.exportData).toBe('function');
    });
  });

  describe('MongoDBMigrationAdapter', () => {
    let adapter;

    beforeEach(() => {
      adapter = new MongoDBMigrationAdapter({
        host: 'localhost',
        database: 'testdb'
      });
    });

    test('should create adapter with config', () => {
      expect(adapter.config.host).toBe('localhost');
      expect(adapter.config.database).toBe('testdb');
    });

    test('should have required methods', () => {
      expect(typeof adapter.createInitialSchema).toBe('function');
      expect(typeof adapter.importData).toBe('function');
      expect(typeof adapter.exportData).toBe('function');
    });
  });

  describe('MySQLMigrationAdapter', () => {
    let adapter;

    beforeEach(() => {
      adapter = new MySQLMigrationAdapter({
        host: 'localhost',
        database: 'testdb'
      });
    });

    test('should create adapter with config', () => {
      expect(adapter.config.host).toBe('localhost');
      expect(adapter.config.database).toBe('testdb');
    });

    test('should have required methods', () => {
      expect(typeof adapter.createInitialSchema).toBe('function');
      expect(typeof adapter.importData).toBe('function');
    });
  });

  describe('Data Import/Export', () => {
    let controller;

    beforeEach(async () => {
      mockFS.existsSync.mockReturnValue(false);
      mockFS.readdirSync.mockReturnValue([]);
      
      controller = new MigrationController();
      await controller.initialize();
    });

    describe('importFromJSON()', () => {
      test('should read and import JSON files', async () => {
        const todoData = { tasks: [{ id: 'task1', title: 'Test Task' }] };
        const agentData = { agents: { agent1: { role: 'development' } } };

        mockFS.existsSync.mockReturnValue(true);
        mockFS.readFileSync
          .mockReturnValueOnce(JSON.stringify(todoData))
          .mockReturnValueOnce(JSON.stringify(agentData));

        controller.currentAdapter.importData = jest.fn().mockResolvedValue();

        await controller.importFromJSON('./todo.json', './agents.json');

        expect(controller.currentAdapter.importData).toHaveBeenCalledWith(
          todoData,
          agentData
        );
      });

      test('should handle missing JSON files', async () => {
        mockFS.existsSync.mockReturnValue(false);
        controller.currentAdapter.importData = jest.fn().mockResolvedValue();

        await controller.importFromJSON('./missing.json', './missing.json');

        expect(controller.currentAdapter.importData).toHaveBeenCalledWith(
          {},
          {}
        );
      });

      test('should handle malformed JSON files', async () => {
        mockFS.existsSync.mockReturnValue(true);
        mockFS.readFileSync.mockReturnValue('invalid json');

        controller.currentAdapter.importData = jest.fn().mockResolvedValue();

        await controller.importFromJSON('./invalid.json', './invalid.json');

        expect(controller.currentAdapter.importData).toHaveBeenCalledWith(
          {},
          {}
        );
      });
    });

    describe('exportToJSON()', () => {
      test('should export and write JSON files', async () => {
        const exportData = {
          todoData: { tasks: [{ id: 'task1' }] },
          agentData: { agents: { agent1: {} } }
        };

        controller.currentAdapter.exportData = jest.fn().mockResolvedValue(exportData);
        mockFS.existsSync.mockReturnValue(true);

        await controller.exportToJSON('./export-todo.json', './export-agents.json');

        expect(mockFS.writeFileSync).toHaveBeenCalledWith(
          './export-todo.json',
          JSON.stringify(exportData.todoData, null, 2)
        );

        expect(mockFS.writeFileSync).toHaveBeenCalledWith(
          './export-agents.json',
          JSON.stringify(exportData.agentData, null, 2)
        );
      });

      test('should create directories if needed', async () => {
        const exportData = {
          todoData: { tasks: [] },
          agentData: { agents: {} }
        };

        controller.currentAdapter.exportData = jest.fn().mockResolvedValue(exportData);
        mockFS.existsSync.mockReturnValue(false);

        await controller.exportToJSON('./new-dir/todo.json', './new-dir/agents.json');

        expect(mockFS.mkdirSync).toHaveBeenCalledWith('./new-dir', { recursive: true });
      });
    });
  });

  describe('Error handling', () => {
    test('should handle file system errors gracefully', async () => {
      mockFS.existsSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      const controller = new MigrationController();

      await expect(controller.initialize()).rejects.toThrow('File system error');
    });

    test('should handle adapter creation errors', async () => {
      getDatabaseConfig.mockReturnValue({
        type: 'invalid_type',
        config: {}
      });

      const controller = new MigrationController();

      await expect(controller.initialize()).rejects.toThrow();
    });
  });
});

module.exports = {
  // Export for potential integration tests
};