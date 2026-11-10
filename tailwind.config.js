import { colors } from './src/ui/tokens.js';
export default {
  content: ['./index.html', './src/**/*.js'],
  theme: {
    extend: {
      colors,
      fontFamily: { display: ['Inter', 'system-ui', 'sans-serif'], body: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
};
