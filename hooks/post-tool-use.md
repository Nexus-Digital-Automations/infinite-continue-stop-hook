#!/usr/bin/env bash

# PostToolUse Hook - Quality Validation During Work
# Calls the post-tool-hook.js script for linting and quality checks

# Run the post-tool hook script
node "/Users/jeremyparker/infinite-continue-stop-hook/post-tool-hook.js"

# Always exit 0 to never block work
exit 0
