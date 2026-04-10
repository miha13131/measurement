window.stackedBarInterop = {
    chart: null,

    destroyCanvasChart: function (canvas) {
        if (!canvas || typeof Chart === 'undefined') return;

        const existing = Chart.getChart(canvas);
        if (existing) {
            existing.destroy();
        }
    },

    renderStackedBarChart: function (canvasId, labels, datasets, title, yAxisLabel, isPercentMode) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof Chart === 'undefined') return;

        const ctx = canvas.getContext('2d');
        this.destroyCanvasChart(canvas);

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels || [],
                datasets: (datasets || []).map(ds => ({
                    ...ds,
                    borderWidth: ds.borderWidth ?? 1
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    title: {
                        display: !!title,
                        text: title || ''
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        ticks: {
                            maxRotation: 45,
                            minRotation: 0
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        max: isPercentMode ? 100 : undefined,
                        title: {
                            display: true,
                            text: yAxisLabel || 'Value'
                        }
                    }
                }
            }
        });
    }
};
