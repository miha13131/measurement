window.sunburstInterop = {
    chart: null,
    resizeHandler: null,

    renderSunburst: function (divId, title, data) {
        const el = document.getElementById(divId);
        if (!el || typeof echarts === 'undefined') return;

        if (this.chart) {
            this.chart.dispose();
        }

        this.chart = echarts.init(el);

        const option = {
            animation: false,
            title: {
                text: title || 'Sunburst: podíl zdrojů',
                left: 'center',
                top: 8,
                textStyle: { fontSize: 14, fontWeight: 600 }
            },
            tooltip: {
                trigger: 'item',
                formatter: function (params) {
                    const v = Number(params.value || 0);
                    return `${params.name}: ${v.toFixed(2)}%`;
                }
            },
            series: {
                type: 'sunburst',
                radius: ["20%", "92%"],
                sort: null,
                data: data || [],
                emphasis: {
                    focus: 'ancestor'
                },
                levels: [{}, {
                    r0: '20%',
                    r: '55%',
                    itemStyle: { borderWidth: 2 },
                    label: { rotate: 0 }
                }, {
                    r0: '55%',
                    r: '92%',
                    label: { align: 'right' }
                }]
            }
        };

        this.chart.setOption(option);

        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }

        this.resizeHandler = () => this.chart && this.chart.resize();
        window.addEventListener('resize', this.resizeHandler);
    }
};
