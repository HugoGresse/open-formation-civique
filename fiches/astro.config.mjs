// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

const site = process.argv.includes('dev')
	? `http://localhost:${process.env.PORT || 4321}`
	: 'https://open-formation-civique.fr';

// https://astro.build/config
export default defineConfig({
	site,
	base: '/',
	trailingSlash: 'always',
	integrations: [
		starlight({
			title: 'Open Formation Civique',
			description: 'Fiches thématiques et quiz pour la formation civique',
			favicon: '/favicon.png',
			logo: {
				src: './public/favicon.png',
				alt: 'Formation Civique',
			},
			head: [
				{
					tag: 'script',
					attrs: {
						defer: true,
						'data-domain': 'open-formation-civique.fr',
						src: 'https://plausible.gresse.io/js/script.js',
					},
				},
			],
			customCss: ['./src/styles/quiz.css'],
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
