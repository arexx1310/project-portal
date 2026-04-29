// notificationController.js
import { NotificationEvent, UserNotification } from "../models/Notifications.js";

/**
 * Creates a NotificationEvent + fan-out UserNotification rows.
 * No real-time emit — frontend polls /notifications.
 *
 * @param {Object} eventData   - { type, message, refId, refModel, triggeredBy }
 * @param {Array}  recipients  - [{ _id, role }]
 * @param {Object} dbSession   - mongoose session (optional, for transactions)
 */
export const sendNotification = async (
  eventData,
  recipients,
  dbSession = null
) => {
  const sessionOpt = dbSession ? { session: dbSession } : {};

  const [event] = await NotificationEvent.create([eventData], sessionOpt);

  await UserNotification.insertMany(
    recipients.map(u => ({
      recipient: u._id,
      recipientRole: u.role,
      event: event._id,
    })),
    sessionOpt
  );

  return event;
};

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await UserNotification.find({ recipient: req.user.id })
      .populate("event")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};





