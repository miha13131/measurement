window.chartInterop = {
    chart: null,

    renderTimeSeriesChart: function (canvasId, points, label) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: label,
                    data: points,     // [{ x: time, y: value }]
                    parsing: false,
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'nearest',
                    intersect: false
                },
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            tooltipFormat: 'HH:mm',
                            displayFormats: {
                                minute: 'HH:mm',
                                hour: 'HH:mm'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    },
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: label
                        }
                    }
                }
            }
        });
    }
};
