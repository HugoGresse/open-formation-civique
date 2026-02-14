// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://hugogresse.github.io',
	base: '/open-formation-civique',
	integrations: [
		starlight({
			title: 'Formation Civique',
			description: 'Fiches thématiques pour la formation civique',
			defaultLocale: 'root',
			locales: {
				root: {
					label: 'Français',
					lang: 'fr',
				},
			},
			sidebar: [
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
			],
		}),
	],
});
