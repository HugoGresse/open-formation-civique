import sharp from 'sharp';
import path from 'path';

const S = 1080;
const LOGO_SIZE = 300;
const CX = S / 2;

const svg = `
<svg width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a" />
      <stop offset="50%" style="stop-color:#1e293b" />
      <stop offset="100%" style="stop-color:#0f172a" />
    </linearGradient>
    <linearGradient id="tri" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#002395" />
      <stop offset="33%" style="stop-color:#002395" />
      <stop offset="33%" style="stop-color:#FFFFFF" />
      <stop offset="66%" style="stop-color:#FFFFFF" />
      <stop offset="66%" style="stop-color:#ED2939" />
      <stop offset="100%" style="stop-color:#ED2939" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${S}" height="${S}" fill="url(#bg)" />
  <rect x="0" y="0" width="${S}" height="6" fill="url(#tri)" />

  <!-- Decorative circles -->
  <circle cx="950" cy="150" r="250" fill="#002395" opacity="0.05" />
  <circle cx="130" cy="950" r="220" fill="#ED2939" opacity="0.05" />
  <circle cx="900" cy="900" r="180" fill="#002395" opacity="0.03" />

  <!-- Title -->
  <text x="${CX}" y="460" font-family="system-ui, -apple-system, sans-serif" font-size="54" font-weight="bold" fill="#f1f5f9" text-anchor="middle">Open Formation</text>
  <text x="${CX}" y="525" font-family="system-ui, -apple-system, sans-serif" font-size="54" font-weight="bold" fill="#f1f5f9" text-anchor="middle">Civique</text>

  <!-- Tricolor divider -->
  <rect x="${CX - 180}" y="555" width="360" height="3" rx="1.5" fill="url(#tri)" />

  <!-- Tagline -->
  <text x="${CX}" y="610" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#94a3b8" text-anchor="middle">Fiches thématiques et quiz gratuits</text>
  <text x="${CX}" y="650" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#94a3b8" text-anchor="middle">pour la formation civique</text>

  <!-- Stats row -->
  <rect x="115" y="710" width="170" height="48" rx="24" fill="#002395" opacity="0.25" />
  <text x="200" y="741" font-family="system-ui, -apple-system, sans-serif" font-size="19" fill="#93c5fd" text-anchor="middle">5 thématiques</text>

  <rect x="310" y="710" width="190" height="48" rx="24" fill="#002395" opacity="0.25" />
  <text x="405" y="741" font-family="system-ui, -apple-system, sans-serif" font-size="19" fill="#93c5fd" text-anchor="middle">841 questions</text>

  <rect x="525" y="710" width="190" height="48" rx="24" fill="#002395" opacity="0.25" />
  <text x="620" y="741" font-family="system-ui, -apple-system, sans-serif" font-size="19" fill="#93c5fd" text-anchor="middle">PDF gratuit</text>

  <rect x="740" y="710" width="220" height="48" rx="24" fill="#002395" opacity="0.25" />
  <text x="850" y="741" font-family="system-ui, -apple-system, sans-serif" font-size="19" fill="#93c5fd" text-anchor="middle">100% Open Source</text>

  <!-- Open Source callout -->
  <rect x="${CX - 220}" y="810" width="440" height="60" rx="12" fill="#002395" opacity="0.12" stroke="#93c5fd" stroke-opacity="0.2" stroke-width="1" />
  <text x="${CX}" y="832" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#64748b" text-anchor="middle">Gratuit, sans cookie, respectueux du RGPD</text>
  <text x="${CX}" y="858" font-family="system-ui, -apple-system, sans-serif" font-size="17" font-weight="bold" fill="#93c5fd" text-anchor="middle">Code source disponible sur GitHub</text>

  <!-- URL -->
  <text x="${CX}" y="960" font-family="system-ui, -apple-system, sans-serif" font-size="26" fill="#64748b" text-anchor="middle">open-formation-civique.fr</text>

  <!-- Bottom tricolor bar -->
  <rect x="0" y="${S - 6}" width="${S}" height="6" fill="url(#tri)" />
</svg>
`;

async function generateLinkedinImage() {
	const logoPath = path.resolve(
		import.meta.dirname,
		'../public/logo/open-formation-civique.png',
	);
	const outputPath = path.resolve(
		import.meta.dirname,
		'../public/social-image-linkedin.png',
	);

	const logo = await sharp(logoPath)
		.resize(LOGO_SIZE, LOGO_SIZE, {
			fit: 'contain',
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		})
		.toBuffer();

	const logoX = Math.round((S - LOGO_SIZE) / 2);
	const logoY = 80;

	await sharp(Buffer.from(svg))
		.composite([
			{
				input: logo,
				left: logoX,
				top: logoY,
			},
		])
		.png()
		.toFile(outputPath);

	console.log(`LinkedIn image generated: ${outputPath}`);
}

generateLinkedinImage().catch(console.error);
