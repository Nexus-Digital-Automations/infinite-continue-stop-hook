/**
 * Sample application code for E2E testing
 * @param {string} message - Message to process
 * @returns {string} Processed message
 */
function processMessage(_message) {
  if (!message) {
    throw new Error('Message is required');
  }
  return message.toUpperCase();
}

module.exports = { processMessage };
