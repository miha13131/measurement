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
                    data: points,
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
    },

    renderMultiTimeSeriesChart: function (canvasId, datasets, yAxisLabel) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        if (this.chart) {
            this.chart.destroy();
        }

        const normalized = (datasets || []).map(ds => ({
            ...ds,
            parsing: { xAxisKey: 'x', yAxisKey: 'y' },
            borderWidth: 2,
            pointRadius: 0,
            spanGaps: true,
            tension: 0
        }));

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: normalized
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    axis: 'x',
                    intersect: false
                },
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        displayColors: true
                    }
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
                            text: yAxisLabel || 'Value'
                        }
                    }
                }
            },
            plugins: [{
                id: 'crosshairGuides',
                afterDraw(chart) {
                    const tooltip = chart.tooltip;
                    if (!tooltip || !tooltip.getActiveElements || tooltip.getActiveElements().length === 0) {
                        return;
                    }

                    const active = tooltip.getActiveElements()[0];
                    if (!active) {
                        return;
                    }

                    const { ctx, chartArea } = chart;
                    const x = active.element.x;
                    const y = active.element.y;

                    ctx.save();
                    ctx.strokeStyle = 'rgba(70, 70, 70, 0.45)';
                    ctx.lineWidth = 1;

                    ctx.beginPath();
                    ctx.moveTo(x, chartArea.top);
                    ctx.lineTo(x, chartArea.bottom);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(chartArea.left, y);
                    ctx.lineTo(chartArea.right, y);
                    ctx.stroke();
                    ctx.restore();
                }
            }]
        });
    }
};
