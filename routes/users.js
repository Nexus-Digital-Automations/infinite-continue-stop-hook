/**
 * User Management Routes
 *
 * Comprehensive user management endpoints for registration, profile management,
 * and account administration. Integrates with existing OAuth authentication
 * and provides complete CRUD operations for user accounts.
 */

const express = require("express");
const AuthMiddleware = require("../lib/authMiddleware");
const UserService = require("../lib/userService");

function createUserRoutes(config = {}) {
  const router = express.Router();
  const authMiddleware = new AuthMiddleware(config);
  const userService = new UserService(config);

  // Initialize user service
  userService.initialize().catch((error) => {
    console.error("Failed to initialize user service:", error);
  });

  /**
   * POST /users/register
   * Register a new user with email/password
   */
  router.post("/register", async (req, res) => {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        displayName,
        avatar,
        bio,
        language,
        timezone,
        theme,
      } = req.body;

      // Prepare registration data
      const registrationData = {
        email,
        password,
        firstName,
        lastName,
        displayName,
        avatar,
        bio,
        language,
        timezone,
        theme,
        provider: "email",
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        source: "web_registration",
      };

      const result = await userService.registerUser(registrationData);

      res.status(201).json({
        success: true,
        data: result.data,
        message: "User registered successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: "Registration failed",
        message: error.message,
      });
    }
  });

  /**
   * POST /users/login
   * Authenticate user with email/password
   */
  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: "Missing credentials",
          message: "Email and password are required",
        });
      }

      const result = await userService.authenticateUser(email, password);

      // Generate JWT token for authenticated user
      const oauthService = authMiddleware.getOAuthService();
      const tokens = oauthService.generateJwtTokens({
        sub: result.data.user.id,
        email: result.data.user.email,
        name: result.data.user.profile?.display_name || result.data.user.email,
        provider: result.data.user.provider,
      });

      res.json({
        success: true,
        data: {
          user: result.data.user,
          tokens: tokens,
        },
        message: "Authentication successful",
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: "Authentication failed",
        message: error.message,
      });
    }
  });

  /**
   * GET /users/profile
   * Get current user's profile
   */
  router.get("/profile", authMiddleware.authenticateJWT(), async (req, res) => {
    try {
      const result = await userService.getUserById(req.user.id);

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: "Profile not found",
        message: error.message,
      });
    }
  });

  /**
   * PUT /users/profile
   * Update current user's profile
   */
  router.put("/profile", authMiddleware.authenticateJWT(), async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        displayName,
        avatar,
        bio,
        preferences,
        privacy,
      } = req.body;

      const profileData = {
        firstName,
        lastName,
        displayName,
        avatar,
        bio,
        preferences,
        privacy,
      };

      const result = await userService.updateUserProfile(
        req.user.id,
        profileData,
      );

      res.json({
        success: true,
        data: result.data,
        message: "Profile updated successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: "Profile update failed",
        message: error.message,
      });
    }
  });

  /**
   * GET /users/:userId
   * Get user by ID (admin or user themselves)
   */
  router.get("/:userId", authMiddleware.authenticateJWT(), async (req, res) => {
    try {
      const { userId } = req.params;

      // Check if user can access this profile
      if (req.user.id !== userId && !req.user.role?.includes("admin")) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
          message: "You can only access your own profile",
        });
      }

      const result = await userService.getUserById(userId);

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: "User not found",
        message: error.message,
      });
    }
  });

  /**
   * DELETE /users/:userId
   * Delete user account (admin or user themselves)
   */
  router.delete(
    "/:userId",
    authMiddleware.authenticateJWT(),
    async (req, res) => {
      try {
        const { userId } = req.params;

        // Check if user can delete this account
        if (req.user.id !== userId && !req.user.role?.includes("admin")) {
          return res.status(403).json({
            success: false,
            error: "Access denied",
            message: "You can only delete your own account",
          });
        }

        const result = await userService.deleteUser(userId);

        res.json({
          success: true,
          message: result.message,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: "Account deletion failed",
          message: error.message,
        });
      }
    },
  );

  /**
   * POST /users/change-password
   * Change user password
   */
  router.post(
    "/change-password",
    authMiddleware.authenticateJWT(),
    async (req, res) => {
      try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
          return res.status(400).json({
            success: false,
            error: "Missing passwords",
            message: "Both current and new password are required",
          });
        }

        // Verify current password first
        const authResult = await userService.authenticateUser(
          req.user.email,
          currentPassword,
        );
        if (!authResult.success) {
          return res.status(401).json({
            success: false,
            error: "Invalid current password",
            message: "Current password is incorrect",
          });
        }

        // Update password through registration update (reusing validation logic)
        const bcrypt = require("bcryptjs");
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Read and update user data directly (simplified for password change)
        const data = await userService.readJsonData();
        const user = data.users.accounts.find((u) => u.id === req.user.id);
        if (user) {
          user.password_hash = hashedPassword;
          user.updated_at = new Date().toISOString();
          await userService.writeJsonData(data);
        }

        res.json({
          success: true,
          message: "Password changed successfully",
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: "Password change failed",
          message: error.message,
        });
      }
    },
  );

  /**
   * GET /users/statistics
   * Get user management statistics (admin only)
   */
  router.get(
    "/admin/statistics",
    authMiddleware.authenticateJWT(),
    authMiddleware.requireRole(["admin"]),
    async (req, res) => {
      try {
        const stats = await userService.getStatistics();

        res.json({
          success: true,
          data: stats,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: "Failed to get statistics",
          message: error.message,
        });
      }
    },
  );

  /**
   * GET /users/admin/list
   * List all users (admin only)
   */
  router.get(
    "/admin/list",
    authMiddleware.authenticateJWT(),
    authMiddleware.requireRole(["admin"]),
    async (req, res) => {
      try {
        const { page = 1, limit = 20, status, role } = req.query;

        // Read user data
        const data = await userService.readJsonData();
        let users = data.users?.accounts || [];

        // Filter by status
        if (status) {
          users = users.filter((u) => u.status === status);
        }

        // Filter by role
        if (role) {
          users = users.filter((u) => u.role === role);
        }

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedUsers = users.slice(startIndex, endIndex);

        // Remove sensitive data
        const sanitizedUsers = paginatedUsers.map((user) => ({
          id: user.id,
          email: user.email,
          provider: user.provider,
          status: user.status,
          role: user.role,
          created_at: user.created_at,
          last_login: user.last_login,
        }));

        res.json({
          success: true,
          data: {
            users: sanitizedUsers,
            pagination: {
              current_page: parseInt(page),
              total_pages: Math.ceil(users.length / limit),
              total_users: users.length,
              per_page: parseInt(limit),
            },
          },
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: "Failed to list users",
          message: error.message,
        });
      }
    },
  );

  /**
   * PUT /users/admin/:userId/status
   * Update user status (admin only)
   */
  router.put(
    "/admin/:userId/status",
    authMiddleware.authenticateJWT(),
    authMiddleware.requireRole(["admin"]),
    async (req, res) => {
      try {
        const { userId } = req.params;
        const { status } = req.body;

        if (!["active", "suspended", "pending_verification"].includes(status)) {
          return res.status(400).json({
            success: false,
            error: "Invalid status",
            message:
              "Status must be: active, suspended, or pending_verification",
          });
        }

        // Update user status
        const data = await userService.readJsonData();
        const user = data.users.accounts.find((u) => u.id === userId);

        if (!user) {
          return res.status(404).json({
            success: false,
            error: "User not found",
            message: "User with specified ID does not exist",
          });
        }

        user.status = status;
        user.updated_at = new Date().toISOString();
        await userService.writeJsonData(data);

        res.json({
          success: true,
          message: `User status updated to ${status}`,
          data: {
            userId: user.id,
            email: user.email,
            status: user.status,
          },
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: "Status update failed",
          message: error.message,
        });
      }
    },
  );

  /**
   * POST /users/verify-email
   * Verify user email with verification token
   */
  router.post("/verify-email", async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: "Missing token",
          message: "Verification token is required",
        });
      }

      // Find verification record
      const data = await userService.readJsonData();
      const verification = data.users.verifications.find(
        (v) =>
          v.token === token &&
          v.type === "email_verification" &&
          !v.used &&
          new Date(v.expires_at) > new Date(),
      );

      if (!verification) {
        return res.status(400).json({
          success: false,
          error: "Invalid or expired token",
          message: "Verification token is invalid or has expired",
        });
      }

      // Mark verification as used
      verification.used = true;
      verification.used_at = new Date().toISOString();

      // Update user status to active
      const user = data.users.accounts.find(
        (u) => u.id === verification.user_id,
      );
      if (user) {
        user.status = "active";
        user.updated_at = new Date().toISOString();
      }

      await userService.writeJsonData(data);

      res.json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Email verification failed",
        message: error.message,
      });
    }
  });

  /**
   * GET /users/health
   * User service health check
   */
  router.get("/health", async (req, res) => {
    try {
      const stats = await userService.getStatistics();

      res.json({
        success: true,
        status: "healthy",
        service: "user-management",
        timestamp: new Date().toISOString(),
        data: {
          total_users: stats.users.total,
          active_users: stats.users.active,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        status: "unhealthy",
        service: "user-management",
        error: error.message,
      });
    }
  });

  return router;
}

module.exports = createUserRoutes;
