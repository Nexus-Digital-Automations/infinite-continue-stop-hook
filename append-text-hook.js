const { loggers } = require('./lib/logger');
/**
 * Claude Code UserPromptSubmit Hook
 * Automatically appends specified text to every user message
 */

process.stdin.setEncoding('utf8');

let inputData = '';

process.stdin.on('readable', () => {
  let chunk;
  while ((chunk = process.stdin.read()) !== null) {
    inputData += chunk;
  }
});

process.stdin.on('end', () => {
  try {
    // Parse the incoming prompt data
    const data = JSON.parse(inputData);

    // Get the user's message
    let userMessage = data.message || '';

    // The text to append to every user message
    const appendText =
      '\n\ncontinue. make sure to think and use concurrent subagents when appropriate';

    // Append the text to the user message
    userMessage += appendText;

    // Return the modified message
    const modifiedData = {
      ...data,
      message: userMessage,
    };

    loggers.stopHook.info(JSON.stringify(modifiedData));
  } catch (error) {
    // If JSON parsing fails, treat as plain text and append
    const appendText =
      '\n\ncontinue. make sure to think and use concurrent subagents when appropriate';
    const modifiedMessage = inputData.trim() + appendText;
    loggers.stopHook.info(modifiedMessage);
  }
});

// Handle errors
process.on('error', (_err) => {
  loggers.stopHook.error('Error in append-text-hook:', _err);
  throw new Error(`append-text-hook error: ${_err.message}`);
});
