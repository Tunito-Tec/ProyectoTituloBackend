const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { jwtSecret, jwtExpire } = require("../config/environment");

const generarToken = (id) => {
  return jwt.sign({ id }, jwtSecret, { expiresIn: jwtExpire });
};

// @desc    Registrar un nuevo usuario
const registerUser = async (req, res) => {
  console.log("📝 Intento de registro:", req.body);

  try {
    const { nombre, email, rut, password } = req.body;

    // Validaciones básicas
    if (!nombre || !email || !rut || !password) {
      return res
        .status(400)
        .json({ message: "Todos los campos son obligatorios" });
    }

    // Limpiar RUT (eliminar puntos y guiones)
    const rutLimpio = rut.replace(/[.-]/g, "").toUpperCase();

    // Validar email
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Formato de email no válido" });
    }

    // Validar contraseña
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "La contraseña debe tener al menos 6 caracteres" });
    }

    // Validar formato de RUT
    const rutRegex = /^[0-9]{7,8}[0-9kK]{1}$/;
    if (!rutRegex.test(rutLimpio)) {
      return res
        .status(400)
        .json({ message: "Formato de RUT no válido (ej: 20407752-5)" });
    }

    // Verificar si el usuario existe
    const userExists = await User.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { rut: rutLimpio }],
    });

    if (userExists) {
      return res
        .status(400)
        .json({ message: "El email o RUT ya está registrado" });
    }

    // HASHEAR CONTRASEÑA AQUÍ (importante)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario con contraseña hasheada
    const user = await User.create({
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      rut: rutLimpio,
      password: hashedPassword, // ← Guardamos la contraseña YA HASHEADA
      rol: "cliente",
    });

    console.log("✅ Usuario creado exitosamente:", user._id);

    res.status(201).json({
      _id: user._id,
      nombre: user.nombre,
      email: user.email,
      rut: user.rut,
      rol: user.rol,
      token: generarToken(user._id),
    });
  } catch (error) {
    console.error("❌ Error en registro:", error);

    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "El email o RUT ya está registrado" });
    }

    res.status(500).json({ message: "Error al registrar usuario" });
  }
};

// @desc    Autenticar usuario (login)
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email y contraseña son requeridos" });
    }

    console.log("🔍 Buscando usuario:", email);

    // Buscar usuario incluyendo el password
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user) {
      console.log("❌ Usuario no encontrado");
      return res.status(401).json({ message: "Email o contraseña no válidos" });
    }

    console.log("✅ Usuario encontrado, comparando contraseñas...");

    // Comparar contraseña usando bcrypt DIRECTAMENTE
    const isMatch = await bcrypt.compare(password, user.password);

    console.log("🔐 Resultado de comparación:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: "Email o contraseña no válidos" });
    }

    console.log("✅ Login exitoso para:", user.email);

    res.json({
      _id: user._id,
      nombre: user.nombre,
      email: user.email,
      rut: user.rut,
      rol: user.rol,
      token: generarToken(user._id),
    });
  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({ message: "Error al iniciar sesión" });
  }
};

// @desc    Obtener perfil del usuario autenticado
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json(user);
  } catch (error) {
    console.error("❌ Error en perfil:", error);
    res.status(500).json({ message: "Error al obtener perfil" });
  }
};

module.exports = { registerUser, loginUser, getProfile };
