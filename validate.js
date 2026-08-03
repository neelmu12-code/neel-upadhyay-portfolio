"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const CUSTOM_HOST = "neelupadhyay.ca";
const CUSTOM_ORIGIN = `https://${CUSTOM_HOST}`;
const LAST_SIGNIFICANT_UPDATE = "2026-08-03";
const LEGACY_PAGES_DOMAIN =
  "neelmu12-code.github.io" + "/neel-upadhyay-portfolio";
const EXPECTED_RESUMES = [
  "Neel_Upadhyay_SResume.pdf",
  "Neel_Upadhyay_SC_Resume.pdf",
  "Neel_Upadhyay_HResume.pdf",
  "Neel_Upadhyay_CResume.pdf",
  "Neel_Upadhyay_COResume.pdf",
  "Neel_Upadhyay_CDResume.pdf",
];
const TEXT_EXTENSIONS = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".svg",
  ".txt",
  ".xml",
]);
const SKIPPED_DIRECTORIES = new Set([
  ".agents",
  ".codex",
  ".git",
  "node_modules",
]);
const ARIA_ID_REFERENCE_ATTRIBUTES = [
  "aria-activedescendant",
  "aria-controls",
  "aria-describedby",
  "aria-details",
  "aria-errormessage",
  "aria-flowto",
  "aria-labelledby",
  "aria-owns",
];

const failures = [];
const stats = {
  cssFiles: 0,
  htmlFiles: 0,
  images: 0,
  localReferences: 0,
};

function relative(filePath) {
  return path.relative(ROOT, filePath).replaceAll("\\", "/") || ".";
}

function lineNumber(source, index) {
  return source.slice(0, index).split("\n").length;
}

function fail(message) {
  failures.push(message);
}

function readRequired(relativePath) {
  const filePath = path.join(ROOT, relativePath);

  if (!fs.existsSync(filePath)) {
    fail(`${relativePath}: required file is missing`);
    return null;
  }

  return fs.readFileSync(filePath, "utf8");
}

function walkFiles(directory, predicate, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIPPED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const filePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      walkFiles(filePath, predicate, output);
    } else if (predicate(filePath)) {
      output.push(filePath);
    }
  }

  return output;
}

function parseAttributes(source) {
  const attributes = Object.create(null);
  const attributePattern =
    /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

  for (const match of source.matchAll(attributePattern)) {
    const name = match[1].toLowerCase();
    attributes[name] = match[2] ?? match[3] ?? match[4] ?? "";
  }

  return attributes;
}

function stripHtml(source) {
  return source
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#(?:x([0-9a-f]+)|([0-9]+));/gi, (_, hex, decimal) =>
      String.fromCodePoint(Number.parseInt(hex || decimal, hex ? 16 : 10))
    )
    .replace(/\s+/g, " ")
    .trim();
}

function safeDecode(value, context) {
  try {
    return decodeURIComponent(value);
  } catch {
    fail(`${context}: malformed URL encoding in "${value}"`);
    return value;
  }
}

function isNonLocalReference(value) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value);
}

function localPathFromReference(fromFile, value, context) {
  const trimmed = value.trim();

  if (
    trimmed === "" ||
    trimmed.startsWith("#") ||
    isNonLocalReference(trimmed)
  ) {
    return null;
  }

  const pathPart = safeDecode(trimmed.split("#")[0].split("?")[0], context);
  if (pathPart === "") {
    return null;
  }

  const resolved = pathPart.startsWith("/")
    ? path.resolve(ROOT, pathPart.replace(/^\/+/, ""))
    : path.resolve(path.dirname(fromFile), pathPart);
  const relativeToRoot = path.relative(ROOT, resolved);

  if (
    relativeToRoot.startsWith("..") ||
    path.isAbsolute(relativeToRoot)
  ) {
    fail(`${context}: local reference escapes the repository root: "${value}"`);
    return null;
  }

  return resolved;
}

function validateLocalReference(fromFile, value, context) {
  const resolved = localPathFromReference(fromFile, value, context);
  if (!resolved) {
    return;
  }

  stats.localReferences += 1;
  if (!fs.existsSync(resolved)) {
    fail(`${context}: missing local target "${value}"`);
  }
}

