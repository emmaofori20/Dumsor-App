import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PDFParse } from 'pdf-parse';

const pdfPath = 'C:/Users/emman/Downloads/800MW GLOBAL LOAD MANAGEMENT TIME TABLE AND GROUPING- 2026 6hrs (1).pdf';
const outputPath = resolve('src/app/data/generated-areas.ts');

const regionNames = ['ACCRA', 'ASHANTI', 'TEMA', 'VOLTA', 'WESTERN', 'EASTERN', 'CENTRAL'];
const groupMarker = (group) => new RegExp(`(?:^|\\n)\\s*${group}\\s*(?=\\n|[A-Z0-9])`, 'g');

function normalizeText(text) {
  return text
    .replace(/\r/g, '\n')
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n');
}

function titleCase(value) {
  return value
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase())
    .replace(/\bShs\b/g, 'SHS')
    .replace(/\bUcc\b/g, 'UCC')
    .replace(/\bKnust\b/g, 'KNUST')
    .replace(/\bUpsa\b/g, 'UPSA')
    .replace(/\bEcgb\b/g, 'ECG')
    .replace(/\bEcG\b/g, 'ECG')
    .replace(/\bGcb\b/g, 'GCB')
    .replace(/\bMtn\b/g, 'MTN')
    .replace(/\bSsnit\b/g, 'SSNIT')
    .replace(/\bUhAs\b/g, 'UHAS');
}

function cleanPlace(value) {
  let cleaned = value
    .replace(/\s+/g, ' ')
    .replace(/^[-–—.:;\s]+|[-–—.:;\s]+$/g, '')
    .replace(/^and\s+/i, '')
    .replace(/\s+and$/i, '')
    .replace(/\betc\.?$/i, '')
    .trim();

  cleaned = cleaned.replace(/\bpart os\b/gi, 'part of');
  cleaned = cleaned.replace(/\bEstaes\b/gi, 'Estates');
  cleaned = cleaned.replace(/\bRounabout\b/gi, 'Roundabout');

  if (!cleaned || cleaned.length < 3) return '';
  if (/^\d+$/.test(cleaned)) return '';
  if (/^(LOAD MANAGEMENT|AREAS TO BE AFFECTED|CENTRAL|ACCRA|ASHANTI|TEMA|VOLTA|WESTERN|EASTERN)$/i.test(cleaned)) return '';
  if (/^-- \d+ of \d+ --$/.test(cleaned)) return '';

  return titleCase(cleaned);
}

function splitPlaces(block) {
  return block
    .replace(/\n/g, ' ')
    .split(/[,;]+|\s{2,}/)
    .map(cleanPlace)
    .filter(Boolean);
}

function stripPageNoise(block) {
  return block
    .replace(/LOAD MANAGEMENT DUE TO GENERATION DEFICIT/g, ' ')
    .replace(/AREAS TO BE AFFECTED/g, ' ')
    .replace(/\b(ACCRA|ASHANTI|ASHANT|TEMA|VOLTA|WESTERN|EASTERN|CENTRAL)\b\s*$/g, ' ')
    .replace(/\b(CENTRAL|ACCRA|ASHANTI|TEMA|WESTERN|EASTERN|VOLTA)\b\s+(?=(CENTRAL|ACCRA|ASHANTI|TEMA|WESTERN|EASTERN|VOLTA)\b)/g, ' ');
}

function splitByGroupMarkers(page, group, regions) {
  const body = stripPageNoise(page);
  const matches = [...body.matchAll(groupMarker(group))];
  const sections = [];

  for (let i = 0; i < regions.length; i += 1) {
    const match = matches[i];
    if (!match) continue;
    const start = match.index + match[0].length;
    const end = matches[i + 1]?.index ?? body.length;
    sections.push({ group, region: regions[i], block: body.slice(start, end) });
  }

  return sections;
}

function splitByRegionHeaders(page, group, headers) {
  const body = stripPageNoise(page);
  const markers = headers
    .map(({ label, region }) => {
      const match = body.match(new RegExp(`\\b${label}\\s+${group}\\b`));
      return match ? { index: match.index + match[0].length, label, region } : undefined;
    })
    .filter(Boolean)
    .sort((a, b) => a.index - b.index);

  return markers.map((marker, index) => ({
    group,
    region: marker.region,
    block: body.slice(marker.index, markers[index + 1]?.index ?? body.length),
  }));
}

