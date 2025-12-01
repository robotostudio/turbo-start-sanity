import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@actions": path.resolve(__dirname, "actions"),
      "@blocks": path.resolve(__dirname, "schemaTypes/blocks"),
      "@components": path.resolve(__dirname, "components"),
      "@definitions": path.resolve(__dirname, "schemaTypes/definitions"),
      "@documents": path.resolve(__dirname, "schemaTypes/documents"),
      "@functions": path.resolve(__dirname, "functions"),
      "@hooks": path.resolve(__dirname, "hooks"),
      "@plugins": path.resolve(__dirname, "plugins"),
      "@schemaTypes": path.resolve(__dirname, "schemaTypes"),
      "@scripts": path.resolve(__dirname, "scripts"),
      "@structure": path.resolve(__dirname, "structure"),
      "@utils": path.resolve(__dirname, "utils"),
    },
  },
});
