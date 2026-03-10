const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  createProceeding,
  getMyProceedings,
} = require("../controllers/proceedingController");
const router = express.Router();

// Todas las rutas aquí aplican el middleware de autenticación y de rol 'cliente'
router.use(protect);
router.use(authorize("cliente", "admin")); // Cliente o admin pueden pasar

router.post("/tramites", createProceeding); // POST /api/client/tramites
router.get("/tramites", getMyProceedings); // GET /api/client/tramites

module.exports = router;
