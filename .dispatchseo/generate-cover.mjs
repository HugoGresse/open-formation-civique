#!/usr/bin/env node
// Render a blog cover from an agent-authored subject SVG and save it under the
// repo's cover directory. Shipped with the DispatchSEO pipeline pack, so every
// connected repo has it - one command, one image, deterministic output path.
//
//   node .dispatchseo/generate-cover.mjs \
//     --slug how-to-build-an-mcp-server \
//     --svg /tmp/mcp-cover-subject.svg \
//     --hue cyan \
//     --out public/blog/covers
//
// No env vars, no network, no image model, no API bill. Earlier versions of
// this pipeline prompted a diffusion model (Cloudflare Workers AI SDXL); every
// technical topic came back as the same generic 3D-render metaphor, and it cost
// money per image. The agent building the guide already knows exactly what the
// post is about, so it AUTHORS the cover as vector art instead of describing it
// to a weaker model. The only cost is the tokens for one small SVG.
//
// Division of labor:
//   - This script owns the house BASE: 1600x900 dark field, a soft off-center
//     glow in the chosen hue, a faint dot grid, a vignette. That keeps every
//     cover in one family regardless of who authors the subject.
//   - The --svg file is the SUBJECT LAYER: a full <svg> document with
//     viewBox="0 0 1600 900" and a TRANSPARENT background (no full-canvas
//     rects), containing the topic-specific artwork. It is composited over
//     the base.
//   - --icon composites an EXACT official product mark (from ICONS below)
//     on top, centered - vector-drawn logos by hand are banned because they
//     come out subtly wrong; diffusion-drawn ones are banned because they
//     come out very wrong.
//
// Palette per hue - subject layers should draw from the active hue's colors
// (plus white/neutral strokes) so subject and glow agree:
//   violet:  accent #8b5cf6  bright #a78bfa  deep #6d28d9
//   cyan:    accent #06b6d4  bright #22d3ee  deep #0e7490
//   magenta: accent #d946ef  bright #e879f9  deep #a21caf
//   amber:   accent #f59e0b  bright #fbbf24  deep #b45309
//   emerald: accent #10b981  bright #34d399  deep #047857
//
// OUTPUT FORMAT resolves at RUN time, in this repo, with no install-time edit:
// if `sharp` is resolvable (it ships with most Next.js installs) the cover is
// rasterized to .webp; if it is not, the script writes a self-contained .svg
// instead rather than failing. Either way the final path is printed on a
// COVER_FILE= line - read that line, never assume the extension.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const HUES = {
  violet: { accent: "#8b5cf6", bright: "#a78bfa", deep: "#6d28d9" },
  cyan: { accent: "#06b6d4", bright: "#22d3ee", deep: "#0e7490" },
  magenta: { accent: "#d946ef", bright: "#e879f9", deep: "#a21caf" },
  amber: { accent: "#f59e0b", bright: "#fbbf24", deep: "#b45309" },
  emerald: { accent: "#10b981", bright: "#34d399", deep: "#047857" },
};

// Exact official product marks for --icon compositing. Add marks here as
// needed; paths are the official glyphs.
const ICONS = {
  github: {
    viewBox: "0 0 16 16",
    path: "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z",
  },
};

const W = 1600;
const H = 900;

function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || i === process.argv.length - 1) return fallback;
  return process.argv[i + 1];
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function die(message) {
  console.error(message);
  process.exit(1);
}

const slug = arg("slug");
const svgPath = arg("svg");
const outDir = arg("out", "public/blog/covers");
const bg = arg("bg", "#0a0a0a");
const format = arg("format", "auto");
const hueKey = arg("hue", Object.keys(HUES)[hash(slug ?? "") % Object.keys(HUES).length]);
const iconKey = arg("icon");

if (!slug || !svgPath) {
  die(
    "Usage: node .dispatchseo/generate-cover.mjs --slug <slug> --svg <subject.svg>\n" +
      "       [--out <dir>] [--hue violet|cyan|magenta|amber|emerald] [--icon github]\n" +
      "       [--bg <hex>] [--format auto|webp|svg]",
  );
}
if (!/^[a-z0-9-]+$/.test(slug)) {
  die(`Bad slug "${slug}" - kebab-case only, it becomes a filename.`);
}
if (!HUES[hueKey]) {
  die(`Unknown --hue "${hueKey}". Hues: ${Object.keys(HUES).join(", ")}.`);
}
if (iconKey && !ICONS[iconKey]) {
  die(`Unknown --icon "${iconKey}". Available: ${Object.keys(ICONS).join(", ")}`);
}
if (!/^#[0-9a-fA-F]{6}$/.test(bg)) {
  die(`Bad --bg "${bg}" - a 6-digit hex color like #0a0a0a.`);
}
if (!["auto", "webp", "svg"].includes(format)) {
  die(`Bad --format "${format}" - auto, webp or svg.`);
}

let subjectSvg;
try {
  subjectSvg = readFileSync(svgPath, "utf8");
} catch {
  die(`Cannot read subject SVG at ${svgPath}`);
}
if (!/<svg[\s>]/.test(subjectSvg)) {
  die(`${svgPath} does not look like an SVG document.`);
}
if (!subjectSvg.includes(`viewBox="0 0 ${W} ${H}"`)) {
  die(`Subject SVG must declare viewBox="0 0 ${W} ${H}" so it maps 1:1 onto the cover.`);
}

const hue = HUES[hueKey];

