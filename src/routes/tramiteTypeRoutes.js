const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  getActiveTramiteTypes,
  createTramiteType,
  updateTramiteType,
  deleteTramiteType,
} = require("../controllers/tramiteTypeController");

const router = express.Router();

// Rutas públicas (solo lectura)
router.get("/activos", getActiveTramiteTypes);

// Rutas protegidas (solo admin)
router.use(protect);
router.use(authorize("admin"));

router.post("/", createTramiteType);
router.put("/:id", updateTramiteType);
router.delete("/:id", deleteTramiteType);

module.exports = router;
