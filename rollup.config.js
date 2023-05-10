import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import serve from "rollup-plugin-serve";

export default {
  input: "src/index.ts",
  output: {
    file: "docs/esml.js",
    format: "umd",
    name: "esml",
    plugins: [terser()],
  },
  plugins: [
    typescript({
      tsconfig: "tsconfig.rollup.json",
      target: "es2021",
      removeComments: true,
      noUnusedLocals: true,
      noImplicitAny: true,
      moduleResolution: "node",
      sourceMap: true,
    }),
    resolve(),
    commonjs(),
    serve({
      open: true,
      contentBase: ["docs"],
      port: 5050,
    }),
  ],
};
