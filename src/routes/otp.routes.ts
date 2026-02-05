// src/routes/otp.route.ts
// src/routes/otp.routes.ts
import { Router } from 'express';
import { otpService } from '../services/otp.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /otp/send:
 *   post:
 *     summary: Send OTP to phone number
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               message:
 *                 type: string
 *                 description: Optional message content
 *     responses:
 *       200:
 *         description: OTP sent
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/send', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    const result = await otpService.sendOTP({ phoneNumber, message });
    res.status(result.success ? 200 : 400).json(result);
  } catch (err: any) {
    logger.error('Error in send OTP route', { error: err.message });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

/**
 * @swagger
 * /otp/verify:
 *   post:
 *     summary: Verify OTP code
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - otp
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified
 *       400:
 *         description: Invalid OTP or bad request
 *       500:
 *         description: Internal server error
 */
router.post('/verify', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required',
      });
    }

    const result = await otpService.verifyOTP({ phoneNumber, otp });
    res.status(result.success ? 200 : 400).json(result);
  } catch (err: any) {
    logger.error('Error in verify OTP route', { error: err.message });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

/**
 * @swagger
 * /otp/resend:
 *   post:
 *     summary: Resend OTP to phone number
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP resent
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/resend', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    const result = await otpService.resendOTP(phoneNumber);
    res.status(result.success ? 200 : 400).json(result);
  } catch (err: any) {
    logger.error('Error in resend OTP route', { error: err.message });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

/**
 * @swagger
 * /otp/status/{phoneNumber}:
 *   get:
 *     summary: Check OTP status
 *     tags: [OTP]
 *     parameters:
 *       - in: path
 *         name: phoneNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status found
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal server error
 */
router.get('/status/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    const result = await otpService.checkStatus(phoneNumber);
    res.status(result.success ? 200 : 404).json(result);
  } catch (err: any) {
    logger.error('Error in check OTP status route', { error: err.message });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

/**
 * @swagger
 * /otp/stats:
 *   get:
 *     summary: Get OTP service statistics
 *     tags: [OTP]
 *     responses:
 *       200:
 *         description: Statistics retrieved
 *       500:
 *         description: Internal server error
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = otpService.getStats();
    res.json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: stats,
    });
  } catch (err: any) {
    logger.error('Error in get OTP stats route', { error: err.message });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

export default router;