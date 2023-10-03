<script setup lang='ts'>

/**
 * Module dependencies
 */
import {useI18n} from 'vue-i18n';
import lodash from 'lodash';
import {useDisplay} from "vuetify";
import {useSingleOralDoseStore} from '@/stores/singleOralDose';


const { t } = useI18n();
const { debounce } = lodash;
const hoveredPoint = reactive({ time: null, derivative: null });


/**
 * Class representing the Oral Dosing Model.
 */
class OralDosingModel {
  _dose: number
  _Cl: number
  _Vd: number
  _F: number
  _ka: number

  /**
   * Class constructor for initializing the properties.
   *
   * @param {number} dose - The dose of the drug.
   * @param {number} Cl - The clearance rate.
   * @param {number} Vd - The volume of distribution.
   * @param {number} F - The bioavailability factor.
   * @param {number} ka - The absorption rate constant.
   */
  constructor(dose: number, Cl: number, Vd: number, F: number, ka: number) {
    this._dose = dose
    this._Cl = Cl
    this._Vd = Vd
    this._F = F
    this._ka = ka
  }

  /**
   * Calculates the elimination rate constant.
   *
   * @returns {number} - The elimination rate constant.
   * @private
   */
  private get eliminationRateConstant(): number {
    return this._Cl / this._Vd
  }

  /**
   * Calculates the plasma concentration at a specific time.
   *
   * @param {number} t - The time in hours.
   * @returns {number} - The plasma concentration at the given time.
   */
  plasmaConcentrationAtTime(t: number): number {
    const k = this.eliminationRateConstant
    const kdif = this._ka - k
    return ((this._F * this._dose * this._ka) / (this._Vd * kdif)) * (Math.exp(-k * t) - Math.exp(-this._ka * t))
  }

  /**
   * Calculates the derivative of plasma concentration at a specific time.
   *
   * @param {number} t - The time in hours.
   * @returns {number} - The derivative value at the given time.
   */
  derivativeAtTime(t: number): number {
    const F = this._F;
    const dose = this._dose;
    const ka = this._ka;
    const Vd = this._Vd;
    const Cl = this._Cl;

    const A = F * dose * ka / (Vd * (ka - Cl / Vd));
    const B = -Cl / Vd;
    const C = -ka;

    return A * (Math.exp(B * t) * B - Math.exp(C * t) * C);
  }
}

/**
 * Type definition for the drug model data entry.
 */
type DrugModelDataEntry = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  hoverListener: boolean;
};

/**
 * Type definition for the drug model data structure.
 */
type DrugModelDataType = Record<'dose' | 'Cl' | 'Vd' | 'F' | 'ka', DrugModelDataEntry>;

/**
 * Reactive data structure for drug model parameters.
 */
const drugModelData: DrugModelDataType = reactive({
  dose: { label: 'Dose(mg) D', value: 200, min: 0, max: 1000, step: 0.1, hoverListener: false },
  Cl: { label: 'Clearance(L/h) Cl', value: 20, min: 0, max: 50, step: 0.1, hoverListener: false },
  Vd: { label: 'Volume of Distribution(L) Vd', value: 200, min: 0, max: 500, step: 0.1, hoverListener: false },
  F: { label: 'Bioavailability F', value: 0.8, min: 0, max: 1, step: 0.01, hoverListener: false },
  ka: { label: 'Absorption Rate Constant(1/h) ka', value: 0.009 * 60, min: 0, max: 1, step: 0.001, hoverListener: false }
})

/**
 * Computed property to generate LaTeX formula for plasma concentration.
 */
const latexFormula = computed(() => {
  let dose = drugModelData.dose.hoverListener ? '\\textcolor{red}{Dose}' : 'Dose';
  let cl = drugModelData.Cl.hoverListener ? '\\textcolor{red}{Cl}' : 'Cl';
  let vd = drugModelData.Vd.hoverListener ? '\\textcolor{red}{Vd}' : 'Vd';
  let f = drugModelData.F.hoverListener ? '\\textcolor{red}{F}' : 'F';
  let ka = drugModelData.ka.hoverListener ? '\\textcolor{red}{k_a}' : 'k_a';
  return `C = \\frac{${f} \\cdot ${dose} \\cdot ${ka}}{${vd} \\cdot (${ka} - \\frac{${cl}}{${vd}})} \\cdot (e^{-\\frac{${cl}}{${vd}}t} - e^{-${ka} t})`;
});

const halfTimeFormula = computed(() => {
  let cl = drugModelData.Cl.hoverListener ? '\\textcolor{red}{Cl}' : 'Cl';
  let vd = drugModelData.Vd.hoverListener ? '\\textcolor{red}{Vd}' : 'Vd';
  return `t_{\\frac{1}{2}} = 0.693 \\cdot \\frac{${vd}}{${cl}}`
})




const drugModel = computed(() => new OralDosingModel(
    drugModelData.dose.value,
    drugModelData.Cl.value,
    drugModelData.Vd.value,
    drugModelData.F.value,
    drugModelData.ka.value))

