const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  getPendingSignatures,
  signDocument,
  validateMinuta,
  verifyIntegrity,
  verifySignature,
  getNotaryStats,
  getProceedingById, // ← Importar la función
  generateClientCopy, // ← Importar la función
  getCompletedProceedings,
} = require("../controllers/notaryController");

const router = express.Router();

// Todas las rutas requieren autenticación y rol de notario o admin
router.use(protect);
router.use(authorize("notario", "admin"));

// Dashboard
router.get("/dashboard/stats", getNotaryStats);

// PRIMERO las rutas específicas (sin parámetros)
router.get("/tramites/pendientes-firma", getPendingSignatures);
router.get("/tramites/completados", getCompletedProceedings); // ← NUEVO

// DESPUÉS las rutas con parámetros (/:id)
router.get("/tramites/:id", getProceedingById);

// Acciones de firma y validación
router.post("/tramites/:id/validar-minuta", validateMinuta);
router.post("/tramites/:id/verificar-integridad", verifyIntegrity); // ← NUEVA RUTA
router.post("/tramites/:id/firmar", signDocument);
router.post("/tramites/:id/verificar-firma", verifySignature);
// En notaryRoutes.js, después de las otras rutas
router.get("/tramites/:id/copia-cliente", generateClientCopy);
module.exports = router;
