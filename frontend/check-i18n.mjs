import { readFile } from 'node:fs/promises';

const localeFiles = {
  en: new URL('./public/i18n/en.json', import.meta.url),
  pl: new URL('./public/i18n/pl.json', import.meta.url),
};

function flattenKeys(value, prefix = '') {
  return Object.entries(value).flatMap(([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      return flattenKeys(entry, path);
    }

    return [path];
  });
}

const locales = Object.fromEntries(
  await Promise.all(
    Object.entries(localeFiles).map(async ([locale, url]) => {
      const contents = await readFile(url, 'utf8');
      return [locale, new Set(flattenKeys(JSON.parse(contents)))];
    })
  )
);

const referenceLocale = 'en';
const referenceKeys = locales[referenceLocale];
let hasMismatch = false;

for (const [locale, keys] of Object.entries(locales)) {
  if (locale === referenceLocale) {
    continue;
  }

  const missing = [...referenceKeys].filter((key) => !keys.has(key));
  const unexpected = [...keys].filter((key) => !referenceKeys.has(key));

  if (missing.length || unexpected.length) {
    hasMismatch = true;
    console.error(`${locale}: translation keys differ from ${referenceLocale}`);

    if (missing.length) {
      console.error(`  Missing: ${missing.join(', ')}`);
    }

    if (unexpected.length) {
      console.error(`  Unexpected: ${unexpected.join(', ')}`);
    }
  }
}

if (hasMismatch) {
  process.exitCode = 1;
} else {
  console.log(`Translation keys match (${referenceKeys.size} keys per locale).`);
}
