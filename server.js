// Servidor Node.js para gestionar usuarios y tablas

const PORT = process.env.PORT || 3000;
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors()); // Permitir peticiones desde cualquier origen
app.use(express.json()); // Para parsear JSON en las peticiones
app.use(express.static('public')); // Servir archivos estáticos desde carpeta public

// Rutas de los archivos JSON
const USUARIOS_FILE = path.join(__dirname, 'usuarios.json');
const TABLAS_FILE = path.join(__dirname, 'tablas.json');

// ============================================
// ENDPOINTS PARA USUARIOS
// ============================================

// GET - Obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
    try {
        const data = await fs.readFile(USUARIOS_FILE, 'utf8');
        const usuarios = JSON.parse(data);
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
        const data = await fs.readFile(USUARIOS_FILE, 'utf8');
        const usuarios = JSON.parse(data);
        
        // Verificar si el usuario ya existe
        const existe = usuarios.find(u => u.nombre.toLowerCase() === nuevoUsuario.nombre.toLowerCase());
        if (existe) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }
        
        usuarios.push(nuevoUsuario);
        await fs.writeFile(USUARIOS_FILE, JSON.stringify(usuarios, null, 2));
        res.json({ mensaje: 'Usuario agregado correctamente', usuario: nuevoUsuario });
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
        const data = await fs.readFile(TABLAS_FILE, 'utf8');
        const tablas = JSON.parse(data);
        res.json(tablas);
    } catch (error) {
        console.error('Error al leer tablas:', error);
        res.status(500).json({ error: 'Error al leer tablas' });
    }
});

// POST - Guardar todas las tablas (reemplaza todo)
app.post('/api/tablas', async (req, res) => {
    try {
        const tablas = req.body;
        await fs.writeFile(TABLAS_FILE, JSON.stringify(tablas, null, 2));
        res.json({ mensaje: 'Tablas guardadas correctamente' });
    } catch (error) {
        console.error('Error al guardar tablas:', error);
        res.status(500).json({ error: 'Error al guardar tablas' });
    }
});

// PUT - Actualizar tablas (merge)
app.put('/api/tablas', async (req, res) => {
    try {
        const nuevasTablas = req.body;
        await fs.writeFile(TABLAS_FILE, JSON.stringify(nuevasTablas, null, 2));
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
        const data = await fs.readFile(TABLAS_FILE, 'utf8');
        const tablas = JSON.parse(data);
        
        if (tipo === 'general') {
            tablas.generales.splice(parseInt(index), 1);
        } else {
            // tipo es "individual-{usuario}"
            const usuario = tipo.replace('individual-', '');
            if (tablas.individuales[usuario]) {
                tablas.individuales[usuario].splice(parseInt(index), 1);
                // Si ya no tiene tablas, eliminar el usuario del objeto
                if (tablas.individuales[usuario].length === 0) {
                    delete tablas.individuales[usuario];
                }
            }
        }
        
        await fs.writeFile(TABLAS_FILE, JSON.stringify(tablas, null, 2));
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
    console.log(`📁 Archivos JSON en: ${__dirname}`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (error) => {
    console.error('Error no manejado:', error);
});