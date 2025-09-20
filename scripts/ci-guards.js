#!/usr/bin/env node

const { spawnSync } = require('child_process');

function gitGrep(pattern) {
  const result = spawnSync('git', ['grep', '-n', '-I', pattern], {
    encoding: 'utf8',
  });

  if (result.status === 0) {
    return result.stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  if (result.status === 1) {
    return [];
  }

  const error = result.stderr?.trim() || result.error?.message;
  throw new Error(error || `git grep failed for pattern: ${pattern}`);
}

function fail(message, details) {
  const output = details && details.length ? `\n${details.join('\n')}` : '';
  console.error(`\n[ci-guards] ${message}${output}`);
  process.exit(1);
}

const mergeMarkerPatterns = ['<<<<<<< ', '^=======$', '>>>>>>> '];
const mergeMarkerHits = mergeMarkerPatterns.flatMap((pattern) => gitGrep(pattern));
const actionableMergeMarkers = mergeMarkerHits.filter(
  (hit) => !hit.startsWith('scripts/ci-guards.js:'),
);

if (actionableMergeMarkers.length > 0) {
  fail('Merge conflict markers detected. Resolve them before committing.', actionableMergeMarkers);
}

const expectedPath = 'packages/form-engine/src/types/external.d.ts';
const xstateMatches = gitGrep("declare module 'xstate'");
const scopedXstateMatches = xstateMatches.filter((match) => match.startsWith(`${expectedPath}:`));
const invalidLocations = xstateMatches
  .filter((match) => !match.startsWith(`${expectedPath}:`))
  .filter((match) => !match.startsWith('scripts/ci-guards.js:'));

if (scopedXstateMatches.length !== 1) {
  fail(
    `Expected exactly one "declare module 'xstate'" declaration, but found ${scopedXstateMatches.length}.`,
    scopedXstateMatches,
  );
}

if (invalidLocations.length > 0) {
  fail(
    `All "declare module 'xstate'" declarations must reside in ${expectedPath}.`,
    invalidLocations,
  );
}

console.log('[ci-guards] All checks passed.');
