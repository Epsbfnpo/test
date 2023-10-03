<script setup lang='ts'>
import {useRouter} from 'vue-router';
import {useRouteStore} from '@/stores/route'
import {useI18n} from "vue-i18n";
import { useAppI18n } from '@/composables/useAppI18n'
import {useDisplay} from "vuetify";


const { availableLocales, onToggleLocale } = useAppI18n()

defineProps({
  color: {
    type: String,
    default: 'inherit',
  },
})

const {t} = useI18n();

const sideNavBar = ref(false);
const {formulas} = useRouteStore()
const router = useRouter();

const navigateToHome = () => {
  router.push({path: '/'})
}

const formulaName = computed(() => {
  const formula = formulas.find((formula) => formula.path === router.currentRoute.value.path)
  return formula ? t(formula.key) : 'PKcalcs'
})
const { xs} = useDisplay()

</script>


<template>
  <v-app>
    <v-layout>
      <v-app-bar>
        <!-- button for expand navigation bar -->
        <!-- Testing changes: add data attributes for testing -->
        <v-btn data-cy="nav-bar-btn" @click="sideNavBar = !sideNavBar">
          <span class="i-iconoir-menu text-2xl"></span>
        </v-btn>

        <div class="px-2 d-flex justify-center align-center" @click='navigateToHome'>


          <div v-if="!xs" class="text-h6 use-cairo-font">{{formulaName}}</div>
          <div v-else class="text-h6 use-cairo-font">PKcals</div>
        </div>

        <v-spacer></v-spacer>


        <v-spacer></v-spacer>
        <v-btn icon @click="navigateToHome" :color="color">
          <span class="i-iconoir-home text-2xl"></span>
        </v-btn>
        <!--  Toggle for change Locale -->
        <LocaleToggler/>
        <!-- Button for change Theme -->
        <ThemeToggler/>
      </v-app-bar>

      <!-- formula pages navigation bar -->

      <!-- Testing changes: add data attributes for testing -->
      <v-navigation-drawer
          v-model="sideNavBar"
          temporary
          data-cy="side-nav"
      >
        <!-- Testing changes: add data attributes for testing -->
        <v-list density="compact" nav>
          <v-list-item v-for="item in formulas"
                       :exact="item.path === $route.path"
                       :to="item.path"
                       :title="t(item.key)"
                       :value="item.path"
                       data-cy="nav-formula">
          </v-list-item>
        </v-list>
      </v-navigation-drawer
      >


      <v-main class="text-slate-700 dark:text-slate-300">
        <v-container fluid class="ma-0 pa-0">
          <RouterView/>
        </v-container>
      </v-main>
    </v-layout>
  </v-app>
</template>


<style scoped>

</style>
