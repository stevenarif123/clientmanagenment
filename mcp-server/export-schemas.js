import fs from 'fs';
import os from 'os';
import path from 'path';
import { TOOLS } from './dist/tools.js';

const targetDir =
  process.env.MCP_SCHEMA_DIR ||
  path.join(os.homedir(), '.gemini', 'antigravity', 'mcp', 'clienthub');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

console.log(`Exporting ${TOOLS.length} ClientHub tools to ${targetDir}...`);

TOOLS.forEach(t => {
  const schemaObj = {
    name: t.name,
    description: t.description,
    parameters: t.inputSchema || {}
  };
  fs.writeFileSync(path.join(targetDir, `${t.name}.json`), JSON.stringify(schemaObj, null, 2));
  console.log(`  ✓ ${t.name}`);
});

console.log('All ClientHub MCP tool schemas exported successfully!');
