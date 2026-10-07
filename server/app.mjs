import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {extname, resolve, sep} from 'node:path';
import {handleApi} from './api.mjs';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

export function createApp({store, clientDir, middleware}) {
  const root = resolve(clientDir);
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/api/state') return await handleApi(request, response, store);
      if (url.pathname.startsWith('/api/')) {
        response.writeHead(404, {'Content-Type': 'application/json; charset=utf-8'});
        return response.end(JSON.stringify({error: 'API route не найден.'}));
      }
      if (middleware) return middleware(request, response);
      if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405, {Allow: 'GET, HEAD'});
        return response.end();
      }
      const pathname = decodeURIComponent(url.pathname);
      const target = resolve(root, pathname === '/' ? 'index.html' : `.${pathname}`);
      if (!target.startsWith(root + sep) || pathname.includes('\\') || pathname.includes('\0')) {
        response.writeHead(404);
        return response.end('Not found');
      }
      const file = await stat(target).catch(() => null);
      if (!file?.isFile()) {
        response.writeHead(404);
        return response.end('Not found');
      }
      response.writeHead(200, {
        'Content-Type': MIME[extname(target)] || 'application/octet-stream',
        'Content-Length': file.size,
        'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      });
      response.end(request.method === 'HEAD' ? undefined : await readFile(target));
    } catch (error) {
      if (response.headersSent) return response.destroy(error);
      response.writeHead(error instanceof URIError ? 400 : 500, {'Content-Type': 'text/plain; charset=utf-8'});
      response.end('Не удалось обработать запрос.');
    }
  });
}
