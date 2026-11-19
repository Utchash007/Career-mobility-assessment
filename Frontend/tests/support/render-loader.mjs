// Test-only TSX/alias support for static React server rendering. No runtime auth adapter.
import { readFileSync } from "node:fs";
import { createRequire, registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = new URL("../../", import.meta.url);
const require = createRequire(import.meta.url);
const linkModule = pathToFileURL(require.resolve("next/link")).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "next/link") {
      // Next's bundler handles CJS default interop; native Node needs it explicitly.
      // This uses the real pinned Link module, not a mocked navigation component.
      const source = `import value from ${JSON.stringify(linkModule)}; export default value.default ?? value;`;
      return {
        url: `data:text/javascript,${encodeURIComponent(source)}`,
        shortCircuit: true,
      };
    }
    if (specifier.startsWith("@/")) {
      const path = new URL(specifier.slice(2), root);
      if (!/\.[cm]?tsx?$/.test(path.pathname)) path.pathname += ".tsx";
      return { url: path.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith(root.href) && /\.tsx$/.test(url)) {
      const source = ts.transpileModule(
        readFileSync(fileURLToPath(url), "utf8"),
        {
          compilerOptions: {
            jsx: ts.JsxEmit.ReactJSX,
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
          },
          fileName: fileURLToPath(url),
        },
      ).outputText;
      return { format: "module", source, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
