const Proceeding = require("../models/Proceeding");
const User = require("../models/User");
const crypto = require("crypto");

// @desc    Crear un nuevo trámite (cliente)
// @route   POST /api/client/tramites
const createProceeding = async (req, res) => {
  try {
    const { tipo, datosFormulario } = req.body;
    const clienteId = req.user._id;

    // Validar que el tipo de trámite sea válido
    const tiposValidos = [
      "poder_simple",
      "compraventa",
      "constitucion_sociedad",
      "mandato_judicial",
    ];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ message: "Tipo de trámite no válido" });
    }

    // Crear el trámite
    const proceeding = await Proceeding.create({
      tipo,
      cliente: clienteId,
      datosFormulario,
      estado: "borrador",
      historial: [
        {
          accion: "TRÁMITE_INICIADO",
          usuario: clienteId,
          detalles: `Cliente inició trámite de tipo: ${tipo}`,
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: proceeding,
      message: "Trámite creado exitosamente",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener trámites del cliente autenticado
// @route   GET /api/client/tramites
const getMyProceedings = async (req, res) => {
  try {
    const proceedings = await Proceeding.find({ cliente: req.user._id })
      .populate("asignadoA", "nombre email")
      .sort("-createdAt");

    res.json({
      success: true,
      count: proceedings.length,
      data: proceedings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener detalle de un trámite específico
// @route   GET /api/client/tramites/:id
const getProceedingById = async (req, res) => {
  try {
    const proceeding = await Proceeding.findById(req.params.id)
      .populate("cliente", "nombre email rut")
      .populate("asignadoA", "nombre email rol")
      .populate("historial.usuario", "nombre rol");

    if (!proceeding) {
      return res.status(404).json({ message: "Trámite no encontrado" });
    }

    // Verificar que el usuario sea el cliente del trámite o tenga rol de admin/notario/auxiliar
    if (
      proceeding.cliente._id.toString() !== req.user._id.toString() &&
      !["admin", "notario", "auxiliar"].includes(req.user.rol)
    ) {
      return res
        .status(403)
        .json({ message: "No autorizado para ver este trámite" });
    }

    res.json({
      success: true,
      data: proceeding,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Actualizar un trámite (cliente o auxiliar)
// @route   PUT /api/client/tramites/:id
const updateProceeding = async (req, res) => {
  try {
    const proceeding = await Proceeding.findById(req.params.id);

    if (!proceeding) {
      return res.status(404).json({ message: "Trámite no encontrado" });
    }

    // Verificar permisos según el rol y estado del trámite
    const esCliente = proceeding.cliente.toString() === req.user._id.toString();
    const esAuxiliarONotario = ["auxiliar", "notario", "admin"].includes(
      req.user.rol,
    );

    // Solo el cliente en estado borrador o auxiliares pueden actualizar
    if (esCliente && proceeding.estado === "borrador") {
      // Cliente puede actualizar datos del formulario
      proceeding.datosFormulario = {
        ...proceeding.datosFormulario,
        ...req.body.datosFormulario,
      };
    } else if (esAuxiliarONotario) {
      // Auxiliar/Notario pueden actualizar más campos
      if (req.body.estado) proceeding.estado = req.body.estado;
      if (req.body.asignadoA) proceeding.asignadoA = req.body.asignadoA;
      if (req.body.datosFormulario) {
        proceeding.datosFormulario = {
          ...proceeding.datosFormulario,
          ...req.body.datosFormulario,
        };
      }
    } else {
      return res
        .status(403)
        .json({ message: "No autorizado para actualizar este trámite" });
    }

    // Agregar al historial
    proceeding.historial.push({
      accion: "TRÁMITE_ACTUALIZADO",
      usuario: req.user._id,
      detalles: `Actualización realizada por ${req.user.rol}: ${JSON.stringify(req.body)}`,
    });

    await proceeding.save();

    res.json({
      success: true,
      data: proceeding,
      message: "Trámite actualizado exitosamente",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Subir documento a un trámite
// @route   POST /api/client/tramites/:id/documentos
const uploadDocument = async (req, res) => {
  try {
    const proceeding = await Proceeding.findById(req.params.id);

    if (!proceeding) {
      return res.status(404).json({ message: "Trámite no encontrado" });
    }

    // Aquí iría la lógica para subir el archivo a un servicio como S3, Cloudinary, etc.
    // Por ahora simulamos la subida
    const { nombre, tipo, url } = req.body;

    proceeding.documentos.push({
      nombre,
      url,
      tipo,
      fechaSubida: new Date(),
    });

    proceeding.historial.push({
      accion: "DOCUMENTO_SUBIDO",
      usuario: req.user._id,
      detalles: `Documento subido: ${nombre}`,
    });

    await proceeding.save();

    res.json({
      success: true,
      data: proceeding.documentos,
      message: "Documento subido exitosamente",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generar hash del documento para integridad
// @route   POST /api/tramites/:id/generar-hash
const generateDocumentHash = async (req, res) => {
  try {
    const proceeding = await Proceeding.findById(req.params.id);

    if (!proceeding) {
      return res.status(404).json({ message: "Trámite no encontrado" });
    }

    // Simular la generación de un hash SHA-256 del documento final
    // En un caso real, esto tomaría el contenido del PDF y generaría el hash
    const documentoContent = JSON.stringify({
      id: proceeding._id,
      tipo: proceeding.tipo,
      datos: proceeding.datosFormulario,
      documentos: proceeding.documentos,
      timestamp: new Date().toISOString(),
    });

    const hash = crypto
      .createHash("sha256")
      .update(documentoContent)
      .digest("hex");

    proceeding.hashDocumentoFinal = hash;

    proceeding.historial.push({
      accion: "HASH_GENERADO",
      usuario: req.user._id,
      detalles: `Hash SHA-256 generado: ${hash.substring(0, 10)}...`,
    });

    await proceeding.save();

    res.json({
      success: true,
      data: { hash },
      message: "Hash generado exitosamente",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verificar integridad del documento
// @route   POST /api/tramites/:id/verificar-integridad
const verifyDocumentIntegrity = async (req, res) => {
  try {
    const proceeding = await Proceeding.findById(req.params.id);

    if (!proceeding) {
      return res.status(404).json({ message: "Trámite no encontrado" });
    }

    // Regenerar el hash para comparar
    const documentoContent = JSON.stringify({
      id: proceeding._id,
      tipo: proceeding.tipo,
      datos: proceeding.datosFormulario,
      documentos: proceeding.documentos,
      timestamp: new Date().toISOString(),
    });

    const currentHash = crypto
      .createHash("sha256")
      .update(documentoContent)
      .digest("hex");
    const isIntegro = currentHash === proceeding.hashDocumentoFinal;

    res.json({
      success: true,
      data: {
        isIntegro,
        hashActual: currentHash,
        hashOriginal: proceeding.hashDocumentoFinal,
        fechaGeneracion: proceeding.updatedAt,
      },
      message: isIntegro
        ? "Documento íntegro - No ha sido modificado"
        : "Documento modificado - La integridad está comprometida",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProceeding,
  getMyProceedings,
  getProceedingById,
  updateProceeding,
  uploadDocument,
  generateDocumentHash,
  verifyDocumentIntegrity,
};
