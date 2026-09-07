import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Generate a complete, versioned offline snapshot from the production output.
export default defineConfig({
  plugins: [{
    name: 'offline-app',
    apply: 'build',
    async closeBundle() {
      const output = resolve('dist');
      async function listFiles(directory, prefix = '') {
        const entries = await readdir(directory, { withFileTypes: true });
        const files = await Promise.all(entries.map((entry) => {
          const name = `${prefix}${entry.name}`;
          return entry.isDirectory()
            ? listFiles(resolve(directory, entry.name), `${name}/`)
            : name;
        }));
        return files.flat();
      }

      const files = (await listFiles(output)).filter((file) => file !== 'sw.js').sort();
      const hash = createHash('sha256');
      for (const file of files) {
        hash.update(file);
        hash.update(await readFile(resolve(output, file)));
      }
      const template = await readFile(resolve('src/service-worker.js'), 'utf8');
      await writeFile(resolve(output, 'sw.js'), template
        .replace('__CACHE_VERSION__', hash.digest('hex').slice(0, 16))
        .replace('__PRECACHE_FILES__', JSON.stringify(files.map((file) => `/${file}`))));
    },
  }],
});
