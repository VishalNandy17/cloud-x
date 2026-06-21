#!/usr/bin/env node

const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].slice(1));

if (majorVersion < 18) {
  console.error(`Node.js 18.x or higher is required, but ${nodeVersion} is installed.`);
  process.exit(1);
}