function page3BSections(page) {
  const body = stripPageNoise(page);
  const voltaMatch = body.match(/\bVOLTA\s+B\b/);
  const accraMatch = [...body.matchAll(groupMarker('B'))][0];
  const sections = [];
  if (voltaMatch && accraMatch) {
    sections.push({
      group: 'B',
      region: 'VOLTA',
      block: body.slice(voltaMatch.index + voltaMatch[0].length, accraMatch.index),
    });
    sections.push({
      group: 'B',
      region: 'ACCRA',
      block: body.slice(accraMatch.index + accraMatch[0].length),
    });
  }
  return sections;
}

function extractSectionsFromPages(pages) {
  return [
    ...splitByGroupMarkers(pages[1], 'A', ['VOLTA', 'ACCRA']),
    ...splitByGroupMarkers(pages[2], 'A', ['ASHANTI', 'TEMA', 'WESTERN', 'EASTERN', 'CENTRAL']),
    ...page3BSections(pages[3]),
    ...splitByRegionHeaders(pages[4], 'B', [
      { label: 'ASHANT', region: 'ASHANTI' },
      { label: 'TEMA', region: 'TEMA' },
      { label: 'WESTERN', region: 'WESTERN' },
      { label: 'EASTERN', region: 'EASTERN' },
    ]),
    ...splitByRegionHeaders(pages[5], 'B', [{ label: 'CENTRAL', region: 'CENTRAL' }]),
    ...splitByGroupMarkers(pages[6], 'C', ['VOLTA', 'ACCRA']),
    ...splitByGroupMarkers(pages[7], 'C', ['ASHANTI', 'TEMA']),
    ...splitByGroupMarkers(pages[8], 'C', ['WESTERN', 'EASTERN', 'CENTRAL']),
  ].filter((section) => section.block.trim().length > 20);
}

function stableId(region, group, name) {
  return `${region}-${group}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function keywordsFor(name, region) {
  return Array.from(new Set([name, region, ...name.split(/[,&/\s-]+/)].map((x) => x.trim().toLowerCase()).filter(Boolean)));
}

const coordinates = {
  Madina: [5.6836, -0.1668],
  'East Legon': [5.6505, -0.1545],
  Legon: [5.6509, -0.187],
  Ayeduase: [6.6857, -1.5654],
  'KNUST Campus': [6.6745, -1.5716],
  Koforidua: [6.0941, -0.2591],
  Keta: [5.9179, 0.9879],
  Nungua: [5.6012, -0.077],
  Prampram: [5.7097, 0.1078],
  Labone: [5.5601, -0.1682],
  Nima: [5.5833, -0.2],
  Asokwa: [6.6669, -1.5945],
  Bantama: [6.7011, -1.6408],
  'Ho Township': [6.6114, 0.4703],
  'Kpando Township': [6.9988, 0.293],
  'Akim Oda': [5.9266, -0.9871],
  'Elmina Town': [5.0847, -1.3509],
};

async function main() {
  const parser = new PDFParse({ data: readFileSync(pdfPath) });
  const result = await parser.getText();
  await parser.destroy();

  const pages = normalizeText(result.text).split(/-- \d+ of 9 --/);
  const sections = extractSectionsFromPages(pages);
  const map = new Map();

  for (const section of sections) {
    for (const name of splitPlaces(section.block)) {
      const id = stableId(section.region, section.group, name);
      if (!map.has(id)) {
        const coord = coordinates[name];
        map.set(id, {
          id,
          name,
          region: titleCase(section.region),
          group: section.group,
          keywords: keywordsFor(name, titleCase(section.region)),
          popularScore: 20,
          ...(coord ? { latitude: coord[0], longitude: coord[1] } : {}),
        });
      }
    }
  }

  const popularBoosts = new Map([
    ['Madina', 100],
    ['East Legon', 98],
    ['KNUST Campus', 100],
    ['Ayeduase', 98],
    ['Ashanti New Town', 96],
    ['Koforidua', 94],
    ['Takoradi Beach Road', 92],
    ['Cape Coast UCC', 90],
    ['Nungua', 86],
    ['Labone', 84],
  ]);

  for (const area of map.values()) {
    if (popularBoosts.has(area.name)) area.popularScore = popularBoosts.get(area.name);
  }

  const areas = [...map.values()].sort((a, b) => a.region.localeCompare(b.region) || a.group.localeCompare(b.group) || a.name.localeCompare(b.name));

  const content = `import { Area } from '../models/dumsor.models';\n\nexport const GENERATED_AREAS: Area[] = ${JSON.stringify(areas, null, 2)};\n`;
  writeFileSync(outputPath, content);

  const counts = areas.reduce((acc, area) => {
    const key = `${area.region}-${area.group}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  console.log(JSON.stringify({ sections: sections.length, areas: areas.length, counts }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
