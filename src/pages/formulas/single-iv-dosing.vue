/**
* This Vue component models and displays the plasma concentration of a drug after a single
* intravenous (IV) dose administration. It provides an interactive way for the user to adjust
* drug parameters and view the resulting plasma concentration curve in both graphical and code formats.
* The calculations are based on standard pharmacokinetics formulas.
*
* Dependencies:
* - vue-i18n: Internationalization support for the user interface.
* - lodash: Provides utility functions such as debounce.
* - vue-codemirror6: A Vue component for displaying code with syntax highlighting.
* - ApexCharts: A charting library for displaying the plasma concentration curve.
*
* Features:
* - The user can adjust drug parameters including dose, clearance rate (Cl), and volume of distribution (Vd).
* - Displays the mathematical formula for the plasma concentration using LaTeX.
* - The plasma concentration is plotted using ApexCharts.
* - The code used to generate the graph is displayed using Codemirror.
*/

<script setup lang='ts'>

// Imports various required modules and libraries
import { useI18n } from 'vue-i18n'
import lodash from 'lodash'
import { useSingleIVDosingStore } from '@/stores/single-iv-dosing'
import { Codemirror } from 'vue-codemirror6';
const { t } = useI18n()
const { debounce } = lodash
import {useDisplay} from "vuetify";
const {xs} = useDisplay();


/**
 * Model for a single intravenous dosing of a drug.
 */


// class SingleIVDosingModel {
//   _dose: number // The administered dose of the drug (e.g., in mg)
//   _Cl: number   // Clearance rate (e.g., in L/h)
//   _Vd: number   // Volume of distribution (e.g., in L)


  // The SingleIVDosingModel class represents the pharmacokinetic model for single IV dosing.
// It provides methods for calculating initial concentration, elimination rate constant,
// and plasma concentration at a given time after dosing.
class SingleIVDosingModel {
  _dose: number // The administered dose of the drug (e.g., in mg)
  _Cl: number   // Clearance rate (e.g., in L/h)
  _Vd: number   // Volume of distribution (e.g., in L)

  // constructor(dose: number = 100, Cl: number = 20, Vd: number = 200) {
  //   this._dose = dose
  //   this._Cl = Cl
  //   this._Vd = Vd
  // }

  constructor(dose: number = 100, Cl: number = 20, Vd: number = 200) {
    this._dose = dose
    this._Cl = Cl
    this._Vd = Vd
  }


  /**
   * Initial plasma concentration of the drug after administration.
   */
  private get initialConcentration(): number { // ystart
    return this._dose / this._Vd
  }

  /**
   * The elimination rate constant of the drug.
   */
  private get eliminationRateConstant(): number { // k
    return this._Cl / this._Vd
  }

  /**
   * Calculate the plasma concentration of the drug at a given time.
   * @param t Time after administration (e.g., in hours)
   * @returns Plasma concentration at time t
   */
  plasmaConcentrationAtTime(t: number): number { // y
    return this.initialConcentration * Math.exp(-this.eliminationRateConstant * t)
  }
}

// Type definition for the drug model data that includes parameters like dose, Cl, and Vd.
// type for drug model data
type DrugModelDataEntry = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  hoverListener: boolean;
};

type DrugModelDataType = Record<'dose' | 'Cl' | 'Vd', DrugModelDataEntry>;

// Data binding for the drug model. This reactive data will be used to generate the graph.
// data binding for drug model
const drugModelData: DrugModelDataType = reactive({
  dose: { label: 'Dose(mg) D', value: 100, min: 0, max: 1000, step: 0.1, hoverListener: false },
  Cl: { label: 'Clearance(L/h) Cl', value: 20, min: 0, max: 50, step: 0.1, hoverListener: false },
  Vd: { label: 'Volume of Distribution(L) Vd', value: 200, min: 0, max: 500, step: 0.1, hoverListener: false }
})

// Computes the LaTeX formula for the drug concentration, highlighting variables in red when hovered.
const latexFormula = computed(() => {
  let dose = drugModelData.dose.hoverListener ? '\\textcolor{red}{dose}' : 'dose'
  let cl = drugModelData.Cl.hoverListener ? '\\textcolor{red}{Cl}' : 'Cl'
  let vd = drugModelData.Vd.hoverListener ? '\\textcolor{red}{Vd}' : 'Vd'
  return `C = \\frac{${dose}}{${vd}} \\cdot e^{-{\\frac{${cl}}{${vd}}} \\cdot t}`

})

