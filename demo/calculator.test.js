// =============================================================================
// calculator.test.js - Incomplete Test Suite for Calculator
// 
// This test file has intentionally low coverage to demonstrate how the
// infinite continue hook system detects low test coverage and switches
// to testing mode.
// =============================================================================

const Calculator = require('./calculator');

describe('Calculator', () => {
    let calculator;

    beforeEach(() => {
        calculator = new Calculator();
    });

    describe('add', () => {
        test('should add two positive numbers', () => {
            expect(calculator.add(2, 3)).toBe(5);
        });

        test('should add negative numbers', () => {
            expect(calculator.add(-2, -3)).toBe(-5);
        });
    });

    describe('subtract', () => {
        test('should subtract two numbers', () => {
            expect(calculator.subtract(5, 3)).toBe(2);
        });
    });

    // Missing tests for multiply, divide, and percentage methods
    // This creates low test coverage intentionally
});

// =============================================================================
// End of calculator.test.js
// =============================================================================