function collectHtmlDocument(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const sourceWithoutComments = source.replace(
    /<!--[\s\S]*?-->/g,
    (comment) => comment.replace(/[^\r\n]/g, " ")
  );
  const tags = [];
  const ids = new Map();
  const references = [];

  for (const match of sourceWithoutComments.matchAll(
    /<([a-z][\w:-]*)\b([^>]*)>/gi
  )) {
    const tagName = match[1].toLowerCase();
    const attributes = parseAttributes(match[2]);
    const line = lineNumber(sourceWithoutComments, match.index);
    tags.push({ attributes, line, tagName });

    if (Object.hasOwn(attributes, "id")) {
      const id = attributes.id.trim();
      if (id === "") {
        fail(`${relative(filePath)}:${line}: id must not be empty`);
      } else {
        const locations = ids.get(id) || [];
        locations.push(line);
        ids.set(id, locations);
      }
    }

    for (const attributeName of ["href", "src", "poster"]) {
      if (!Object.hasOwn(attributes, attributeName)) {
        continue;
      }

      const value = attributes[attributeName].trim();
      const context = `${relative(filePath)}:${line} ${attributeName}`;
      references.push({ attributeName, context, value });

      if (attributeName === "href" && value === "#") {
        fail(`${context}: placeholder href="#" is not allowed`);
      }

      validateLocalReference(filePath, value, context);
    }

    if (tagName === "img") {
      stats.images += 1;

      if (!Object.hasOwn(attributes, "alt")) {
        fail(`${relative(filePath)}:${line}: <img> is missing alt`);
      }

      for (const dimension of ["width", "height"]) {
        const value = attributes[dimension];
        if (!/^\d+$/.test(value || "") || Number(value) <= 0) {
          fail(
            `${relative(filePath)}:${line}: <img> needs a positive numeric ${dimension}`
          );
        }
      }
    }

    if (tagName === "video") {
      if (!Object.hasOwn(attributes, "controls")) {
        fail(`${relative(filePath)}:${line}: <video> must expose controls`);
      }

      if (
        !Object.hasOwn(attributes, "aria-label") &&
        !Object.hasOwn(attributes, "aria-labelledby")
      ) {
        fail(`${relative(filePath)}:${line}: <video> needs an accessible name`);
      }
    }

    if (tagName === "button" && !Object.hasOwn(attributes, "type")) {
      fail(`${relative(filePath)}:${line}: <button> needs an explicit type`);
    }

    if (Object.hasOwn(attributes, "data-video-open")) {
      if (tagName !== "a" || !attributes.href) {
        fail(
          `${relative(filePath)}:${line}: video trigger needs a direct-link fallback`
        );
      }
    }
  }

  for (const [id, locations] of ids) {
    if (locations.length > 1) {
      fail(
        `${relative(filePath)}: duplicate id="${id}" on lines ${locations.join(", ")}`
      );
    }
  }

  for (const reference of references) {
    if (
      reference.attributeName !== "href" ||
      !reference.value.startsWith("#") ||
      reference.value === "#"
    ) {
      continue;
    }

    const fragment = safeDecode(
      reference.value.slice(1),
      reference.context
    );
    if (!ids.has(fragment)) {
      fail(
        `${reference.context}: internal fragment "${reference.value}" has no matching id`
      );
    }
  }

  for (const tag of tags) {
    for (const attributeName of ARIA_ID_REFERENCE_ATTRIBUTES) {
      if (!Object.hasOwn(tag.attributes, attributeName)) {
        continue;
      }

      const value = tag.attributes[attributeName].trim();
      const context = `${relative(filePath)}:${tag.line} ${attributeName}`;
      if (value === "") {
        fail(`${context}: ARIA ID reference must not be empty`);
        continue;
      }

      for (const idReference of value.split(/\s+/)) {
        if (!ids.has(idReference)) {
          fail(
            `${context}: "${idReference}" has no matching id in this document`
          );
        }
      }
    }
  }

  for (const match of sourceWithoutComments.matchAll(
    /<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi
  )) {
    const attributes = parseAttributes(match[1]);
    const line = lineNumber(sourceWithoutComments, match.index);
    const context = `${relative(filePath)}:${line}`;
    const href = (attributes.href || "").trim();
    const target = (attributes.target || "").trim().toLowerCase();

    if (/^https?:\/\//i.test(href) && target !== "_blank") {
      fail(`${context}: external anchor "${href}" must use target="_blank"`);
    }

    if (target !== "_blank") {
      continue;
    }

    const relTokens = new Set(
      (attributes.rel || "")
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
    );
    if (!relTokens.has("noopener") || !relTokens.has("noreferrer")) {
      fail(
        `${context}: target="_blank" anchor "${href}" needs rel="noopener noreferrer"`
      );
    }

    const accessibleName = Object.hasOwn(attributes, "aria-label")
      ? attributes["aria-label"].trim()
      : stripHtml(match[2]);
    if (!/\bnew\s+tab\b/i.test(accessibleName)) {
      fail(
        `${context}: target="_blank" anchor "${href}" must indicate "new tab" in its accessible text or aria-label`
      );
    }
  }

  const jsonLdValues = [];
  for (const match of sourceWithoutComments.matchAll(
    /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi
  )) {
    const attributes = parseAttributes(match[1]);
    if ((attributes.type || "").toLowerCase() !== "application/ld+json") {
      continue;
    }

    const line = lineNumber(sourceWithoutComments, match.index);
    try {
      jsonLdValues.push(JSON.parse(match[2].trim()));
    } catch (error) {
      fail(
        `${relative(filePath)}:${line}: JSON-LD is invalid JSON (${error.message})`
      );
    }
  }

  return { ids, jsonLdValues, references, source, tags };
}

