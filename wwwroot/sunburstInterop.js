window.sunburstInterop = {
    chart: null,
    resizeHandler: null,

    renderSunburst: function (divId, title, data, rawUnit, centerLabel, legendItems) {
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
            legend: {
                type: 'scroll',
                bottom: 4,
                left: 'center',
                icon: 'rect',
                itemWidth: 14,
                itemHeight: 14,
                textStyle: { fontSize: 13 },
                data: (legendItems || []).map(item => item.name)
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
                radius: ["0%", "82%"],
                sort: null,
                data: data || [],
                label: {
                    color: '#ffffff',
                    fontSize: 16,
                    fontWeight: 700,
                    textBorderColor: 'rgba(0,0,0,0.35)',
                    textBorderWidth: 2,
                    formatter: function (params) {
                        const rawValue = Number(params?.data?.rawValue ?? NaN);
                        const share = Number(params.value || 0);
                        if (!Number.isNaN(rawValue)) {
                            return compact(rawValue);
                        }
                        return `${share.toFixed(1)}%`;
                    }
                },
                emphasis: {
                    focus: 'ancestor'
                },
                levels: [{
                }, {
                    // Level 1: inner ring (zones)
                    r0: '0%',
                    r: '45%',
                    itemStyle: {
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    },
                    label: {
                        rotate: 0,
                        fontSize: 18
                    }
                }, {
                    // Level 2: outer ring (devices)
                    r0: '46%',
                    r: '82%',
                    itemStyle: {
                        borderColor: 'rgba(255,255,255,0.75)',
                        borderWidth: 2
                    },
                    label: {
                        rotate: 'radial',
                        fontSize: 14,
                        align: 'center'
                    }
                }]
            },
            color: (legendItems || []).map(item => item.color)
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
