import { NotificationService } from '../services/notificationService.js';
import { sendSuccess } from '../utils/response.js';

export const getMyNotifications = async (req, res, next) => {
  try {
    const result = await NotificationService.getMyNotifications(req.user._id, req.query);
    return sendSuccess(res, 'Notifications retrieved', result);
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const updated = await NotificationService.markAsRead(req.params.id, req.user._id);
    return sendSuccess(res, 'Notification marked as read', updated);
  } catch (error) {
    next(error);
  }
};

export const scanOverdueNotifications = async (req, res, next) => {
  try {
    const result = await NotificationService.scanAndGenerateOverdueNotifications();
    return sendSuccess(res, 'Overdue scan completed and notifications dispatched', result);
  } catch (error) {
    next(error);
  }
};
