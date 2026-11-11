import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../common/middleware/validate';
import { authenticate } from '../../common/middleware/authenticate';
import {
  loginRateLimiter,
  forgotPasswordRateLimiter,
  tokenActionRateLimiter,
} from '../../common/middleware/rate-limiter';
import {
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schema';

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate with email and password. Returns a short-lived access JWT (15 min) and sets an httpOnly refresh token cookie (7 days). Account locks for 15 minutes after 5 failed attempts.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'superadmin@sqlworkspace.com'
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 'SuperAdmin@Secure123!'
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials or inactive account
 *       403:
 *         description: Workspace deactivated
 *       429:
 *         description: Too many requests or account temporarily locked
 */
router.post('/auth/login', loginRateLimiter, validate({ body: loginSchema }), (req, res, next) => {
  authController.login(req, res, next);
});

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Exchange an httpOnly refresh token cookie for a new short-lived access token and a rotated refresh token cookie.
 *     tags:
 *       - Authentication
 *     security:
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Missing or expired refresh token
 */
router.post('/auth/refresh', (req, res, next) => {
  authController.refresh(req, res, next);
});

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     description: Revoke the active refresh token session in Redis and clear the refresh token cookie.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/auth/logout', (req, res, next) => {
  authController.logout(req, res, next);
});

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     description: Returns the profile and permissions context of the logged-in user.
 *     tags:
 *       - Authentication
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/auth/me', authenticate, (req, res, next) => {
  authController.getProfile(req, res, next);
});

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     summary: Change password
 *     description: Change current user password. Requires current password and a new password conforming to the password policy. Clears must_change_password and revokes other active sessions.
 *     tags:
 *       - Authentication
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error or incorrect current password
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/auth/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  (req, res, next) => {
    authController.changePassword(req, res, next);
  },
);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset email
 *     description: Generates a single-use 1-hour reset token and sends an email if an active account exists. Returns neutral response to prevent email enumeration.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset link dispatched if email exists
 *       429:
 *         description: Too many reset attempts
 */
router.post(
  '/auth/forgot-password',
  forgotPasswordRateLimiter,
  validate({ body: forgotPasswordSchema }),
  (req, res, next) => {
    authController.forgotPassword(req, res, next);
  },
);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     description: Sets a new password using the single-use token received via email. Terminates other active sessions.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired reset token or weak password
 */
router.post(
  '/auth/reset-password',
  tokenActionRateLimiter,
  validate({ body: resetPasswordSchema }),
  (req, res, next) => {
    authController.resetPassword(req, res, next);
  },
);

export const authRoutes = router;

