const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Conexión a MongoDB
const MONGODB_URI = 'mongodb+srv://enzoeara019_db_user:gOGxFMOFo7pwIUFd@chateous1919.6jcbhjn.mongodb.net/rugby-pef?retryWrites=true&w=majority&appName=Chateous1919';

// Schema actualizado con campo deporte
const usuarioSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true },
    tipo: { type: String, required: true, enum: ['user', 'admin'] },
    deporte: { type: String, required: true, enum: ['rugby', 'futbol', 'hockey', 'voley', 'basquet', 'handball', 'natacion', 'tenis', 'patin'] }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

const tablasSchema = new mongoose.Schema({
    generales: { type: Array, default: [] },
    individuales: { type: Object, default: {} }
}, { strict: false, minimize: false });

const Tablas = mongoose.model('Tablas', tablasSchema);

// Función principal de migración
async function migrar() {
    try {
        console.log('📄 Iniciando migración...');
        
        // Conectar a MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a MongoDB');        
        // ============================================
        // MIGRAR USUARIOS EXISTENTES
        // ============================================
        console.log('\n📋 Migrando usuarios existentes...');
        
        const usuariosPath = path.join(__dirname, 'usuarios.json');
        
        if (fs.existsSync(usuariosPath)) {
            const usuariosData = fs.readFileSync(usuariosPath, 'utf8');
            const usuarios = JSON.parse(usuariosData);
            
            console.log(`   Encontrados ${usuarios.length} usuarios en usuarios.json`);
            
            let usuariosAgregados = 0;
            let usuariosExistentes = 0;
            
            for (const usuario of usuarios) {
                try {
                    const existe = await Usuario.findOne({ nombre: usuario.nombre });
                    
                    if (!existe) {
                        // Si el usuario no tiene deporte, asignar rugby por defecto
                        if (!usuario.deporte) {
                            usuario.deporte = 'rugby';
                        }
                        
                        await Usuario.create(usuario);
                        console.log(`   ✅ Usuario agregado: ${usuario.nombre} (${usuario.tipo} - ${usuario.deporte})`);
                        usuariosAgregados++;
                    } else {
                        console.log(`   ⭐ Usuario ya existe: ${usuario.nombre}`);
                        usuariosExistentes++;
                    }
                } catch (error) {
                    console.error(`   ❌ Error con usuario ${usuario.nombre}:`, error.message);
                }
            }
            
            console.log(`\n   📊 Resumen usuarios:`);
            console.log(`      - Agregados: ${usuariosAgregados}`);
            console.log(`      - Ya existían: ${usuariosExistentes}`);
        } else {
            console.log('   ⚠️ Archivo usuarios.json no encontrado');
        }
        
        // ============================================
        // MIGRAR TABLAS
        // ============================================
        console.log('\n📋 Migrando tablas...');
        
        const tablasPath = path.join(__dirname, 'tablas.json');
        
        if (fs.existsSync(tablasPath)) {
            const tablasData = fs.readFileSync(tablasPath, 'utf8');
            const tablasJSON = JSON.parse(tablasData);
            
            console.log(`   Tablas generales encontradas: ${tablasJSON.generales?.length || 0}`);
            console.log(`   Usuarios con tablas individuales: ${Object.keys(tablasJSON.individuales || {}).length}`);
            
            let tablasDoc = await Tablas.findOne();
            
            if (tablasDoc) {
                console.log('   ⚠️ Ya existen tablas en MongoDB');
                console.log('   📄 Fusionando datos...');
                
                const generalesExistentes = tablasDoc.generales.length;
                
                for (const tabla of tablasJSON.generales || []) {
                    // Asignar deporte rugby por defecto si no tiene
                    if (!tabla.deporte) {
                        tabla.deporte = 'rugby';
                    }
                    
                    const existe = tablasDoc.generales.find(t => t.nombre === tabla.nombre && t.deporte === tabla.deporte);
                    if (!existe) {
                        tablasDoc.generales.push(tabla);
                    }
                }
                
                console.log(`   ✅ Tablas generales agregadas: ${tablasDoc.generales.length - generalesExistentes}`);
                
                let individualesAgregadas = 0;
                
                for (const usuario in tablasJSON.individuales || {}) {
                    if (!tablasDoc.individuales[usuario]) {
                        tablasDoc.individuales[usuario] = tablasJSON.individuales[usuario];
                        individualesAgregadas += tablasJSON.individuales[usuario].length;
                    } else {
                        for (const tabla of tablasJSON.individuales[usuario]) {
                            // Asignar deporte rugby por defecto si no tiene
                            if (!tabla.deporte) {
                                tabla.deporte = 'rugby';
                            }
                            
                            const existe = tablasDoc.individuales[usuario].find(t => t.nombre === tabla.nombre && t.deporte === tabla.deporte);
                            if (!existe) {
                                tablasDoc.individuales[usuario].push(tabla);
                                individualesAgregadas++;
                            }
                        }
                    }
                }
                
                console.log(`   ✅ Tablas individuales agregadas: ${individualesAgregadas}`);
                
                await tablasDoc.save();
            } else {
                console.log('   ✅ Creando nuevo documento de tablas');
                
                // Asignar deporte rugby por defecto a todas las tablas sin deporte
                if (tablasJSON.generales) {
                    tablasJSON.generales.forEach(tabla => {
                        if (!tabla.deporte) {
                            tabla.deporte = 'rugby';
                        }
                    });
                }
                
                if (tablasJSON.individuales) {
                    Object.keys(tablasJSON.individuales).forEach(usuario => {
                        tablasJSON.individuales[usuario].forEach(tabla => {
                            if (!tabla.deporte) {
                                tabla.deporte = 'rugby';
                            }
                        });
                    });
                }
                
                await Tablas.create(tablasJSON);
                console.log(`   ✅ ${tablasJSON.generales?.length || 0} tablas generales migradas`);
                console.log(`   ✅ ${Object.keys(tablasJSON.individuales || {}).length} usuarios con tablas individuales`);
            }
        } else {
            console.log('   ⚠️ Archivo tablas.json no encontrado');
        }
        
        // ============================================
        // VERIFICACIÓN FINAL
        // ============================================
        console.log('\n🔍 Verificación final:');
        
        const totalUsuarios = await Usuario.countDocuments();
        const tablasDoc = await Tablas.findOne();
        
        console.log(`   📊 Total usuarios en MongoDB: ${totalUsuarios}`);
        console.log(`   📊 Total tablas generales: ${tablasDoc?.generales?.length || 0}`);
        console.log(`   📊 Total usuarios con tablas individuales: ${Object.keys(tablasDoc?.individuales || {}).length}`);
        
        // Mostrar resumen por deporte
        console.log('\n📊 Resumen por deporte:');
        for (const deporte of deportes) {
            const usuariosDeporte = await Usuario.countDocuments({ deporte: deporte });
            const tablasDeporte = tablasDoc?.generales?.filter(t => t.deporte === deporte).length || 0;
            console.log(`   ${deporte}: ${usuariosDeporte} usuarios, ${tablasDeporte} tablas generales`);
        }
        
        console.log('\n✅ ¡MIGRACIÓN COMPLETADA CON ÉXITO!\n');
        
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexión cerrada');
        process.exit();
    }
}

migrar();