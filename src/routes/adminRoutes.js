const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const User = require("../models/User");
const Proceeding = require("../models/Proceeding");
const router = express.Router();

// Todas las rutas requieren autenticación y rol de admin
router.use(protect);
router.use(authorize("admin"));

// ==============================================
// GESTIÓN DE USUARIOS
// ==============================================

// @desc    Obtener todos los usuarios
// @route   GET /api/admin/usuarios
router.get("/usuarios", async (req, res) => {
  try {
    const usuarios = await User.find().select("-password").sort("-createdAt");
    res.json({
      success: true,
      count: usuarios.length,
      data: usuarios,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Obtener un usuario por ID
// @route   GET /api/admin/usuarios/:id
router.get("/usuarios/:id", async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id).select("-password");
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Crear un nuevo usuario (admin, notario, auxiliar)
// @route   POST /api/admin/usuarios
router.post("/usuarios", async (req, res) => {
  try {
    const { nombre, email, rut, password, rol, telefono, direccion } = req.body;

    // Validar que el rol sea válido
    const rolesValidos = ["cliente", "auxiliar", "notario", "admin"];
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({ message: "Rol no válido" });
    }

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ $or: [{ email }, { rut }] });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "El usuario ya existe (email o RUT)" });
    }

    const usuario = await User.create({
      nombre,
      email,
      rut,
      password,
      rol,
      telefono,
      direccion,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rut: usuario.rut,
        rol: usuario.rol,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
      },
      message: "Usuario creado exitosamente",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Actualizar un usuario
// @route   PUT /api/admin/usuarios/:id
router.put("/usuarios/:id", async (req, res) => {
  try {
    const { nombre, email, rut, rol, telefono, direccion } = req.body;

    const usuario = await User.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Actualizar campos
    if (nombre) usuario.nombre = nombre;
    if (email) usuario.email = email;
    if (rut) usuario.rut = rut;
    if (rol) {
      const rolesValidos = ["cliente", "auxiliar", "notario", "admin"];
      if (!rolesValidos.includes(rol)) {
        return res.status(400).json({ message: "Rol no válido" });
      }
      usuario.rol = rol;
    }
    if (telefono) usuario.telefono = telefono;
    if (direccion) usuario.direccion = direccion;

    await usuario.save();

    res.json({
      success: true,
      data: {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rut: usuario.rut,
        rol: usuario.rol,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
      },
      message: "Usuario actualizado exitosamente",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Eliminar un usuario
// @route   DELETE /api/admin/usuarios/:id
router.delete("/usuarios/:id", async (req, res) => {
  try {
    const usuario = await User.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // No permitir eliminar el propio admin
    if (usuario._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "No puedes eliminar tu propia cuenta" });
    }

    await usuario.deleteOne();

    res.json({
      success: true,
      message: "Usuario eliminado exitosamente",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==============================================
// GESTIÓN DE TRÁMITES
// ==============================================

// @desc    Obtener todos los trámites
// @route   GET /api/admin/tramites
router.get("/tramites", async (req, res) => {
  try {
    const { estado, tipo, desde, hasta } = req.query;

    // Construir filtros
    let filtro = {};
    if (estado) filtro.estado = estado;
    if (tipo) filtro.tipo = tipo;
    if (desde || hasta) {
      filtro.createdAt = {};
      if (desde) filtro.createdAt.$gte = new Date(desde);
      if (hasta) filtro.createdAt.$lte = new Date(hasta);
    }

    const tramites = await Proceeding.find(filtro)
      .populate("cliente", "nombre email rut")
      .populate("asignadoA", "nombre email rol")
      .sort("-createdAt");

    res.json({
      success: true,
      count: tramites.length,
      data: tramites,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Obtener estadísticas del sistema
// @route   GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const [
      totalUsuarios,
      usuariosPorRol,
      totalTramites,
      tramitesPorEstado,
      tramitesCompletadosHoy,
      tramitesPendientes,
    ] = await Promise.all([
      // Total de usuarios
      User.countDocuments(),

      // Usuarios por rol
      User.aggregate([{ $group: { _id: "$rol", count: { $sum: 1 } } }]),

      // Total de trámites
      Proceeding.countDocuments(),

      // Trámites por estado
      Proceeding.aggregate([
        { $group: { _id: "$estado", count: { $sum: 1 } } },
      ]),

      // Trámites completados hoy
      Proceeding.countDocuments({
        estado: "completado",
        fechaFirmaNotario: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lt: new Date().setHours(23, 59, 59, 999),
        },
      }),

      // Trámites pendientes
      Proceeding.countDocuments({
        estado: {
          $in: [
            "borrador",
            "pendiente_revision_auxiliar",
            "en_revision",
            "esperando_firma_cliente",
            "esperando_firma_notario",
          ],
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        usuarios: {
          total: totalUsuarios,
          porRol: usuariosPorRol.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
        },
        tramites: {
          total: totalTramites,
          porEstado: tramitesPorEstado.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          completadosHoy: tramitesCompletadosHoy,
          pendientes: tramitesPendientes,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==============================================
// CONFIGURACIÓN DEL SISTEMA
// ==============================================

// @desc    Obtener tipos de trámite disponibles
// @route   GET /api/admin/config/tipos-tramite
router.get("/config/tipos-tramite", (req, res) => {
  const tiposTramite = [
    {
      id: "poder_simple",
      nombre: "Poder Simple",
      descripcion: "Otorgamiento de poder general o especial",
      campos: ["poderdante", "apoderado", "facultades"],
    },
    {
      id: "compraventa",
      nombre: "Compraventa",
      descripcion: "Contrato de compraventa de bienes",
      campos: ["vendedor", "comprador", "inmueble", "precio"],
    },
    {
      id: "constitucion_sociedad",
      nombre: "Constitución de Sociedad",
      descripcion: "Creación de sociedad comercial",
      campos: ["socios", "razon_social", "capital", "administracion"],
    },
    {
      id: "mandato_judicial",
      nombre: "Mandato Judicial",
      descripcion: "Poder para representación en juicios",
      campos: ["mandante", "mandatario", "tribunales", "causa"],
    },
  ];

  res.json({
    success: true,
    data: tiposTramite,
  });
});

// @desc    Actualizar configuración de tipos de trámite
// @route   PUT /api/admin/config/tipos-tramite/:tipoId
router.put("/config/tipos-tramite/:tipoId", (req, res) => {
  // Esta ruta podría actualizar la configuración en la base de datos
  // Por ahora solo simulamos la respuesta
  res.json({
    success: true,
    message: "Configuración actualizada (simulada)",
    data: {
      tipoId: req.params.tipoId,
      ...req.body,
    },
  });
});

// @desc    Obtener logs del sistema
// @route   GET /api/admin/logs
router.get("/logs", (req, res) => {
  // Aquí iría la lógica para obtener logs de MongoDB o de un servicio externo
  res.json({
    success: true,
    message: "Funcionalidad de logs en desarrollo",
    data: [],
  });
});

module.exports = router;
