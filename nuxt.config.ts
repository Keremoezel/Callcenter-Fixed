// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // https://nuxt.com/modules
  modules: ["@nuxthub/core", "@nuxt/eslint", "@nuxt/ui"],
  css: ["~/assets/css/main.css"],

  // https://devtools.nuxt.com
  devtools: { enabled: true },

  // Nuxt UI Configuration
  ui: {},

  // Color Mode Configuration
  colorMode: {
    preference: "light",
    fallback: "light",
    classSuffix: "",
  },

  // Env variables - https://nuxt.com/docs/getting-started/configuration#environment-variables-and-private-tokens
  runtimeConfig: {
    public: {
      // Can be overridden by NUXT_PUBLIC_HELLO_TEXT environment variable
      helloText: "Hello from the Edge 👋",
    },
  },

  nitro: {
    experimental: {
      tasks: true,
    },
  },

  ssr: false,

  // https://nuxt.com/docs/getting-started/upgrade#testing-nuxt-4
  future: { compatibilityVersion: 4 },
  compatibilityDate: "2025-03-01",

  // https://hub.nuxt.com/docs/getting-started/installation#options
  hub: {
    database: true,
  },

  // Development config
  eslint: {
    config: {
      stylistic: {
        quotes: "single",
        commaDangle: "never",
      },
    },
  },
});
