<script setup lang='ts'>

import {useI18n} from 'vue-i18n'
import pkg from 'lodash';

const {debounce} = pkg;
import {useMultipleOralDosingStore} from '@/stores/multiple-oral-dosing'
import {useDisplay} from "vuetify";

const {t} = useI18n()

/**
 * Model for a single intravenous dosing of a drug.
 */
class MultipleOralDosingModel {
  _dose: number // The administered dose of the drug (e.g., in mg)
  _tau: number   // Clearance rate (e.g., in L/h)
  _F: number
  _ka: number
  _k: number
  // _kdif: number// this should calculate automatically
  _Vd: number


  constructor(dose = 250, tau = 8, F = 0.75, ka = 0.9, k = 0.07, Vd = 121.5) {
    this._dose = dose;
    this._tau = tau;
    this._F = F;
    this._ka = ka;
    this._k = k;
    // this._kdif = kdif;
    this._Vd = Vd;
  }

  calculatePlasmaConcentration(time: number): number {
    const n = Math.floor(time / this._tau);
    const dosetime = time - (n * this._tau);
    const m = n + 1;
    const kdif = this._k - this._ka;
    return ((this._F * this._dose * this._ka) / (this._Vd * kdif)) * (
        (((1 - Math.exp(-m * this._ka * this._tau)) / (1 - Math.exp(-this._ka * this._tau))) * Math.exp(-this._ka * dosetime)) -
        (((1 - Math.exp(-m * this._k * this._tau)) / (1 - Math.exp(-this._k * this._tau))) * Math.exp(-this._k * dosetime))
    );
  }
}

// binding for expansion panel
const descriptionPanel = ref([0])
// binding for tabs (graph / code )
const tab = ref('graph')

// type for drug model data
type DrugModelDataEntry = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  hoverListener: boolean;
};

type DrugModelDataType = Record<'dose' | 'tau' | 'F' | 'ka' | 'k' | 'Vd', DrugModelDataEntry>;

// data binding for drug model
const drugModelData: DrugModelDataType = reactive({
  dose: {label: 'Dose(mg) D', value: 250, min: 0, max: 1000, step: 0.1, hoverListener: false},
  tau: {label: 'Tau(h) τ', value: 8, min: 0, max: 24, step: 0.1, hoverListener: false},
  F: {label: 'Bioavailability F', value: 0.75, min: 0, max: 1, step: 0.01, hoverListener: false},
  ka: {label: 'Absorption Rate Constant(h⁻¹) ka', value: 0.9, min: 0, max: 10, step: 0.01, hoverListener: false},
  k: {label: 'Elimination Rate Constant(h⁻¹) k', value: 0.07, min: 0, max: 1, step: 0.001, hoverListener: false},
  Vd: {label: 'Volume of Distribution(L) Vd', value: 121.5, min: 0, max: 500, step: 0.1, hoverListener: false}
});

const latexFormula = computed(() => {
  let dose = drugModelData.dose.hoverListener ? '\\textcolor{red}{Dose}' : 'Dose';
  let tau = drugModelData.tau.hoverListener ? '\\textcolor{red}{\\tau}' : '\\tau';
  let f = drugModelData.F.hoverListener ? '\\textcolor{red}{F}' : 'F';
  let ka = drugModelData.ka.hoverListener ? '\\textcolor{red}{k_a}' : 'k_a';
  let k = drugModelData.k.hoverListener ? '\\textcolor{red}{k}' : 'k';
  let vd = drugModelData.Vd.hoverListener ? '\\textcolor{red}{Vd}' : 'Vd';

  return `C_p = \\frac{${f} \\cdot ${dose} \\cdot ${ka}}{${vd}(${k}-${ka})} \\times \\left[ \\left( \\frac{1-e^{-n${ka}${tau}}}{1-e^{-${ka}\\tau}} \\right)e^{-${ka}t} - \\left(\\frac{1-e^{-n${k}${tau}}}{1-e^{-${k}\\tau}}\\right)e^{-${k}t} \\right]`;
});
const halflifeFormula = computed(() => {

  let k = drugModelData.k.hoverListener ? '\\textcolor{red}{k}' : 'k';


  return `t_{\\frac{1}{2}}=\\frac{0.693}{${k}}`;
});

// chart options for single iv dosing
let {chartOptions} = useMultipleOralDosingStore()

// drug model
const drugModel = computed(() => new MultipleOralDosingModel(
    drugModelData.dose.value,
    drugModelData.tau.value,
    drugModelData.F.value,
    drugModelData.ka.value,
    drugModelData.k.value,
    drugModelData.Vd.value
))


const updateSeries = debounce(() => {
  series.value[0].data = chartOptions.xaxis.categories.map(hour => drugModel.value.calculatePlasmaConcentration(hour));
}, 50) // 10 ms debounce to prevent too many updates

watch(drugModelData, updateSeries)


const series = ref([
  {
    name: 'Plasma Concentration',
    data: chartOptions.xaxis.categories.map(hour => drugModel.value.calculatePlasmaConcentration(hour)),
    color: '#0000FF'
  }
])


const showConfigDialog = ref(true)

