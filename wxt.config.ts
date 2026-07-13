import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: "HH-Hunter",
    description:
      "Генерация персонализированных сопроводительных писем для вакансий HeadHunter с помощью DeepSeek.",
    permissions: ["storage", "activeTab"],
    host_permissions: ["https://api.hh.ru/*", "https://api.deepseek.com/*"],
  },
});
