import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await mkdir('dist/server', { recursive: true });
await mkdir('dist/.openai', { recursive: true });

for (const file of ['index.html', 'styles.css', 'enhancements.css', 'app.js']) {
  await cp(file, `dist/${file}`);
}

await cp('.openai/hosting.json', 'dist/.openai/hosting.json');

const assets = {
  '/': { body: await readFile('index.html', 'utf8'), type: 'text/html; charset=utf-8' },
  '/index.html': { body: await readFile('index.html', 'utf8'), type: 'text/html; charset=utf-8' },
  '/styles.css': { body: await readFile('styles.css', 'utf8'), type: 'text/css; charset=utf-8' },
  '/enhancements.css': { body: await readFile('enhancements.css', 'utf8'), type: 'text/css; charset=utf-8' },
  '/app.js': { body: await readFile('app.js', 'utf8'), type: 'text/javascript; charset=utf-8' }
};

const worker = `const assets = ${JSON.stringify(assets)};
export default {
  async fetch(request) {
    const path = new URL(request.url).pathname;
    const asset = assets[path] || assets['/'];
    return new Response(asset.body, {
      headers: {
        'content-type': asset.type,
        'cache-control': path === '/' ? 'no-cache' : 'public, max-age=3600'
      }
    });
  }
};
`;

await writeFile('dist/server/index.js', worker);

