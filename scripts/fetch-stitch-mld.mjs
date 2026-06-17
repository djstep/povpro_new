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
const mld = screens.find((s) => /МЛД.*Объедин|МЛД/i.test(s.title || ''));
if (!mld) {
  console.log('MLD screens:');
  screens.filter((s) => /лить|МЛД|mld/i.test(s.title || '')).forEach((s) => console.log(s.name, s.title));
  process.exit(1);
}
console.log('Found:', mld.title, mld.name);
const htmlUrl = mld.htmlCode?.downloadUrl || mld.htmlCode?.uri;
if (!htmlUrl) {
  console.log(JSON.stringify(mld, null, 2).slice(0, 2000));
  process.exit(1);
}
const htmlRes = await fetch(htmlUrl);
const html = await htmlRes.text();
const out = path.join(root, 'site', 'pages', 'mld-stitch-latest.html');
fs.writeFileSync(out, html, 'utf8');
console.log('Saved', out, html.length, 'bytes');

const idx = html.indexOf('Процесс ремонта');
if (idx >= 0) console.log(html.slice(Math.max(0, idx - 200), idx + 8000));
