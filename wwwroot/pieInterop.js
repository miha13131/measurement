window.pieInterop = {
    chart: null,

    renderSharePieChart: function (canvasId, labels, values, title) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof Chart === 'undefined') return;

        const ctx = canvas.getContext('2d');

        if (this.chart) {
            this.chart.destroy();
        }

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
            }
        });
    }
};
