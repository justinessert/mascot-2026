import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-fs-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/stage-image' && req.method === 'POST') {
            const chunks: Uint8Array[] = [];
            req.on('data', (chunk: Uint8Array) => chunks.push(chunk));
            req.on('end', () => {
              try {
                const body = JSON.parse(Buffer.concat(chunks).toString());
                const { teamKey, imageBase64 } = body;

                // Create temp dir if not exists
                const tempDir = path.resolve(__dirname, 'temp');
                if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

                // Write Image
                // Remove header "data:image/jpeg;base64,"
                const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                fs.writeFileSync(path.join(tempDir, `${teamKey}.jpg`), buffer);

                res.statusCode = 200;
                res.end(JSON.stringify({ success: true }));
              } catch (e: any) {
                console.error(e);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
            return;
          }

          if (req.url === '/api/commit' && req.method === 'POST') {
            const chunks: Uint8Array[] = [];
            req.on('data', (chunk: Uint8Array) => chunks.push(chunk));
            req.on('end', () => {
              try {
                const body = JSON.parse(Buffer.concat(chunks).toString());
                const { changes } = body; // Map of teamKey -> { nickname, mappedNcaaName, hasImage }

                const sharedDir = path.resolve(__dirname, '../shared-data');
                const assetsDir = path.resolve(__dirname, '../public/assets/teams');
                const tempDir = path.resolve(__dirname, 'temp');

                // 1. Update Nicknames
                const nicknamesPath = path.join(sharedDir, 'nicknames.json');
                const nicknames: Record<string, string> = JSON.parse(fs.readFileSync(nicknamesPath, 'utf-8'));
                let nicknamesChanged = false;

                // 2. Update Mapings
                const mappingsPath = path.join(sharedDir, 'specialNcaaNames.json');
                const mappings: Record<string, string> = JSON.parse(fs.readFileSync(mappingsPath, 'utf-8'));
                let mappingsChanged = false;

                const result = {
                  success: true,
                  nicknamesUpdated: false,
                  mappingsUpdated: false,
                  imagesMoved: [] as string[],
                  imagesMissing: [] as string[]
                };

                Object.keys(changes).forEach(teamKey => {
                  const change = changes[teamKey];

                  // Nickname
                  if (change.nickname) {
                    nicknames[teamKey] = change.nickname;
                    nicknamesChanged = true;
                  }

                  // Mapping
                  if (change.mappedNcaaName) {
                    mappings[teamKey] = change.mappedNcaaName;
                    mappingsChanged = true;
                  }

                  // Move Image
                  if (change.hasImage) {
                    const tempPath = path.join(tempDir, `${teamKey}.jpg`);
                    if (fs.existsSync(tempPath)) {
                      if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
                      fs.copyFileSync(tempPath, path.join(assetsDir, `${teamKey}.jpg`));
                      result.imagesMoved.push(teamKey);
                    } else {
                      // Track if we expected an image but temp file was missing
                      result.imagesMissing.push(teamKey);
                    }
                  }
                });

                // Save JSONs (Sorted)
                if (nicknamesChanged) {
                  const sortedNicknames = Object.keys(nicknames).sort().reduce((acc: Record<string, string>, key) => {
                    acc[key] = nicknames[key];
                    return acc;
                  }, {});
                  fs.writeFileSync(nicknamesPath, JSON.stringify(sortedNicknames, null, 2));
                  result.nicknamesUpdated = true;
                }

                if (mappingsChanged) {
                  const sortedMappings = Object.keys(mappings).sort().reduce((acc: Record<string, string>, key) => {
                    acc[key] = mappings[key];
                    return acc;
                  }, {});
                  fs.writeFileSync(mappingsPath, JSON.stringify(sortedMappings, null, 2));
                  result.mappingsUpdated = true;
                }

                res.statusCode = 200;
                res.end(JSON.stringify(result));
              } catch (e: any) {
                console.error(e);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
            return;
          }
          next();
        });
      }
    }
  ],
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared-data'),
      '@assets': path.resolve(__dirname, '../public/assets'),
    },
  },
})
