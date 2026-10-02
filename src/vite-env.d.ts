/// <reference types="vite/client" />

declare module '*.svg?mono' {
  const markup: string;
  export default markup;
}
