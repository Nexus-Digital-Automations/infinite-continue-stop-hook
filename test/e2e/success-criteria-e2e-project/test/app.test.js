const { processMessage } = require('../src/app');

describe('Application Tests', () => {
    
    
  test('should process message correctly', () => {
    expect(processMessage('hello')).toBe('HELLO');
});

  test('should throw error for empty message', () => {
    expect(() => processMessage('')).toThrow('Message is required');
});
});
