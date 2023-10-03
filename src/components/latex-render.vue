<template>
  <div v-html="htmlString"></div>


</template>

<script>
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default {
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  computed: {
    htmlString() {
      const slotContent = this.$slots.default ? this.$slots.default()[0].children : '';
      const latex = this.modelValue || slotContent;
      return katex.renderToString(latex, {
        throwOnError: false
      });
    }
  }
};
</script>

<style scoped>

</style>
