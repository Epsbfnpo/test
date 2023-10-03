
<script setup lang='ts'>


import {useI18n} from "vue-i18n";
import lodash from 'lodash';
import {useIntravenousInfusionAndEffectOfClearance} from "@/stores/useIntravenousInfusionAndEffectOfClearance";
import {useDisplay} from "vuetify";

const {t} = useI18n();
const {debounce} = lodash;


//
class intravenousInfusionModel {
  _infusionRate: number // infusion rate(mg/h)
  _clearance: number //clearnce (L/h)
  _clearance2: number // another clearance
  _clearance3: number //
  _volume: number //volume of distribution

  constructor(infusionRate: number = 10, clearance: number = 40,
              clearance2: number = 60, clearance3: number = 80,
              volume: number = 200) {
    this._infusionRate = infusionRate
    this._clearance = clearance
    this._clearance2 = clearance2
    this._clearance3 = clearance3
    this._volume = volume
  }

  getEliminationRate(cl: number): number {
    return (cl / this._volume);
  }

  getPlasmaConcentrationForCL1(time: number) {
    const concentration = ((this._infusionRate / this._clearance) * (1 - Math.exp(-this.getEliminationRate(this._clearance) * time)));
    return concentration;
  }
  getPlasmaConcentrationForCL2(time: number) {
    const concentration = ((this._infusionRate / this._clearance2) * (1 - Math.exp(-this.getEliminationRate(this._clearance2) * time)));
    return concentration;
  }
  getPlasmaConcentrationForCL3(time: number) {
    const concentration = ((this._infusionRate / this._clearance3) * (1 - Math.exp(-this.getEliminationRate(this._clearance3) * time)));
    return concentration;
  }
}

// type for drug model data
type DrugModelDataEntry = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  hoverListener: boolean;
};

type DrugModelDataType = Record<'k0' | 'cl' | 'cl2' | 'cl3' | 'vd', DrugModelDataEntry>;

const drugModelData: DrugModelDataType = reactive({
  k0: {
    label: t('pages.formulas.parameters.infusionRate'),
    value: 10,
    min: 0,
    max: 1000,
    step: 0.1,
    hoverListener: false
  },
  cl: {label: t('pages.formulas.parameters.clearance1'), value: 40, min: 0, max: 1000, step: 0.1, hoverListener: false},
  cl2: {
    label: t('pages.formulas.parameters.clearance2'),
    value: 60,
    min: 0,
    max: 1000,
    step: 0.1,
    hoverListener: false
  },
  cl3: {
    label: t('pages.formulas.parameters.clearance3'),
    value: 80,
    min: 0,
    max: 1000,
    step: 0.1,
    hoverListener: false
  },
  vd: {
    label: t('pages.formulas.parameters.volumeOfDistribution'),
    value: 200,
    min: 0,
    max: 1000,
    step: 0.1,
    hoverListener: false
  }
})

const latexFormula = computed(() => {
  let k0 = drugModelData.k0.hoverListener ? '\\textcolor{red}{K0}' : 'K0'
  let cl = (drugModelData.cl.hoverListener || drugModelData.cl2.hoverListener || drugModelData.cl3.hoverListener)
      ? '\\textcolor{red}{Cl}' : 'Cl'
  return `C = \\frac{${k0}}{${cl}} \\cdot (1 - e^{-K_et})`

})

const latexHalfLife = computed(() => {
  let cl = (drugModelData.cl.hoverListener || drugModelData.cl2.hoverListener || drugModelData.cl3.hoverListener)
      ? '\\textcolor{red}{Cl}' : 'Cl'
  let vd = drugModelData.vd.hoverListener ? '\\textcolor{red}{Vd}' : 'Vd'
  return `\\text{Half Life} = 0.693 \\times \\frac{${vd}}{${cl}}`
})

