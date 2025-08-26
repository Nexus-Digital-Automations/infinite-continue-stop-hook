/**
 * Authentication Routes
 * 
 * Provides OAuth 2.0 authentication endpoints for login, callback,
 * token refresh, and user management.
 */

const express = require('express');
const AuthMiddleware = require('../lib/authMiddleware');

function createAuthRoutes(config = {}) {
  const router = express.Router();
  const authMiddleware = new AuthMiddleware(config);
  const oauthService = authMiddleware.getOAuthService();

  /**
   * GET /auth/providers
   * Get available OAuth providers
   */
  router.get('/providers', (req, res) => {
    const providers = Object.keys(oauthService.config.providers).filter(provider => {
      const config = oauthService.config.providers[provider];
      return config.clientId && config.clientSecret;
    });

    res.json({
      success: true,
      data: {
        providers: providers.map(provider => ({
          name: provider,
          displayName: provider.charAt(0).toUpperCase() + provider.slice(1),
          authUrl: `/api/auth/login/${provider}`
        }))
      }
    });
  });

  /**
   * GET /auth/login/:provider
   * Initiate OAuth login flow
   */
  router.get('/login/:provider', (req, res) => {
    try {
      const { provider } = req.params;
      const { redirect_uri } = req.query;
      
      // Validate provider
      if (!oauthService.config.providers[provider]) {
        return res.status(400).json({
          success: false,
          error: 'Invalid provider',
          message: `Provider '${provider}' is not supported`
        });
      }

      // Generate authorization URL
      const callbackUrl = redirect_uri || `${req.protocol}://${req.get('host')}/api/auth/callback/${provider}`;
      const authData = oauthService.generateAuthUrl(provider, callbackUrl, {
        stateData: {
          originalUrl: req.query.return_to || req.get('Referer')
        }
      });

      res.json({
        success: true,
        data: {
          authUrl: authData.authUrl,
          state: authData.state,
          provider,
          expiresAt: authData.expiresAt
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Login initialization failed',
        message: error.message
      });
    }
  });

  /**
   * GET /auth/callback/:provider
   * Handle OAuth callback
   */
  router.get('/callback/:provider', async (req, res) => {
    try {
      const { provider } = req.params;
      const { code, state, error, error_description } = req.query;

      // Handle OAuth errors
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'OAuth error',
          message: error_description || error
        });
      }

      // Validate required parameters
      if (!code || !state) {
        return res.status(400).json({
          success: false,
          error: 'Missing parameters',
          message: 'Authorization code and state are required'
        });
      }

      // Exchange code for tokens
      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/callback/${provider}`;
      const result = await oauthService.exchangeCodeForToken(provider, code, state, redirectUri);

      // For web applications, you might want to redirect with tokens in URL or set cookies
      // For API usage, return tokens in response
      res.json({
        success: true,
        data: {
          tokens: result.tokens,
          user: {
            id: result.userInfo.id,
            email: result.userInfo.email,
            name: result.userInfo.name,
            avatar: result.userInfo.avatar,
            provider: result.provider
          },
          message: 'Authentication successful'
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Authentication failed',
        message: error.message
      });
    }
  });

  /**
   * POST /auth/refresh
   * Refresh JWT tokens
   */
  router.post('/refresh', async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Missing refresh token',
          message: 'Refresh token is required'
        });
      }

      const result = await oauthService.refreshTokens(refreshToken);

      res.json({
        success: true,
        data: result.tokens,
        message: 'Tokens refreshed successfully'
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Token refresh failed',
        message: error.message
      });
    }
  });

  /**
   * GET /auth/me
   * Get current user information
   */
  router.get('/me', authMiddleware.authenticateJWT(), (req, res) => {
    const storedTokens = oauthService.getStoredTokens(req.user.id);
    
    res.json({
      success: true,
      data: {
        user: req.user,
        tokenInfo: req.tokenInfo,
        sessionInfo: storedTokens ? {
          provider: storedTokens.provider,
          createdAt: storedTokens.createdAt,
          refreshedAt: storedTokens.refreshedAt
        } : null
      }
    });
  });

  /**
   * POST /auth/logout
   * Logout and revoke tokens
   */
  router.post('/logout', authMiddleware.authenticateJWT(), (req, res) => {
    try {
      // Revoke stored tokens
      oauthService.revokeTokens(req.user.id);

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Logout failed',
        message: error.message
      });
    }
  });

  /**
   * GET /auth/status
   * Get authentication service status
   */
  router.get('/status', (req, res) => {
    const stats = oauthService.getStatistics();
    
    res.json({
      success: true,
      data: {
        status: 'operational',
        statistics: stats,
        timestamp: new Date().toISOString()
      }
    });
  });

  /**
   * POST /auth/verify
   * Verify JWT token
   */
  router.post('/verify', (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Missing token',
          message: 'Token is required for verification'
        });
      }

      const payload = oauthService.verifyJwt(token);

      res.json({
        success: true,
        data: {
          valid: true,
          payload: {
            sub: payload.sub,
            email: payload.email,
            name: payload.name,
            provider: payload.provider,
            type: payload.type,
            issuedAt: payload.iat,
            expiresAt: payload.exp
          }
        }
      });
    } catch (error) {
      res.json({
        success: true,
        data: {
          valid: false,
          error: error.message
        }
      });
    }
  });

  return router;
}

module.exports = createAuthRoutes;