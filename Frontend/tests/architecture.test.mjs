import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const frontend = fileURLToPath(new URL("../", import.meta.url));

function sourceFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(path)
      : /\.[cm]?tsx?$/.test(entry.name) && !/\.(test|types)\./.test(entry.name)
        ? [path]
        : [];
  });
}

function readSource(path) {
  return ts.createSourceFile(
    path,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

function visit(node, callback) {
  callback(node);
  ts.forEachChild(node, (child) => visit(child, callback));
}

function isFunction(node) {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node)
  );
}

function componentName(node) {
  if (ts.isFunctionDeclaration(node) && node.name) return node.name.text;
  if (
    (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) &&
    ts.isVariableDeclaration(node.parent) &&
    ts.isIdentifier(node.parent.name)
  ) {
    return node.parent.name.text;
  }
  return null;
}

function hasJsx(node) {
  let found = false;
  visit(node, (child) => {
    if (
      ts.isJsxElement(child) ||
      ts.isJsxSelfClosingElement(child) ||
      ts.isJsxFragment(child)
    ) {
      found = true;
    }
  });
  return found;
}

test("every authored component implementation has its own same-named folder", () => {
  const root = join(frontend, "components");
  for (const path of sourceFiles(root)) {
    const folder = basename(dirname(path));
    assert.match(folder, /^[A-Z][A-Za-z0-9]*$/);
    assert.equal(relative(root, dirname(path)), folder);
    assert.equal(basename(path), `${folder}.tsx`);
    const source = readSource(path);
    visit(source, (node) => {
      const name = componentName(node);
      if (name && /^[A-Z]/.test(name) && hasJsx(node)) {
        assert.equal(name, folder, path);
      }
    });
  }
});

test("pure logic and hooks never define UI", () => {
  for (const root of ["lib", "hooks"]) {
    for (const path of sourceFiles(join(frontend, root))) {
      assert.equal(path.endsWith(".tsx"), false, path);
      assert.equal(hasJsx(readSource(path)), false, path);
    }
  }
});

test("component-valued Flowbite link props stay inside client boundaries", () => {
  for (const path of sourceFiles(join(frontend, "components"))) {
    const source = readFileSync(path, "utf8");
    if (source.includes("as={Link}"))
      assert.match(source, /^"use client";/, path);
  }
});

test("components are never defined inside other functions", () => {
  for (const root of ["components", "app"]) {
    for (const path of sourceFiles(join(frontend, root))) {
      visit(readSource(path), (node) => {
        const name = componentName(node);
        // JSX in a .map callback is composition, not a newly defined component.
        if (!name || !/^[A-Z]/.test(name) || !hasJsx(node)) return;
        let parent = node.parent;
        while (parent) {
          assert.equal(isFunction(parent), false, path);
          parent = parent.parent;
        }
      });
    }
  }
});

test("Next entrypoints only render imported components and required root tags", () => {
  for (const path of sourceFiles(join(frontend, "app"))) {
    if (!/^(page|layout|loading|error|not-found)\.tsx$/.test(basename(path))) {
      continue;
    }
    const source = readSource(path);
    const importedNames = new Set();
    const rootLayout = path === join(frontend, "app", "layout.tsx");
    let definitions = 0;
    for (const statement of source.statements) {
      if (ts.isImportDeclaration(statement)) {
        const modulePath = statement.moduleSpecifier.text;
        if (!modulePath.includes("components/")) continue;
        const clause = statement.importClause;
        if (clause?.name) importedNames.add(clause.name.text);
        if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
          for (const name of clause.namedBindings.elements) {
            importedNames.add(name.name.text);
          }
        }
      }
    }
    visit(source, (node) => {
      if (isFunction(node) && hasJsx(node)) definitions += 1;
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const name = node.tagName.getText(source);
        assert.ok(
          importedNames.has(name) ||
            (rootLayout && ["html", "body"].includes(name)),
          `${relative(frontend, path)} must not define inline UI: ${name}`,
        );
      }
      if (basename(path) === "page.tsx" && ts.isCallExpression(node)) {
        const call = node.expression.getText(source);
        assert.equal(/^(use[A-Z]|fetch$)/.test(call), false, path);
        assert.equal(/\.(map|filter|reduce|forEach)$/.test(call), false, path);
      }
    });
    assert.ok(definitions <= 1, path);
  }
});