function validateCss(filePath) {
  const source = fs.readFileSync(filePath, "utf8");

  for (const match of source.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)) {
    const value = match[2].trim();
    const context = `${relative(filePath)}:${lineNumber(source, match.index)} url()`;
    validateLocalReference(filePath, value, context);
  }
}

function findTag(tags, tagName, predicate) {
  return tags.find(
    (tag) => tag.tagName === tagName && predicate(tag.attributes)
  );
}

function validateProductionMetadata(indexDocument) {
  const canonical = findTag(
    indexDocument.tags,
    "link",
    (attributes) =>
      (attributes.rel || "")
        .toLowerCase()
        .split(/\s+/)
        .includes("canonical")
  );
  if (!canonical || canonical.attributes.href !== `${CUSTOM_ORIGIN}/`) {
    fail(
      `index.html: canonical URL must be exactly "${CUSTOM_ORIGIN}/"`
    );
  }

  const ogUrl = findTag(
    indexDocument.tags,
    "meta",
    (attributes) => (attributes.property || "").toLowerCase() === "og:url"
  );
  if (!ogUrl || ogUrl.attributes.content !== `${CUSTOM_ORIGIN}/`) {
    fail(`index.html: og:url must be exactly "${CUSTOM_ORIGIN}/"`);
  }

  const ogImage = findTag(
    indexDocument.tags,
    "meta",
    (attributes) => (attributes.property || "").toLowerCase() === "og:image"
  );
  if (
    !ogImage ||
    !ogImage.attributes.content.startsWith(`${CUSTOM_ORIGIN}/`)
  ) {
    fail(`index.html: og:image must use the ${CUSTOM_HOST} origin`);
  }

  const robotsMeta = findTag(
    indexDocument.tags,
    "meta",
    (attributes) => (attributes.name || "").toLowerCase() === "robots"
  );
  const robotsTokens = new Set(
    (robotsMeta?.attributes.content || "")
      .toLowerCase()
      .split(/[\s,]+/)
      .filter(Boolean)
  );
  for (const directive of [
    "index",
    "follow",
    "max-image-preview:large",
    "max-snippet:-1",
    "max-video-preview:-1",
  ]) {
    if (!robotsTokens.has(directive)) {
      fail(`index.html: robots metadata must include "${directive}"`);
    }
  }

  if (indexDocument.jsonLdValues.length === 0) {
    fail("index.html: at least one application/ld+json block is required");
    return;
  }

  const jsonLdNodes = [];
  const addJsonLdNodes = (value) => {
    if (Array.isArray(value)) {
      value.forEach(addJsonLdNodes);
    } else if (value && typeof value === "object") {
      jsonLdNodes.push(value);
      if (Array.isArray(value["@graph"])) {
        value["@graph"].forEach(addJsonLdNodes);
      }
    }
  };
  indexDocument.jsonLdValues.forEach(addJsonLdNodes);

  const findJsonLdType = (expectedType) =>
    jsonLdNodes.find((node) => {
      const type = node["@type"];
      return (
        type === expectedType ||
        (Array.isArray(type) && type.includes(expectedType))
      );
    });

  const website = findJsonLdType("WebSite");
  const profilePage = findJsonLdType("ProfilePage");
  const profileImage = findJsonLdType("ImageObject");
  const person = jsonLdNodes.find((node) => {
    const type = node["@type"];
    return type === "Person" || (Array.isArray(type) && type.includes("Person"));
  });

  if (!website) {
    fail("index.html: JSON-LD must include a WebSite node");
  } else {
    if (website["@id"] !== `${CUSTOM_ORIGIN}/#website`) {
      fail(`index.html: JSON-LD WebSite @id must use the ${CUSTOM_HOST} origin`);
    }
    if (website.url !== `${CUSTOM_ORIGIN}/`) {
      fail(`index.html: JSON-LD WebSite url must be "${CUSTOM_ORIGIN}/"`);
    }
  }

  if (!profilePage) {
    fail("index.html: JSON-LD must include a ProfilePage node");
  } else {
    if (profilePage.url !== `${CUSTOM_ORIGIN}/`) {
      fail(`index.html: JSON-LD ProfilePage url must be "${CUSTOM_ORIGIN}/"`);
    }
    if (profilePage.mainEntity?.["@id"] !== `${CUSTOM_ORIGIN}/#person`) {
      fail("index.html: JSON-LD ProfilePage mainEntity must reference the Person node");
    }
    if (profilePage.dateModified !== LAST_SIGNIFICANT_UPDATE) {
      fail(
        `index.html: JSON-LD ProfilePage dateModified must be "${LAST_SIGNIFICANT_UPDATE}"`
      );
    }
  }

  if (!person) {
    fail("index.html: JSON-LD must include a Person node");
  } else {
    if (person["@id"] !== `${CUSTOM_ORIGIN}/#person`) {
      fail(`index.html: JSON-LD Person @id must use the ${CUSTOM_HOST} origin`);
    }
    if (person.url !== `${CUSTOM_ORIGIN}/`) {
      fail(`index.html: JSON-LD Person url must be "${CUSTOM_ORIGIN}/"`);
    }
    const imageIsLocalUrl =
      typeof person.image === "string" &&
      person.image.startsWith(`${CUSTOM_ORIGIN}/`);
    const imageReferencesProfile =
      person.image?.["@id"] === `${CUSTOM_ORIGIN}/#profile-image`;
    if (!imageIsLocalUrl && !imageReferencesProfile) {
      fail(
        `index.html: JSON-LD Person image must use or reference the ${CUSTOM_HOST} origin`
      );
    }
  }

  if (
    !profileImage ||
    profileImage["@id"] !== `${CUSTOM_ORIGIN}/#profile-image` ||
    typeof profileImage.contentUrl !== "string" ||
    !profileImage.contentUrl.startsWith(`${CUSTOM_ORIGIN}/`)
  ) {
    fail("index.html: JSON-LD must include the local profile ImageObject");
  }

  const sourceCodeNodes = jsonLdNodes.filter((node) => {
    const type = node["@type"];
    return (
      type === "SoftwareSourceCode" ||
      (Array.isArray(type) && type.includes("SoftwareSourceCode"))
    );
  });
  if (sourceCodeNodes.length < 3) {
    fail("index.html: JSON-LD must describe all three featured software projects");
  }
  for (const project of sourceCodeNodes) {
    if (project.contributor?.["@id"] !== `${CUSTOM_ORIGIN}/#person`) {
      fail(
        `index.html: JSON-LD project "${project.name || project["@id"]}" must reference Neel as contributor`
      );
    }
  }
}

