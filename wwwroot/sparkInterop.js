window.sparkInterop = {
    chart: null,

    renderSparks: function (divId, model) {
        const el = document.getElementById(divId);
        if (!el) return;

        if (this.chart) {
            this.chart.dispose();
        }

        const chart = echarts.init(el);
        this.chart = chart;

        const grids = [];
        const xAxes = [];
        const yAxes = [];
        const series = [];

        let top = 10;
        const trackHeight = 80;
        const gap = 10;

        model.tracks.forEach((t, idx) => {
            grids.push({
                top: top,
                height: trackHeight,
                left: 90,
                right: 20
            });

            xAxes.push({
                type: 'time',
                gridIndex: idx,
                axisLabel: { show: idx === model.tracks.length - 1 }
            });

            yAxes.push({
                gridIndex: idx,
                type: 'value',
                scale: true,
                axisLabel: { show: true },
                name: t.label,
                nameLocation: 'middle',
                nameGap: 45
            });

            series.push({
                type: 'line',
                xAxisIndex: idx,
                yAxisIndex: idx,
                showSymbol: false,
                emphasis: { focus: 'series' },
                data: t.points.map(p => [
                    new Date(p.t),   // ⬅ ВАЖНО
                    p.v
                ])
            });

            top += trackHeight + gap;
        });

        chart.setOption({
            animation: false,
            tooltip: { trigger: 'axis' },
            grid: grids,
            xAxis: xAxes,
            yAxis: yAxes,
            series: series,
            dataZoom: [
                { type: 'inside', xAxisIndex: xAxes.map((_, i) => i) },
                { type: 'slider', xAxisIndex: xAxes.map((_, i) => i) }
            ]
        });
    }
};
