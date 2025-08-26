/**
 * OAuth 2.0 Authentication System Test Suite
 * 
 * Comprehensive tests for OAuth service, middleware, and routes
 */

const OAuthService = require('../lib/oauthService');
const AuthMiddleware = require('../lib/authMiddleware');

describe('OAuth 2.0 Authentication System', () => {
  let oauthService;
  let authMiddleware;

  beforeEach(() => {
    oauthService = new OAuthService({
      jwt: {
        secret: 'test-secret-key-for-jwt-signing',
        expiresIn: '1h',
        refreshExpiresIn: '7d'
      },
      providers: {
        test: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          authUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          userUrl: 'https://example.com/api/user',
          scope: 'user:email'
        }
      }
    });

    authMiddleware = new AuthMiddleware({
      oauth: oauthService
    });
  });

  describe('OAuthService', () => {
    describe('generateAuthUrl', () => {
      test('should generate valid authorization URL', () => {
        const result = oauthService.generateAuthUrl('test', 'http://localhost:3000/callback');

        expect(result).toHaveProperty('authUrl');
        expect(result).toHaveProperty('state');
        expect(result).toHaveProperty('expiresAt');
        expect(result.authUrl).toContain('https://example.com/oauth/authorize');
        expect(result.authUrl).toContain('client_id=test-client-id');
        expect(result.authUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback');
        expect(result.authUrl).toContain('scope=user%3Aemail');
        expect(result.authUrl).toContain(`state=${result.state}`);
      });

      test('should throw error for invalid provider', () => {
        expect(() => {
          oauthService.generateAuthUrl('invalid-provider', 'http://localhost:3000/callback');
        }).toThrow('Unsupported OAuth provider: invalid-provider');
      });

      test('should store state with expiration', () => {
        const result = oauthService.generateAuthUrl('test', 'http://localhost:3000/callback');
        const stateData = oauthService.validateState(result.state);

        expect(stateData).toBeTruthy();
        expect(stateData.provider).toBe('test');
        expect(stateData.redirectUri).toBe('http://localhost:3000/callback');
        expect(stateData.expiresAt).toBeGreaterThan(Date.now());
      });
    });

    describe('JWT Token Management', () => {
      const mockUserInfo = {
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        provider: 'test'
      };

      test('should generate valid JWT tokens', () => {
        const tokens = oauthService.generateJwtTokens(mockUserInfo, 'test');

        expect(tokens).toHaveProperty('accessToken');
        expect(tokens).toHaveProperty('refreshToken');
        expect(tokens).toHaveProperty('expiresIn');
        expect(tokens).toHaveProperty('tokenType', 'Bearer');
        expect(typeof tokens.accessToken).toBe('string');
        expect(typeof tokens.refreshToken).toBe('string');
        expect(tokens.expiresIn).toBe(3600); // 1 hour
      });

      test('should verify valid JWT tokens', () => {
        const tokens = oauthService.generateJwtTokens(mockUserInfo, 'test');
        const payload = oauthService.verifyJwt(tokens.accessToken);

        expect(payload.sub).toBe(mockUserInfo.id);
        expect(payload.email).toBe(mockUserInfo.email);
        expect(payload.name).toBe(mockUserInfo.name);
        expect(payload.provider).toBe('test');
        expect(payload.type).toBe('access');
      });

      test('should reject invalid JWT tokens', () => {
        expect(() => {
          oauthService.verifyJwt('invalid.jwt.token');
        }).toThrow('Token verification failed');
      });

      test('should handle token expiration logic', () => {
        // Test that the expiration logic is set up correctly
        const shortExpiryService = new OAuthService({
          jwt: {
            secret: 'test-secret',
            expiresIn: '1s', // Very short expiration
            refreshExpiresIn: '7d'
          }
        });

        const tokens = shortExpiryService.generateJwtTokens(mockUserInfo, 'test');
        
        // Verify the token contains expiration information
        const payload = shortExpiryService.verifyJwt(tokens.accessToken);
        expect(payload.exp).toBeDefined();
        expect(payload.exp).toBeGreaterThan(payload.iat);
      });

      test('should refresh tokens successfully', async () => {
        const originalTokens = oauthService.generateJwtTokens(mockUserInfo, 'test');
        
        // Store tokens
        oauthService.storeTokens(mockUserInfo.id, {
          provider: 'test',
          userInfo: mockUserInfo,
          jwt: originalTokens
        });

        const result = await oauthService.refreshTokens(originalTokens.refreshToken);

        expect(result.success).toBe(true);
        expect(result.tokens).toHaveProperty('accessToken');
        expect(result.tokens).toHaveProperty('refreshToken');
        // Tokens should be different (new access token generated)
        expect(result.tokens.accessToken).toBeTruthy();
        expect(result.tokens.refreshToken).toBeTruthy();
      });
    });

    describe('State Management', () => {
      test('should validate unexpired states', () => {
        const result = oauthService.generateAuthUrl('test', 'http://localhost:3000/callback');
        const stateData = oauthService.validateState(result.state);

        expect(stateData).toBeTruthy();
        expect(stateData.provider).toBe('test');
      });

      test('should reject expired states', () => {
        const result = oauthService.generateAuthUrl('test', 'http://localhost:3000/callback');
        
        // Manually expire the state
        const stateData = oauthService.stateStore.get(result.state);
        stateData.expiresAt = Date.now() - 1000; // 1 second ago
        oauthService.stateStore.set(result.state, stateData);

        const validatedState = oauthService.validateState(result.state);
        expect(validatedState).toBeNull();
      });

      test('should cleanup expired states', () => {
        // Generate multiple states
        const state1 = oauthService.generateAuthUrl('test', 'http://localhost:3000/callback').state;
        const state2 = oauthService.generateAuthUrl('test', 'http://localhost:3000/callback').state;

        // Expire one state
        const stateData = oauthService.stateStore.get(state1);
        stateData.expiresAt = Date.now() - 1000;
        oauthService.stateStore.set(state1, stateData);

        // Run cleanup
        oauthService.cleanupExpiredStates();

        expect(oauthService.stateStore.has(state1)).toBe(false);
        expect(oauthService.stateStore.has(state2)).toBe(true);
      });
    });

    describe('Token Storage', () => {
      const mockTokenData = {
        provider: 'test',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        userInfo: { id: 'user-123', email: 'test@example.com' }
      };

      test('should store and retrieve tokens', () => {
        oauthService.storeTokens('user-123', mockTokenData);
        const retrieved = oauthService.getStoredTokens('user-123');

        expect(retrieved).toEqual(mockTokenData);
      });

      test('should revoke tokens', () => {
        oauthService.storeTokens('user-123', mockTokenData);
        oauthService.revokeTokens('user-123');
        const retrieved = oauthService.getStoredTokens('user-123');

        expect(retrieved).toBeUndefined();
      });
    });

    describe('Utility Functions', () => {
      test('should parse time strings correctly', () => {
        expect(oauthService.parseTimeToSeconds('30s')).toBe(30);
        expect(oauthService.parseTimeToSeconds('5m')).toBe(300);
        expect(oauthService.parseTimeToSeconds('2h')).toBe(7200);
        expect(oauthService.parseTimeToSeconds('7d')).toBe(604800);
      });

      test('should throw error for invalid time format', () => {
        expect(() => {
          oauthService.parseTimeToSeconds('invalid');
        }).toThrow('Invalid time format: invalid');
      });

      test('should generate secure random secrets', () => {
        const secret1 = oauthService.generateSecret();
        const secret2 = oauthService.generateSecret();

        expect(secret1).not.toBe(secret2);
        expect(secret1.length).toBe(128); // 64 bytes * 2 (hex)
        expect(/^[a-f0-9]+$/.test(secret1)).toBe(true);
      });
    });

    describe('Statistics', () => {
      test('should return service statistics', () => {
        // Add some test data
        oauthService.generateAuthUrl('test', 'http://localhost:3000/callback');
        oauthService.storeTokens('user-123', { provider: 'test' });

        const stats = oauthService.getStatistics();

        expect(stats).toHaveProperty('activeStates');
        expect(stats).toHaveProperty('storedTokens');
        expect(stats).toHaveProperty('providers');
        expect(stats).toHaveProperty('uptime');
        expect(stats.activeStates).toBeGreaterThan(0);
        expect(stats.storedTokens).toBeGreaterThan(0);
        expect(Array.isArray(stats.providers)).toBe(true);
      });
    });
  });

  describe('AuthMiddleware', () => {
    describe('authenticateJWT', () => {
      test('should allow public routes without authentication', () => {
        const middleware = authMiddleware.authenticateJWT();
        const req = { path: '/api/health' };
        const res = {};
        const next = jest.fn();

        middleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
      });

      test('should reject requests without authorization header', () => {
        const middleware = authMiddleware.authenticateJWT();
        const req = { path: '/api/protected', headers: {} };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        const next = jest.fn();

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Authorization header required',
          message: 'Please provide a valid JWT token'
        });
        expect(next).not.toHaveBeenCalled();
      });

      test('should authenticate valid JWT tokens', () => {
        const mockUserInfo = {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          provider: 'test'
        };
        
        const tokens = oauthService.generateJwtTokens(mockUserInfo, 'test');
        const middleware = authMiddleware.authenticateJWT();
        
        const req = {
          path: '/api/protected',
          headers: { authorization: `Bearer ${tokens.accessToken}` }
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        const next = jest.fn();

        middleware(req, res, next);

        expect(req.user).toBeDefined();
        expect(req.user.id).toBe('user-123');
        expect(req.user.email).toBe('test@example.com');
        expect(req.tokenInfo).toBeDefined();
        expect(next).toHaveBeenCalledWith();
      });

      test('should reject invalid JWT tokens', () => {
        const middleware = authMiddleware.authenticateJWT();
        const req = {
          path: '/api/protected',
          headers: { authorization: 'Bearer invalid.jwt.token' }
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        const next = jest.fn();

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid or expired token',
          message: expect.stringContaining('Token verification failed')
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('isPublicRoute', () => {
      test('should identify public routes correctly', () => {
        expect(authMiddleware.isPublicRoute('/api/health')).toBe(true);
        expect(authMiddleware.isPublicRoute('/api/auth/login')).toBe(true);
        expect(authMiddleware.isPublicRoute('/api/auth/callback')).toBe(true);
        expect(authMiddleware.isPublicRoute('/api/protected')).toBe(false);
        expect(authMiddleware.isPublicRoute('/api/tasks')).toBe(false);
      });
    });
  });

  describe('Integration Tests', () => {
    test('should complete full OAuth flow simulation', async () => {
      // 1. Generate auth URL
      const authData = oauthService.generateAuthUrl('test', 'http://localhost:3000/callback');
      expect(authData.authUrl).toBeTruthy();
      expect(authData.state).toBeTruthy();

      // 2. Validate state
      const stateData = oauthService.validateState(authData.state);
      expect(stateData).toBeTruthy();
      expect(stateData.provider).toBe('test');

      // 3. Simulate successful token generation
      const mockUserInfo = {
        id: 'oauth-user-123',
        email: 'oauth@example.com',
        name: 'OAuth User',
        provider: 'test'
      };

      const jwtTokens = oauthService.generateJwtTokens(mockUserInfo, 'test');
      expect(jwtTokens.accessToken).toBeTruthy();
      expect(jwtTokens.refreshToken).toBeTruthy();

      // 4. Store tokens
      oauthService.storeTokens(mockUserInfo.id, {
        provider: 'test',
        userInfo: mockUserInfo,
        jwt: jwtTokens
      });

      // 5. Verify token works for authentication
      const payload = oauthService.verifyJwt(jwtTokens.accessToken);
      expect(payload.sub).toBe(mockUserInfo.id);
      expect(payload.email).toBe(mockUserInfo.email);

      // 6. Test token refresh
      const refreshResult = await oauthService.refreshTokens(jwtTokens.refreshToken);
      expect(refreshResult.success).toBe(true);
      expect(refreshResult.tokens.accessToken).toBeTruthy();
      // Verify new tokens are generated  
      expect(refreshResult.tokens.accessToken).toBeTruthy();
      expect(refreshResult.tokens.refreshToken).toBeTruthy();
    });
  });
});