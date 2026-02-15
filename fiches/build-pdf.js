import { spawn } from 'child_process';

const PORT = 4322;
const BASE = '/';
const PDF_FILENAME = 'formation-civique';

function startPreviewServer() {
  return new Promise((resolve, reject) => {
    const server = spawn('npx', ['astro', 'preview', '--port', String(PORT)], {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: import.meta.dirname,
    });

    let started = false;

    server.stdout.on('data', (data) => {
      const output = data.toString();
      if (!started && output.includes(`localhost:${PORT}`)) {
        started = true;
        resolve(server);
      }
    });

    server.stderr.on('data', (data) => {
      const output = data.toString();
      if (!started && output.includes(`localhost:${PORT}`)) {
        started = true;
        resolve(server);
      }
    });

    server.on('error', reject);

    // Fallback timeout - assume server is ready after 5s
    setTimeout(() => {
      if (!started) {
        started = true;
        resolve(server);
      }
    }, 5000);
  });
}

function generatePdf() {
  return new Promise((resolve, reject) => {
    const args = [
      'starlight-to-pdf',
      `http://localhost:${PORT}${BASE}/`,
      '-p', `./dist${BASE}`,
      '-f', PDF_FILENAME,
      '--pdf-outline',
      '--print-bg',
      '--contents-links=internal',
      '-e', `${BASE}/formation-civique.pdf`,
    ];

    // In CI environments (like GitHub Actions), use system Chromium if available
    // This avoids sandbox issues with Puppeteer's bundled Chromium
    if (process.env.CI && process.env.CHROMIUM_PATH) {
      args.push('--browser-executable', process.env.CHROMIUM_PATH);
      console.log(`Using system Chromium: ${process.env.CHROMIUM_PATH}`);
    }

    console.log(`Running: npx ${args.join(' ')}`);

    const proc = spawn('npx', args, {
      stdio: 'inherit',
      cwd: import.meta.dirname,
    });

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`starlight-to-pdf exited with code ${code}`));
    });

    proc.on('error', reject);
  });
}

async function main() {
  console.log('Starting preview server...');
  const server = await startPreviewServer();
  console.log(`Preview server running on port ${PORT}`);

  try {
    await generatePdf();
    console.log('PDF generated successfully!');
  } finally {
    server.kill();
    console.log('Preview server stopped.');
  }
}

main().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('PDF generation failed:', err);
  process.exit(1);
});
