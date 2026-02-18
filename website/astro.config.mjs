// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';

const site = process.argv.includes('dev')
	? `http://localhost:${process.env.PORT || 4321}`
	: 'https://open-formation-civique.fr';

const siteTitle = 'Open Formation Civique – Fiches et Quiz gratuits 2026';
const siteDescription =
	'Préparez votre formation civique avec des fiches thématiques et des quiz gratuits. Valeurs de la République, institutions, droits et devoirs – tout pour réussir votre examen civique.';

// https://astro.build/config
export default defineConfig({
	site,
	base: '/',
	trailingSlash: 'always',
	integrations: [
		sitemap({
			changefreq: 'weekly',
			priority: 0.7,
			lastmod: new Date(),
		}),
		starlight({
			title: 'Open Formation Civique',
			description: siteDescription,
			favicon: '/favicon.png',
			logo: {
				src: './public/favicon.png',
				alt: 'Formation Civique',
			},
			head: [
				// Analytics
				{
					tag: 'script',
					attrs: {
						defer: true,
						'data-domain': 'open-formation-civique.fr',
						src: 'https://plausible.gresse.io/js/script.js',
					},
				},
				// Open Graph tags
				{
					tag: 'meta',
					attrs: {
						property: 'og:type',
						content: 'website',
					},
				},
				{
					tag: 'meta',
					attrs: {
						property: 'og:site_name',
						content: 'Open Formation Civique',
					},
				},
				{
					tag: 'meta',
					attrs: {
						property: 'og:locale',
						content: 'fr_FR',
					},
				},
				{
					tag: 'meta',
					attrs: {
						property: 'og:image',
						content: `${site}/social-image.png`,
					},
				},
				{
					tag: 'meta',
					attrs: {
						property: 'og:image:width',
						content: '1200',
					},
				},
				{
					tag: 'meta',
					attrs: {
						property: 'og:image:height',
						content: '630',
					},
				},
				{
					tag: 'meta',
					attrs: {
						property: 'og:image:alt',
						content: siteTitle,
					},
				},
				// Twitter Card tags
				{
					tag: 'meta',
					attrs: {
						name: 'twitter:card',
						content: 'summary_large_image',
					},
				},
				{
					tag: 'meta',
					attrs: {
						name: 'twitter:image',
						content: `${site}/social-image.png`,
					},
				},
				{
					tag: 'meta',
					attrs: {
						name: 'twitter:image:alt',
						content: siteTitle,
					},
				},
				// JSON-LD: WebSite schema with SearchAction
				{
					tag: 'script',
					attrs: { type: 'application/ld+json' },
					content: JSON.stringify({
						'@context': 'https://schema.org',
						'@type': 'WebSite',
						name: 'Open Formation Civique',
						alternateName: 'Formation Civique Gratuite',
						url: 'https://open-formation-civique.fr/',
						description: siteDescription,
						inLanguage: 'fr-FR',
						potentialAction: {
							'@type': 'SearchAction',
							target: {
								'@type': 'EntryPoint',
								urlTemplate: 'https://open-formation-civique.fr/search/?q={search_term_string}',
							},
							'query-input': 'required name=search_term_string',
						},
					}),
				},
				// JSON-LD: Organization schema
				{
					tag: 'script',
					attrs: { type: 'application/ld+json' },
					content: JSON.stringify({
						'@context': 'https://schema.org',
						'@type': 'Organization',
						name: 'Open Formation Civique',
						url: 'https://open-formation-civique.fr/',
						logo: 'https://open-formation-civique.fr/favicon.png',
						description:
							'Ressources gratuites et open source pour la formation civique en France : fiches thématiques, quiz officiels (CSP, Carte de Résident) et quiz thématiques.',
						sameAs: ['https://github.com/HugoGresse/open-formation-civique'],
					}),
				},
			],
			components: {
				Footer: './src/components/Footer.astro',
			},
			customCss: ['./src/styles/quiz.css', './src/styles/content.css'],
			defaultLocale: 'root',
			locales: {
				root: {
					label: 'Français',
					lang: 'fr',
				},
			},
			sidebar: [
				{
					label: 'Quiz',
					autogenerate: { directory: 'quiz' },
				},
				{
					label: 'Accueil',
					link: '/',
				},
				{
					label: 'Principes et valeurs de la République',
					autogenerate: { directory: 'principes-et-valeurs' },
				},
				{
					label: 'Système institutionnel et politique',
					autogenerate: { directory: 'systeme-institutionnel' },
				},
				{
					label: 'Droits et devoirs',
					autogenerate: { directory: 'droits-et-devoirs' },
				},
				{
					label: 'Histoire, géographie et culture',
					autogenerate: { directory: 'histoire-geographie-culture' },
				},
				{
					label: 'Vivre dans la société française',
					autogenerate: { directory: 'vivre-en-france' },
				},
				{
					label: 'Télécharger en PDF',
					link: `${site}/formation-civique.pdf`,
					badge: { text: 'PDF', variant: 'tip' },
					attrs: { href: `${site}/formation-civique.pdf`, download: true },
				},
			],
		}),
	],
});
