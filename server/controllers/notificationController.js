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
    const notifications = await UserNotification.find({
      recipient: req.user.id,
    })
      .populate({
        path: "event",
        select: "type message triggeredBy",
        populate: {
          path: "triggeredBy",
          select: "name email",
        },
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      success: true,
      data: notifications.map((n) => ({
        type: n.event?.type,
        message: n.event?.message,

        triggeredBy: n.event?.triggeredBy
          ? {
              name: n.event.triggeredBy.name,
              email: n.event.triggeredBy.email,
            }
          : null,
        // 🕒 Date + Time
        createdAt: n.createdAt,
        date: new Date(n.createdAt).toLocaleDateString(),
        time: new Date(n.createdAt).toLocaleTimeString(),
      })),
    });
  } catch (error) {
    next(error);
  }
};