const latexHalfLife = computed(() => {
  let cl = drugModelData.Cl.hoverListener ? '\\textcolor{red}{Cl}' : 'Cl'
  let vd = drugModelData.Vd.hoverListener ? '\\textcolor{red}{Vd}' : 'Vd'
  return `t_{1/2} = 0.693 * \\frac{${vd}}{${cl}}`
})

// Chart options and setup for the single IV dosing display.
// chart options for single iv dosing
let { chartOptions } = useSingleIVDosingStore()

// drug model
const drugModel = computed(() => new SingleIVDosingModel(drugModelData.dose.value, drugModelData.Cl.value, drugModelData.Vd.value))


const updateSeries = debounce(() => {
  series.value[0].data = chartOptions.xaxis.categories.map(hour => drugModel.value.plasmaConcentrationAtTime(hour))

}, 50) // 50 ms debounce to prevent too many updates


watch(drugModelData, updateSeries)

// Other component state such as the chart series data, and UI state like panels and tabs.
const series = ref([
  {
    name: 'Plasma Concentration',
    data: chartOptions.xaxis.categories.map(hour => drugModel.value.plasmaConcentrationAtTime(hour)),
    color: '#0000FF'
  }
])

const chart = ref<ApexCharts | null>(null)
const updateOptions = (options: any) => {
  chart.value?.updateOptions(options)
}


// binding for expansion panel
const descriptionPanel = ref([0])
// binding for tabs (graph / code )
const tab = ref('graph')
// binding for config dialog
const showConfigDialog = ref(true)

const code = ref(`############
#Insert Drug parameters, Cl = clearance (L/h), Vd = volume of distribution (L), and dose in mg.
dose =100
Cl =20
Vd =200
############

#############################################################
# DO NOT CHANGE THESE
#############################################################
# Initial concentration is dose over volume of distribution
ystart =dose/Vd

#The elimination rate constant is CL over Vd
k = Cl/Vd

import matplotlib.pyplot as plt
import numpy as np

t = np.linspace(0, 24, 100)
y = ystart * np.exp(-k*t)

fig = plt.figure(figsize = (10, 5))
# Create the plot
plt.plot(t, y)
plt.xlabel("Time (h)")
plt.ylabel("Plasma Concentration (mg/L)")

# Show the plot
plt.show()
`)


</script>

<template>
  <!-- margin left and right to leave space for both sidebars -->
  <v-row class='mx-3 mt-2'>
    <v-col v-show="xs" cols="12">
      <!--   title card   -->
      <div class="font-weight-bold use-cairo-font text-center">
        {{ t('pages.formulas.titles.singeIVDosing') }}
      </div>
    </v-col>
    <v-col cols='12'>
      <v-expansion-panels v-model='descriptionPanel' >
        <v-expansion-panel>
          <v-expansion-panel-title data-cy="description-expansion-panel" class='text-subtitle-1 text-uppercase font-weight-bold use-cairo-font'>
            {{ t('pages.formulas.descriptions.shortDescription') }}
          </v-expansion-panel-title>
          <v-expansion-panel-text data-cy="description-panel-content">{{ t('pages.formulas.descriptions.singeIVDosing') }}</v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-col>
    <v-col cols='12'>
      <v-card>
        <v-tabs fixed-tabs v-model='tab'>
          <v-tab value='graph' data-cy="graph-tab">Graph</v-tab>
          <v-tab value='code' data-cy="code-tab">Code</v-tab>
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
                        <latex-render style='font-size: 1.5em' class='ml-3' v-model='latexFormula'></latex-render>
                        <v-spacer></v-spacer>
                        <v-btn v-show="!xs" @click="showConfigDialog = false" icon="mdi-fullscreen"></v-btn>                        <single-iv-dosing-dialog
                          :drugModelData='drugModelData'
                          :updateOptions='updateOptions'
                        >
                        </single-iv-dosing-dialog>
                      </v-card-actions>
                      <v-col cols="12">
                        <latex-render style="font-size: 1.25em" class="ml-1" v-model="latexHalfLife"></latex-render>
                      </v-col>
                      <v-card-text>

                        <v-sheet v-for='slide in drugModelData' :key='slide.label'
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
                <a href="https://colab.research.google.com/github/sladem-tox/PK_calcs/blob/main/PlasmaTime_SingleIV.ipynb" target="_blank"><img src="https://colab.research.google.com/assets/colab-badge.svg" alt="Open In Colab"/></a>
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
.code-editor-scrollable {
  overflow: auto;
}
</style>
