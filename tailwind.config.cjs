const config = {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {},
  },
  plugins: [
    require("daisyui"),
  ],
  daisyui: {
    themes: ["light", "pastel", "cupcake", "dark", "cmyk", "luxury", "halloween"],
  },
};

module.exports = config;
