const Notification = require("../models/Notification");

// Obtener notificaciones del usuario
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      usuario: req.user._id,
    })
      .sort("-createdAt")
      .limit(50);

    const noLeidas = notifications.filter((n) => !n.leido).length;

    res.json({
      success: true,
      count: notifications.length,
      noLeidas,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Marcar como leída
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notificación no encontrada" });
    }

    if (notification.usuario.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "No autorizado" });
    }

    notification.leido = true;
    notification.fechaLeido = new Date();
    await notification.save();

    res.json({
      success: true,
      message: "Notificación marcada como leída",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Marcar todas como leídas
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { usuario: req.user._id, leido: false },
      { leido: true, fechaLeido: new Date() },
    );

    res.json({
      success: true,
      message: "Todas las notificaciones marcadas como leídas",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
