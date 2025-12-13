// Chart.js + адаптер времени (date-fns) через ESM с CDN
import 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js';
import 'https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js';

// (опционально включить масштабирование/зум)
// import 'https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.0.1/dist/chartjs-plugin-zoom.umd.min.js';

let chart;

export function renderTimeSeriesChart(canvasId, groups) {
    const ctx = document.getElementById(canvasId);

    const datasets = groups.map(g => ({
        label: g.label,
        data: g.points,           // [{x: ISO date/string, y: number}]
        parsing: false,           // указываем, что точки уже в формате {x,y}
        pointRadius: 2,
        borderWidth: 2,
        tension: 0.2
    }));

    const config = {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: false },
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        title: items => items[0]?.raw?.x ?? '',
                        label: item => `${item.dataset.label}: ${item.raw?.y}`
                    }
                },
                // zoom: {              // раскомментируй, если подключил плагин zoom
                //   zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
                //   pan: { enabled: true, mode: 'x' }
                // }
            },
            scales: {
                x: { type: 'time', time: { tooltipFormat: 'yyyy-MM-dd HH:mm:ss' } },
                y: { beginAtZero: false }
            }
        }
    };

    if (chart) chart.destroy();
    chart = new Chart(ctx, config);
}
