window.boxplotInterop = {
    chart: null,
    resizeHandler: null,

    clear: function (divId) {
        const el = document.getElementById(divId);
        if (!el) return;

        if (this.chart) {
            this.chart.dispose();
            this.chart = null;
        }

        el.innerHTML = '';
    },

    renderReadable: function (divId, categories, boxData, outliers, metricLabel, threshold, thresholdUnit, onlyAboveThreshold) {
        const el = document.getElementById(divId);
        if (!el || typeof echarts === 'undefined') return;

        if (this.chart) {
            this.chart.dispose();
        }

        const chart = echarts.init(el);
        this.chart = chart;

        const safeCategories = categories || [];
        const safeBoxes = boxData || [];
        const safeOutliers = outliers || [];

        const option = {
            animation: false,
            backgroundColor: '#f7f7f7',
            title: {
                text: `Krabicový graf (${metricLabel || 'metrika'})`,
                subtext: `${metricLabel || 'metrika'} – rozdělení${onlyAboveThreshold ? ` • filtr P95 > ${Number(threshold || 0).toFixed(2)} ${thresholdUnit || ''}` : ''}`,
                left: 'center',
                textStyle: { fontSize: 30, fontWeight: 800 },
                subtextStyle: { fontSize: 14, color: '#555' }
            },
            tooltip: {
                trigger: 'item',
                confine: true
            },
            grid: {
                left: 85,
                right: 35,
                top: 100,
                bottom: 92
            },
            xAxis: {
                type: 'category',
                data: safeCategories,
                boundaryGap: true,
                axisLabel: {
                    rotate: 40,
                    color: '#374151',
                    fontSize: 12,
                    formatter: function (value, index) {
                        return index % 4 === 0 ? value : '';
                    }
                },
                splitLine: {
                    show: true,
                    lineStyle: { color: '#e5e7eb', type: 'dashed' }
                },
                name: 'Časová okna',
                nameLocation: 'middle',
                nameGap: 58,
                nameTextStyle: { fontSize: 15, fontWeight: 600 }
            },
            yAxis: {
                type: 'value',
                scale: true,
                axisLabel: {
                    color: '#374151',
                    fontSize: 12
                },
                splitArea: {
                    show: true,
                    areaStyle: { color: ['#f9fafb', '#f3f4f6'] }
                },
                splitLine: {
                    lineStyle: { color: '#d1d5db' }
                },
                name: `${metricLabel || 'Hodnota'}${thresholdUnit ? ` (${thresholdUnit})` : ''}`,
                nameLocation: 'middle',
                nameGap: 58,
                nameTextStyle: { fontSize: 15, fontWeight: 600 }
            },
            dataZoom: [
                { type: 'inside', zoomOnMouseWheel: true, moveOnMouseMove: true },
                { type: 'slider', height: 18, bottom: 28 }
            ],
            series: [
                {
                    name: 'Rozdělení',
                    type: 'boxplot',
                    data: safeBoxes,
                    itemStyle: {
                        color: '#93c5fd',
                        borderColor: '#1d4ed8',
                        borderWidth: 2.8
                    },
                    lineStyle: {
                        color: '#1d4ed8',
                        width: 2.8
                    },
                    emphasis: {
                        itemStyle: {
                            color: '#60a5fa',
                            borderColor: '#1d4ed8',
                            borderWidth: 3.2
                        }
                    },
                    boxWidth: [20, 40],
                    markLine: {
                        silent: true,
                        symbol: 'none',
                        lineStyle: { color: '#dc2626', width: 2, type: 'dashed' },
                        label: {
                            show: true,
                            formatter: `P95 limit: ${Number(threshold || 0).toFixed(2)} ${thresholdUnit || ''}`,
                            color: '#991b1b',
                            fontWeight: 600
                        },
                        data: [{ yAxis: Number(threshold || 0) }]
                    }
                },
                {
                    name: 'Odlehlé hodnoty',
                    type: 'scatter',
                    data: safeOutliers,
                    symbolSize: 9,
                    itemStyle: { color: '#dc2626' }
                }
            ]
        };

        chart.setOption(option);

        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }

        this.resizeHandler = () => chart.resize();
        window.addEventListener('resize', this.resizeHandler);
    }
};
