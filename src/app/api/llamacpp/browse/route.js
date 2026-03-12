import { success, badRequest, withHandler } from '@/lib/api/response';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// Allowed base directories for browsing. Restricts file system access to
// user-configured models directory and common safe default locations.
function getAllowedBaseDirs() {
  const dirs = [];

  // Check DB setting for user-configured models directory
  try {
    const db = getDb();
    const row = db.prepare("SELECT value FROM settings WHERE key = 'llamacpp_models_dir'").get();
    if (row) {
      const val = JSON.parse(row.value);
      if (val && typeof val === 'string') dirs.push(path.resolve(val));
    }
  } catch { /* no setting */ }

  // Common default locations
  const home = process.env.HOME || process.env.USERPROFILE || '';
  if (home) {
    dirs.push(path.resolve(home, 'models'));
    dirs.push(path.resolve(home, '.cache', 'huggingface'));
    dirs.push(path.resolve(home, 'llama.cpp', 'models'));
    // If no explicit models dir configured, allow home as fallback
    if (dirs.length <= 3) dirs.push(path.resolve(home));
  }

  return dirs;
}

function isPathAllowed(absPath) {
  const allowed = getAllowedBaseDirs();
  return allowed.some(base => absPath === base || absPath.startsWith(base + path.sep));
}

export const GET = withHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const dirPath = searchParams.get('path');
  const searchDir = searchParams.get('search');
  const query = searchParams.get('q');

  if (searchDir && query) {
    // Recursive GGUF search
    const absPath = path.resolve(searchDir);
    if (!isPathAllowed(absPath)) return badRequest('Path is outside allowed directories');
    if (!fs.existsSync(absPath)) return badRequest('Directory not found');

    const results = [];
    searchGguf(absPath, query.toLowerCase(), results, 3); // max 3 levels deep
    return success({ files: results });
  }

  if (!dirPath) return badRequest('path parameter required');

  const absPath = path.resolve(dirPath);
  if (!isPathAllowed(absPath)) {
    return badRequest('Path is outside allowed directories');
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
});

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