// The house base. Glow position varies by slug hash so a shelf of covers
// doesn't share one identical light source, but stays in the upper half
// where card crops keep it visible.
//
// Every id is `dsc-` prefixed because the SVG fallback below inlines the
// subject layer into this same document, and ids are document-global - an
// unprefixed `glow` here would be silently overridden by a subject that
// happened to define its own gradient with that name.
const glowX = 300 + (hash(slug) % 1000);
const glowY = 180 + (hash(`${slug}y`) % 300);
const baseDefs = `<defs>
    <radialGradient id="dsc-glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${hue.accent}" stop-opacity="0.34"/>
      <stop offset="45%" stop-color="${hue.deep}" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="${hue.deep}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="dsc-vignette" cx="0.5" cy="0.5" r="0.72">
      <stop offset="60%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.5"/>
    </radialGradient>
    <pattern id="dsc-dots" width="36" height="36" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="1.5" fill="#ffffff" fill-opacity="0.05"/>
    </pattern>
  </defs>`;
const baseBody = `<rect width="${W}" height="${H}" fill="${bg}"/>
  <rect width="${W}" height="${H}" fill="url(#dsc-dots)"/>
  <ellipse cx="${glowX}" cy="${glowY}" rx="820" ry="560" fill="url(#dsc-glow)"/>
  <rect width="${W}" height="${H}" fill="url(#dsc-vignette)"/>`;
const baseSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${baseDefs}
  ${baseBody}
</svg>`;

const ICON_SIZE = 414;
function iconSvgDoc() {
  const { viewBox, path } = ICONS[iconKey];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="${viewBox}"><path fill="#fff" d="${path}"/></svg>`;
}

mkdirSync(outDir, { recursive: true });

// sharp is resolved, never required, and never installed. A Hugo or Astro repo
// may not have it at all, and installing a native binary mid-CI-run to draw one
// decorative image is a bad trade. The .svg fallback is a real cover, not a
// degraded one - the exact same artwork, just not rasterized.
//
// Two resolution attempts, because one is not enough on the most common stack:
// Next.js ships sharp as an optional dependency, but pnpm's strict node_modules
// does NOT hoist transitive deps, so a bare `import("sharp")` fails in a
// perfectly ordinary pnpm + Next repo that has sharp sitting right there inside
// next's own tree. The second attempt resolves it the way Next itself does.
async function loadSharp() {
  const req = createRequire(import.meta.url);
  const attempts = [
    () => req.resolve("sharp"),
    () => createRequire(req.resolve("next/package.json")).resolve("sharp"),
  ];
  for (const resolve of attempts) {
    try {
      const mod = await import(pathToFileURL(resolve()).href);
      return mod.default ?? mod;
    } catch {
      // Next isn't installed, sharp isn't under it, or the binary won't load on
      // this platform - all of them mean "try the next route, then fall back".
    }
  }
  return null;
}

const sharp = format === "svg" ? null : await loadSharp();
if (!sharp && format === "webp") {
  die(
    "--format webp was requested but `sharp` could not be resolved in this repo.\n" +
      "Install it, or drop --format to let the script write an .svg cover instead.",
  );
}

let outPath;
if (sharp) {
  outPath = join(outDir, `${slug}.webp`);
  console.log(`Rendering cover for "${slug}" (hue: ${hueKey}, format: webp)...`);
  const base = await sharp(Buffer.from(baseSvg)).png().toBuffer();
  const subject = await sharp(Buffer.from(subjectSvg))
    .resize(W, H, { fit: "contain" })
    .png()
    .toBuffer();
  const layers = [{ input: subject }];
  if (iconKey) {
    layers.push({
      input: await sharp(Buffer.from(iconSvgDoc())).png().toBuffer(),
      gravity: "center",
    });
  }
  await sharp(base).composite(layers).webp({ quality: 82 }).toFile(outPath);
} else {
  outPath = join(outDir, `${slug}.svg`);
  console.log(`Rendering cover for "${slug}" (hue: ${hueKey}, format: svg - no sharp available)...`);
  // Nest the subject document inside the base. Nested <svg> elements are valid
  // and keep the subject's own coordinate system, so the artwork lands exactly
  // where its author placed it.
  const inner = subjectSvg
    .replace(/^﻿/, "")
    .replace(/<\?xml[^>]*\?>/g, "")
    .replace(/<!DOCTYPE[^>]*>/g, "")
    .trim();
  const icon = iconKey
    ? `<svg x="${(W - ICON_SIZE) / 2}" y="${(H - ICON_SIZE) / 2}" width="${ICON_SIZE}" height="${ICON_SIZE}" overflow="visible">${iconSvgDoc()}</svg>`
    : "";
  writeFileSync(
    outPath,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">
  ${baseDefs}
  ${baseBody}
  ${inner}
  ${icon}
</svg>
`,
  );
}

// Machine-readable last lines: the build agent reads COVER_FILE rather than
// guessing an extension, because which branch ran depends on the repo.
console.log(`Wrote ${outPath}`);
console.log(`COVER_FILE=${outPath}`);
// COVER_URL is only emitted for the one layout this script can map with
// certainty - a `public/` static root, which is Next's and Astro's. Anywhere
// else (Hugo's `static/`, a Jekyll `assets/`) the served URL is a repo
// convention this script cannot know, and a confidently wrong path would ship
// a broken image; the agent resolves it from the repo instead.
if (outPath.startsWith("public/")) {
  console.log(`COVER_URL=/${outPath.slice("public/".length)}`);
} else {
  console.log("COVER_URL=unknown (non-public/ output dir - map it to a served URL yourself)");
}