/**

 * Fetches chart options and initializes the drug model.
 */
let { chartOptions } = useSingleOralDoseStore()
const allConcentrations = chartOptions.xaxis.categories.map(hour => drugModel.value.plasmaConcentrationAtTime(hour));
const maxConcentration = Math.max(...allConcentrations);
const minConcentration = Math.min(...allConcentrations);

chartOptions = {
  ...chartOptions,
  yaxis: {
    min: minConcentration,
    max: maxConcentration,
    labels: {
      formatter: function(val: number) {
        return val.toFixed(2);
      }
    }
  },
  tooltip: {
    y: {
      formatter: function(value: number, opts: { seriesIndex: number, dataPointIndex: number }): string {
        const time = chartOptions.xaxis.categories[opts.dataPointIndex];
        const derivativeValue = drugModel.value.derivativeAtTime(time);
        hoveredPoint.time = time;
        hoveredPoint.derivative = derivativeValue;
        return `Plasma Concentration: ${value.toFixed(2)}<br>Derivative: ${derivativeValue.toFixed(2)}`;
      }
    }
  }
}

const tangentLine = computed(() => {
  if (!hoveredPoint.time) return [];

  const m = hoveredPoint.derivative;
  const x1 = hoveredPoint.time;
  const y1 = drugModel.value.plasmaConcentrationAtTime(x1);

  return chartOptions.xaxis.categories.map(x => m * (x - x1) + y1);
});




/**
 * Debounced function to update the data series.
 */
const updateSeries = debounce(() => {
  series.value[0].data = chartOptions.xaxis.categories.map(hour => drugModel.value.plasmaConcentrationAtTime(hour));
  series.value[1].data = tangentLine.value;
}, 50)


/**
 * Watches changes to drugModelData and updates the series accordingly.
 */
watch(drugModelData, updateSeries)
watch(hoveredPoint, updateSeries);


/**
 * Data series for the chart.
 */
const series = ref([
  {
    name: '',
    data: chartOptions.xaxis.categories.map(hour => drugModel.value.plasmaConcentrationAtTime(hour)),
    color: '#0000FF'
  },
  {
    name: '',
    data: [],
    color: '#FF0000'
  }
])

/**
 * Ref for the ApexCharts instance.
 */
const chart = ref<ApexCharts | null>(null)

/**
 * Updates the chart with new options.
 *
 * @param {any} options - New options for the chart.
 */
const updateOptions = (options: any) => {
  chart.value?.updateOptions(options)
}

/**
 * Refs for controlling the description panel and configuration dialog.
 */
const descriptionPanel = ref([0])
const tab = ref('graph')
const {xs} = useDisplay();
const showConfigDialog = ref(true)
const code = ref(`############
#Insert Drug parameters, Cl = clearance (L/h), Vd = volume of distribution (L), and dose in mg, bioavailability (F), and absorption rate constant (ka).
#Here we are using the PK parameters from the single IV curve we already ran in this repo.
# For more on the estimation of oral PK parameters see: Gabrielsson 2006 (page 508)
# Parameters:
dose =200
Cl = 20
Vd =200
#Bioavailability would need to be determined experimentally. F = AUCoral/AUCiv
F = 0.8
# We also need to set the absorption rate constant:
#Ka is experimentally extrapolated by means of a method of residuals (feathering) where ka corresponds to the slope of the residual line.
#Here the number chosen gives a nice shaped curve! You would need to consult published papers to find values of Ka for your drug or determine it experimentally.
ka = 0.009*60
############
#Assuming that we have the data from the single IV curve we now know Cl and Vd so k can be estimated:
#The elimination rate constant is simply given by CL over Vd
k = Cl/Vd
#Calculate half-life
import numpy as np
hl = -np.log(.5)/k
print("The half-life for the drug is %.2f hours." % hl)
import matplotlib.pyplot as plt
import numpy as np
kdif = ka - k
t = np.linspace(0, 24, 100)
y = ((F*dose*ka)/(Vd*kdif)) * (np.exp(-k*t) - np.exp(-ka*t))
fig = plt.figure(figsize = (10, 5))
# Create the plot
plt.plot(t, y)
plt.xlabel("Time (h)")
plt.ylabel("Plasma Concentration (mg/L)")
# Show the plot
plt.show()
#The oral disposition equation can be defined as a function so we can ask it about specific times.
def oral(t):
  return str(round(((F*dose*ka)/(Vd*kdif)) * (np.exp(-k*t) - np.exp(-ka*t)),2)) + ' mg/L'
oral(5)
for i in range(10):
  print(oral(i))
`)
</script>

