<script setup lang='ts'>
import { useI18n } from 'vue-i18n'
import lodash from 'lodash';
import { usenonLinearPharmacokineticsStore } from '@/stores/nonLinearPharmacokinetics'
import {useDisplay} from "vuetify";

const { t } = useI18n()
const { debounce } = lodash;

class NonLinearPharmacokineticsModel {
  _C0: number
  _k1: number
  _k2: number
  _C_thresh: number

  constructor(C0: number = 10, k1: number = 1, k2: number = 0.5, C_thresh: number = 2) {
    this._C0 = C0
    this._k1 = k1
    this._k2 = k2
    this._C_thresh = C_thresh
  }

  concentration(t: number): number {
    const t_thresh = (this._C0 - this._C_thresh) / this._k1
    if (this._C0 - this._k1 * t > this._C_thresh) {
      return this._C0 - this._k1 * t
    } else {
      return this._C_thresh * Math.exp(-this._k2 * (t - t_thresh))
    }
  }
}

// binding for expansion panel
const descriptionPanel = ref([0])
// binding for tabs (graph / code )
const tab = ref('graph')
const {xs} = useDisplay();

// data binding for drug model
const modelData = reactive({
  C0: { label: 'Initial Concentration C0(mg/mL)', value: 10, min: 0, max: 20, step: 0.1,hoverListener: false },
  k1: { label: 'Linear Decay Constant k1(1/h)', value: 1, min: 0, max: 2, step: 0.01, hoverListener: false },
  k2: { label: 'Exponential Decay Constant k2(1/h)', value: 0.5, min: 0, max: 1, step: 0.01, hoverListener: false },
  C_thresh: { label: 'Concentration Threshold(mg/mL)', value: 2, min: 0, max: 10, step: 0.1, hoverListener: false }
})

const latexFormula = computed(() => {
  let C0 = modelData.C0.hoverListener ? '\\textcolor{red}{C0}' : 'C0';
  let k1 = modelData.k1.hoverListener ? '\\textcolor{red}{k1}' : 'k1';
  let k2 = modelData.k2.hoverListener ? '\\textcolor{red}{k2}' : 'k2';
  let t_thresh = modelData.C_thresh.hoverListener ? '\\textcolor{red}{t_{thresh}}' : 't_{thresh}';

  const linearFormula = `Y = ${k1} \\cdot t + ${C0}`;
  const exponentialFormula = `C = ${C0} \\cdot e^{-${k2} \\cdot (t - ${t_thresh})}`;

  return {
    linear: linearFormula,
    exponential: exponentialFormula
  };
})

// chart options for NonLinearPharmacokinetics
let { chartOptions } = usenonLinearPharmacokineticsStore()
// drug model
const model = computed(() => new NonLinearPharmacokineticsModel(modelData.C0.value, modelData.k1.value, modelData.k2.value, modelData.C_thresh.value))

const updateSeries = debounce(() => {
  series.value[0].data = chartOptions.xaxis.categories.map(hour => model.value.concentration(hour))
}, 50)

watch(modelData, updateSeries)

const series = ref([
  {
    name: 'Concentration',
    data: chartOptions.xaxis.categories.map(hour => model.value.concentration(hour)),
    color: '#0000FF'
  }
])

const showConfigDialog = ref(true)
const chart = ref<ApexCharts | null>(null)
const updateOptions = (options: any) => {
  chart.value?.updateOptions(options)
}
const code = ref(`import numpy as np
import matplotlib.pyplot as plt

def concentration(t, C0, k1, k2, C_thresh):
    if C0 - k1*t > C_thresh:
        return C0 - k1*t
    else:
        return C_thresh*np.exp(-k2*(t - t_thresh))

# Define function parameters
C0 = 10.0   # initial concentration
k1 = 1.0    # linear decay constant
k2 = 0.5    # exponential decay constant
C_thresh = 2.0   # concentration threshold
t_thresh = (C0 - C_thresh) / k1   # time when concentration reaches threshold

# Generate data for x and y values
t_values = np.linspace(0, 24, 100)
C_values = [concentration(t, C0, k1, k2, C_thresh) for t in t_values]

# Plot the concentration against time
plt.plot(t_values, C_values)
plt.xlabel('Time (h)')
plt.ylabel('Concentration (mg/mL)')
plt.title('Function with Linear decline and Exponential Terminal Elimination')
plt.show()

`)

