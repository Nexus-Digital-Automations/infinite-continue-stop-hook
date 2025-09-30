/**
 * Sample application code for E2E testing
 * @param {string} message - Message to process
 * @returns {string} Processed message
 */
function processMessage(_message, _category = 'general') {
  if (!_message) {
    throw new Error('Message is required');
  }
  return _message.toUpperCase();
}

module.exports = { processMessage };
