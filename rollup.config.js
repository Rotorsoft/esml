import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import serve from "rollup-plugin-serve";

export default {
  input: "src/index.ts",
  output: {
    file: "docs/esml.js",
    format: "umd",
    name: "esml",
    globals: { graphre: "graphre" },
  },
  external: ["graphre"],
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
    nodeResolve(),
    serve({
      open: true,
      contentBase: ["docs"],
      port: 5050,
    }),
  ],
};
