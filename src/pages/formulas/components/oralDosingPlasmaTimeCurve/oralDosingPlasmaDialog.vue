<script setup lang='ts'>

import { useSingleOralDoseStore } from '@/stores/singleOralDose';
const store = useSingleOralDoseStore();
const { chartOptions } = useSingleOralDoseStore()
const dialog = ref(false)
const { drugModelData, updateOptions } = defineProps(['drugModelData', 'updateOptions'])

const showXAxisLines = computed({
  get: () => chartOptions.grid.xaxis.lines.show,
  set: (value) => {
    chartOptions.grid.xaxis.lines.show = value
    updateOptions({ grid: { xaxis: { lines: { show: value } } } })
  }
})

const showYAxisLines = computed({
  get: () => chartOptions.grid.yaxis.lines.show,
  set: (value) => {
    chartOptions.grid.yaxis.lines.show = value
    updateOptions({ grid: { yaxis: { lines: { show: value } } } })
  }
})

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
  <v-dialog
    v-model='dialog'
    scrollable
    max-width='800px'
  >
    <template v-slot:activator='{ props }'>
      <v-btn
        icon='mdi-cog-outline'
        v-bind='props'
      >
      </v-btn>
    </template>
    <v-card>
      <v-card-title>Advance Setting</v-card-title>
      <v-divider></v-divider>
      <v-card-item>
        <v-row>
          <v-col cols='4' v-for='data in drugModelData'>
            <v-card elevation='0'>
              <v-card-text>
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
          <v-col>
            <v-card elevation='0'>
              <div class='font-weight-bold'>Grid</div>
              <v-switch label='X' v-model='showXAxisLines'></v-switch>
              <v-switch label='Y' v-model='showYAxisLines'></v-switch>
            </v-card>
          </v-col>
          <v-col>
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