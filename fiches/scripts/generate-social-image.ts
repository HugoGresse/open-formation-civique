import sharp from 'sharp';
import path from 'path';

const WIDTH = 1200;
const HEIGHT = 630;
const LOGO_SIZE = 280;

const svgBackground = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="tricolor" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#002395;stop-opacity:1" />
      <stop offset="33%" style="stop-color:#002395;stop-opacity:1" />
      <stop offset="33%" style="stop-color:#FFFFFF;stop-opacity:1" />
      <stop offset="66%" style="stop-color:#FFFFFF;stop-opacity:1" />
      <stop offset="66%" style="stop-color:#ED2939;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ED2939;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />

  <!-- French tricolor bar at top -->
  <rect x="0" y="0" width="${WIDTH}" height="6" fill="url(#tricolor)" />

  <!-- Subtle pattern / decorative elements -->
  <circle cx="1100" cy="80" r="200" fill="#002395" opacity="0.06" />
  <circle cx="100" cy="550" r="180" fill="#ED2939" opacity="0.06" />

  <!-- Title -->
  <text x="${420 + (WIDTH - 420) / 2}" y="215" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="52" font-weight="bold" fill="#f1f5f9" text-anchor="middle">Open Formation Civique</text>

  <!-- Divider line -->
  <rect x="520" y="245" width="360" height="3" rx="1.5" fill="url(#tricolor)" />

  <!-- Tagline line 1 -->
  <text x="${420 + (WIDTH - 420) / 2}" y="310" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="26" fill="#94a3b8" text-anchor="middle">Fiches thématiques et quiz gratuits</text>

  <!-- Tagline line 2 -->
  <text x="${420 + (WIDTH - 420) / 2}" y="350" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="26" fill="#94a3b8" text-anchor="middle">pour la formation civique</text>

  <!-- Stats badges -->
  <rect x="470" y="400" width="130" height="44" rx="22" fill="#002395" opacity="0.25" />
  <text x="535" y="428" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="17" fill="#93c5fd" text-anchor="middle">5 thématiques</text>

  <rect x="620" y="400" width="160" height="44" rx="22" fill="#002395" opacity="0.25" />
  <text x="700" y="428" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="17" fill="#93c5fd" text-anchor="middle">841 questions</text>

  <rect x="800" y="400" width="130" height="44" rx="22" fill="#002395" opacity="0.25" />
  <text x="865" y="428" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="17" fill="#93c5fd" text-anchor="middle">Open Source</text>

  <!-- URL at bottom -->
  <text x="${WIDTH / 2}" y="565" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="22" fill="#64748b" text-anchor="middle">open-formation-civique.fr</text>

  <!-- Bottom tricolor bar -->
  <rect x="0" y="${HEIGHT - 6}" width="${WIDTH}" height="6" fill="url(#tricolor)" />
</svg>
`;

async function generateSocialImage() {
	const logoPath = path.resolve(
		import.meta.dirname,
		'../public/logo/open-formation-civique.png',
	);
	const outputPath = path.resolve(
		import.meta.dirname,
		'../public/social-image.png',
	);

	const logo = await sharp(logoPath)
		.resize(LOGO_SIZE, LOGO_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
		.toBuffer();

	const background = Buffer.from(svgBackground);

	const logoX = Math.round((420 - LOGO_SIZE) / 2);
	const logoY = Math.round((HEIGHT - LOGO_SIZE) / 2);

	await sharp(background)
		.composite([
			{
				input: logo,
				left: logoX,
				top: logoY,
			},
		])
		.png()
		.toFile(outputPath);

	console.log(`Social image generated: ${outputPath}`);
}

generateSocialImage().catch(console.error);
