/**
 * Reportes Module
 * Fetches real dashboard stats and renders KPIs and charts.
 */

let API_URL = '';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const configResp = await fetch('../../assets/config.json');
        const config = await configResp.json();
        API_URL = `${config.apiUrl}/reportes/dashboard`;

        loadDashboardData();
    } catch (e) {
        console.error('Initialization error:', e);
    }
});

async function loadDashboardData() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const resp = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();

        if (data.success) {
            renderKPIs(data.data.kpis);
            renderMonthlyChart(data.data.monthlySales);
            renderTopProducts(data.data.topProducts);
        } else {
            console.error('Backend error:', data.message);
        }
    } catch (e) {
        console.error('Error fetching dashboard data:', e);
    }
}

function renderKPIs(kpis) {
    document.getElementById('kpi-ventas').textContent = formatCurrency(kpis.ventasMes);
    document.getElementById('kpi-utilidad').textContent = formatCurrency(kpis.utilidadNeta);
    document.getElementById('kpi-clientes').textContent = kpis.nuevosClientes;
}

function renderMonthlyChart(sales) {
    const chart = document.getElementById('ventas-chart');
    if (!chart) return;
    chart.innerHTML = '';

    const mesesLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Find max value to scale bars
    const maxSale = Math.max(...sales.map(s => parseFloat(s.total)), 1);

    sales.forEach(s => {
        const height = (parseFloat(s.total) / maxSale) * 90; // max 90%
        const wrapper = document.createElement('div');
        wrapper.className = 'bar-wrapper';

        let colorStyle = '';
        if (s.mes === new Date().getMonth() + 1) {
            colorStyle = 'background: #10B981;'; // Green for current month
        }

        wrapper.innerHTML = `
            <div class="bar" style="height: ${height}%; ${colorStyle}" title="${formatCurrency(s.total)}"></div>
            <span class="bar-label">${mesesLabels[s.mes - 1]}</span>
        `;
        chart.appendChild(wrapper);
    });
}

function renderTopProducts(products) {
    const tbody = document.getElementById('top-products-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.nombre}</td>
            <td style="text-align: right;">${parseFloat(p.cantidad).toLocaleString()}</td>
            <td style="text-align: right; font-weight: bold;">${formatCurrency(p.total)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function formatCurrency(value) {
    if (value >= 1000000) {
        return '$' + (value / 1000000).toFixed(1) + 'M';
    }
    return '$' + parseFloat(value).toLocaleString();
}