const halfLifeAndSteadyStateMessages = computed(() => {
  const Vd = drugModelData.vd.value;
  const clearances = [drugModelData.cl.value, drugModelData.cl2.value, drugModelData.cl3.value];

  return clearances.map((Cl, index) => {
    const halfLife = 0.693 * (Vd / Cl);
    const ttss = 5 * halfLife;
    return `It will take ${ttss.toFixed(2)} hours to reach steady-state if clearance is ${Cl.toFixed(0)} (Clearance ${index + 1})`;
  });
});


let {chartOptions} = useIntravenousInfusionAndEffectOfClearance()

const drugModel = computed(() => new intravenousInfusionModel(drugModelData.k0.value, drugModelData.cl.value, drugModelData.cl2.value,
    drugModelData.cl3.value, drugModelData.vd.value))

const updateSeries = debounce(() => {
  series.value[0].data = chartOptions.xaxis.categories.map(hour => drugModel.value.getPlasmaConcentrationForCL1(hour));
  series.value[1].data = chartOptions.xaxis.categories.map(hour => drugModel.value.getPlasmaConcentrationForCL2(hour));
  series.value[2].data = chartOptions.xaxis.categories.map(hour => drugModel.value.getPlasmaConcentrationForCL3(hour));
}, 50);


watch(drugModelData, updateSeries)

const series = ref([
  {
    name: 'Plasma Concentration for CL1',
    data: chartOptions.xaxis.categories.map(hour => drugModel.value.getPlasmaConcentrationForCL1(hour)),
    color: '#FFDAB9'
  },
  {
    name: 'Plasma Concentration for CL2',
    data: chartOptions.xaxis.categories.map(hour => drugModel.value.getPlasmaConcentrationForCL2(hour)),
    color: '#FFA07A'
  },
  {
    name: 'Plasma Concentration for CL3',
    data: chartOptions.xaxis.categories.map(hour => drugModel.value.getPlasmaConcentrationForCL3(hour)),
    color: '#FFE4E1'
  }
]);

const showConfigDialog = ref(true)

const chart = ref <ApexCharts | null >(null)

const updateOptions = (options: any) =>{
  chart.value?.updateOptions(options)
}

// This keeps the expansion panel open by default
const panel = ref(0);
const tab = ref('graph')
const {xs} = useDisplay();

const code = ref(`############
#Insert Drug parameters, Cl = clearance (L/h), Vd = volume of distribution (L), and dose in mg.
#K0 = infusion rate (mg/h)
K0 = 10
Cl = 40
Cl2 = 60
Cl3 = 80
Vd = 200
############


#The elimination rate constant is CL over Vd
k = Cl/Vd
k2 = Cl2/Vd
k3 = Cl3/Vd

import matplotlib.pyplot as plt
import numpy as np

t = np.linspace(0, 24, 100)
y = K0/Cl * (1-np.exp(-k*t))

fig = plt.figure(figsize = (10, 5))
# Create the plot
plt.plot(t, y, label = "Clearance 40 L/h")
plt.plot(t, K0/Cl2 * (1-np.exp(-k2*t)), label = "Clearance 60 L/h")
plt.plot(t, K0/Cl3 * (1-np.exp(-k3*t)), label = "Clearance 80 L/h")
plt.xlabel("Time (h)")
plt.ylabel("Plasma Concentration (mg/L)")

# Show the plot
plt.legend()
plt.show()


halflife = 0.693 * (Vd/Cl)
ttss = 5 * halflife
print("It will take %.2f hours to reach steadystate if clearance is %.f" % (ttss, Cl))


halflife2 = 0.693 * (Vd/Cl2)
ttss2 = 5 * halflife2
print("It will take %.2f hours to reach steadystate if clearance is %.f" % (ttss2, Cl2))


halflife3 = 0.693 * (Vd/Cl3)
ttss3 = 5 * halflife3
print("It will take %.2f hours to reach steadystate if clearance is %.f" % (ttss3, Cl3))
`)

</script>
<!--TODO Add all texts to the yml file-->

