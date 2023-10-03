<template>
  <codemirror
      :value="modelValue"
      :style="{ height: '400px' }"
      :autofocus="true"
      :indent-with-tab="true"
      :tab-size="2"
      :extensions="extensions"
      @ready="handleReady"
      @change="handleChange"

  />
<!--        @focus="log('focus', $event)"
      @blur="log('blur', $event)"-->
</template>

<script>
import { defineComponent, ref, shallowRef, watch } from 'vue'
import Codemirror from 'vue-codemirror6';
import { javascript } from '@codemirror/lang-javascript'
import {python} from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark'
import {vscodeDark} from "@uiw/codemirror-theme-vscode";
export default defineComponent({
  components: {
    Codemirror
  },
  props: {
    modelValue: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      default: 'python',
    },
  },
  setup(props, { emit }) {
    const currentLanguage = ref(props.language)
    const extensions = computed(() => {
      const extensions = [vscodeDark]
      if (currentLanguage.value === 'javascript') {
        extensions.push(javascript())
      } else if (currentLanguage.value === 'python') {
        extensions.push(python())
      }
      // ... other language ...
      return extensions
    })
    const view = shallowRef()

    const handleReady = (payload) => {
      view.value = payload.view;
      view.value.dispatch({
        changes: { from: 0, to: view.value.state.doc.length, insert: props.modelValue },
      });
    }

    // handel the user input and update the modelValue
    const handleChange = () => {
      if (view.value) {
        const code = view.value.state.doc.toString()
        emit('update:modelValue', code)
      }
    }

    // watch the modelValue and update the editor
    watch(
        () => props.modelValue,
        (newVal) => {
          if (view.value && view.value.state.doc.toString() !== newVal) {
            view.value.dispatch({
              changes: { from: 0, to: view.value.state.doc.length, insert: newVal },
            })
          }
        }
    )

    return {
      extensions,
      handleReady,
      handleChange,
      log: console.log,
    }
  },
})
</script>
