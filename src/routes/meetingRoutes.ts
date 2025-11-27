import { Router } from 'express';
import {
  createMeeting,
  getUserMeetings,
  getMeetingById,
  joinMeeting,
  leaveMeeting,
  deleteMeeting,
  updateMeeting,
} from '../controllers/meetingController';

const router = Router();

/**
 * @route   POST /api/meetings
 * @desc    Create a new meeting
 * @access  Internal (called from User Backend)
 * @body    { userId, title, description }
 */
router.post('/', createMeeting);

/**
 * @route   GET /api/meetings/user/:userId
 * @desc    Get all meetings for a user
 * @access  Internal (called from User Backend)
 * @param   {string} userId - User ID
 */
router.get('/user/:userId', getUserMeetings);

/**
 * @route   GET /api/meetings/:meetingId
 * @desc    Get meeting by ID
 * @access  Internal (called from User Backend)
 * @param   {string} meetingId - Meeting ID
 */
router.get('/:meetingId', getMeetingById);

/**
 * @route   POST /api/meetings/:meetingId/join
 * @desc    Join a meeting
 * @access  Internal (called from User Backend)
 * @param   {string} meetingId - Meeting ID
 * @body    { userId }
 */
router.post('/:meetingId/join', joinMeeting);

/**
 * @route   POST /api/meetings/:meetingId/leave
 * @desc    Leave a meeting
 * @access  Internal (called from User Backend)
 * @param   {string} meetingId - Meeting ID
 * @body    { userId }
 */
router.post('/:meetingId/leave', leaveMeeting);

/**
 * @route   PUT /api/meetings/:meetingId
 * @desc    Update a meeting
 * @access  Internal (called from User Backend)
 * @param   {string} meetingId - Meeting ID
 * @body    { userId, title, description, status }
 */
router.put('/:meetingId', updateMeeting);

/**
 * @route   DELETE /api/meetings/:meetingId
 * @desc    Delete a meeting
 * @access  Internal (called from User Backend)
 * @param   {string} meetingId - Meeting ID
 * @body    { userId }
 */
router.delete('/:meetingId', deleteMeeting);

export default router;

