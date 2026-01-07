// Variables globales
let usuarioActual = null;
let tablaActual = null;

// URL del servidor backend
const API_URL = 'http://localhost:3000/api';

// Verificar autenticación al cargar la página
window.addEventListener('DOMContentLoaded', function() {
    verificarSesion();
    cargarSelectorTablas();
});

// Verificar si el usuario tiene sesión activa
function verificarSesion() {
    const sesion = localStorage.getItem('usuarioActual');
    
    if (!sesion) {
        // No hay sesión, redirigir al login
        window.location.href = 'index.html';
        return;
    }
    
    usuarioActual = JSON.parse(sesion);
    
    // Verificar que sea un usuario normal (no admin)
    if (usuarioActual.tipo === 'admin') {
        window.location.href = 'admin.html';
        return;
    }
    
    // Mostrar nombre del usuario
    document.getElementById('nombreUsuario').textContent = usuarioActual.nombre;
}

// Cargar las tablas disponibles en el selector
async function cargarSelectorTablas() {
    const selector = document.getElementById('selectorTabla');
    const tablas = await cargarTablas();
    
    // Limpiar opciones existentes excepto la primera
    selector.innerHTML = '<option value="">-- Seleccione una tabla --</option>';
    
    // Agregar tablas generales
    if (tablas.generales && tablas.generales.length > 0) {
        const optgroupGeneral = document.createElement('optgroup');
        optgroupGeneral.label = 'Tablas Generales';
        
        tablas.generales.forEach((tabla, index) => {
            const option = document.createElement('option');
            option.value = `general-${index}`;
            option.textContent = tabla.nombre;
            optgroupGeneral.appendChild(option);
        });
        
        selector.appendChild(optgroupGeneral);
    }
    
    // Agregar tabla individual si existe para este usuario
    if (tablas.individuales && tablas.individuales[usuarioActual.nombre]) {
        const tablasUsuario = tablas.individuales[usuarioActual.nombre];
        
        if (tablasUsuario.length > 0) {
            const optgroupIndividual = document.createElement('optgroup');
            optgroupIndividual.label = 'Mi Tabla Individual';
            
            tablasUsuario.forEach((tabla, index) => {
                const option = document.createElement('option');
                option.value = `individual-${index}`;
                option.textContent = tabla.nombre;
                optgroupIndividual.appendChild(option);
            });
            
            selector.appendChild(optgroupIndividual);
        }
    }
}

// Cargar tablas desde el servidor
async function cargarTablas() {
    try {
        const response = await fetch(`${API_URL}/tablas`);
        if (!response.ok) {
            throw new Error('No se pudieron cargar las tablas');
        }
        const tablas = await response.json();
        return tablas;
    } catch (error) {
        console.error('Error al cargar tablas:', error);
        alert('Error al cargar las tablas del servidor');
        return { generales: [], individuales: {} };
    }
}

// Cargar y mostrar la tabla seleccionada
async function cargarTablaSeleccionada() {
    const selector = document.getElementById('selectorTabla');
    const valorSeleccionado = selector.value;
    
    if (!valorSeleccionado) {
        // No hay selección, ocultar tabla
        document.getElementById('tablaContainer').style.display = 'none';
        document.getElementById('noTabla').style.display = 'block';
        return;
    }
    
    // Parsear el valor seleccionado
    const [tipo, index] = valorSeleccionado.split('-');
    const tablas = await cargarTablas();
    
    // Obtener la tabla correspondiente
    if (tipo === 'general') {
        tablaActual = tablas.generales[parseInt(index)];
    } else {
        tablaActual = tablas.individuales[usuarioActual.nombre][parseInt(index)];
    }
    
    // Mostrar la tabla
    mostrarTabla(tablaActual);
}

// Mostrar la tabla en el DOM
function mostrarTabla(tabla) {
    document.getElementById('tituloTabla').textContent = tabla.nombre;
    const contenedor = document.getElementById('contenidoTabla');
    contenedor.innerHTML = '';
    
    // Recorrer cada lista de la tabla
    tabla.listas.forEach(lista => {
        const listaDiv = document.createElement('div');
        listaDiv.className = 'lista';
        
        // Título de la lista
        const titulo = document.createElement('div');
        titulo.className = 'lista-titulo';
        titulo.textContent = lista.titulo;
        listaDiv.appendChild(titulo);
        
        // Crear tabla HTML
        const table = document.createElement('table');
        
        // Encabezado
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const thEjercicio = document.createElement('th');
        thEjercicio.textContent = 'Ejercicio';
        headerRow.appendChild(thEjercicio);
        
        for (let i = 1; i <= 6; i++) {
            const th = document.createElement('th');
            th.textContent = `Semana ${i}`;
            headerRow.appendChild(th);
        }
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Cuerpo de la tabla
        const tbody = document.createElement('tbody');
        
        lista.ejercicios.forEach(ejercicio => {
            const row = document.createElement('tr');
            
            // Columna del nombre del ejercicio
            const tdNombre = document.createElement('td');
            tdNombre.className = 'ejercicio-nombre';
            tdNombre.textContent = ejercicio.nombre;
            row.appendChild(tdNombre);
            
            // Columnas de las 6 semanas
            for (let i = 1; i <= 6; i++) {
                const td = document.createElement('td');
                const semanaKey = `semana${i}`;
                const datos = ejercicio[semanaKey];
                
                td.className = 'datos-semana';
                td.innerHTML = `
                    <strong>Series:</strong> ${datos.series}<br>
                    <strong>Reps:</strong> ${datos.repeticiones}<br>
                    <strong>Peso:</strong> ${datos.peso} kg
                `;
                row.appendChild(td);
            }
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        listaDiv.appendChild(table);
        contenedor.appendChild(listaDiv);
    });
    
    // Mostrar contenedor y ocultar mensaje
    document.getElementById('tablaContainer').style.display = 'block';
    document.getElementById('noTabla').style.display = 'none';
}

// Descargar tabla como PDF (usando window.print)
function descargarPDF() {
    if (!tablaActual) {
        alert('No hay tabla seleccionada');
        return;
    }
    
    // Usar la funcionalidad de impresión del navegador
    window.print();
}

// Cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('usuarioActual');
    window.location.href = 'index.html';
}