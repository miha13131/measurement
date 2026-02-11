window.sparkInterop = {
    chart: null,
    resizeHandler: null,

    renderSparks: function (divId, model) {
        const el = document.getElementById(divId);
        if (!el) return;

        if (this.chart) {
            this.chart.dispose();
        }

        const chart = echarts.init(el);
        this.chart = chart;

        const trendColors = ['#5f97be', '#4960d6', '#9a6ad5'];
        const stateLabels = (model.states || []).map(s => s.label);

        const option = {
            animation: false,
            title: {
                text: model.title || 'Sparks',
                left: 'center',
                top: 6,
                textStyle: { fontSize: 14, fontWeight: 600 }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'line', snap: true }
            },
            axisPointer: {
                link: [{ xAxisIndex: [0, 1, 2] }]
            },
            grid: [
                { top: 40, left: 90, right: 30, height: 70 },
                { top: 130, left: 90, right: 30, height: 220 },
                { top: 370, left: 90, right: 30, height: 220 }
            ],
            xAxis: [
                {
                    type: 'time',
                    gridIndex: 0,
                    axisLabel: { show: false },
                    splitLine: { show: true, lineStyle: { color: '#e9e9e9' } }
                },
                {
                    type: 'time',
                    gridIndex: 1,
                    axisLabel: { show: false },
                    splitLine: { show: true, lineStyle: { color: '#e9e9e9' } }
                },
                {
                    type: 'time',
                    gridIndex: 2,
                    axisLabel: { show: true },
                    splitLine: { show: true, lineStyle: { color: '#f0f0f0' } }
                }
            ],
            yAxis: [
                {
                    type: 'category',
                    gridIndex: 0,
                    data: ['Alerts'],
                    axisTick: { show: false }
                },
                {
                    type: 'value',
                    gridIndex: 1,
                    scale: true,
                    splitLine: { show: true, lineStyle: { color: '#ececec' } },
                    axisLabel: { color: '#666' }
                },
                {
                    type: 'category',
                    gridIndex: 2,
                    data: stateLabels,
                    inverse: true,
                    axisTick: { show: false },
                    axisLabel: { color: '#555' },
                    splitLine: { show: true, lineStyle: { color: '#f1f1f1' } }
                }
            ],
            legend: {
                top: 108,
                left: 90,
                itemWidth: 18,
                textStyle: { fontSize: 11 }
            },
            dataZoom: [
                { type: 'inside', xAxisIndex: [0, 1, 2] },
                { type: 'slider', xAxisIndex: [0, 1, 2], bottom: 8 }
            ],
            series: []
        };

        const alerts = (model.alerts || []).map(segment => ({
            value: [new Date(segment.from), 0, new Date(segment.to)]
        }));

        option.series.push({
            name: 'Alerts',
            type: 'custom',
            xAxisIndex: 0,
            yAxisIndex: 0,
            renderItem: function (params, api) {
                const yIdx = api.value(1);
                const start = api.coord([api.value(0), yIdx]);
                const end = api.coord([api.value(2), yIdx]);
                const height = Math.max(10, api.size([0, 1])[1] * 0.55);

                return {
                    type: 'rect',
                    shape: {
                        x: start[0],
                        y: start[1] - height / 2,
                        width: Math.max(2, end[0] - start[0]),
                        height
                    },
                    style: {
                        fill: 'rgba(225, 29, 72, 0.8)',
                        stroke: 'rgba(190, 24, 93, 1)',
                        lineWidth: 1
                    }
                };
            },
            encode: { x: [0, 2], y: 1 },
            data: alerts,
            tooltip: {
                formatter: p => `Alert: ${new Date(p.value[0]).toLocaleString()} - ${new Date(p.value[2]).toLocaleString()}`
            }
        });

        (model.trends || []).forEach((trend, idx) => {
            option.series.push({
                name: trend.label,
                type: 'line',
                xAxisIndex: 1,
                yAxisIndex: 1,
                showSymbol: false,
                smooth: 0.15,
                lineStyle: {
                    width: 1.5,
                    color: trendColors[idx % trendColors.length]
                },
                data: (trend.points || []).map(p => [new Date(p.t), p.v])
            });
        });

        (model.states || []).forEach((state, idx) => {
            option.series.push({
                name: state.label,
                type: 'custom',
                xAxisIndex: 2,
                yAxisIndex: 2,
                renderItem: function (params, api) {
                    const yIdx = api.value(1);
                    const start = api.coord([api.value(0), yIdx]);
                    const end = api.coord([api.value(2), yIdx]);
                    const height = Math.max(8, api.size([0, 1])[1] * 0.55);

                    return {
                        type: 'rect',
                        shape: {
                            x: start[0],
                            y: start[1] - height / 2,
                            width: Math.max(2, end[0] - start[0]),
                            height
                        },
                        style: {
                            fill: state.color || '#2ca25f',
                            opacity: 0.9
                        }
                    };
                },
                encode: { x: [0, 2], y: 1 },
                data: (state.segments || []).map(segment => ({
                    value: [new Date(segment.from), idx, new Date(segment.to)]
                })),
                tooltip: {
                    formatter: p => `${state.label}: ${new Date(p.value[0]).toLocaleString()} - ${new Date(p.value[2]).toLocaleString()}`
                }
            });
        });

        chart.setOption(option);

        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }

        this.resizeHandler = () => chart.resize();
        window.addEventListener('resize', this.resizeHandler);
    }
};
