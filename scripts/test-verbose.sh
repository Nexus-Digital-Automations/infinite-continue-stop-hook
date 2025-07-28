#!/bin/bash

# Verbose Test Runner
# Enables detailed logging and verbose output for debugging test issues

echo "🔍 Running tests with verbose output enabled..."
echo "This will show detailed logs, file operations, and system protection messages."
echo ""

# Set verbose testing environment variable
export VERBOSE_TESTS=true

# Run tests with all arguments passed through
npm test "$@"