const fs = require("node:fs");
const path = require("node:path");

const supabaseUrl = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !publishableKey) {
  throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required to build.");
}

const parsedUrl = new URL(supabaseUrl);
if (parsedUrl.protocol !== "https:") {
  throw new Error("SUPABASE_URL must use HTTPS.");
}

const outputDirectory = path.join(__dirname, "dist");
fs.rmSync(outputDirectory, { recursive: true, force: true });
fs.mkdirSync(outputDirectory, { recursive: true });

for (const file of ["index.html", "styles.css", "app.js"]) {
  fs.copyFileSync(path.join(__dirname, file), path.join(outputDirectory, file));
}

const config = {
  url: supabaseUrl,
  publishableKey,
};
fs.writeFileSync(
  path.join(outputDirectory, "config.js"),
  `window.CLASS_FEEDBACK_CONFIG = ${JSON.stringify(config)};\n`,
  "utf8",
);
