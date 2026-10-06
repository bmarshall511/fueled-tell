/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.svg?mono' {
  const markup: string;
  export default markup;
}