const chart = ref<ApexCharts | null>(null)
const updateOptions = (options: any) => {
  chart.value?.updateOptions(options)
}
const { xs } = useDisplay()
const code = ref(`############
# Parameters:
dose =250
tau = 8 # dosing interval is called tau
dosetime = 4 # 4 hours after the 7th dose
n = 7 # The 7th dose
F = 0.75
ka = 0.9
k = 0.07
kdif = -0.83
Vd = 121.5 #1.5 * 81 # Vd in L / kg so times 81 kg
Cl = k*Vd


# At 4 hours after the 7th dose
import numpy as np
Cp = ((F*dose*ka)/(Vd*kdif)) * ( (((1-np.exp(-n*ka*tau))/(1-np.exp(-ka*tau)))*np.exp(-ka*dosetime))-(((1-np.exp(-n*k*tau))/(1-np.exp(-k*tau)))*np.exp(-k*dosetime)) )
round(Cp,2)


import matplotlib.pyplot as plt
import numpy as np

# Parameters:
dose =250
tau = 8 # dosing interval is called tau
#dosetime = 4 # 4 hours after the 7th dose, or for the whole 7th dose use "time"
n = 7 # The 7th dose
F = 0.75
ka = 0.9
k = 0.07
kdif = -0.83
Vd = 121.5 #1.5 * 81 # Vd in L / kg so times 81 kg
Cl = k*Vd

time = np.linspace(0, 24, 100)

y = ((F*dose*ka)/(Vd*kdif)) * ( (((1-np.exp(-n*ka*tau))/(1-np.exp(-ka*tau)))*np.exp(-ka*time))-(((1-np.exp(-n*k*tau))/(1-np.exp(-k*tau)))*np.exp(-k*time)) )

fig = plt.figure(figsize = (10, 5))
# Create the plot
plt.plot(time, y)
plt.xlabel("Time (h)")
plt.ylabel("Plasma Concentration (mg/L)")

# Show the plot
plt.show()


import numpy as np
import matplotlib.pyplot as plt

# Parameters
dose = 250
tau = 24
F = 0.75
ka = 0.9
k = 0.07
kdif = -0.83
Vd = 121.5

# Time range
time = np.linspace(0, 168, num=1000)

# Calculate plasma concentration taking into account the dose number (m_array) which is time/tau as integer plus one (to correct for initial zero)
# and also changing time to dosetime which is time since last dose which uses n_array * tau so that is starts from zero on day 1.

n_array = np.int_(time / tau)
dosetime = time - (n_array * tau)
m_array = (n_array +1)
y = ((F * dose * ka) / (Vd * kdif)) * (
    (((1 - np.exp(-m_array * ka * tau)) / (1 - np.exp(-ka * tau))) * np.exp(-ka * dosetime)) -
    (((1 - np.exp(-m_array * k * tau)) / (1 - np.exp(-k * tau))) * np.exp(-k * dosetime))
)

# Plotting
plt.plot(time, y)
plt.xlabel('Time (hours)')
plt.ylabel('Plasma Concentration (mg/L)')
plt.title('Plasma Concentration for multiple oral doses')
plt.grid(True)
plt.show()


Cl = k*Vd
halflife = 0.693 * (Vd/Cl)
time2steady = 5 * halflife
print("It will take approximately %.2f hours to reach steady-state." % time2steady )
`)

</script>

<template>
  <!-- margin left and right to leave space for both sidebars -->
  <v-row class='mx-3 mt-2'>
    <v-col v-show="xs" cols='12'>
      <!--   title card   -->
      <v-card>
        <v-card-title data-cy="formula-title-card">
          <h1 class='text-h2 use-cairo-font'>{{ t('pages.formulas.titles.multipleOralDosing') }}</h1>
        </v-card-title>
        <v-card-text>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols='12'>
      <v-expansion-panels v-model='descriptionPanel'>
        <v-expansion-panel>
          <v-expansion-panel-title class='text-subtitle-1 text-uppercase font-weight-bold use-cairo-font'>
            {{ t('pages.formulas.descriptions.shortDescription') }}
          </v-expansion-panel-title>
          <v-expansion-panel-text>{{ t('pages.formulas.descriptions.multipleOralDosing') }}</v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-col>

    <v-col cols='12'>
      <v-card>
        <v-tabs fixed-tabs v-model='tab'>
          <v-tab value="graph">{{t('pages.formulas.descriptions.graph')}}</v-tab>
          <v-tab value="code">{{t('pages.formulas.descriptions.code')}}</v-tab>
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
                            <latex-render style='font-size: 1em' class='ml-3'
                                          v-model='latexFormula'></latex-render>
                          </v-col>
                          <v-col cols="12" class="py-1">
                            <latex-render style='font-size: 1em' class='ml-3'
                                          v-model='halflifeFormula'></latex-render>
                          </v-col>
                        </v-row>
                        <v-spacer></v-spacer>
                        <v-btn v-show="!xs" @click='showConfigDialog = false' icon='mdi-fullscreen'></v-btn>
                        <multiple-oral-dosing-dialog
                            :drugModelData='drugModelData'
                            :updateOptions='updateOptions'
                        >
                        </multiple-oral-dosing-dialog>
                      </v-card-actions>
                      <v-card-text>
                        <v-sheet v-for='slide in drugModelData' :key='slide.label'
                                 @mouseover='slide.hoverListener=true'
                                 @mouseleave='slide.hoverListener=false'>
                          <div class='mb-2 font-weight-bold'>{{ slide.label }}</div>
                          <v-slider
                              v-model='slide.value'
                              :min='slide.min'
                              :max='slide.max'
                              :step='slide.step'
                              class='align-center use-cairo-font'
                          >
                            <!-- Box for user to enter number -->
                            <template v-slot:append>
                              <v-text-field
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
                <v-col :cols='showConfigDialog? 8: 12'>
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
                <a href="https://colab.research.google.com/github/sladem-tox/PK_calcs/blob/main/MultipleOralDose.ipynb" target="_blank"><img src="https://colab.research.google.com/assets/colab-badge.svg" alt="Open In Colab"/></a>
              </div>
              <code-editor v-model="code"></code-editor>

            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

</template>

<style scoped>
.code-editor-scrollable {
  overflow: auto;
}
</style>
