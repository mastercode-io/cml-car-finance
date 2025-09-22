#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DEFAULT_KEEP = 5;

function printUsage() {
  const scriptName = path.basename(process.argv[1] || 'pin-form-schema-version.js');
  console.error(
    `\nUsage: node ${scriptName} --manifest <path> [--pin <version> | --clear] [--keep <count>] [--dry-run]\n`,
  );
  console.error('Options:');
  console.error('  --manifest <path>   Path to the schema manifest JSON downloaded from the CDN.');
  console.error('  --pin <version>     Version to pin (must exist in manifest.versions).');
  console.error('  --clear             Remove any pinned version.');
  console.error('  --keep <count>      Number of versions to retain (default: 5).');
  console.error('  --dry-run           Do not write changes, output result to stdout.');
}

function parseArgs(argv) {
  const options = {
    manifestPath: null,
    pin: null,
    clear: false,
    keep: DEFAULT_KEEP,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case '--manifest': {
        const next = argv[index + 1];
        if (!next) {
          throw new Error('Missing value for --manifest');
        }
        options.manifestPath = next;
        index += 1;
        break;
      }
      case '--pin': {
        const next = argv[index + 1];
        if (!next) {
          throw new Error('Missing value for --pin');
        }
        options.pin = next;
        index += 1;
        break;
      }
      case '--clear': {
        options.clear = true;
        break;
      }
      case '--keep': {
        const next = argv[index + 1];
        if (!next) {
          throw new Error('Missing value for --keep');
        }
        const parsed = Number(next);
        if (!Number.isFinite(parsed) || parsed < 0) {
          throw new Error('--keep must be a non-negative number');
        }
        options.keep = parsed;
        index += 1;
        break;
      }
      case '--dry-run': {
        options.dryRun = true;
        break;
      }
      default: {
        throw new Error(`Unknown argument: ${arg}`);
      }
    }
  }

  if (!options.manifestPath) {
    throw new Error('Missing required --manifest <path> argument');
  }

  if (options.pin && options.clear) {
    throw new Error('Use either --pin or --clear, not both.');
  }

  if (!options.pin && !options.clear) {
    throw new Error('Specify --pin <version> to pin or --clear to remove the override.');
  }

  return options;
}

function ensureArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value;
}

function loadManifest(manifestPath) {
  const absolutePath = path.resolve(process.cwd(), manifestPath);
  const data = fs.readFileSync(absolutePath, 'utf8');
  try {
    const parsed = JSON.parse(data);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Manifest JSON must be an object');
    }
    return parsed;
  } catch (error) {
    throw new Error(`Failed to parse manifest JSON: ${error.message}`);
  }
}

function trimVersions(versions, keep, pinnedVersion) {
  if (!keep || keep <= 0) {
    if (!pinnedVersion) {
      return [];
    }
    const pinnedEntry = versions.find((entry) => entry.version === pinnedVersion);
    return pinnedEntry ? [pinnedEntry] : [];
  }

  const trimmed = [];
  const seen = new Set();

  for (const entry of versions) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    if (seen.has(entry.version)) {
      continue;
    }
    trimmed.push(entry);
    seen.add(entry.version);
    if (trimmed.length === keep) {
      break;
    }
  }

  if (!pinnedVersion) {
    return trimmed;
  }

  const hasPinned = trimmed.some((entry) => entry.version === pinnedVersion);
  if (hasPinned) {
    return trimmed;
  }

  const pinnedEntry = versions.find((entry) => entry.version === pinnedVersion);
  if (!pinnedEntry) {
    return trimmed;
  }

  if (trimmed.length < keep) {
    return [pinnedEntry, ...trimmed];
  }

  return [pinnedEntry, ...trimmed.slice(0, keep - 1)];
}

function applyPin(manifest, options) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Manifest must be an object');
  }

  const versions = ensureArray(manifest.versions);
  if (!versions.length) {
    throw new Error('Manifest has no versions to manage');
  }

  let pinnedVersion = manifest.pinnedVersion ?? null;

  if (options.clear) {
    pinnedVersion = null;
  }

  if (options.pin) {
    const exists = versions.some((entry) => entry && entry.version === options.pin);
    if (!exists) {
      throw new Error(`Version ${options.pin} does not exist in manifest.versions`);
    }
    pinnedVersion = options.pin;
  }

  const keep = typeof options.keep === 'number' ? options.keep : DEFAULT_KEEP;
  const trimmedVersions = trimVersions(versions, keep, pinnedVersion);
  const trimmedSet = new Set(trimmedVersions.map((entry) => entry.version));
  const removed = versions
    .filter((entry) => entry && !trimmedSet.has(entry.version))
    .map((entry) => entry.version);

  const updatedManifest = {
    ...manifest,
    pinnedVersion: pinnedVersion ?? null,
    versions: trimmedVersions,
    lastRollbackAt: options.pin ? new Date().toISOString() : (manifest.lastRollbackAt ?? null),
  };

  return { manifest: updatedManifest, removedVersions: removed };
}

function writeManifest(manifestPath, manifest, dryRun) {
  const absolutePath = path.resolve(process.cwd(), manifestPath);
  const payload = `${JSON.stringify(manifest, null, 2)}\n`;
  if (dryRun) {
    process.stdout.write(payload);
    return;
  }
  fs.writeFileSync(absolutePath, payload, 'utf8');
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const manifest = loadManifest(options.manifestPath);
    const { manifest: updatedManifest, removedVersions } = applyPin(manifest, options);
    writeManifest(options.manifestPath, updatedManifest, options.dryRun);

    const action = options.clear
      ? 'Cleared pinned version.'
      : `Pinned schema version to ${options.pin}.`;
    console.error(action);
    if (removedVersions.length > 0) {
      console.error(`Retention removed versions: ${removedVersions.join(', ')}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('Unknown error', error);
    }
    printUsage();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  DEFAULT_KEEP,
  applyPin,
  loadManifest,
  parseArgs,
  trimVersions,
};
