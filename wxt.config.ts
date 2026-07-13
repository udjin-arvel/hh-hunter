import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: "HH-Hunter",
    version: "1.1.0",
    description:
      "Генерация персонализированных сопроводительных писем для вакансий HeadHunter с помощью DeepSeek.",
    permissions: ["storage", "activeTab", "sidePanel", "tabs", "scripting"],
    action: {},
    host_permissions: [
      "https://api.hh.ru/*",
      "https://api.deepseek.com/*",
      "https://hh.ru/*",
      "https://*.hh.ru/*",
    ],
    optional_host_permissions: ["https://*/*", "http://*/*"],
  },
});
