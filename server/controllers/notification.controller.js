const Notification = require('../models/notifications');
const { success, error } = require('../utils/response.util');

// GET /api/notifications
// returns notifications for the logged-in user only
// supports ?unreadOnly=true and ?limit=20
exports.getNotifications = async (req, res) => {
  try {
    const { unreadOnly, limit = 20 } = req.query;

    const filter = {
      workspaceId: req.workspaceId,
      userId:      req.user.userId,
    };

    if (unreadOnly === 'true') filter.read = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    const unreadCount = await Notification.countDocuments({
      workspaceId: req.workspaceId,
      userId:      req.user.userId,
      read:        false,
    });

    return success(res, { notifications, unreadCount });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// PATCH /api/notifications/:id/read
exports.markOneRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      {
        _id:         req.params.id,
        userId:      req.user.userId,   // user can only mark their own
        workspaceId: req.workspaceId,
      },
      { read: true },
      { returnDocument: 'after' }
    );

    if (!notif) return error(res, 'Notification not found', 404);
    return success(res, { notification: notif });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// PATCH /api/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        userId:      req.user.userId,
        workspaceId: req.workspaceId,
        read:        false,
      },
      { read: true }
    );

    return success(res, {
      message: `${result.modifiedCount} notifications marked as read`,
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    const notif = await Notification.findOneAndDelete({
      _id:         req.params.id,
      userId:      req.user.userId,
      workspaceId: req.workspaceId,
    });

    if (!notif) return error(res, 'Notification not found', 404);
    return success(res, { message: 'Notification deleted' });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// DELETE /api/notifications
// clears all READ notifications for this user — keeps unread ones
exports.clearAll = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      userId:      req.user.userId,
      workspaceId: req.workspaceId,
      read:        true,
    });

    return success(res, {
      message: `${result.deletedCount} notifications cleared`,
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};
