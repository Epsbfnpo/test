import { defineStore } from 'pinia'

export const useIntravenousInfusionAndEffectOfClearance = defineStore({
    id: 'intravenous-infusion-and-effect-of-clearance',
    state: () => ({
        decimalPlaces: 2,
        chartOptions: {
            chart: {
                id: 'basic-bar',
                type: 'line',
                zoom: {
                    type: 'x',
                    enabled: false,
                    autoScaleYaxis: true
                },
                toolbar: {
                    export: {
                        csv: {
                            filename: 'intravenous-infusion-and-effect-of-clearance'
                        },
                        svg: {
                            filename: 'intravenous-infusion-and-effect-of-clearance'
                        },
                        png: {
                            filename: 'intravenous-infusion-and-effect-of-clearance'
                        }
                    }
                }
            },
            stroke: {
                curve: 'straight'
            },
            grid: {
                xaxis: {
                    lines: {
                        show: false
                    }
                },
                yaxis: {
                    lines: {
                        show: true
                    }
                }
            },
            xaxis: {
                title: {
                    text: 'Time (hours)'
                },
                categories: Array.from({ length: 25 }, (_, i) => i),
                labels: {
                    formatter: (value: number) => {
                        return Math.floor(value).toString()
                    }
                }
            },
            yaxis: {
                title: {
                    text: 'Plasma Concentration (mg/L)'
                },
                labels: {
                    formatter: (value: number) => {
                        return value.toFixed(2)
                    }
                }
            },
            tooltip: {
                x: {
                    formatter: (value: any) => `${value - 1} hours`
                },
                y: {
                    formatter: (value: any) => `${value.toFixed(2)} mg/L`
                }
            }
        }
    }),
    actions: {
        changeDecimalPlaces(value: number) {
            this.decimalPlaces = value;
            this.chartOptions.yaxis.labels.formatter = (value: any) => value.toFixed(this.decimalPlaces);
            this.chartOptions.tooltip.y.formatter = (value: any) => `${value.toFixed(this.decimalPlaces)} mg/L`;
        }
    }

})
