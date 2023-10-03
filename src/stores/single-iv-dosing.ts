import { defineStore } from 'pinia'

export const useSingleIVDosingStore = defineStore({
  id: 'single-iv-dosing',
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
              filename: 'single-iv-dosing'
            },
            svg: {
              filename: 'single-iv-dosing'
            },
            png: {
              filename: 'single-iv-dosing'
            }
          }
        }
      },
      stroke: {
        curve: 'straight'
      },
      fill: {
        type: 'gradient',
        gradient: {
          type: 'vertical',
          colorStops: [
            {
              offset: 25,
              color: '#00008B'
            },
            {
              offset: 50,
              color: '#0000FF'
            },
            {
              offset: 75,
              color: '#ADD8E6'
            },
            {
              offset: 100,
              color: '#D3D3D3'
            }
          ]
        }
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
