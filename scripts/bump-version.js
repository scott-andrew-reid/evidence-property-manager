#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '..', 'package.json');
const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const currentVersion = package.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Default to patch version bump
const bumpType = process.argv[2] || 'patch';

let newVersion;
switch (bumpType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
  default:
    console.error('Invalid bump type. Use: major, minor, or patch');
    process.exit(1);
}

package.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(package, null, 2) + '\n');

console.log(`Version bumped from ${currentVersion} to ${newVersion}`);
console.log('Run the following commands to commit and push:');
console.log(`  git add package.json`);
console.log(`  git commit -m "Bump version to ${newVersion}"`);
console.log(`  git push origin master`);