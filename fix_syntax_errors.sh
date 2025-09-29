#!/bin/bash

# List of files to fix (from user's request)
FILES=(
    "test/rag-system/utils/testDataGenerator.js"
    "test/success-criteria-validation.test.js"
    "test/success-criteria-e2e.test.js"
    "test/success-criteria-integration.test.js"
    "test/success-criteria-manager.test.js"
    "test/success-criteria-performance.test.js"
    "test/success-criteria-regression.test.js"
    "test/research-system-unit.test.js"
    "test/taskmanager-api-comprehensive.test.js"
)

# Function to fix common syntax errors
fix_file() {
    local file="$1"
    echo "Fixing $file..."
    
    # Make backup
    cp "$file" "$file.bak"
    
    # Fix common patterns
    sed -i '' \
        -e 's/const: {/const {/g' \
        -e 's/try: {/try {/g' \
        -e 's/} else: {/} else {/g' \
        -e 's/} catch: {/} catch (error) {/g' \
        -e 's/class \([^:]*\): {/class \1 {/g' \
        -e 's/{,/{/g' \
        -e 's/;,/;/g' \
        -e 's/: {/{/g' \
        -e 's/return: {/return {/g' \
        -e 's/\[ {/[{/g' \
        -e 's/^class \([^:]*\): {$/class \1 {/g' \
        -e 's/^    \([^:]*\): {$/    \1: {/g' \
        "$file"
    
    echo "Fixed $file"
}

# Fix each file
for file in "${FILES[@]}"; do
    if [[ -f "$file" ]]; then
        fix_file "$file"
    else
        echo "Warning: $file not found"
    fi
done

echo "All syntax fixes completed!"
