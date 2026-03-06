import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const rootDir = process.cwd();
const outputDir = path.join(rootDir, 'artifacts');
const outputFile = path.join(outputDir, 'voice-typing-extension.zip');
const extensionFiles = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.js',
  'popup.html',
  'popup_en.html',
  'popup_he.html',
  'microphone.html',
  'microphone.js',
  'icon16.png',
  'icon48.png',
  'icon128.png',
];

extensionFiles.forEach((file) => {
  if (!fs.existsSync(path.join(rootDir, file))) {
    throw new Error(`Missing extension file: ${file}`);
  }
});

fs.mkdirSync(outputDir, { recursive: true });

if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile);
}

let result;

if (process.platform === 'win32') {
  const files = extensionFiles
    .map((file) => `'${file.replace(/'/g, "''")}'`)
    .join(', ');
  const destination = outputFile.replace(/'/g, "''");
  const command = `Compress-Archive -Path ${files} -DestinationPath '${destination}' -Force`;

  result = spawnSync(
    'powershell',
    ['-NoProfile', '-Command', command],
    { cwd: rootDir, stdio: 'inherit' }
  );
} else {
  result = spawnSync(
    'zip',
    ['-q', '-r', outputFile, ...extensionFiles],
    { cwd: rootDir, stdio: 'inherit' }
  );
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`Created ${outputFile}`);
