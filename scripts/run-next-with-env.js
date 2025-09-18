#!/usr/bin/env node

process.env.NEXT_DISABLE_LOCKFILE_PATCH = process.env.NEXT_DISABLE_LOCKFILE_PATCH || '1';
process.env.NEXT_IGNORE_INCORRECT_LOCKFILE = process.env.NEXT_IGNORE_INCORRECT_LOCKFILE || '1';

if (process.argv.length <= 2) {
  console.error('Usage: node scripts/run-next-with-env.js <command> [...args]');
  process.exit(1);
}

require('next/dist/bin/next');
