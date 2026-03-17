const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  createProceeding,
  getMyProceedings,
  getProceedingById,
  updateProceeding,
  uploadDocument,
  signProceeding, // ← Importar la nueva función
} = require("../controllers/proceedingController");

const router = express.Router();

// Todas las rutas aquí aplican el middleware de autenticación y de rol 'cliente'
router.use(protect);
router.use(authorize("cliente", "admin"));

router.post("/tramites", createProceeding);
router.get("/tramites", getMyProceedings);
router.get("/tramites/:id", getProceedingById);
router.put("/tramites/:id", updateProceeding);
router.post("/tramites/:id/documentos", uploadDocument);
router.post("/tramites/:id/firmar", signProceeding); // ← Agregar esta ruta
// En notaryRoutes.js o clientRoutes.js, agrega:

module.exports = router;
