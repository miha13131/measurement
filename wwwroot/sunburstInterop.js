window.sunburstInterop = {
    chart: null,
    resizeHandler: null,

    renderSunburst: function (divId, title, data, rawUnit) {
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
                    const share = Number(params.value || 0);
                    const rawValue = Number(params?.data?.rawValue ?? NaN);
                    const unit = params?.data?.rawUnit || rawUnit || '';

                    if (!Number.isNaN(rawValue)) {
                        return `${params.name}: ${rawValue.toFixed(2)} ${unit}<br/>Podíl: ${share.toFixed(2)}%`;
                    }

                    return `${params.name}: ${share.toFixed(2)}%`;
                }
            },
            series: {
                type: 'sunburst',
                radius: ["20%", "92%"],
                sort: null,
                data: data || [],
                label: {
                    rotate: 'radial',
                    color: '#ffffff',
                    fontSize: 18,
                    fontWeight: 700,
                    textBorderColor: 'rgba(0,0,0,0.35)',
                    textBorderWidth: 2,
                    formatter: function (params) {
                        const rawValue = Number(params?.data?.rawValue ?? NaN);
                        const unit = params?.data?.rawUnit || rawUnit || '';
                        const name = params?.data?.name || '';

                        if (name === 'Celkem' && !Number.isNaN(rawValue)) {
                            return `Celkem\n${compact(rawValue)} ${unit}`;
                        }

                        if (!Number.isNaN(rawValue)) {
                            return `${compact(rawValue)} ${unit}`;
                        }

                        const share = Number(params.value || 0);
                        return `${share.toFixed(1)}%`;
                    }
                },
                emphasis: {
                    focus: 'ancestor'
                },
                levels: [{}, {
                    r0: '20%',
                    r: '55%',
                    itemStyle: { borderWidth: 2 },
                    label: {
                        rotate: 0,
                        color: '#ffffff',
                        fontSize: 22,
                        fontWeight: 700,
                        textBorderColor: 'rgba(0,0,0,0.35)',
                        textBorderWidth: 2
                    }
                }, {
                    r0: '55%',
                    r: '92%',
                    label: {
                        align: 'right',
                        color: '#ffffff',
                        fontSize: 20,
                        fontWeight: 700,
                        textBorderColor: 'rgba(0,0,0,0.35)',
                        textBorderWidth: 2
                    },
                    itemStyle: {
                        borderColor: 'rgba(255,255,255,0.75)',
                        borderWidth: 2
                    }
                }]
            }
        };

        this.chart.setOption(option);

        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }

        this.resizeHandler = () => this.chart && this.chart.resize();
        window.addEventListener('resize', this.resizeHandler);

        function compact(value) {
            const abs = Math.abs(value);
            if (abs >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (abs >= 1000) return `${(value / 1000).toFixed(1)}K`;
            return value.toFixed(1);
        }
    }
};
