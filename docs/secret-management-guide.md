# Secret Management System Guide

## Overview

The Infinite Continue Stop Hook project includes a comprehensive secret management system designed to handle sensitive configuration values like API keys, passwords, tokens, and other secrets securely across development, staging, and production environments.

## Features

### Core Capabilities

- ✅ **Multi-source secret loading** - Environment variables, .env files, external secret managers
- ✅ **Schema-based validation** - Automatic validation with pattern matching, length requirements, allowed values
- ✅ **Environment-aware requirements** - Different secret requirements for development, staging, and production
- ✅ **Startup validation** - Application fails fast on missing required secrets in production
- ✅ **Comprehensive audit logging** - All secret access logged for security monitoring
- ✅ **Secure handling** - No secrets exposed in logs, redacted debug information
- ✅ **External secret manager integration** - AWS Secrets Manager, HashiCorp Vault, Doppler, Kubernetes
- ✅ **Secret rotation** - Built-in rotation capabilities for supported providers

### Security Features

- **No hardcoded secrets** - All secrets loaded from external sources
- **Secure audit trails** - Security logger captures sensitive secret access
- **Input validation** - Schema validation prevents invalid secret values
- **Environment isolation** - Different requirements for different environments
- **Encryption ready** - Architecture supports encryption at rest and in transit

## Quick Start

### 1. Basic Setup (Development)

Create a `.env` file in your project root:

```bash
# Required
NODE_ENV=development
LOG_LEVEL=info

# Optional development secrets
API_KEY=your_development_api_key
JWT_SECRET=your_development_jwt_secret_32_chars_min
```

### 2. Production Setup

For production, use external secret managers instead of .env files:

```bash
# AWS Secrets Manager
export AWS_SECRET_NAME=myapp-secrets
export AWS_REGION=us-east-1
export NODE_ENV=production

# Or HashiCorp Vault
export VAULT_URL=https://vault.company.com
export VAULT_TOKEN=hvs.your_vault_token
export VAULT_SECRET_PATH=secret/data/myapp
export NODE_ENV=production

# Or Doppler
export DOPPLER_TOKEN=your_doppler_service_token
export NODE_ENV=production
```

### 3. Application Integration

The secret manager is automatically initialized during application startup:

```javascript
const { secretManager, validateRequiredSecrets, getEnvVar } = require('./lib/secretManager');

// Automatic startup validation (already integrated in taskmanager-api.js)
await validateRequiredSecrets(['API_KEY']); // Add your required secrets

// Get secrets in your application
const apiKey = getEnvVar('API_KEY');
const dbPassword = secretManager.getSecret('DB_PASSWORD');
```

## Configuration

### Secret Schema

Secrets are defined in the `SECRET_SCHEMA` object in `lib/secretManager.js`:

```javascript
const SECRET_SCHEMA = {
  NODE_ENV: {
    required: true,
    allowedValues: ['development', 'staging', 'production', 'test'],
    defaultValue: 'development',
    category: 'config',
  },
  API_KEY: {
    required: false,
    minLength: 20,
    category: 'api',
  },
  JWT_SECRET: {
    required: false, // Required in production (environment-aware)
    minLength: 32,
    category: 'security',
  },
  // ... more secrets
};
```

### Environment-Aware Requirements

The system automatically adjusts requirements based on the environment:

- **Development**: Only `NODE_ENV` required
- **Staging**: `NODE_ENV` + basic security secrets
- **Production**: `NODE_ENV` + `JWT_SECRET` + `ENCRYPTION_KEY` + any additional required secrets

## External Secret Managers

### AWS Secrets Manager

```bash
# Configuration
export AWS_SECRET_NAME=myapp-production-secrets
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
export NODE_ENV=production
```

The system will automatically load secrets from the specified AWS secret.

### HashiCorp Vault

```bash
# Configuration
export VAULT_URL=https://vault.company.com:8200
export VAULT_TOKEN=hvs.your_vault_token
export VAULT_SECRET_PATH=secret/data/myapp
export NODE_ENV=production
```

### Doppler

```bash
# Configuration
export DOPPLER_TOKEN=dp.st.production.your_service_token
export NODE_ENV=production
```

### Kubernetes Secrets

For Kubernetes deployments, secrets are automatically loaded from mounted secret files:

```yaml
# kubernetes-deployment.yaml
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secrets
data:
  API_KEY: <base64-encoded-value>
  JWT_SECRET: <base64-encoded-value>
---
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
        - name: myapp
          env:
            - name: NODE_ENV
              value: 'production'
          volumeMounts:
            - name: secrets
              mountPath: /var/run/secrets
      volumes:
        - name: secrets
          secret:
            secretName: myapp-secrets
```

## Secret Rotation

The system includes built-in secret rotation capabilities:

```javascript
// Manual rotation
await secretManager.rotateSecret('API_KEY');

// Automated rotation (implement in your application)
setInterval(
  async () => {
    const sensitiveSecrets = ['JWT_SECRET', 'ENCRYPTION_KEY'];
    for (const secret of sensitiveSecrets) {
      try {
        await secretManager.rotateSecret(secret);
      } catch (error) {
        logger.error(`Failed to rotate ${secret}:`, error);
      }
    }
  },
  24 * 60 * 60 * 1000
); // Daily rotation
```

## Monitoring and Auditing

### Security Logging

All secret access is logged to the security logger:

```javascript
// Logs are automatically generated for secret access
const secret = secretManager.getSecret('SENSITIVE_API_KEY');
// Logs: "Sensitive secret accessed: SENSITIVE_API_KEY"
```

