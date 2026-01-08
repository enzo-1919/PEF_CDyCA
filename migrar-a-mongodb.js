const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
// Conexión a MongoDB (la misma que en server.js)
const MONGODB_URI = 'mongodb+srv://enzoeara019_db_user:gOGxFMOFo7pwIUFd@chateous1919.6jcbhjn.mongodb.net/rugby-pef?retryWrites=true&w=majority&appName=Chateous1919';
// Modelos (los mismos que en server.js)
const usuarioSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true },
    tipo: { type: String, required: true, enum: ['user', 'admin'] }});
const Usuario = mongoose.model('Usuario', usuarioSchema);
const tablasSchema = new mongoose.Schema({
    generales: { type: Array, default: [] },
    individuales: { type: Object, default: {} }
}, { strict: false,minimize: false });
const Tablas = mongoose.model('Tablas', tablasSchema);
// Función principal de migración
async function migrar() {
    try {
        console.log('🔄 Iniciando migración...');        
        // Conectar a MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a MongoDB');
        // ============================================
        // MIGRAR USUARIOS
        // ============================================
        console.log('\n📋 Migrando usuarios...');        
        // Leer usuarios.json
        const usuariosPath = path.join(__dirname, 'usuarios.json');        
        if (fs.existsSync(usuariosPath)) {
            const usuariosData = fs.readFileSync(usuariosPath, 'utf8');
            const usuarios = JSON.parse(usuariosData);            
            console.log(` Encontrados ${usuarios.length} usuarios en usuarios.json`);            
            // Insertar cada usuario (ignorar duplicados)
            let usuariosAgregados = 0;
            let usuariosExistentes = 0;            
            for (const usuario of usuarios) {
                try {
                    const existe = await Usuario.findOne({ nombre: usuario.nombre });
                    if (!existe) {
                        await Usuario.create(usuario);console.log(`   ✅ Usuario agregado: ${usuario.nombre} (${usuario.tipo})`);
                        usuariosAgregados++;
                    } else {
                        console.log(`   ⏭️  Usuario ya existe: ${usuario.nombre}`);
                        usuariosExistentes++;}
                } catch (error) {console.error(`   ❌ Error con usuario ${usuario.nombre}:`, error.message);}}
            console.log(`\n   📊 Resumen usuarios:`);
            console.log(`      - Agregados: ${usuariosAgregados}`);
            console.log(`      - Ya existían: ${usuariosExistentes}`);
        } else {console.log('   ⚠️  Archivo usuarios.json no encontrado');}
        // ============================================
        // MIGRAR TABLAS
        // ============================================
        console.log('\n📋 Migrando tablas...');
        // Leer tablas.json
        const tablasPath = path.join(__dirname, 'tablas.json');
        if (fs.existsSync(tablasPath)) {
            const tablasData = fs.readFileSync(tablasPath, 'utf8');
            const tablasJSON = JSON.parse(tablasData);
            console.log(`   Tablas generales encontradas: ${tablasJSON.generales?.length || 0}`);
            console.log(`   Usuarios con tablas individuales: ${Object.keys(tablasJSON.individuales || {}).length}`);
            // Buscar si ya existe un documento de tablas
            let tablasDoc = await Tablas.findOne();
            if (tablasDoc) {
                console.log('   ⚠️  Ya existen tablas en MongoDB');
                console.log('   🔄 Fusionando datos...');
                // Fusionar tablas generales (agregar solo las que no existen)
                const generalesExistentes = tablasDoc.generales.length;
                for (const tabla of tablasJSON.generales || []) {
                    const existe = tablasDoc.generales.find(t => t.nombre === tabla.nombre);
                    if (!existe) {tablasDoc.generales.push(tabla);}}
                console.log(`   ✅ Tablas generales agregadas: ${tablasDoc.generales.length - generalesExistentes}`);
                // Fusionar tablas individuales
                let individualesAgregadas = 0;
                for (const usuario in tablasJSON.individuales || {}) {
                    if (!tablasDoc.individuales[usuario]) {
                        tablasDoc.individuales[usuario] = tablasJSON.individuales[usuario];
                        individualesAgregadas += tablasJSON.individuales[usuario].length;
                    } else {
                        for (const tabla of tablasJSON.individuales[usuario]) {
                            const existe = tablasDoc.individuales[usuario].find(t => t.nombre === tabla.nombre);
                            if (!existe) {
                                tablasDoc.individuales[usuario].push(tabla);
                                individualesAgregadas++;}}}}
                console.log(`   ✅ Tablas individuales agregadas: ${individualesAgregadas}`);
                await tablasDoc.save();
            } else {
                console.log('   ✅ Creando nuevo documento de tablas');
                await Tablas.create(tablasJSON);
                console.log(`   ✅ ${tablasJSON.generales?.length || 0} tablas generales migradas`);
                console.log(`   ✅ ${Object.keys(tablasJSON.individuales || {}).length} usuarios con tablas individuales`);
            }
        } else {console.log('   ⚠️  Archivo tablas.json no encontrado');}
        // ============================================
        // VERIFICACIÓN FINAL
        // ============================================
        console.log('\n🔍 Verificación final:');
        const totalUsuarios = await Usuario.countDocuments();
        const tablasDoc = await Tablas.findOne();
        console.log(`   📊 Total usuarios en MongoDB: ${totalUsuarios}`);
        console.log(`   📊 Total tablas generales: ${tablasDoc?.generales?.length || 0}`);
        console.log(`   📊 Total usuarios con tablas individuales: ${Object.keys(tablasDoc?.individuales || {}).length}`);
        console.log('\n✅ ¡MIGRACIÓN COMPLETADA CON ÉXITO!\n');
    } catch (error) {console.error('❌ Error durante la migración:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexión cerrada');
        process.exit();}}
migrar();