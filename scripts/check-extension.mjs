import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

function fileExists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function loadJson(relativePath) {
  return JSON.parse(
    fs.readFileSync(path.join(rootDir, relativePath), 'utf8')
  );
}

const errors = [];

function assert(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

assert(fileExists('manifest.json'), 'manifest.json is missing.');

const manifest = loadJson('manifest.json');

assert(manifest.manifest_version === 3, 'Manifest version must be 3.');
assert(typeof manifest.name === 'string' && manifest.name.length > 0, 'Manifest name is required.');
assert(typeof manifest.version === 'string' && manifest.version.length > 0, 'Manifest version is required.');
assert(
  typeof manifest.description === 'string' && manifest.description.length > 0,
  'Manifest description is required.'
);

const manifestFiles = new Set();

Object.values(manifest.icons || {}).forEach((file) => manifestFiles.add(file));
Object.values(manifest.action?.default_icon || {}).forEach((file) => manifestFiles.add(file));

if (manifest.side_panel?.default_path) {
  manifestFiles.add(manifest.side_panel.default_path);
}

if (manifest.background?.service_worker) {
  manifestFiles.add(manifest.background.service_worker);
}

(manifest.content_scripts || []).forEach((entry) => {
  (entry.js || []).forEach((file) => manifestFiles.add(file));
});

(manifest.web_accessible_resources || []).forEach((entry) => {
  (entry.resources || []).forEach((file) => manifestFiles.add(file));
});

[
  'popup.js',
  'popup_en.html',
  'popup_he.html',
  'microphone.html',
  'microphone.js',
  '.env.example',
  'docs/index.html',
  'README.md',
  'LICENSE',
].forEach((file) => manifestFiles.add(file));

[...manifestFiles].forEach((file) => {
  assert(fileExists(file), `Referenced file is missing: ${file}`);
});

assert(!fileExists('.env'), 'A local .env file is present in the repository root.');
assert(!fileExists('extension.zip'), 'extension.zip should not live in the repository root.');

if (errors.length > 0) {
  console.error('Extension validation failed:');
  errors.forEach((error) => {
    console.error(`- ${error}`);
  });
  process.exit(1);
}

console.log('Extension validation passed.');
