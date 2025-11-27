import { getFirestoreInstance } from '../config/firebase';
import { logger } from '../utils/logger';

/**
 * Chat service for managing meeting rooms
 * @class ChatService
 */
export class ChatService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = getFirestoreInstance();
  }

  /**
   * Create a new meeting in Firestore
   * @param {any} meetingData - Meeting data
   * @returns {Promise<void>}
   */
  async createMeeting(meetingData: any): Promise<void> {
    try {
      await this.db.collection('meetings').doc(meetingData.meetingId).set(meetingData);
      logger.info(`Meeting created in Firestore: ${meetingData.meetingId}`);
    } catch (error) {
      logger.error('Error creating meeting in Firestore', error);
      throw error;
    }
  }

  /**
   * Get all meetings for a user
   * @param {string} userId - User ID
   * @returns {Promise<any[]>} Array of meetings
   */
  async getUserMeetings(userId: string): Promise<any[]> {
    try {
      const snapshot = await this.db
        .collection('meetings')
        .where('participants', 'array-contains', userId)
        .orderBy('createdAt', 'desc')
        .get();

      const meetings = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return meetings;
    } catch (error) {
      logger.error(`Error fetching meetings for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Check if a meeting exists in Firestore
   * @param {string} meetingId - Meeting ID
   * @returns {Promise<boolean>} True if meeting exists
   */
  async meetingExists(meetingId: string): Promise<boolean> {
    try {
      const doc = await this.db.collection('meetings').doc(meetingId).get();
      return doc.exists;
    } catch (error) {
      logger.error(`Error checking if meeting exists: ${meetingId}`, error);
      return false;
    }
  }

  /**
   * Get meeting information
   * @param {string} meetingId - Meeting ID
   * @returns {Promise<any>} Meeting data
   */
  async getMeetingInfo(meetingId: string): Promise<any> {
    try {
      const doc = await this.db.collection('meetings').doc(meetingId).get();
      
      if (!doc.exists) {
        throw new Error('Meeting not found');
      }

      return {
        id: doc.id,
        ...doc.data(),
      };
    } catch (error) {
      logger.error(`Error fetching meeting info: ${meetingId}`, error);
      throw error;
    }
  }

  /**
   * Add a participant to the meeting's participants list in Firestore
   * This maintains a persistent record of everyone who has ever connected
   * @param {string} meetingId - Meeting ID
   * @param {string} userId - User ID to add
   * @returns {Promise<void>}
   */
  async addParticipantToMeeting(meetingId: string, userId: string): Promise<void> {
    try {
      const meetingRef = this.db.collection('meetings').doc(meetingId);
      const meetingDoc = await meetingRef.get();

      if (!meetingDoc.exists) {
        logger.warn(`Meeting ${meetingId} does not exist, cannot add participant`);
        return;
      }

      const meetingData = meetingDoc.data();
      const participants = meetingData?.participants || [];

      // Only add if not already in the list
      if (!participants.includes(userId)) {
        await meetingRef.update({
          participants: [...participants, userId],
          updatedAt: new Date().toISOString(),
        });

        logger.info(`Added user ${userId} to participants list of meeting ${meetingId}`);
      }
    } catch (error) {
      logger.warn(`Could not add participant to meeting ${meetingId}`, error);
      // Don't throw error, just log it
    }
  }

  /**
   * Update meeting's active participants count (currently connected in real-time)
   * @param {string} meetingId - Meeting ID
   * @param {number} activeParticipants - Number of active participants
   * @returns {Promise<void>}
   */
  async updateActiveParticipants(meetingId: string, activeParticipants: number): Promise<void> {
    try {
      const meetingExists = await this.meetingExists(meetingId);
      
      if (meetingExists) {
        await this.db.collection('meetings').doc(meetingId).update({
          activeParticipants,
          updatedAt: new Date().toISOString(),
        });

        logger.info(`Updated active participants for meeting ${meetingId}: ${activeParticipants}`);
      }
    } catch (error) {
      logger.warn(`Could not update active participants for meeting ${meetingId}`, error);
      // Don't throw error, just log it
    }
  }

  /**
   * Update a meeting
   * @param {string} meetingId - Meeting ID
   * @param {any} updateData - Data to update
   * @returns {Promise<void>}
   */
  async updateMeeting(meetingId: string, updateData: any): Promise<void> {
    try {
      await this.db.collection('meetings').doc(meetingId).update(updateData);
      logger.info(`Meeting updated: ${meetingId}`);
    } catch (error) {
      logger.error(`Error updating meeting ${meetingId}`, error);
      throw error;
    }
  }

  /**
   * Delete a meeting
   * @param {string} meetingId - Meeting ID
   * @returns {Promise<void>}
   */
  async deleteMeeting(meetingId: string): Promise<void> {
    try {
      await this.db.collection('meetings').doc(meetingId).delete();
      logger.info(`Meeting deleted: ${meetingId}`);
    } catch (error) {
      logger.error(`Error deleting meeting ${meetingId}`, error);
      throw error;
    }
  }
}
