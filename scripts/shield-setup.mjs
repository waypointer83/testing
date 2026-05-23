/**
 * Waypoint Shield: CLI Setup Utility
 * ---------------------------------
 * This script links your local git environment to your Waypoint AI account.
 * Usage: node scripts/shield-setup.mjs <your-uid>
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const uid = process.argv[2];

if (!uid) {
  console.error('\x1b[31mâŒ Error:\x1b[0m Please provide your Waypoint User ID.');
  console.log('You can find your UID in the [Account Settings] section of the dashboard.');
  console.log('Usage: node scripts/shield-setup.mjs <your-uid>');
  process.exit(1);
}

const configDir = join(process.cwd(), '.waypoint');
const configFile = join(configDir, 'config.json');

try {
  if (!existsSync(configDir)) {
    mkdirSync(configDir);
  }

  const config = {
    uid: uid,
    linkedAt: new Date().toISOString(),
    telemetry: true
  };

  writeFileSync(configFile, JSON.stringify(config, null, 2));

  console.log('\n\x1b[32mâœ¨ Waypoint Shield Integrated Successfully!\x1b[0m');
  console.log(`- Config: ${configFile}`);
  console.log(`- Linked UID: ${uid}`);
  console.log('\nYour git commits are now protected by the Early Warning System.');
  console.log('Any blocked empathy violations will be reported to your Shield Dashboard.\n');

} catch (error) {
  console.error('\x1b[31mâŒ Setup Failed:\x1b[0m', error.message);
  process.exit(1);
}