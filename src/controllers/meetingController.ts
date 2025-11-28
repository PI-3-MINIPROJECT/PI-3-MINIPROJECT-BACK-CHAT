import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chatService';
import { createError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

const chatService = new ChatService();

/**
 * Generate a unique meeting ID
 * @returns {string} Unique meeting ID
 */
const generateMeetingId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Create a new meeting
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const createMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { 
      userId, 
      title, 
      description, 
      date, 
      time, 
      estimatedDuration, 
      maxParticipants 
    } = req.body;

    if (!userId) {
      throw createError('User ID is required', 400);
    }

    if (!title || !date || !time) {
      throw createError('Title, date, and time are required', 400);
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw createError('Date must be in YYYY-MM-DD format', 400);
    }

    // Validate time format (HH:mm)
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(time)) {
      throw createError('Time must be in HH:mm format', 400);
    }

    const meetingId = generateMeetingId();

    const meetingData = {
      meetingId,
      hostId: userId,
      title,
      description: description || '',
      date,
      time,
      estimatedDuration: estimatedDuration || 60, // Default 60 minutes
      maxParticipants: maxParticipants || parseInt(process.env.MAX_PARTICIPANTS || '10', 10),
      participants: [userId],
      activeParticipants: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
    };

    await chatService.createMeeting(meetingData);

    logger.success(`Meeting created: ${meetingId} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      data: meetingData,
    });
  } catch (error: any) {
    if (error.statusCode) {
      next(error);
    } else {
      logger.error('Error creating meeting', error);
      next(createError('Error creating meeting', 500));
    }
  }
};

/**
 * Get all meetings for a user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const getUserMeetings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      throw createError('User ID is required', 400);
    }

    const meetings = await chatService.getUserMeetings(userId);

    res.status(200).json({
      success: true,
      data: meetings,
    });
  } catch (error: any) {
    if (error.statusCode) {
      next(error);
    } else {
      logger.error('Error fetching user meetings', error);
      next(createError('Error fetching meetings', 500));
    }
  }
};

/**
 * Get meeting by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const getMeetingById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { meetingId } = req.params;

    if (!meetingId) {
      throw createError('Meeting ID is required', 400);
    }

    const meeting = await chatService.getMeetingInfo(meetingId);

    res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (error: any) {
    if (error.statusCode) {
      next(error);
    } else if (error.message === 'Meeting not found') {
      next(createError('Meeting not found', 404));
    } else {
      logger.error('Error fetching meeting', error);
      next(createError('Error fetching meeting', 500));
    }
  }
};

/**
 * Join a meeting
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const joinMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { meetingId } = req.params;
    const { userId } = req.body;

    if (!meetingId || !userId) {
      throw createError('Meeting ID and User ID are required', 400);
    }

    const meeting = await chatService.getMeetingInfo(meetingId);

    if (!meeting) {
      throw createError('Meeting not found', 404);
    }

    // Add user to participants if not already there
    await chatService.addParticipantToMeeting(meetingId, userId);

    const updatedMeeting = await chatService.getMeetingInfo(meetingId);

    logger.info(`User ${userId} joined meeting ${meetingId}`);

    res.status(200).json({
      success: true,
      message: 'Joined meeting successfully',
      data: updatedMeeting,
    });
  } catch (error: any) {
    if (error.statusCode) {
      next(error);
    } else {
      logger.error('Error joining meeting', error);
      next(createError('Error joining meeting', 500));
    }
  }
};

/**
 * Leave a meeting
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const leaveMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { meetingId } = req.params;
    const { userId } = req.body;

    if (!meetingId || !userId) {
      throw createError('Meeting ID and User ID are required', 400);
    }

    // Note: We keep the user in participants[] (historical record)
    // This is just for compatibility with the API

    logger.info(`User ${userId} left meeting ${meetingId}`);

    res.status(200).json({
      success: true,
      message: 'Left meeting successfully',
    });
  } catch (error: any) {
    if (error.statusCode) {
      next(error);
    } else {
      logger.error('Error leaving meeting', error);
      next(createError('Error leaving meeting', 500));
    }
  }
};

/**
 * Delete a meeting
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const deleteMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { meetingId } = req.params;
    const { userId } = req.body;

    if (!meetingId || !userId) {
      throw createError('Meeting ID and User ID are required', 400);
    }

    const meeting = await chatService.getMeetingInfo(meetingId);

    if (!meeting) {
      throw createError('Meeting not found', 404);
    }

    // Only host can delete the meeting
    if (meeting.hostId !== userId) {
      throw createError('Only the host can delete the meeting', 403);
    }

    await chatService.deleteMeeting(meetingId);

    logger.success(`Meeting deleted: ${meetingId}`);

    res.status(200).json({
      success: true,
      message: 'Meeting deleted successfully',
    });
  } catch (error: any) {
    if (error.statusCode) {
      next(error);
    } else {
      logger.error('Error deleting meeting', error);
      next(createError('Error deleting meeting', 500));
    }
  }
};

/**
 * Update a meeting
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const updateMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { meetingId } = req.params;
    const { 
      userId, 
      title, 
      description, 
      date, 
      time, 
      estimatedDuration, 
      maxParticipants, 
      status 
    } = req.body;

    if (!meetingId || !userId) {
      throw createError('Meeting ID and User ID are required', 400);
    }

    // Validate date format if provided
    if (date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        throw createError('Date must be in YYYY-MM-DD format', 400);
      }
    }

    // Validate time format if provided
    if (time) {
      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(time)) {
        throw createError('Time must be in HH:mm format', 400);
      }
    }

    const meeting = await chatService.getMeetingInfo(meetingId);

    if (!meeting) {
      throw createError('Meeting not found', 404);
    }

    // Only host can update the meeting
    if (meeting.hostId !== userId) {
      throw createError('Only the host can update the meeting', 403);
    }

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (date) updateData.date = date;
    if (time) updateData.time = time;
    if (estimatedDuration) updateData.estimatedDuration = estimatedDuration;
    if (maxParticipants) updateData.maxParticipants = maxParticipants;
    if (status) updateData.status = status;

    await chatService.updateMeeting(meetingId, updateData);

    const updatedMeeting = await chatService.getMeetingInfo(meetingId);

    logger.success(`Meeting updated: ${meetingId}`);

    res.status(200).json({
      success: true,
      message: 'Meeting updated successfully',
      data: updatedMeeting,
    });
  } catch (error: any) {
    if (error.statusCode) {
      next(error);
    } else {
      logger.error('Error updating meeting', error);
      next(createError('Error updating meeting', 500));
    }
  }
};

/**
 * Get today's meetings for a user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const getTodayMeetings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      throw createError('User ID is required', 400);
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    logger.info(`Fetching today meetings for user: ${userId}, date: ${today}`);

    const meetings = await chatService.getTodayMeetings(userId, today);

    logger.success(`Found ${meetings.length} meetings for user ${userId} on ${today}`);

    res.status(200).json({
      success: true,
      data: {
        date: today,
        count: meetings.length,
        meetings: meetings,
      },
    });
  } catch (error: any) {
    logger.error('Error in getTodayMeetings controller:', {
      userId: req.params.userId,
      error: error.message,
      stack: error.stack
    });
    
    if (error.statusCode) {
      next(error);
    } else {
      next(createError(`Error fetching today meetings: ${error.message}`, 500));
    }
  }
};

