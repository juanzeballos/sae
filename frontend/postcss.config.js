// PostCSS procesa el CSS antes de enviarlo al navegador.
// Tailwind necesita esto para funcionar.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},  // agrega prefijos -webkit-, -moz-, etc. automaticamente
  },
}
