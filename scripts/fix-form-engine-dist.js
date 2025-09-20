#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'packages', 'form-engine', 'dist');

const ensureJsExtensions = (filePath) => {
  const source = fs.readFileSync(filePath, 'utf8');
  const updateSpecifier = (match, prefix, specifier, suffix) => {
    if (specifier.endsWith('.js') || specifier.endsWith('.json') || specifier.endsWith('.css')) {
      return match;
    }
    return `${prefix}${specifier}.js${suffix}`;
  };

  const fromPattern = /(from\s+['"])(\.{1,2}\/[^'"\n]+)(['"])/g;
  const dynamicPattern = /(import\(\s*['"])(\.{1,2}\/[^'"\n]+)(['"]\s*\))/g;

  let rewritten = source.replace(fromPattern, updateSpecifier);
  rewritten = rewritten.replace(dynamicPattern, updateSpecifier);

  if (rewritten !== source) {
    fs.writeFileSync(filePath, rewritten);
  }
};

const walkDist = (directory) => {
  if (!fs.existsSync(directory)) {
    return;
  }
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkDist(entryPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      ensureJsExtensions(entryPath);
    }
  }
};

const workerPath = path.join(distDir, 'validation', 'worker-client.js');
if (fs.existsSync(workerPath)) {
  const workerSource = fs.readFileSync(workerPath, 'utf8');
  fs.writeFileSync(
    workerPath,
    workerSource.replace('./validation.worker.ts', './validation.worker.js'),
  );
}

walkDist(distDir);
