// src/routes/otp.route.ts
// src/routes/otp.routes.ts
import { Router } from 'express';
import { otpService } from '../services/otp.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route   POST /api/otp/send
 * @desc    Send OTP to phone number
 * @body    { phoneNumber: string, message?: string }
 * @access  Public
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
 * @route   POST /api/otp/verify
 * @desc    Verify OTP code
 * @body    { phoneNumber: string, otp: string }
 * @access  Public
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
 * @route   POST /api/otp/resend
 * @desc    Resend OTP to phone number
 * @body    { phoneNumber: string }
 * @access  Public
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
 * @route   GET /api/otp/status/:phoneNumber
 * @desc    Check OTP status
 * @param   phoneNumber
 * @access  Public
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
 * @route   GET /api/otp/stats
 * @desc    Get OTP service statistics
 * @access  Public
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