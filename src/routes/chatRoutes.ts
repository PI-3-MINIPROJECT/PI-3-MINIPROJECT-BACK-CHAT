import { Router } from 'express';
import {
  getMeetingInfo,
  getServerStats,
} from '../controllers/chatController';

/**
 * Express router for chat-related endpoints
 * @type {Router}
 */
const router = Router();

/**
 * @route   GET /api/chat/meeting/:meetingId
 * @desc    Get meeting information
 * @access  Public (no auth needed - User Backend already validated)
 * @param   {string} meetingId - Meeting ID
 */
router.get('/meeting/:meetingId', getMeetingInfo);

/**
 * @route   GET /api/chat/stats
 * @desc    Get server statistics
 * @access  Public
 */
router.get('/stats', getServerStats);

export default router;
