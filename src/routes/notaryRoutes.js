const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  getProceedingsPendingSignature,
  signDocument,
  validateMinuta,
  verifySignature,
  getNotaryStats,
} = require("../controllers/notaryController");

const router = express.Router();

// Todas las rutas requieren autenticación y rol de notario o admin
router.use(protect);
router.use(authorize("notario", "admin"));

// Dashboard
router.get("/dashboard/stats", getNotaryStats);

// Gestión de trámites
router.get("/tramites/pendientes-firma", getProceedingsPendingSignature);

// Acciones de firma y validación
router.post("/tramites/:id/validar-minuta", validateMinuta);
router.post("/tramites/:id/firmar", signDocument);
router.post("/tramites/:id/verificar-firma", verifySignature);

module.exports = router;
