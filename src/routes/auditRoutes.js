const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  getAuditLogs,
  getProceedingTrace,
} = require("../controllers/auditController");

const router = express.Router();

// Solo admin y notario pueden ver auditoría
router.use(protect);
router.use(authorize("admin", "notario"));

router.get("/logs", getAuditLogs);
router.get("/tramite/:id", getProceedingTrace);

module.exports = router;