function validateLegacyDomain() {
  const textFiles = walkFiles(ROOT, (filePath) => {
    const name = path.basename(filePath);
    return name === "CNAME" || TEXT_EXTENSIONS.has(path.extname(name).toLowerCase());
  });

  for (const filePath of textFiles) {
    const source = fs.readFileSync(filePath, "utf8");
    const lowerSource = source.toLowerCase();
    const legacy = LEGACY_PAGES_DOMAIN.toLowerCase();
    let index = lowerSource.indexOf(legacy);

    while (index !== -1) {
      fail(
        `${relative(filePath)}:${lineNumber(source, index)}: legacy GitHub Pages domain is not allowed`
      );
      index = lowerSource.indexOf(legacy, index + legacy.length);
    }
  }
}

function validateHostingFiles() {
  const robots = readRequired("robots.txt");
  if (
    robots &&
    !new RegExp(
      `^Sitemap:\\s*${CUSTOM_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/sitemap\\.xml\\s*$`,
      "im"
    ).test(robots)
  ) {
    fail(
      `robots.txt: Sitemap must be "${CUSTOM_ORIGIN}/sitemap.xml"`
    );
  }

  const sitemap = readRequired("sitemap.xml");
  if (sitemap) {
    const locations = [...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map(
      (match) => match[1]
    );
    if (locations.length === 0) {
      fail("sitemap.xml: at least one <loc> URL is required");
    }
    if (!locations.includes(`${CUSTOM_ORIGIN}/`)) {
      fail(`sitemap.xml: must include "${CUSTOM_ORIGIN}/"`);
    }
    for (const location of locations) {
      if (!location.startsWith(`${CUSTOM_ORIGIN}/`)) {
        fail(
          `sitemap.xml: "${location}" must use the ${CUSTOM_HOST} origin`
        );
      }
    }

    const lastModifiedValues = [
      ...sitemap.matchAll(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/gi),
    ].map((match) => match[1]);
    if (!lastModifiedValues.includes(LAST_SIGNIFICANT_UPDATE)) {
      fail(
        `sitemap.xml: must include <lastmod>${LAST_SIGNIFICANT_UPDATE}</lastmod>`
      );
    }

    const imageLocations = [
      ...sitemap.matchAll(/<image:loc>\s*([^<]+?)\s*<\/image:loc>/gi),
    ].map((match) => match[1]);
    if (imageLocations.length === 0) {
      fail("sitemap.xml: at least one <image:loc> URL is required");
    }
    for (const imageLocation of imageLocations) {
      if (!imageLocation.startsWith(`${CUSTOM_ORIGIN}/assets/images/`)) {
        fail(
          `sitemap.xml: image "${imageLocation}" must use the ${CUSTOM_HOST} image origin`
        );
      }
    }
  }

  const cname = readRequired("CNAME");
  if (cname && cname.trim() !== CUSTOM_HOST) {
    fail(`CNAME: content must be exactly "${CUSTOM_HOST}"`);
  }
}

function validateResumeReferences(htmlDocuments) {
  const referencedPaths = new Set(
    [...htmlDocuments.values()].flatMap((document) => document.references).map((reference) => {
      const pathPart = safeDecode(
        reference.value.split("#")[0].split("?")[0],
        reference.context
      );
      return pathPart.replaceAll("\\", "/").replace(/^\.\//, "");
    })
  );

  for (const fileName of EXPECTED_RESUMES) {
    const resumePath = `assets/resume/${fileName}`;
    if (!fs.existsSync(path.join(ROOT, ...resumePath.split("/")))) {
      fail(`${resumePath}: expected résumé PDF is missing`);
    }
    if (!referencedPaths.has(resumePath)) {
      fail(`HTML pages: résumé PDF is not referenced: "${resumePath}"`);
    }
  }
}

function validateCrossDocumentFragments(htmlDocuments) {
  for (const [fromFile, document] of htmlDocuments) {
    for (const reference of document.references) {
      const value = reference.value.trim();
      if (
        reference.attributeName !== "href" ||
        value.startsWith("#") ||
        !value.includes("#") ||
        isNonLocalReference(value)
      ) {
        continue;
      }

      const fragment = safeDecode(value.slice(value.indexOf("#") + 1), reference.context);
      if (!fragment) {
        continue;
      }

      const targetPath = localPathFromReference(fromFile, value, reference.context);
      const targetDocument = htmlDocuments.get(targetPath);
      if (targetDocument && !targetDocument.ids.has(fragment)) {
        fail(
          `${reference.context}: target document has no id="${fragment}"`
        );
      }
    }
  }
}

const htmlFiles = walkFiles(
  ROOT,
  (filePath) => path.extname(filePath).toLowerCase() === ".html"
);
const cssFiles = walkFiles(
  ROOT,
  (filePath) => path.extname(filePath).toLowerCase() === ".css"
);
const htmlDocuments = new Map();

for (const filePath of htmlFiles) {
  stats.htmlFiles += 1;
  htmlDocuments.set(filePath, collectHtmlDocument(filePath));
}

for (const filePath of cssFiles) {
  stats.cssFiles += 1;
  validateCss(filePath);
}

const indexPath = path.join(ROOT, "index.html");
const indexDocument = htmlDocuments.get(indexPath);
if (!indexDocument) {
  fail("index.html: required file is missing");
} else {
  validateProductionMetadata(indexDocument);
  validateResumeReferences(htmlDocuments);
  validateCrossDocumentFragments(htmlDocuments);
}

validateLegacyDomain();
validateHostingFiles();

const uniqueFailures = [...new Set(failures)];
if (uniqueFailures.length > 0) {
  console.error(
    `Site validation failed with ${uniqueFailures.length} issue${uniqueFailures.length === 1 ? "" : "s"}:`
  );
  uniqueFailures.forEach((message, index) => {
    console.error(`${index + 1}. ${message}`);
  });
  process.exitCode = 1;
} else {
  console.log(
    `Site validation passed (${stats.htmlFiles} HTML, ${stats.cssFiles} CSS, ${stats.images} images, ${stats.localReferences} local references).`
  );
}
