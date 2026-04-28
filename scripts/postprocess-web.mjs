import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, "dist");
const assetsDir = path.join(projectRoot, "assets");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeText(filePath, contents) {
  fs.writeFileSync(filePath, contents, "utf8");
}

function copyFile(src, dst) {
  fs.copyFileSync(src, dst);
}

function upsertHeadLinks(html) {
  const headClose = "</head>";
  const idx = html.indexOf(headClose);
  if (idx === -1) {
    throw new Error("dist/index.html is missing </head>");
  }

  const injections = [
    '<link rel="manifest" href="/manifest.webmanifest" />',
    '<meta name="theme-color" content="#ffffff" />',
    '<meta name="apple-mobile-web-app-capable" content="yes" />',
    '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
    '<link rel="icon" type="image/png" sizes="192x192" href="/pwa-192.png" />',
    '<link rel="icon" type="image/png" sizes="512x512" href="/pwa-512.png" />',
  ];

  // Avoid duplicating if script runs multiple times.
  const alreadyHasManifest = html.includes('rel="manifest"') || html.includes("manifest.webmanifest");
  if (alreadyHasManifest) {
    return html;
  }

  const insert = `  ${injections.join("\n  ")}\n`;
  return html.slice(0, idx) + insert + html.slice(idx);
}

function main() {
  if (!fs.existsSync(distDir)) {
    throw new Error("dist directory does not exist. Run `npx expo export --platform web` first.");
  }

  // Reuse the existing app icon asset; Chrome accepts larger PNGs, but
  // we also ship 192/512 aliases for PWA expectations.
  const iconPng = path.join(assetsDir, "icon.png");
  if (!fs.existsSync(iconPng)) {
    throw new Error("assets/icon.png is missing");
  }

  ensureDir(distDir);
  copyFile(iconPng, path.join(distDir, "apple-touch-icon.png"));
  copyFile(iconPng, path.join(distDir, "pwa-192.png"));
  copyFile(iconPng, path.join(distDir, "pwa-512.png"));

  const manifest = {
    name: "When2Meet",
    short_name: "When2Meet",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
      { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };

  writeText(path.join(distDir, "manifest.webmanifest"), JSON.stringify(manifest, null, 2));

  const indexHtmlPath = path.join(distDir, "index.html");
  const html = readText(indexHtmlPath);
  const nextHtml = upsertHeadLinks(html);
  if (nextHtml !== html) {
    writeText(indexHtmlPath, nextHtml);
  }
}

main();

