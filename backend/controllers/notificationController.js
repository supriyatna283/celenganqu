const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json(notifications);
  } catch (error) {
    console.error('getNotifications error:', error);
    return res.status(500).json({ message: 'Gagal mengambil notifikasi.' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notifikasi tidak ditemukan.' });
    }

    notification.is_read = true;
    await notification.save();

    return res.status(200).json(notification);
  } catch (error) {
    console.error('markAsRead error:', error);
    return res.status(500).json({ message: 'Gagal menandai notifikasi.' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { user_id: req.user.id, is_read: false } }
    );

    return res.status(200).json({ message: 'Semua notifikasi ditandai sudah dibaca.' });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    return res.status(500).json({ message: 'Gagal menandai semua notifikasi.' });
  }
};
