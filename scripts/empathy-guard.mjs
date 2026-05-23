import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FORBIDDEN_STRINGS = [
  { pattern: /\bClick\s+here\b/i, label: "Non-descriptive Link Text ('Click Here')", gain: "1.2%" },
  { pattern: /\bLearn\s+more\b/i, label: "Ambiguous Action ('Learn More')", gain: "0.8%" },
  { pattern: /\bRead\s+more\b/i, label: "Ambiguous Action ('Read More')", gain: "0.8%" },
  { pattern: /href=["']#["']/i, label: "Broken Anchor (Empty href)", gain: "2.5%" }
];

async function reportBlock(uid, violationCount, repoName = 'local-repository') {
  if (!uid) return;

  const url = process.env.WAYPOINT_TELEMETRY_URL || 'https://waypointstudio.io/api/telemetry/shield';
  const data = JSON.stringify({ uid, violationsCount: violationCount, repoName });

  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const reqModule = parsedUrl.protocol === 'http:' ? http : https;
      
      const req = reqModule.request(parsedUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      }, (res) => {
        res.on('data', () => {}); // Consume response data to free memory
        res.on('end', () => resolve());
      });

      req.on('error', () => resolve()); // Silent fail to ensure git workflow isn't blocked
      req.write(data);
      req.end();
    } catch (e) {
      resolve(); // Fail silently
    }
  });
}

async function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const violations = [];

  FORBIDDEN_STRINGS.forEach(({ pattern, label, gain }) => {
    if (pattern.test(content)) {
      violations.push({ label, gain });
    }
  });

  const emptyInteractivePattern = /<(button|a)\b[^>]*>(?:\s*)<\/\1>/gi;
  if (emptyInteractivePattern.test(content)) {
    violations.push({ label: "Empty Interactive Element (Missing content/label)", gain: "3.5%" });
  }

  return violations;
}

async function run() {
  const files = process.argv.slice(2).filter(f => !f.startsWith('--'));
  const isDemo = process.argv.includes('--demo');
  let totalViolations = 0;

  // Resolve User ID for reporting
  let uid = null;
  const configPath = resolve(process.cwd(), '.waypoint/config.json');
  if (existsSync(configPath)) {
    uid = JSON.parse(readFileSync(configPath, 'utf8')).uid;
  }

  console.log(`\x1b[36m[Waypoint Shield]\x1b[0m Scanning ${files.length} staged file(s)...\n`);

  for (const file of files) {
    const filePath = resolve(process.cwd(), file);
    try {
      const violations = await checkFile(filePath);
      if (violations.length > 0) {
        console.error(`\x1b[31m[BLOCKED]\x1b[0m ${file}:`);
        violations.forEach(v => {
          console.error(`  - \x1b[1m\x1b[32m[REACH GAIN: +${v.gain}]\x1b[0m ${v.label}`);
        });
        totalViolations += violations.length;
      }
    } catch (e) {}
  }

  if (totalViolations > 0) {
    console.log(`\n\x1b[33m[EMPATHY TIP]\x1b[0m Screen reader users navigate by listing links. ` +
                `"Click Here" provides zero context and blocks their journey.`);
    
    if (uid || isDemo) {
      console.log(`\x1b[34m[TELEMETRY]\x1b[0m Synchronizing prevention metrics with Dashboard...`);
      if (!isDemo) {
        // Try to get repo name from package.json
        let repoName = 'local-repository';
        try {
          const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));
          repoName = pkg.name || repoName;
        } catch (e) {}
        
        // NON-BLOCKING TELEMETRY: We fire and forget with a hard timeout to ensure Git doesn't hang
        const telemetryPromise = reportBlock(uid, totalViolations, repoName);
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('timeout'), 2000));
        
        try {
          await Promise.race([telemetryPromise, timeoutPromise]);
        } catch (e) {
          // Ignore telemetry errors
        }
      }
    }
    
    process.exit(1);
  } else {
    console.log(`\x1b[32m[PASSED]\x1b[0m All files meet empathy standards.`);
    process.exit(0);
  }
}

run();