<script setup lang='ts'>

// import { useSingleIVDosingStore } from '@/stores/single-iv-dosing'
// const store = useSingleIVDosingStore();
// const { chartOptions } = useSingleIVDosingStore()
// const dialog = ref(false)
// const { drugModelData, updateOptions } = defineProps(['drugModelData', 'updateOptions'])

// Imports the custom store for single IV dosing management.
import { useSingleIVDosingStore } from '@/stores/single-iv-dosing'

// Initialize the store and the chart options.
const store = useSingleIVDosingStore();
const { chartOptions } = useSingleIVDosingStore()

// Reference to control the visibility state of the dialog.
const dialog = ref(false)

// Define properties for this component: drug model data and a method to update chart options.
const { drugModelData, updateOptions } = defineProps(['drugModelData', 'updateOptions'])

// Computed property to get/set the visibility of X-axis grid lines on the chart.
const showXAxisLines = computed({
  get: () => chartOptions.grid.xaxis.lines.show,
  set: (value) => {
    chartOptions.grid.xaxis.lines.show = value
    updateOptions({ grid: { xaxis: { lines: { show: value } } } })
  }
})


// Computed property to get/set the visibility of Y-axis grid lines on the chart.
const showYAxisLines = computed({
  get: () => chartOptions.grid.yaxis.lines.show,
  set: (value) => {
    chartOptions.grid.yaxis.lines.show = value
    updateOptions({ grid: { yaxis: { lines: { show: value } } } })
  }
})


// Computed property to get/set the decimal places for the chart's Y-axis and tooltip values.
const decimal = computed({
  get: () => store.decimalPlaces,
  set: (newValue) => {
    store.changeDecimalPlaces(newValue);
    updateOptions({ yaxis: { labels: { formatter: (value: number) => value.toFixed(newValue) } },
      tooltip: { y: { formatter: (value: number) => `${value.toFixed(newValue)} mg/L` } }
    })
  }
})

</script>

<template>
  <!-- A dialog component for advanced settings. -->
  <v-dialog
    v-model='dialog'
    scrollable
    max-width='800px'
  >
    <!-- Button slot that triggers the dialog. -->
    <template v-slot:activator='{ props }'>
      <v-btn
        icon='mdi-cog-outline'
        v-bind='props'
      >
      </v-btn>
    </template>
    <!-- The content of the dialog. -->
    <v-card>
      <v-card-title>Advance Setting</v-card-title>
      <v-divider></v-divider>

      <!-- A section to input min and max values for each drug model data. -->
      <v-card-item>
        <v-row>
          <v-col cols="12" md='4' v-for='data in drugModelData'>
            <v-card elevation='0'>
              <v-card-text>
                <!-- Display the label of the current drug model data. -->
                <div class='font-weight-bold'>
                  {{ data.label }}
                </div>
                <v-row>
                  <v-col cols='6'>
                    <v-text-field variant='underlined' v-model='data.min'>
                      <template v-slot:prepend>
                        <div>
                          MIN
                        </div>
                      </template>
                    </v-text-field>
                  </v-col>
                  <v-col cols='6'>
                    <v-text-field variant='underlined' v-model='data.max'>
                      <template v-slot:prepend>
                        <div>
                          MAX
                        </div>
                      </template>
                    </v-text-field>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6">
            <v-card elevation='0'>
              <div class='font-weight-bold'>Grid</div>
              <v-switch label='X' v-model='showXAxisLines'></v-switch>
              <v-switch label='Y' v-model='showYAxisLines'></v-switch>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field variant='underlined' v-model='decimal'>
              <template v-slot:prepend>
                <div>
                  Decimal Places
                </div>
              </template>
            </v-text-field>
          </v-col>
        </v-row>
      </v-card-item>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color='blue-darken-1'
          variant='text'
          @click='dialog = false'
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>

</style>



<!--<template>-->
<!--  <v-dialog-->
<!--      v-model='dialog'-->
<!--      scrollable-->
<!--      max-width='800px'-->
<!--  >-->
<!--    <template v-slot:activator='{ props }'>-->
<!--      <v-btn-->
<!--          icon='mdi-cog-outline'-->
<!--          v-bind='props'-->
<!--      >-->
<!--      </v-btn>-->
<!--    </template>-->
<!--    <v-card>-->
<!--      <v-card-title>Advance Setting</v-card-title>-->
<!--      <v-divider></v-divider>-->
<!--      <v-card-item>-->
<!--        <v-row>-->
<!--          <v-col cols='4' v-for='data in drugModelData'>-->
<!--            <v-card elevation='0'>-->
<!--              <v-card-text>-->
<!--                <div class='font-weight-bold'>-->
<!--                  {{ data.label }}-->
<!--                </div>-->
<!--                <v-row>-->
<!--                  <v-col cols='6'>-->
<!--                    <v-text-field variant='underlined' v-model='data.min'>-->
<!--                      <template v-slot:prepend>-->
<!--                        <div>-->
<!--                          MIN-->
<!--                        </div>-->
<!--                      </template>-->
<!--                    </v-text-field>-->
<!--                  </v-col>-->
<!--                  <v-col cols='6'>-->
<!--                    <v-text-field variant='underlined' v-model='data.max'>-->
<!--                      <template v-slot:prepend>-->
<!--                        <div>-->
<!--                          MAX-->
<!--                        </div>-->
<!--                      </template>-->
<!--                    </v-text-field>-->
<!--                  </v-col>-->
<!--                </v-row>-->
<!--              </v-card-text>-->
<!--            </v-card>-->
<!--          </v-col>-->
<!--        </v-row>-->
<!--        <v-row>-->
<!--          <v-col>-->
<!--            <v-card elevation='0'>-->
<!--              <div class='font-weight-bold'>Grid</div>-->
<!--              <v-switch label='X' v-model='showXAxisLines'></v-switch>-->
<!--              <v-switch label='Y' v-model='showYAxisLines'></v-switch>-->
<!--            </v-card>-->
<!--          </v-col>-->
<!--          <v-col>-->
<!--            <v-text-field variant='underlined' v-model='decimal'>-->
<!--              <template v-slot:prepend>-->
<!--                <div>-->
<!--                  Decimal Places-->
<!--                </div>-->
<!--              </template>-->
<!--            </v-text-field>-->
<!--          </v-col>-->
<!--        </v-row>-->
<!--      </v-card-item>-->
<!--      <v-divider></v-divider>-->
<!--      <v-card-actions>-->
<!--        <v-spacer></v-spacer>-->
<!--        <v-btn-->
<!--            color='blue-darken-1'-->
<!--            variant='text'-->
<!--            @click='dialog = false'-->
<!--        >-->
<!--          Close-->
<!--        </v-btn>-->
<!--      </v-card-actions>-->
<!--    </v-card>-->
<!--  </v-dialog>-->
<!--</template>-->