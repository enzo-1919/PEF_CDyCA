let usuarioActual = null;
let tablaActual = null;
const API_URL = 'https://pef-2pzu.onrender.com/api';
const deporteConfig = {
    rugby: { nombre: 'Rugby', color: '#2d8b2d', oscuro: '#1a5f1a' },
    futbol: { nombre: 'Fútbol', color: '#1d0adb', oscuro: '#0d47a1' },
    hockey: { nombre: 'Hockey', color: '#e91e63', oscuro: '#880e4f' },
    voley: { nombre: 'Voley', color: '#dc1c1c', oscuro: '#51414f' },
    basquet: { nombre: 'Basquet', color: '#ff6f00', oscuro: '#e65100' },
    handball: { nombre: 'Handball', color: '#00897b', oscuro: '#004d40' },
    natacion: { nombre: 'Natación', color: '#06adce', oscuro: '#01579b' },
    tenis: { nombre: 'Tenis', color: '#ecf405', oscuro: '#ecf405' },
    patin: { nombre: 'Patín', color: '#6a1b9a', oscuro: '#4a148c' }};
window.addEventListener('DOMContentLoaded', function() {
    verificarSesion();
    aplicarColoresDeporte();
    cargarSelectorTablas();});
function verificarSesion() {
    const sesion = localStorage.getItem('usuarioActual');
    if (!sesion) {window.location.href = 'index.html';return;}
usuarioActual = JSON.parse(sesion);
    if (usuarioActual.tipo === 'admin') {window.location.href = 'admin.html';return;}
document.getElementById('nombreUsuario').textContent = usuarioActual.nombre;
    document.getElementById('deporteUsuario').textContent = deporteConfig[usuarioActual.deporte].nombre;}
function aplicarColoresDeporte() {
    const deporte = usuarioActual.deporte;
    const config = deporteConfig[deporte];
    if (config) {
        document.documentElement.style.setProperty('--color-primario', config.color);
        document.documentElement.style.setProperty('--color-oscuro', config.oscuro);}}
async function cargarSelectorTablas() {
    const selector = document.getElementById('selectorTabla');
    const tablas = await cargarTablas();    
    selector.innerHTML = '<option value="">-- Seleccione una tabla --</option>';
    if (tablas.generales && tablas.generales.length > 0) {
        const tablasDeporte = tablas.generales.filter(t => t.deporte === usuarioActual.deporte);
        if (tablasDeporte.length > 0) {
            const optgroupGeneral = document.createElement('optgroup');
            optgroupGeneral.label = 'Tablas Generales';
            tablasDeporte.forEach((tabla, index) => {
                const indiceOriginal = tablas.generales.indexOf(tabla);
                const option = document.createElement('option');
                option.value = `general-${indiceOriginal}`;
                option.textContent = tabla.nombre;
                optgroupGeneral.appendChild(option);});
            selector.appendChild(optgroupGeneral);}}
    if (tablas.individuales && tablas.individuales[usuarioActual.nombre]) {
        const tablasUsuario = tablas.individuales[usuarioActual.nombre].filter(t => t.deporte === usuarioActual.deporte);
        if (tablasUsuario.length > 0) {
            const optgroupIndividual = document.createElement('optgroup');
            optgroupIndividual.label = 'Mi Tabla Individual';
            tablasUsuario.forEach((tabla, index) => {
                const option = document.createElement('option');
                option.value = `individual-${index}`;
                option.textContent = tabla.nombre;
                optgroupIndividual.appendChild(option);});
            selector.appendChild(optgroupIndividual);}}}
async function cargarTablas() {
    try {
        const response = await fetch(`${API_URL}/tablas`);
        if (!response.ok) {throw new Error('No se pudieron cargar las tablas');}
    const tablas = await response.json();return tablas;
    } catch (error) {
        console.error('Error al cargar tablas:', error);
        alert('Error al cargar las tablas del servidor');
        return { generales: [], individuales: {} }; }}
async function cargarTablaSeleccionada() {
    const selector = document.getElementById('selectorTabla');
    const valorSeleccionado = selector.value;
    if (!valorSeleccionado) {
        document.getElementById('tablaContainer').style.display = 'none';
        document.getElementById('noTabla').style.display = 'block';
        return;}
    const [tipo, index] = valorSeleccionado.split('-');
    const tablas = await cargarTablas();
    if (tipo === 'general') {tablaActual = tablas.generales[parseInt(index)];
    } else {tablaActual = tablas.individuales[usuarioActual.nombre][parseInt(index)];}
    mostrarTabla(tablaActual);}
