<script setup lang='ts'>
import { useRouteStore } from '@/stores/route';
import {useI18n} from "vue-i18n";
import {useDisplay} from "vuetify";
import { onMounted } from "vue";
import particlesJs from "./particles.js";
import particlesConfig from "./particles.json";


const { t } = useI18n();

const { formulas } = useRouteStore();
const { xs, mdAndUp } = useDisplay();
onMounted(() => {
  particlesJs("particles-js", particlesConfig);
  document.body.style.overflow = "hidden";
});

function addRippleEffect(event) {
  const button = event.currentTarget;
  const circle = document.createElement("span");
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  circle.style.width = circle.style.height = `${size}px`;
  circle.style.left = `${x}px`;
  circle.style.top = `${y}px`;

  circle.classList.add("ripple-init");
  setTimeout(() => {
    circle.classList.add("ripple");
  }, 0);

  button.appendChild(circle);

  setTimeout(() => {
    circle.remove();
  }, 600);
}


</script>

<template>
  <div class="particles-js-box">
    <div id="particles-js"></div>
  </div>

  <v-container style='max-width: 1200px'>
    <v-row>
      <v-col cols='12' sm='6' md='6' lg='4' v-for='(pages, index) in formulas' :key="index" class='mb-xs-1 mb-md-5'>
        <v-hover v-slot='{ isHovering, props }'>
          <v-card
              :elevation='isHovering ? 12 : 2'
              class='mx-auto'
              v-bind='props'
              max-width='344'
              :to='pages.path'
              :data-cy="'formula-card-' + index"
              @click.native="addRippleEffect"
          >
            <v-img
                v-show="!xs"
                :src='pages.image'
                height="200"
                class='image-fit'
                :data-cy="'formula-card-image-' + index"
            ></v-img>

            <v-card-title :data-cy="'formula-card-title-' + index"> <!-- Added data-cy attribute for each title -->

              {{ t(pages.key) }}
            </v-card-title>
            <v-card-text>
              Formula
            </v-card-text>
          </v-card>
        </v-hover>
      </v-col>
    </v-row>
  </v-container>
</template>



<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.video-container video {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.particles-js-box {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: -1;
}
#particles-js {
  background-color: #2d3a4b;
  width: 100%;
  height: 100%;
}

.ripple-init {
  transform: scale(0);
}

.ripple {
  z-index: 1;
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  animation: ripple-animation 0.6s linear;
}

@keyframes ripple-animation {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

@keyframes ripple-animation {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

</style>


<route lang='yaml'>
meta:
  layout: dashboard
</route>