<template>
  <!-- The primary layout component of the oral dosing plasma-time curve page. -->
  <v-row class='mx-3 mt-2'>
    <v-col v-show="xs" cols='12'>
      <!-- Card that displays the page title. -->
      <v-card>
        <v-card-title>
          <!-- Title will hide on extra small screens -->
          <h1 v-show="!xs" class='text-h2 use-cairo-font'>{{ t('pages.formulas.titles.oralDosingPlasmaTimeCurve') }}</h1>
        </v-card-title>
        <v-card-text>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols='12'>

      <!--
        Expansion panels that provide a short description about oral dosing plasma-time curve.
      -->
      <v-expansion-panels v-model='descriptionPanel'>
        <v-expansion-panel>
          <v-expansion-panel-title class='text-subtitle-1 text-uppercase font-weight-bold use-cairo-font'>
            {{ t('pages.formulas.descriptions.shortDescription') }}
          </v-expansion-panel-title>
          <v-expansion-panel-text>{{ t('pages.formulas.descriptions.oralDosingPlasmaTimeCurve') }}</v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-col>

    <v-col cols='12'>

      <!--
        Card that hosts tabs for switching between graphical and code representations.
      -->
      <v-card>
        <v-tabs fixed-tabs v-model='tab'>
          <v-tab value='graph'>Graph</v-tab>
          <v-tab value='code'>Code</v-tab>
        </v-tabs>

        <v-card-text>

          <!--
            Window that switches the content based on the selected tab.
          -->
          <v-window disabled v-model='tab'>

            <!--
              Content window for the 'Graph' tab.
              Contains configuration options and the actual graph representation.
            -->
            <v-window-item value='graph'>
              <v-row>
                <v-slide-x-transition>
                  <!--
                    Left-side column for graph configurations.
                    It can be toggled to provide more viewing space for the graph.
                  -->
                  <v-col cols='12' md="4" v-show='showConfigDialog'>
                    <!-- Card for latex formula and configuration options. -->
                    <v-card elevation='0'>
                      <v-card-actions>

                        <v-row>
                          <v-col cols="12">
                            <latex-render style='font-size: 1.4em' class='ml-3' v-model='latexFormula'></latex-render>
                          </v-col>
                          <v-col cols="12">
                            <latex-render style="font-size: 1.25em" class="ml-1" v-model="halfTimeFormula"></latex-render>
                          </v-col>
                        </v-row>

                        <v-spacer></v-spacer>
                        <!-- Fullscreen toggle button. -->
                        <v-btn v-show="!xs" @click='showConfigDialog = false' icon='mdi-fullscreen' class="btn-hover btn-active"></v-btn>
                        <!-- Custom dialog for additional configurations. -->
                        <oral-dosing-plasma-dialog
                            :drugModelData='drugModelData'
                            :updateOptions='updateOptions'
                        >
                        </oral-dosing-plasma-dialog>
                      </v-card-actions>

                      <v-card-text>
                        <!-- Dynamic sliders for drug model configurations. -->
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
                          >
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

                <!-- Right-side column that displays the actual graph. -->
                <v-col :cols='showConfigDialog? 8: 12'>
                  <v-btn @click='showConfigDialog = true'
                         v-show='!showConfigDialog'
                         variant='text'
                         icon='mdi-fullscreen-exit'
                         class="btn-hover btn-active"></v-btn>
                  <!-- Apex chart for plotting the oral dosing plasma-time curve. -->
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

            <!--
              Content window for the 'Code' tab.
              Reserved for future use or implementation of code-based view.
            -->
            <v-window-item value='code'>

              <div class="d-flex justify-end mr-1">
                <a href="https://colab.research.google.com/github/sladem-tox/PK_calcs/blob/main/SingleOralDose.ipynb" target="_blank"><img src="https://colab.research.google.com/assets/colab-badge.svg" alt="Open In Colab"/></a>
              </div>

              <code-editor class="code-editor-scrollable" v-model="code"></code-editor>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

</template>


<style>
/* Hover animation for buttons */
.btn-hover:hover {
  transform: scale(1.05);
  transition: transform 0.2s;
}
.code-editor-scrollable {
  overflow: auto;
}

/* Click animation for buttons */
.btn-active:active {
  transform: scale(0.95);
}

/* Smooth transition for toggle-able sections */
.slide-transition-enter-active, .slide-transition-leave-active {
  transition: opacity 0.5s, transform 0.5s;
}
.slide-transition-enter, .slide-transition-leave-to {
  opacity: 0;
  transform: translateY(1em);
}

/* Placeholder for possible loading animation */
.loading {
  animation: spin 1s infinite linear;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Small devices (landscape phones, 576px and up) */
@media (min-width: 576px) {
  /* Add styles specific to small devices here */
}

/* Medium devices (tablets, 768px and up) */
@media (min-width: 768px) {
  /* Add styles specific to medium devices here */
}

/* Large devices (desktops, 992px and up) */
@media (min-width: 992px) {
  /* Add styles specific to large devices here */
}

/* Extra large devices (large desktops, 1200px and up) */
@media (min-width: 1200px) {
  /* Add styles specific to extra large devices here */
}
</style>
