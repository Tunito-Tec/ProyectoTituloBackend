const Proceeding = require("../models/Proceeding");
const User = require("../models/User");

// @desc    Obtener detalle de un trámite específico (para auxiliar)
// @route   GET /api/auxiliar/tramites/:id
const getProceedingById = async (req, res) => {
  try {
    const proceeding = await Proceeding.findById(req.params.id)
      .populate("cliente", "nombre email rut")
      .populate("tipo", "nombre tipoId")
      .populate("asignadoA", "nombre email rol")
      .populate("historial.usuario", "nombre rol");

    if (!proceeding) {
      return res.status(404).json({
        success: false,
        message: "Trámite no encontrado",
      });
    }

    res.json({
      success: true,
      data: proceeding,
    });
  } catch (error) {
    console.error("Error en getProceedingById:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Obtener trámites pendientes de revisión
// @route   GET /api/auxiliar/tramites/pendientes
const getPendingProceedings = async (req, res) => {
  try {
    const proceedings = await Proceeding.find({
      estado: { $in: ["pendiente_revision_auxiliar", "pendiente"] },
    })
      .populate("cliente", "nombre email rut")
      .populate("tipo", "nombre tipoId")
      .sort("-createdAt");

    // Transformar los datos para el frontend
    const proceedingsFormateados = proceedings.map((proc) => {
      const procObj = proc.toObject();

      return {
        _id: procObj._id,
        tipoNombre: procObj.tipo?.nombre || procObj.tipoId || "Sin tipo",
        clienteNombre: procObj.cliente?.nombre || "Cliente no especificado",
        clienteEmail: procObj.cliente?.email,
        clienteRut: procObj.cliente?.rut,
        estado: procObj.estado,
        fecha: procObj.createdAt,
        tipoId: procObj.tipoId,
        datosFormulario: procObj.datosFormulario,
        documentos: procObj.documentos,
      };
    });

    res.json({
      success: true,
      count: proceedingsFormateados.length,
      data: proceedingsFormateados,
    });
  } catch (error) {
    console.error("Error en getPendingProceedings:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener trámites asignados al auxiliar actual
// @route   GET /api/auxiliar/tramites/asignados
const getAssignedProceedings = async (req, res) => {
  try {
    const proceedings = await Proceeding.find({
      asignadoA: req.user._id,
      estado: { $ne: "completado" },
    })
      .populate("cliente", "nombre email rut")
      .populate("tipo", "nombre tipoId")
      .sort("-updatedAt");

    const proceedingsFormateados = proceedings.map((proc) => {
      const procObj = proc.toObject();

      return {
        _id: procObj._id,
        tipoNombre: procObj.tipo?.nombre || procObj.tipoId || "Sin tipo",
        clienteNombre: procObj.cliente?.nombre || "Cliente no especificado",
        clienteEmail: procObj.cliente?.email,
        clienteRut: procObj.cliente?.rut,
        estado: procObj.estado,
        fecha: procObj.updatedAt,
        tipoId: procObj.tipoId,
        datosFormulario: procObj.datosFormulario,
        documentos: procObj.documentos,
      };
    });

    res.json({
      success: true,
      count: proceedingsFormateados.length,
      data: proceedingsFormateados,
    });
  } catch (error) {
    console.error("Error en getAssignedProceedings:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Asignar trámite a auxiliar o notario
// @route   PUT /api/auxiliar/tramites/:id/asignar
const assignProceeding = async (req, res) => {
  try {
    const { usuarioId, rol } = req.body;

    const proceeding = await Proceeding.findById(req.params.id);
    if (!proceeding) {
      return res.status(404).json({ message: "Trámite no encontrado" });
    }

    const usuario = await User.findById(usuarioId);
    if (!usuario || usuario.rol !== rol) {
      return res
        .status(400)
        .json({ message: `Usuario no válido o no es ${rol}` });
    }

    proceeding.asignadoA = usuarioId;
    proceeding.estado =
      rol === "auxiliar" ? "en_revision" : "esperando_firma_notario";

    proceeding.historial.push({
      accion: "TRÁMITE_ASIGNADO",
      usuario: req.user._id,
      detalles: `Asignado a ${usuario.nombre} (${usuario.rol})`,
    });

    await proceeding.save();

    res.json({
      success: true,
      data: proceeding,
      message: `Trámite asignado a ${usuario.nombre}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Revisar documentación del trámite
// @route   PUT /api/auxiliar/tramites/:id/revisar
const reviewProceeding = async (req, res) => {
  try {
    const { comentarios, aprobado } = req.body;

    const proceeding = await Proceeding.findById(req.params.id);
    if (!proceeding) {
      return res.status(404).json({ message: "Trámite no encontrado" });
    }

    if (aprobado) {
      proceeding.estado = "esperando_firma_cliente";
    } else {
      proceeding.estado = "pendiente";
    }

    proceeding.historial.push({
      accion: aprobado ? "DOCUMENTACIÓN_APROBADA" : "DOCUMENTACIÓN_RECHAZADA",
      usuario: req.user._id,
      detalles:
        comentarios ||
        (aprobado
          ? "Documentación aprobada"
          : "Documentación rechazada - requiere correcciones"),
    });

    await proceeding.save();

    res.json({
      success: true,
      data: proceeding,
      message: aprobado
        ? "Trámite aprobado, listo para firma del cliente"
        : "Trámite devuelto al cliente para correcciones",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Solicitar correcciones al cliente
// @route   POST /api/auxiliar/tramites/:id/solicitar-correcciones
const requestCorrections = async (req, res) => {
  try {
    const { correcciones } = req.body;

    const proceeding = await Proceeding.findById(req.params.id);
    if (!proceeding) {
      return res.status(404).json({ message: "Trámite no encontrado" });
    }

    proceeding.estado = "pendiente";

    proceeding.historial.push({
      accion: "CORRECCIONES_SOLICITADAS",
      usuario: req.user._id,
      detalles: `Correcciones solicitadas: ${correcciones}`,
    });

    await proceeding.save();

    res.json({
      success: true,
      data: proceeding,
      message: "Correcciones solicitadas al cliente",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProceedingById,
  getPendingProceedings,
  getAssignedProceedings,
  assignProceeding,
  reviewProceeding,
  requestCorrections,
};