<template>
  <!--  <div class="bg-yellow-lighten-5">-->
  <v-row class="mx-3 mt-2">
    <v-col v-show="xs" cols="12">
      <!--Title-->
      <div class="font-weight-bold use-cairo-font text-center">
        {{ t('pages.formulas.titles.intravenousInfusionAndEffectOfClearance') }}
      </div>
    </v-col>
    <!--expansion panel of the description-->
    <v-col cols="12">
      <v-expansion-panels class="mt-2 mb-2" v-model="panel">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <p class="text-subtitle-1 font-weight-bold use-cairo-font">
              {{ t('pages.formulas.descriptions.shortDescription') }}</p>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <p class="use-cario-font"> {{
                t('pages.formulas.descriptions.intravenousInfusionAndEffectOfClearance')
              }} </p>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-col>

    <v-col cols = "12">
      <v-card>
        <v-tabs fixed-tabs v-model="tab">
          <v-tab value="graph">{{t('pages.formulas.descriptions.graph')}}</v-tab>
          <v-tab value="code">{{t('pages.formulas.descriptions.code')}}</v-tab>
        </v-tabs>

        <v-card-text>
          <v-window disabled v-model="tab">
            <v-window-item value="graph">
              <!--Equation and the slider -->
              <v-row>
                <v-slide-x-transition>
                  <v-col cols="12" md="4"  v-show='showConfigDialog'>
                    <v-card elevation="0">
                      <v-card-actions>
                        <v-row>
                          <v-col cols="12">
                            <latex-render style="font-size: 1.25em" class="ml-1" v-model="latexFormula"></latex-render>
                          </v-col>
                          <v-col cols="12">
                            <latex-render style="font-size: 1.25em" class="ml-1" v-model="latexHalfLife"></latex-render>
                          </v-col>
                          <v-col cols="12">
                            <div v-for="(message, index) in halfLifeAndSteadyStateMessages" :key="index">
                              {{ message }}
                            </div>
                          </v-col>
                        </v-row>
                        <v-spacer></v-spacer>
                        <v-btn v-show="!xs" @click="showConfigDialog = false" icon="mdi-fullscreen"></v-btn>                        <intravenous-infusion-dialog
                            :drugModelData='drugModelData'
                            :updateOptions='updateOptions'>
                        </intravenous-infusion-dialog>
                      </v-card-actions>
                      <v-card-text>

                        <v-sheet v-for="slide in drugModelData" :key="slide.label"                                 @mouseover="slide.hoverListener=true"
                                 @mouseleave="slide.hoverListener=false"
                        >
                          <div class="mb-2 font-weight-bold">{{slide.label}}</div>
                          <v-slider
                              v-model="slide.value"
                              :min="slide.min"
                              :max="slide.max"
                              :step="slide.step"
                              class="align-center use-cairo-font"
                              thumb-label
                          >
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

                <v-col cols="12" :md="showConfigDialog? 8:12">
                  <v-btn @click="showConfigDialog = true"
                         v-show="!showConfigDialog"
                         variant="text"
                         icon="mdi-fullscreen-exit"></v-btn>
                  <apexchart
                      ref="chart"
                      height="400"
                      type="line"
                      :options="chartOptions"
                      :series="series"
                  ></apexchart>
                </v-col>
              </v-row>
            </v-window-item>
            <v-window-item value='code'>
              <div class="d-flex justify-end mr-1">
                <a href="https://colab.research.google.com/github/sladem-tox/PK_calcs/blob/main/Infusion_curves.ipynb" target="_blank"><img src="https://colab.research.google.com/assets/colab-badge.svg" alt="Open In Colab"/></a>
              </div>
              <code-editor class="code-editor-scrollable" v-model="code"></code-editor>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>
    </v-col>

  </v-row>

  <!--  </div>-->


</template>


<style scoped>

.use-cairo-font{
  font-family: "Cairo", sans-serif !important;
}
.code-editor-scrollable {
  overflow: auto;
}

</style>
