/**
 * Jest Test Setup
 *
 * Global setup for TaskManager API tests
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JEST_WORKER_ID = 'true';

// Increase timeout for all tests
jest.setTimeout(30000);

// Global test utilities can be added here if needed
global.testUtils = {
  // Add any global test utilities here
};