### Audit Trail

Get audit logs for compliance and monitoring:

```javascript
// Get all secret access logs
const auditLog = secretManager.getAuditLog();

// Get logs for specific secret
const apiKeyLogs = secretManager.getAuditLog({ key: 'API_KEY' });

// Get logs since specific time
const recentLogs = secretManager.getAuditLog({
  since: new Date(Date.now() - 24 * 60 * 60 * 1000),
});
```

### Secret Information (Debug)

Get redacted secret information for debugging:

```javascript
const secretInfo = secretManager.getSecretInfo();
console.log(secretInfo);
// Output:
// {
//   "API_KEY": {
//     "source": "env",
//     "timestamp": "2025-09-28T02:00:00.000Z",
//     "length": 32,
//     "hasValue": true,
//     "value": "[REDACTED]"
//   }
// }
```

## Development Workflow

### 1. Local Development

1. Copy `.env.example` to `.env`
2. Fill in development values
3. Never commit `.env` to version control
4. Use `.env.local` for personal overrides

### 2. Testing

Test environments automatically set:

- `NODE_ENV=test`
- `TEST_MODE=jest`
- Relaxed secret requirements

### 3. Staging/Production

1. Configure external secret manager
2. Set `NODE_ENV=production`
3. Required secrets automatically enforced
4. Application fails fast on missing secrets

## Security Best Practices

### 1. Secret Management

- ✅ Never commit secrets to version control
- ✅ Use external secret managers in production
- ✅ Rotate secrets regularly
- ✅ Monitor secret access patterns
- ✅ Use least-privilege access

### 2. Environment Security

- ✅ Different secret requirements per environment
- ✅ Secure secret transportation (TLS/encryption)
- ✅ Audit logging for compliance
- ✅ Fail-fast on missing production secrets

### 3. Application Security

- ✅ No secrets in application logs
- ✅ Secure secret redaction in debug output
- ✅ Input validation for all secrets
- ✅ Proper error handling without secret exposure

## Troubleshooting

### Common Issues

#### 1. "Missing required secrets" Error

```bash
❌ Secret Management Error: Missing required secrets: NODE_ENV
```

**Solution**: Create `.env` file with `NODE_ENV=development`

#### 2. Secret Validation Warnings

```bash
⚠️ Secret does not meet minimum length requirement
```

**Solution**: Check `SECRET_SCHEMA` for requirements (e.g., JWT_SECRET needs 32+ characters)

#### 3. External Secret Manager Connection Issues

```bash
❌ Failed to load from AWS Secrets Manager
```

**Solution**:

- Verify AWS credentials and permissions
- Check secret name and region configuration
- Ensure network connectivity to AWS

### Debug Mode

Enable debug logging to troubleshoot secret loading:

```bash
LOG_LEVEL=debug node taskmanager-api.js
```

### Validation Test

Test secret validation manually:

```javascript
const { validateRequiredSecrets } = require('./lib/secretManager');

// Test with specific requirements
validateRequiredSecrets(['API_KEY', 'JWT_SECRET'])
  .then(() => console.log('✅ All secrets valid'))
  .catch((err) => console.error('❌ Validation failed:', err.message));
```

## API Reference

### SecretManager Class

#### Methods

- `initialize(options)` - Initialize secret manager with options
- `getSecret(key, context)` - Get secret value with audit logging
- `hasSecret(key)` - Check if secret exists
- `setSecret(key, value, metadata)` - Set secret value
- `rotateSecret(key)` - Rotate secret (async)
- `getSecretInfo()` - Get redacted secret information
- `getAuditLog(filters)` - Get audit trail

#### Utility Functions

- `validateRequiredSecrets(additional)` - Validate all required secrets
- `getEnvVar(key, defaultValue)` - Safely get environment variable
- `isSecureEnvironment()` - Check if running in production/staging

## Integration Examples

### Express.js Application

```javascript
const express = require('express');
const { validateRequiredSecrets, getEnvVar } = require('./lib/secretManager');

async function startServer() {
  // Validate secrets before starting server
  await validateRequiredSecrets(['JWT_SECRET', 'DB_PASSWORD']);

  const app = express();
  const port = getEnvVar('PORT', 3000);
  const jwtSecret = getEnvVar('JWT_SECRET');

  // Configure middleware with secrets
  app.use(jwt({ secret: jwtSecret }));

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer().catch(console.error);
```

### Scheduled Secret Rotation

```javascript
const cron = require('node-cron');
const { secretManager } = require('./lib/secretManager');

// Rotate secrets daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  const secretsToRotate = ['API_KEY', 'JWT_SECRET', 'WEBHOOK_SECRET'];

  for (const secret of secretsToRotate) {
    try {
      await secretManager.rotateSecret(secret);
      console.log(`✅ Rotated ${secret}`);
    } catch (error) {
      console.error(`❌ Failed to rotate ${secret}:`, error.message);
    }
  }
});
```

## Contributing

When adding new secrets to the system:

1. Update `SECRET_SCHEMA` in `lib/secretManager.js`
2. Add configuration to `.env.example`
3. Update this documentation
4. Add validation tests
5. Consider environment-specific requirements

## Support

For questions or issues with the secret management system:

1. Check the troubleshooting section above
2. Review audit logs for access patterns
3. Test with debug logging enabled
4. Verify external secret manager connectivity

The secret management system is designed to be secure by default while providing flexibility for different deployment scenarios.
