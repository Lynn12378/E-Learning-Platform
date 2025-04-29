/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify, type ThemeDefinition } from 'vuetify'

const myCustomLightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#efefef',
    surface: '#FFFFFF',
    primary: '#1976D2',
    'primary-darken-1': '#1565C0',
    secondary: '#00BFA5',
    'secondary-darken-1': '#00897B',
    error: '#D32F2F',
    info: '#0288D1',
    success: '#388E3C',
    warning: '#FBC02D',
  },
}

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'myCustomLightTheme',
    themes: {
      myCustomLightTheme,
    },
  },
})