</script>

<template>
  <!-- margin left and right to leave space for both sidebars -->
  <v-row class='mx-3 mt-2'>
    <v-col v-show="xs" cols="12">
      <!--   title card   -->
        <div class="font-weight-bold use-cairo-font text-center">
        {{ t('pages.formulas.titles.nonLinearPharmacokinetics') }}
      </div>
    </v-col>
    <v-col cols='12'>
      <v-expansion-panels v-model='descriptionPanel'>
        <v-expansion-panel>
          <v-expansion-panel-title class='text-subtitle-1 text-uppercase font-weight-bold use-cairo-font'>
            {{ t('pages.formulas.descriptions.shortDescription') }}
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            {{ t('pages.formulas.descriptions.nonLinearPharmacokinetics-1') }} <br/> <br/>
            {{ t('pages.formulas.descriptions.nonLinearPharmacokinetics-2') }}

          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-col>
    <v-col cols='12'>
      <v-card>
        <v-tabs fixed-tabs v-model='tab'>
          <v-tab value='graph'>Graph</v-tab>
          <v-tab value='code'>Code</v-tab>
        </v-tabs>

        <v-card-text>
          <!--          <v-btn @click="showConfigDialog = !showConfigDialog">Toggle Dialog</v-btn>-->
          <v-window disabled v-model='tab'>
            <v-window-item value='graph'>
              <v-row>
                <v-slide-x-transition>
                  <v-col cols="12" md="4"  v-show='showConfigDialog'>
                    <v-card elevation='0'>
                      <v-card-actions>
                        <v-row>
                            <v-col cols="12" class="py-1">
                                <latex-render style='font-size: 1.5em' class='ml-3' v-model='latexFormula.linear'></latex-render>
                            </v-col>
                            <v-col cols="12" class="py-1">
                                <latex-render style='font-size: 1.5em' class='ml-3' v-model='latexFormula.exponential'></latex-render>
                            </v-col>
                        </v-row>

                        <v-spacer></v-spacer>
                        <v-btn v-show="!xs" @click="showConfigDialog = false" icon="mdi-fullscreen"></v-btn>
                        <nonLinearPharmacokinetics-dialog
                            :drugModelData='modelData'
                            :updateOptions='updateOptions'
                        >
                        </nonLinearPharmacokinetics-dialog>
                      </v-card-actions>
                      <v-card-text>
                        <v-sheet v-for='slide in modelData' :key='slide.label'
                                 @mouseover='slide.hoverListener=true'
                                 @mouseleave='slide.hoverListener=false'
                        >
                          <div class='mb-2 font-weight-bold'>{{ slide.label }}</div>
                          <v-slider
                              v-model='slide.value'
                              :min='slide.min'
                              :max='slide.max'
                              :step='slide.step'
                              class='align-center use-cairo-font'
                              thumb-label
                          >
                            <!-- Box for user to enter number -->
                            <template v-slot:append>
                              <v-text-field
                                  v-show="!xs"
                                  v-model='slide.value'
                                  hide-details
                                  single-line
                                  density='compact'
                                  type='number'
                                  style='width: 100px'
                              ></v-text-field>
                            </template>
                          </v-slider>
                        </v-sheet>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-slide-x-transition>
                <v-divider vertical></v-divider>
                <v-col cols="12" :md="showConfigDialog? 8:12">
                  <v-btn @click='showConfigDialog = true'
                         v-show='!showConfigDialog'
                         variant='text'
                         icon='mdi-fullscreen-exit'></v-btn>
                  <apexchart
                      ref='chart'
                      height='400'
                      type='line'
                      :options='chartOptions'
                      :series='series'
                  ></apexchart>
                </v-col>
              </v-row>

            </v-window-item>

            <v-window-item value='code'>
              <div class="d-flex justify-end mr-1">
                <a href="https://colab.research.google.com/github/sladem-tox/PK_calcs/blob/main/Zero_OrderElimination_then_1st.ipynb" target="_blank"><img src="https://colab.research.google.com/assets/colab-badge.svg" alt="Open In Colab"/></a>
              </div>
              <code-editor class="code-editor-scrollable" v-model="code"></code-editor>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

</template>

<style scoped>
.use-cairo-font {
  font-family: "Cairo", sans-serif !important;
}

.code-editor-scrollable {
  overflow: auto;
}
</style>