function mostrarTabla(tabla) {
    document.getElementById('tituloTabla').textContent = tabla.nombre;
    const contenedor = document.getElementById('contenidoTabla');
    contenedor.innerHTML = '';
    tabla.listas.forEach(lista => {
        const listaDiv = document.createElement('div');
        listaDiv.className = 'lista';
        const titulo = document.createElement('div');
        titulo.className = 'lista-titulo';
        titulo.textContent = lista.titulo;
        listaDiv.appendChild(titulo);
        const tableWrapper = document.createElement('div');
        tableWrapper.style.overflowX = 'auto';
        tableWrapper.style.maxWidth = '100%';
        tableWrapper.style.WebkitOverflowScrolling = 'touch';
        const table = document.createElement('table');
        table.style.minWidth = '600px';
        const thead = document.createElement('thead');
        let maxSemanas = 1;
        lista.ejercicios.forEach(ej => {
            if (ej.semanas && ej.semanas.length > maxSemanas) {maxSemanas = ej.semanas.length;}});
        const headerRow = document.createElement('tr');
        const thEjercicio = document.createElement('th');
        thEjercicio.textContent = 'Ejercicio';
        thEjercicio.style.position = 'sticky';
        thEjercicio.style.left = '0';
        thEjercicio.style.background = 'var(--color-oscuro)';
        thEjercicio.style.zIndex = '10';
        thEjercicio.rowSpan = 2;
        headerRow.appendChild(thEjercicio);
        for (let i = 0; i < maxSemanas; i++) {
            const th = document.createElement('th');
            th.textContent = `Semana ${i + 1}`;
            headerRow.appendChild(th);}
        thead.appendChild(headerRow);
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        lista.ejercicios.forEach(ejercicio => {
            const row = document.createElement('tr');
            const tdNombre = document.createElement('td');
            tdNombre.className = 'ejercicio-nombre';
            tdNombre.textContent = ejercicio.nombre;
            tdNombre.style.position = 'sticky';
            tdNombre.style.left = '0';
            tdNombre.style.background = 'white';
            tdNombre.style.zIndex = '5';
            row.appendChild(tdNombre);
            if (!ejercicio.semanas || !Array.isArray(ejercicio.semanas)) {
                ejercicio.semanas = [];
                for (let i = 1; i <= 6; i++) {
                    const semanaKey = `semana${i}`;
                    if (ejercicio[semanaKey]) {ejercicio.semanas.push(ejercicio[semanaKey]);}}
            if (ejercicio.semanas.length === 0) {ejercicio.semanas = [{ series: '', repeticiones: '', peso: '', t1: '', t2: '', t3: '' }];}}
            ejercicio.semanas.forEach((semana, semanaIndex) => {
                const td = document.createElement('td');
                td.className = 'datos-semana';
                td.style.verticalAlign = 'top';
                td.style.padding = '8px';
                const containerDiv = document.createElement('div');
                containerDiv.style.display = 'flex';
                containerDiv.style.flexDirection = 'column';
                containerDiv.style.gap = '2px';
                containerDiv.style.fontSize = '13px';
                containerDiv.innerHTML = `
                    <div><strong>Series:</strong> ${semana.series || '-'}</div>
                    <div><strong>Reps:</strong> ${semana.repeticiones || '-'}</div>
                    <div><strong>Peso:</strong> ${semana.peso ? semana.peso + ' kg' : '-'}</div>
                    <div><strong>t1:</strong> ${semana.t1 || '-'}</div>
                    <div><strong>t2:</strong> ${semana.t2 || '-'}</div>
                    <div><strong>t3:</strong> ${semana.t3 || '-'}</div>`;
                td.appendChild(containerDiv);
                row.appendChild(td);});
            tbody.appendChild(row);});
        table.appendChild(tbody);
        tableWrapper.appendChild(table);
        listaDiv.appendChild(tableWrapper);
        contenedor.appendChild(listaDiv);});
    document.getElementById('tablaContainer').style.display = 'block';
    document.getElementById('noTabla').style.display = 'none';}
function descargarPDF() {
    if (!tablaActual) {alert('No hay tabla seleccionada');return;}
window.print();}
function cerrarSesion() {
    localStorage.removeItem('usuarioActual');
    localStorage.removeItem('deporteSeleccionado');
    window.location.href = 'index.html';}