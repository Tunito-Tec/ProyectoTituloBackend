const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  getPendingProceedings,
  getAssignedProceedings,
  assignProceeding,
  reviewProceeding,
  requestCorrections,
} = require("../controllers/auxiliaryController");

const router = express.Router();

// Todas las rutas requieren autenticación y rol de auxiliar o admin
router.use(protect);
router.use(authorize("auxiliar", "admin"));

// Dashboard y listados
router.get("/tramites/pendientes", getPendingProceedings);
router.get("/tramites/asignados", getAssignedProceedings);

// Acciones sobre trámites
router.put("/tramites/:id/asignar", assignProceeding);
router.put("/tramites/:id/revisar", reviewProceeding);
router.post("/tramites/:id/solicitar-correcciones", requestCorrections);

module.exports = router;
