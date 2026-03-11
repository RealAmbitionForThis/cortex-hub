import { success, error, badRequest } from '@/lib/api/response';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const dirPath = searchParams.get('path');
    const searchDir = searchParams.get('search');
    const query = searchParams.get('q');

    if (searchDir && query) {
      // Recursive GGUF search
      const absPath = path.resolve(searchDir);
      if (!fs.existsSync(absPath)) return badRequest('Directory not found');

      const results = [];
      searchGguf(absPath, query.toLowerCase(), results, 3); // max 3 levels deep
      return success({ files: results });
    }

    if (!dirPath) return badRequest('path parameter required');

    const absPath = path.resolve(dirPath);
    if (!path.isAbsolute(absPath) || absPath.includes('..')) {
      return badRequest('Invalid path');
    }

    if (!fs.existsSync(absPath)) {
      return badRequest('Path does not exist');
    }

    const stat = fs.statSync(absPath);
    if (!stat.isDirectory()) {
      return badRequest('Path is not a directory');
    }

    const entries = fs.readdirSync(absPath, { withFileTypes: true });
    const items = [];

    for (const entry of entries) {
      // Skip hidden files
      if (entry.name.startsWith('.')) continue;

      const fullPath = path.join(absPath, entry.name);

      if (entry.isDirectory()) {
        items.push({
          name: entry.name,
          path: fullPath,
          type: 'directory',
        });
      } else if (entry.name.toLowerCase().endsWith('.gguf')) {
        try {
          const fileStat = fs.statSync(fullPath);
          items.push({
            name: entry.name,
            path: fullPath,
            type: 'file',
            size: fileStat.size,
          });
        } catch {
          // Skip files we can't stat
        }
      }
    }

    // Sort: directories first, then files, alphabetically
    items.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return success({
      path: absPath,
      parent: path.dirname(absPath),
      items,
    });
  } catch (err) {
    return error(err.message);
  }
}

function searchGguf(dir, query, results, maxDepth) {
  if (maxDepth <= 0 || results.length >= 50) return;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        searchGguf(fullPath, query, results, maxDepth - 1);
      } else if (
        entry.name.toLowerCase().endsWith('.gguf') &&
        entry.name.toLowerCase().includes(query)
      ) {
        try {
          const stat = fs.statSync(fullPath);
          results.push({ name: entry.name, path: fullPath, size: stat.size });
        } catch { /* skip */ }
      }
    }
  } catch { /* permission denied etc */ }
}
