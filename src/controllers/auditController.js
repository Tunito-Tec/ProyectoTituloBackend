const AuditLog = require("../models/AuditLog");

// Obtener logs de auditoría (solo admin)
const getAuditLogs = async (req, res) => {
  try {
    const { entidad, usuario, desde, hasta, limit = 100 } = req.query;

    let filtro = {};
    if (entidad) filtro.entidad = entidad;
    if (usuario) filtro.usuario = usuario;
    if (desde || hasta) {
      filtro.createdAt = {};
      if (desde) filtro.createdAt.$gte = new Date(desde);
      if (hasta) filtro.createdAt.$lte = new Date(hasta);
    }

    const logs = await AuditLog.find(filtro)
      .populate("usuario", "nombre email rol")
      .sort("-createdAt")
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener trazabilidad de un trámite específico
const getProceedingTrace = async (req, res) => {
  try {
    const logs = await AuditLog.find({
      entidad: "tramite",
      entidadId: req.params.id,
    })
      .populate("usuario", "nombre email rol")
      .sort("createdAt");

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAuditLogs,
  getProceedingTrace,
};
