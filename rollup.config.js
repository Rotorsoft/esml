import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/index.ts",
  output: {
    file: "app/esml.js",
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
  ],
};
