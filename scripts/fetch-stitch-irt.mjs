/**
 * Загружает экран «Интеллектуальные системы — ППО №3 (Fidelity Layout Sync)» из Stitch.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const MCP_URL = 'https://stitch.googleapis.com/mcp';
const PROJECT_ID = 'projects/14494823803936085508';

function getApiKey() {
  if (process.env.STITCH_API_KEY) return process.env.STITCH_API_KEY;
  const mcpPath = path.join(process.env.USERPROFILE || process.env.HOME || '', '.cursor', 'mcp.json');
  const cfg = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
  return cfg.mcpServers.stitch.headers['X-Goog-Api-Key'];
}

async function mcpCall(tool, args) {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': getApiKey() },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'tools/call', params: { name: tool, arguments: args } }),
  });
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data.result?.structuredContent;
}

const data = await mcpCall('list_screens', { project_id: PROJECT_ID });
const screens = data.screens || [];
const irt =
  screens.find((s) => /Интеллектуальные системы.*Fidelity/i.test(s.title || '')) ||
  screens.find((s) => /Интеллектуальные системы.*Финальный/i.test(s.title || ''));
if (!irt) {
  console.log('IRT screens:');
  screens.filter((s) => /интел/i.test(s.title || '')).forEach((s) => console.log(s.title));
  process.exit(1);
}
console.log('Found:', irt.title);
const htmlUrl = irt.htmlCode?.downloadUrl;
const html = await (await fetch(htmlUrl)).text();
const outStitch = path.join(root, 'site', 'pages', 'irt-stitch-latest.html');
const outPage = path.join(root, 'site', 'pages', 'intelligent-systems.html');
fs.writeFileSync(outStitch, html, 'utf8');
fs.writeFileSync(outPage, html, 'utf8');
console.log('Saved', outStitch);
