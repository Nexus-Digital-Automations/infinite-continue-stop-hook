// =============================================================================
// calculator.js - Simple Calculator Module with Intentional Bugs
// 
// This module demonstrates a basic calculator with some intentional bugs
// to showcase how the infinite continue hook system detects issues and
// switches modes appropriately.
// =============================================================================

/**
 * Calculator class with basic arithmetic operations
 * Contains intentional bugs for demonstration purposes
 */
class Calculator {
    /**
     * Add two numbers
     * @param {number} a - First number
     * @param {number} b - Second number
     * @returns {number} Sum of a and b
     */
    add(a, b) {
        return a + b;
    }

    /**
     * Subtract b from a
     * @param {number} a - First number
     * @param {number} b - Second number
     * @returns {number} Difference of a and b
     */
    subtract(a, b) {
        return a - b;
    }

    /**
     * Multiply two numbers
     * BUG: Type coercion issue with strings
     * @param {number} a - First number
     * @param {number} b - Second number
     * @returns {number} Product of a and b
     */
    multiply(a, b) {
        // Intentional bug: no type checking
        return a * b;
    }

    /**
     * Divide a by b
     * BUG: No division by zero check
     * @param {number} a - Dividend
     * @param {number} b - Divisor
     * @returns {number} Quotient of a divided by b
     */
    divide(a, b) {
        // Intentional bug: no zero check
        return a / b;
    }

    /**
     * Calculate percentage
     * BUG: Incorrect calculation
     * @param {number} value - The value
     * @param {number} percentage - The percentage
     * @returns {number} Percentage of value
     */
    percentage(value, percentage) {
        // Intentional bug: wrong formula
        return value * percentage;
    }
}

module.exports = Calculator;

// =============================================================================
// End of calculator.js
// =============================================================================