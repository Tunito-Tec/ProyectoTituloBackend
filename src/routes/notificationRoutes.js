const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

router.get("/", getMyNotifications);
router.put("/:id/leer", markAsRead);
router.post("/leer-todas", markAllAsRead);

module.exports = router;
