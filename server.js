// Servidor Node.js con MongoDB para gestionar usuarios y tablas
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://enzoeara019_db_user:gOGxFMOFo7pwIUFd@chateous1919.6jcbhjn.mongodb.net/rugby-pef?retryWrites=true&w=majority&appName=Chateous1919';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(err => console.error('❌ Error conectando a MongoDB:', err));

// ============================================
// MODELOS DE MONGOOSE
// ============================================

// Modelo de Usuario
const usuarioSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true },
    tipo: { type: String, required: true, enum: ['user', 'admin'] }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

// Modelo de Tablas
const tablasSchema = new mongoose.Schema({
    generales: { type: Array, default: [] },
    individuales: { type: Object, default: {} }
}, { 
    strict: false,
    minimize: false 
});

const Tablas = mongoose.model('Tablas', tablasSchema);

// ============================================
// INICIALIZACIÓN - Crear datos por defecto
// ============================================

async function inicializarDatos() {
    try {
        // Verificar si ya existe el admin
        const adminExiste = await Usuario.findOne({ nombre: 'Admin' });
        if (!adminExiste) {
            await Usuario.create({ nombre: 'Admin', tipo: 'admin' });
            console.log('✅ Usuario Admin creado');
        }

        // Verificar si ya existe el documento de tablas
        const tablasExisten = await Tablas.findOne();
        if (!tablasExisten) {
            await Tablas.create({ generales: [], individuales: {} });
            console.log('✅ Documento de tablas creado');
        }
    } catch (error) {
        console.error('Error inicializando datos:', error);
    }
}

// Llamar a inicialización
inicializarDatos();

// ============================================
// ENDPOINTS PARA USUARIOS
// ============================================

// GET - Obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
    try {
        const usuarios = await Usuario.find();
        res.json(usuarios);
    } catch (error) {
        console.error('Error al leer usuarios:', error);
        res.status(500).json({ error: 'Error al leer usuarios' });
    }
});

// POST - Agregar un nuevo usuario
app.post('/api/usuarios', async (req, res) => {
    try {
        const nuevoUsuario = req.body;
        
        // Verificar si el usuario ya existe
        const existe = await Usuario.findOne({ 
            nombre: { $regex: new RegExp(`^${nuevoUsuario.nombre}$`, 'i') }
        });
        
        if (existe) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }
        
        const usuario = await Usuario.create(nuevoUsuario);
        res.json({ mensaje: 'Usuario agregado correctamente', usuario });
    } catch (error) {
        console.error('Error al agregar usuario:', error);
        res.status(500).json({ error: 'Error al agregar usuario' });
    }
});

// ============================================
// ENDPOINTS PARA TABLAS
// ============================================

// GET - Obtener todas las tablas
app.get('/api/tablas', async (req, res) => {
    try {
        let tablas = await Tablas.findOne();
        
        if (!tablas) {
            // Si no existe, crear uno nuevo
            tablas = await Tablas.create({ generales: [], individuales: {} });
        }
        
        res.json(tablas);
    } catch (error) {
        console.error('Error al leer tablas:', error);
        res.status(500).json({ error: 'Error al leer tablas' });
    }
});

// POST - Guardar/actualizar todas las tablas
app.post('/api/tablas', async (req, res) => {
    try {
        const nuevasTablas = req.body;
        
        // Buscar el documento existente
        let tablas = await Tablas.findOne();
        
        if (tablas) {
            // Actualizar existente
            tablas.generales = nuevasTablas.generales;
            tablas.individuales = nuevasTablas.individuales;
            await tablas.save();
        } else {
            // Crear nuevo
            tablas = await Tablas.create(nuevasTablas);
        }
        
        res.json({ mensaje: 'Tablas guardadas correctamente' });
    } catch (error) {
        console.error('Error al guardar tablas:', error);
        res.status(500).json({ error: 'Error al guardar tablas' });
    }
});

// PUT - Actualizar tablas
app.put('/api/tablas', async (req, res) => {
    try {
        const nuevasTablas = req.body;
        
        let tablas = await Tablas.findOne();
        
        if (tablas) {
            tablas.generales = nuevasTablas.generales;
            tablas.individuales = nuevasTablas.individuales;
            await tablas.save();
        } else {
            tablas = await Tablas.create(nuevasTablas);
        }
        
        res.json({ mensaje: 'Tablas actualizadas correctamente' });
    } catch (error) {
        console.error('Error al actualizar tablas:', error);
        res.status(500).json({ error: 'Error al actualizar tablas' });
    }
});

// DELETE - Eliminar una tabla específica
app.delete('/api/tablas/:tipo/:index', async (req, res) => {
    try {
        const { tipo, index } = req.params;
        const tablas = await Tablas.findOne();
        
        if (!tablas) {
            return res.status(404).json({ error: 'No se encontraron tablas' });
        }
        
        if (tipo === 'general') {
            tablas.generales.splice(parseInt(index), 1);
        } else {
            const usuario = tipo.replace('individual-', '');
            if (tablas.individuales[usuario]) {
                tablas.individuales[usuario].splice(parseInt(index), 1);
                if (tablas.individuales[usuario].length === 0) {
                    delete tablas.individuales[usuario];
                }
            }
        }
        
        await tablas.save();
        res.json({ mensaje: 'Tabla eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar tabla:', error);
        res.status(500).json({ error: 'Error al eliminar tabla' });
    }
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (error) => {
    console.error('Error no manejado:', error);
});