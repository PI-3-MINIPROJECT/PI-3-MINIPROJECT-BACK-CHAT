import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chatService';
import { createError } from '../middlewares/errorHandler';
import { getActiveMeetingsCount, getTotalUsersCount } from '../config/socket';

/**
 * ChatService instance for meeting operations
 * @type {ChatService}
 */
const chatService = new ChatService();

/**
 * Get meeting information
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const getMeetingInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { meetingId } = req.params;

    if (!meetingId) {
      throw createError('Meeting ID is required', 400);
    }

    const meetingInfo = await chatService.getMeetingInfo(meetingId);

    res.status(200).json({
      success: true,
      data: meetingInfo,
    });
  } catch (error: any) {
    if (error.statusCode) {
      next(error);
    } else if (error.message === 'Meeting not found') {
      next(createError('Meeting not found', 404));
    } else {
      next(createError('Error fetching meeting information', 500));
    }
  }
};

/**
 * Get server statistics
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const getServerStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const activeMeetings = getActiveMeetingsCount();
    const totalUsers = getTotalUsersCount();

    res.status(200).json({
      success: true,
      data: {
        activeMeetings,
        totalUsers,
        maxParticipantsPerMeeting: parseInt(process.env.MAX_PARTICIPANTS || '10', 10),
        minParticipantsPerMeeting: parseInt(process.env.MIN_PARTICIPANTS || '2', 10),
      },
    });
  } catch (error: any) {
    next(createError('Error fetching server statistics', 500));
  }
};
