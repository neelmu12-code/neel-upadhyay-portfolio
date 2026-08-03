"use strict";

const fs = require("fs");
const path = require("path");

const root = __dirname;
const dist = path.join(root, "dist");
const client = path.join(dist, "client");
const server = path.join(dist, "server");

const files = [
  "index.html",
  "work.html",
  "experience.html",
  "credentials.html",
  "skills.html",
  "contact.html",
  "styles.css",
  "script.js",
  "favicon.svg",
  "robots.txt",
  "sitemap.xml",
];

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(client, { recursive: true });
fs.mkdirSync(server, { recursive: true });

for (const file of files) {
  fs.copyFileSync(path.join(root, file), path.join(client, file));
}

fs.cpSync(path.join(root, "assets"), path.join(client, "assets"), { recursive: true });
fs.copyFileSync(path.join(root, "worker.mjs"), path.join(server, "index.js"));

console.log(`Built ${files.length} site files and project assets.`);
