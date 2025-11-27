const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const mappingFile = path.join(rootDir, "ALL - FInal.txt");
const questionFile = path.join(rootDir, "Question 2 Final.txt");
const outFile = path.join(rootDir, "data", "major-seed-payloads.json");

const stackedArrayBoundary = /\]\s*(?:\r?\n)+\s*\[/g;
const newlineDelimiter = /\r?\n/;

function splitTopLevelJsonArrays(input) {
  const segments = [];
  if (!input) return segments;
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaping = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (inString) {
      if (escaping) {
        escaping = false;
      } else if (char === "\\") {
        escaping = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "[") {
      if (depth === 0) start = i;
      depth++;
    } else if (char === "]") {
      if (depth > 0) depth--;
      if (depth === 0 && start !== -1) {
        segments.push(input.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return segments;
}

function safeRead(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return raw.replace(/^\uFEFF/, "").replace(/,\s*([\]}])/g, "$1").trim();
}

function parseStackedJsonArrays(raw) {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const flattenRecords = (parsed) => {
    if (!Array.isArray(parsed)) return [];
    const first = parsed[0];
    if (Array.isArray(first)) {
      return parsed.reduce((acc, item) => acc.concat(item), []);
    }
    return parsed;
  };

  const safeParseArray = (text) => {
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : null;
    } catch (_) {
      return null;
    }
  };

  const direct = safeParseArray(trimmed);
  if (direct && direct.length) return flattenRecords(direct);

  const normalizedInput = `[${trimmed.replace(stackedArrayBoundary, "],\n[")}]`;
  const normalized = safeParseArray(normalizedInput);
  if (normalized && normalized.length) return flattenRecords(normalized);

  const segments = splitTopLevelJsonArrays(trimmed);
  if (segments.length) {
    const fallback = [];
    for (const segment of segments) {
      const parsedSegment = safeParseArray(segment);
      if (parsedSegment && parsedSegment.length) {
        fallback.push(...parsedSegment);
      }
    }
    if (fallback.length) return fallback;
  }

  return [];
}

function parseQuestionList(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    const fixed = raw.replace(/}\s*\n+\s*\{/g, "},{");
    const parsed = JSON.parse(fixed);
    return Array.isArray(parsed) ? parsed : [];
  }
}

function normalizeStringArray(val) {
  if (!val) return [];
  if (Array.isArray(val))
    return val.map((s) => String(s).trim()).filter(Boolean);
  return String(val)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildPayload(records, questions) {
  const majorsSet = new Set();
  const mapping = [];
  const sections = [
    { key: "ria_sec", label: "RIASEC", weight: 2 },
    { key: "academic_strengths", label: "Academic Strength", weight: 3 },
    { key: "core_values", label: "Core Value", weight: 2 },
    { key: "personality_traits", label: "Personality", weight: 1 },
    { key: "mbti_traits", label: "Personality", weight: 1 },
    { key: "micro_traits", label: "Micro Trait", weight: 2 },
  ];

  records.forEach((item) => {
    const majorName = String(
      item.parent_major || item.major_name || item.name || ""
    ).trim();
    if (!majorName) return;
    majorsSet.add(majorName);
    sections.forEach(({ key, label, weight }) => {
      normalizeStringArray(item[key]).forEach((value) => {
        mapping.push({
          category: label,
          option_value: value,
          major_name: majorName,
          score: weight,
        });
      });
    });
  });

  const majors = Array.from(majorsSet).map((name) => ({
    name,
    description: "",
    avg_salary: "",
    job_outlook: "",
    work_environment: "",
  }));

  return { majors, mapping, questions };
}

function loadSeedData() {
  const records = parseStackedJsonArrays(safeRead(mappingFile));
  if (!records.length) {
    throw new Error("No mapping records parsed");
  }
  const questions = parseQuestionList(safeRead(questionFile));
  if (!questions.length) {
    throw new Error("No questions parsed");
  }
  return { records, questions, payload: buildPayload(records, questions) };
}

function main() {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const { payload } = loadSeedData();
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
  console.log(
    `Payload saved to ${outFile} (majors=${payload.majors.length}, mappings=${payload.mapping.length}, questions=${payload.questions.length})`
  );
}

if (require.main === module) {
  main();
} else {
  module.exports = { loadSeedData };
}
