window.pieInterop = {
    chart: null,

    destroyCanvasChart: function (canvas) {
        if (!canvas || typeof Chart === 'undefined') return;

        const existing = Chart.getChart(canvas);
        if (existing) {
            existing.destroy();
        }
    },

    renderSharePieChart: function (canvasId, labels, values, title) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof Chart === 'undefined') return;

        const ctx = canvas.getContext('2d');

        this.destroyCanvasChart(canvas);

        const safeLabels = labels || [];
        const safeValues = values || [];
        const colors = ['#2f7ed8', '#8bbc21', '#910000', '#1aadce', '#492970', '#f28f43', '#77a1e5'];

        this.chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: safeLabels,
                datasets: [{
                    data: safeValues,
                    backgroundColor: safeLabels.map((_, i) => colors[i % colors.length]),
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: 20
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: title || 'Share by source (%)'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const value = context.parsed || 0;
                                return `${context.label}: ${value.toFixed(2)}%`;
                            }
                        }
                    }
                }
            },
            plugins: [{
                id: 'piePercentLabels',
                afterDatasetsDraw(chart) {
                    const dataset = chart.data?.datasets?.[0];
                    const values = (dataset?.data || []).map(v => Number(v) || 0);
                    const total = values.reduce((sum, value) => sum + value, 0);

                    if (!dataset || total <= 0) {
                        return;
                    }

                    const meta = chart.getDatasetMeta(0);
                    const { ctx } = chart;

                    ctx.save();
                    ctx.font = 'bold 13px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    meta.data.forEach((arc, index) => {
                        const raw = values[index];
                        if (!raw || !arc) {
                            return;
                        }

                        const percentText = `${raw.toFixed(1)}%`;
                        const angle = (arc.startAngle + arc.endAngle) / 2;
                        const radius = arc.innerRadius + (arc.outerRadius - arc.innerRadius) * 0.65;
                        const x = arc.x + Math.cos(angle) * radius;
                        const y = arc.y + Math.sin(angle) * radius;

                        // subtle outline for readability
                        ctx.lineWidth = 3;
                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
                        ctx.strokeText(percentText, x, y);

                        ctx.fillStyle = '#ffffff';
                        ctx.fillText(percentText, x, y);
                    });

                    ctx.restore();
                }
            }]
        });
    }
};
