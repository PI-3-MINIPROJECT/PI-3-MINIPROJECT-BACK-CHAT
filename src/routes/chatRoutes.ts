import { Router } from 'express';
import {
  getMeetingInfo,
  getServerStats,
} from '../controllers/chatController';
import { optionalAuth } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @route   GET /api/chat/meeting/:meetingId
 * @desc    Get meeting information
 * @access  Public (optional auth)
 * @param   {string} meetingId - Meeting ID
 */
router.get('/meeting/:meetingId', optionalAuth, getMeetingInfo);

/**
 * @route   GET /api/chat/stats
 * @desc    Get server statistics
 * @access  Public
 */
router.get('/stats', getServerStats);

export default router;
