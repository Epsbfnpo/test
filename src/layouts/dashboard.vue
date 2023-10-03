<!-- display layout for index page -->
<script setup lang='ts'>

</script>


<template>
    <v-app>
        <v-layout>
            <v-app-bar data-cy="app-bar">
                <div class="px-2 d-flex justify-center align-center ">

                  <div class="ml-4 text-h6 use-cairo-font">PKcals</div>
                </div>

                <v-spacer></v-spacer>


                <v-spacer></v-spacer>
                <!--  Toggle for change Locale -->
                <LocaleToggler data-cy="locale-toggler"/>
                <!-- Button for change Theme -->
                <ThemeToggler data-cy="theme-toggler"/>
            </v-app-bar>

          <!-- Add Data Attribute for testing -->
          <v-main data-cy="main-content" class="text-slate-700 dark:text-slate-300">
                <v-container fluid class="ma-0 pa-0">
                    <RouterView/>
                </v-container>
            </v-main>
        </v-layout>
    </v-app>
</template>


<style scoped>

</style>
