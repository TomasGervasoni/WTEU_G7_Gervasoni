'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// DashboardAdmin.js
// Lógica de UI para el Dashboard de Administración
// CU-024 a CU-028
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch(`${window.API_URL}/api/v1/dashboard`, {
            credentials: 'include' // Para enviar la cookie de sesión
        });

        if (response.status === 401 || response.status === 403) {
            window.location.href = '../../Seguridad/SeguridadPages/SeguridadLogin.html';
            return;
        }

        if (!response.ok) throw new Error('Error al obtener datos del dashboard');

        const data = await response.json();
        renderizarDashboard(data);

        // Attach event listener for export
        const btnExportar = document.getElementById('btnExportarExcel');
        if (btnExportar) {
            btnExportar.addEventListener('click', () => {
                window.location.href = `${window.API_URL}/api/v1/dashboard/exportar`;
            });
        }
    } catch (error) {
        console.error('Error cargando el dashboard:', error);
        alert('Hubo un error cargando las métricas.');
    }
});

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(valor);
}

function renderizarDashboard(data) {
    // 1. KPIs
    document.getElementById('kpiPedidosTotales').textContent = data.pedidosTotales;
    document.getElementById('kpiVentasMes').textContent = formatearMoneda(data.ventasMesActual);
    
    const crec = document.getElementById('kpiVentasCrecimiento');
    if (data.crecimientoVentas >= 0) {
        crec.innerHTML = `<span class="material-symbols-outlined text-[14px]">trending_up</span> +${data.crecimientoVentas.toFixed(1)}% vs mes anterior`;
        crec.className = 'text-secondary text-[12px] font-medium mt-1 flex items-center gap-1';
    } else {
        crec.innerHTML = `<span class="material-symbols-outlined text-[14px]">trending_down</span> ${data.crecimientoVentas.toFixed(1)}% vs mes anterior`;
        crec.className = 'text-error text-[12px] font-medium mt-1 flex items-center gap-1';
    }

    document.getElementById('kpiClientesActivos').textContent = data.clientesTotales;
    document.getElementById('kpiPagosValidados').textContent = data.eficienciaPagos.toFixed(1) + '%';

    // 2. Gráfico de Barras (Ventas por mes)
    renderizarGraficoBarras(data.ventasPorMes);

    // 3. Gráfico Donut (Pedidos por estado)
    renderizarGraficoDonut(data.pedidosPorEstado, data.pedidosTotales);
}

function renderizarGraficoBarras(ventasPorMes) {
    const svg = document.getElementById('chartVentasBarras');
    if (!svg || !ventasPorMes || ventasPorMes.length === 0) return;

    // Removemos contenido anterior pero conservamos las líneas y ejes si queremos, 
    // pero es más fácil regenerar todo
    svg.innerHTML = `
        <!-- Y-Axis Grid Lines -->
        <line x1="60" y1="50" x2="760" y2="50" stroke="#E2E8F0" stroke-width="1"></line>
        <line x1="60" y1="125" x2="760" y2="125" stroke="#E2E8F0" stroke-width="1"></line>
        <line x1="60" y1="200" x2="760" y2="200" stroke="#E2E8F0" stroke-width="1"></line>
        <line x1="60" y1="275" x2="760" y2="275" stroke="#E2E8F0" stroke-width="1"></line>
        <line x1="60" y1="310" x2="760" y2="310" stroke="#191c1e" stroke-width="1.5"></line>
    `;

    // Tomar solo los últimos 6 meses (en caso de que vengan más)
    const datos = ventasPorMes.slice(-6);
    const maxVenta = Math.max(...datos.map(d => parseFloat(d.total_ventas)), 10000); // 10k base si está todo en 0

    // Eje Y Labels
    const steps = [maxVenta, maxVenta * 0.75, maxVenta * 0.5, maxVenta * 0.25, 0];
    const yPositions = [55, 130, 205, 280, 315];
    
    let labelsHTML = `<g class="font-label-sm text-[12px]" fill="#76777c">`;
    steps.forEach((val, i) => {
        let textVal = val >= 1000 ? (val/1000).toFixed(0) + 'k' : val;
        labelsHTML += `<text x="50" y="${yPositions[i]}" text-anchor="end">${textVal}</text>`;
    });

    const xStart = 100;
    const xGap = 110;
    
    datos.forEach((d, i) => {
        const val = parseFloat(d.total_ventas);
        const height = (val / maxVenta) * 260; // Max bar height approx 260
        const y = 310 - height;
        const x = xStart + (i * xGap);

        // Barra
        svg.innerHTML += `<rect x="${x}" y="${y}" width="45" height="${height}" fill="#0f1420" rx="4"><title>${formatearMoneda(val)}</title></rect>`;
        // Label mes
        labelsHTML += `<text x="${x + 22.5}" y="335" text-anchor="middle">${d.mes}</text>`;
    });

    labelsHTML += `</g>`;
    svg.innerHTML += labelsHTML;
}

function renderizarGraficoDonut(pedidosPorEstado, total) {
    const svg = document.getElementById('chartPedidosDonut');
    const legend = document.getElementById('chartPedidosLeyenda');
    const totalElem = document.getElementById('chartPedidosTotal');
    
    if (!svg || !legend || !totalElem) return;

    totalElem.textContent = total;
    legend.innerHTML = '';
    
    // Circulo de fondo
    svg.innerHTML = `<circle cx="50" cy="50" r="42" fill="transparent" stroke="#f2f4f6" stroke-width="12"></circle>`;

    if (total === 0) return;

    const COLORS = {
        'entregado': '#22C55E', // verde
        'en_preparacion': '#8b5cf6', // purpura
        'confirmado': '#0ea5e9', // celeste
        'enviado': '#3b82f6', // azul
        'pendiente': '#f59e0b', // naranja
        'cancelado': '#ba1a1a', // rojo
        '__carrito__': '#ccc' // ignorar
    };

    const TITLES = {
        'entregado': 'Entregado',
        'en_preparacion': 'En Prep.',
        'confirmado': 'Confirmado',
        'enviado': 'Enviado',
        'pendiente': 'Pendiente',
        'cancelado': 'Cancelado'
    };

    const circumference = 2 * Math.PI * 42; // r=42 -> 263.89
    let dashOffset = 0;

    pedidosPorEstado.forEach(d => {
        const cantidad = parseInt(d.cantidad, 10);
        const pct = cantidad / total;
        const dashArrayVal = pct * circumference;
        
        const color = COLORS[d.estado] || '#333';
        const title = TITLES[d.estado] || d.estado;

        // SVG Arc
        if (cantidad > 0) {
            svg.innerHTML += `<circle cx="50" cy="50" r="42" fill="transparent" stroke="${color}" stroke-width="12" stroke-dasharray="${dashArrayVal} ${circumference}" stroke-dashoffset="-${dashOffset}"><title>${title}: ${cantidad}</title></circle>`;
            dashOffset += dashArrayVal;
            
            // Legend Item
            legend.innerHTML += `
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full" style="background-color: ${color}"></div>
                    <div class="flex flex-col">
                        <span class="text-[12px] font-semibold text-primary capitalize">${title}</span>
                        <span class="text-[11px] text-on-surface-variant">${cantidad} (${(pct*100).toFixed(0)}%)</span>
                    </div>
                </div>
            `;
        }
    });
}
