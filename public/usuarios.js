let usuarioActual = null;
let tablaActual = null;
const API_URL = 'https://pef-2pzu.onrender.com/api';
window.addEventListener('DOMContentLoaded', function() {
    verificarSesion();
    cargarSelectorTablas();});
function verificarSesion() {
    const sesion = localStorage.getItem('usuarioActual');
    if (!sesion) {window.location.href = 'index.html';return;}
    usuarioActual = JSON.parse(sesion);
    if (usuarioActual.tipo === 'admin') {window.location.href = 'admin.html';return;}
    document.getElementById('nombreUsuario').textContent = usuarioActual.nombre;}
async function cargarSelectorTablas() {
    const selector = document.getElementById('selectorTabla');
    const tablas = await cargarTablas();
    selector.innerHTML = '<option value="">-- Seleccione una tabla --</option>';
    if (tablas.generales && tablas.generales.length > 0) {
        const optgroupGeneral = document.createElement('optgroup');
        optgroupGeneral.label = 'Tablas Generales';
        tablas.generales.forEach((tabla, index) => {
            const option = document.createElement('option');
            option.value = `general-${index}`;
            option.textContent = tabla.nombre;
            optgroupGeneral.appendChild(option);});
        selector.appendChild(optgroupGeneral);}
    if (tablas.individuales && tablas.individuales[usuarioActual.nombre]) {
        const tablasUsuario = tablas.individuales[usuarioActual.nombre];        
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
        const tablas = await response.json();
        return tablas;} catch (error) {
        console.error('Error al cargar tablas:', error);
        alert('Error al cargar las tablas del servidor');
        return { generales: [], individuales: {} };}}
async function cargarTablaSeleccionada() {
    const selector = document.getElementById('selectorTabla');
    const valorSeleccionado = selector.value;
    if (!valorSeleccionado) {
        document.getElementById('tablaContainer').style.display = 'none';
        document.getElementById('noTabla').style.display = 'block';return;}
    const [tipo, index] = valorSeleccionado.split('-');
    const tablas = await cargarTablas();
    if (tipo === 'general') {
        tablaActual = tablas.generales[parseInt(index)];} else {
        tablaActual = tablas.individuales[usuarioActual.nombre][parseInt(index)];}
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
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');        
        const thEjercicio = document.createElement('th');
        thEjercicio.textContent = 'Ejercicio';
        headerRow.appendChild(thEjercicio);        
        for (let i = 1; i <= 6; i++) {
            const th = document.createElement('th');
            th.textContent = `Semana ${i}`;
            headerRow.appendChild(th);}        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        const tbody = document.createElement('tbody');
        lista.ejercicios.forEach(ejercicio => {
            const row = document.createElement('tr');
            const tdNombre = document.createElement('td');
            tdNombre.className = 'ejercicio-nombre';
            tdNombre.textContent = ejercicio.nombre;
            row.appendChild(tdNombre);
            for (let i = 1; i <= 6; i++) {
                const td = document.createElement('td');
                const semanaKey = `semana${i}`;
                const datos = ejercicio[semanaKey];                
                td.className = 'datos-semana';
                td.innerHTML = `
                    <strong>Series:</strong> ${datos.series}<br>
                    <strong>Reps:</strong> ${datos.repeticiones}<br>
                    <strong>Peso:</strong> ${datos.peso} kg`;
                row.appendChild(td);}
            tbody.appendChild(row);});
        table.appendChild(tbody);
        listaDiv.appendChild(table);
        contenedor.appendChild(listaDiv);});
    document.getElementById('tablaContainer').style.display = 'block';
    document.getElementById('noTabla').style.display = 'none';}
function descargarPDF() {
    if (!tablaActual) {alert('No hay tabla seleccionada');return;}window.print();}
function cerrarSesion() {
    localStorage.removeItem('usuarioActual');
    window.location.href = 'index.html';}