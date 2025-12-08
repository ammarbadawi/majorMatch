const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const os = require("os");
const fsp = fs.promises;
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config();
const nodemailer = require("nodemailer");
const axios = require("axios");
const { OAuth2Client } = require("google-auth-library");
// Initialize Stripe only if API key is provided
let stripe = null;
if (
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_SECRET_KEY !== "sk_test_your_stripe_secret_key_here"
) {
  stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  console.log("✅ Stripe initialized successfully");
} else {
  console.warn("⚠️  Stripe not initialized - STRIPE_SECRET_KEY not configured");
  console.log("   To enable payments, add your Stripe secret key to .env file");
}

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/major_match";
const EMAIL_FROM =
  process.env.EMAIL_FROM || "Major Match <no-reply@majormatch.local>";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
// Whish Money config
const WHISH_ACCOUNT_NAME = process.env.WHISH_ACCOUNT_NAME || "Whish Money";
const WHISH_ACCOUNT_NUMBER = process.env.WHISH_ACCOUNT_NUMBER || "0000000000";
const WHISH_AMOUNT_CENTS = parseInt(process.env.WHISH_AMOUNT_CENTS || "1499");
const WHISH_CURRENCY = (process.env.WHISH_CURRENCY || "USD").toUpperCase();
const WHISH_INSTRUCTIONS =
  process.env.WHISH_INSTRUCTIONS ||
  "Send the exact amount and keep your transaction reference. Verification may take up to 24 hours.";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const googleClient = GOOGLE_CLIENT_ID
  ? new OAuth2Client(GOOGLE_CLIENT_ID)
  : null;
const MAJOR_SEED_FILE =
  process.env.MAJOR_SEED_FILE ||
  path.join(__dirname, "data", "major-seed-payloads.json");
const MAJOR_TARGET_COUNT = parseInt(process.env.MAJOR_TARGET_COUNT || "67", 10);
const FORCE_SEED =
  String(process.env.FORCE_SEED || "").toLowerCase() === "true";

const DEFAULT_MAJOR_QUESTIONS_FILENAME = "Question 2 Final.txt";
const DEFAULT_MAJOR_MAPPING_FILENAME = "ALL - FInal.txt";

function normalizeStringArray(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((value) => {
      if (value === null || value === undefined) return "";
      return String(value).trim();
    })
    .filter(Boolean);
}

function normalizeCandidatePath(candidate) {
  if (candidate === undefined || candidate === null) return "";
  const trimmed = String(candidate).trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("~/")) {
    return path.join(os.homedir(), trimmed.slice(2));
  }
  if (trimmed.startsWith("~")) {
    return path.join(os.homedir(), trimmed.slice(1));
  }
  return trimmed;
}

function findCaseInsensitiveFile(dir, targetName) {
  try {
    const desired = String(targetName || "").toLowerCase();
    if (!desired) return null;
    const entries = fs.readdirSync(dir);
    const match = entries.find(
      (entry) => entry && entry.toLowerCase() === desired
    );
    return match ? path.join(dir, match) : null;
  } catch (err) {
    return null;
  }
}

function resolveCandidateFile(candidate, defaultFileName) {
  const normalized = normalizeCandidatePath(candidate);
  if (!normalized) return null;
  try {
    const resolvedInput = path.isAbsolute(normalized)
      ? normalized
      : path.resolve(normalized);
    let targetPath = resolvedInput;
    if (!fs.existsSync(targetPath)) {
      const dir = path.dirname(targetPath);
      const fallback = findCaseInsensitiveFile(dir, path.basename(targetPath));
      if (fallback) {
        targetPath = fallback;
      } else {
        return null;
      }
    }
    const stats = fs.statSync(targetPath);
    if (stats.isDirectory()) {
      if (!defaultFileName) return null;
      const direct = path.join(targetPath, defaultFileName);
      if (fs.existsSync(direct)) return direct;
      const insensitive = findCaseInsensitiveFile(targetPath, defaultFileName);
      return insensitive;
    }
    return targetPath;
  } catch (err) {
    return null;
  }
}

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
  if (direct && direct.length) {
    return flattenRecords(direct);
  }

  const normalizedInput = `[${trimmed.replace(stackedArrayBoundary, "],\n[")}]`;
  const normalized = safeParseArray(normalizedInput);
  if (normalized && normalized.length) {
    return flattenRecords(normalized);
  }

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
  const trimmed = raw.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    try {
      const fixed = trimmed
        .replace(/}\s*\n+\s*\{/g, "},{")
        .replace(/,\s*([\]}])/g, "$1");
      const parsed = JSON.parse(fixed);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err2) {
      return [];
    }
  }
}

function mapQuestionRecords(list, language) {
  if (!Array.isArray(list)) return [];
  return list
    .map((q, idx) => {
      const rawId = q.id ?? idx + 1;
      const id = Number.isFinite(Number(rawId)) ? parseInt(rawId, 10) : idx + 1;
      const questionText = q.question || q.text;
      if (!questionText) return null;
      const topic = q.topic ? String(q.topic).trim() : "";
      return {
        id,
        category: String(q.category || "General"),
        topic: topic || null,
        question: String(questionText),
        language,
        micro_traits: normalizeStringArray(q.micro_traits),
      };
    })
    .filter(Boolean);
}

function loadMajorQuestionDocs(language = "en") {
  const envPath =
    language === "ar"
      ? process.env.MAJOR_QUESTIONS_PATH_AR
      : process.env.MAJOR_QUESTIONS_PATH;
  const defaultFileName =
    language === "en"
      ? DEFAULT_MAJOR_QUESTIONS_FILENAME
      : language === "ar"
      ? "Question 2 Final - Arabic.txt"
      : null;
  const candidates = new Set();
  if (envPath) candidates.add(envPath);
  if (defaultFileName) {
    candidates.add(path.join(__dirname, defaultFileName));
    candidates.add(path.join(process.cwd(), defaultFileName));
  }
  if (language === "en") {
    candidates.add(path.join(__dirname, "Mapping"));
    candidates.add(path.join(process.cwd(), "Mapping"));
  }
  for (const candidate of candidates) {
    const resolved = resolveCandidateFile(candidate, defaultFileName);
    if (!resolved) continue;
    try {
      const raw = fs
        .readFileSync(resolved, "utf8")
        .replace(/^\uFEFF/, "")
        .replace(/,\s*([\]}])/g, "$1");
      const parsed = parseQuestionList(raw);
      if (Array.isArray(parsed) && parsed.length) {
        return { docs: mapQuestionRecords(parsed, language), source: resolved };
      }
    } catch (err) {
      console.warn(
        `[Seed] Failed to load ${language} major questions from ${resolved}:`,
        err.message
      );
    }
  }
  return null;
}

function buildMappingsFromRecords(records) {
  const majorsSet = new Set();
  const mappings = [];
  const categoryLabels = {
    ria_sec: "RIASEC",
    academic_strengths: "Academic Strength",
    core_values: "Core Value",
    personality_traits: "Personality",
    mbti_traits: "Personality",
    micro_traits: "Micro Trait",
  };
  const weight = {
    ria_sec: 2,
    academic_strengths: 3,
    core_values: 2,
    personality_traits: 1,
    mbti_traits: 1,
    micro_traits: 2,
  };
  const addMap = (optionValue, majorName, score, category) => {
    if (!optionValue || !majorName) return;
    mappings.push({
      category,
      option_value: String(optionValue),
      major_name: String(majorName),
      score: parseInt(score || 1) || 1,
    });
  };

  (records || []).forEach((item) => {
    const majorName = String(
      item.parent_major || item.major_name || item.name || ""
    ).trim();
    if (!majorName) return;
    majorsSet.add(majorName);

    ["ria_sec", "academic_strengths", "core_values"].forEach((key) => {
      normalizeStringArray(item[key]).forEach((value) =>
        addMap(value, majorName, weight[key], categoryLabels[key])
      );
    });

    // Legacy compatibility
    normalizeStringArray(item.personality_traits).forEach((value) =>
      addMap(value, majorName, weight.personality_traits, "Personality")
    );

    normalizeStringArray(item.mbti_traits).forEach((value) =>
      addMap(value, majorName, weight.mbti_traits, "Personality")
    );

    normalizeStringArray(item.micro_traits).forEach((value) =>
      addMap(value, majorName, weight.micro_traits, "Micro Trait")
    );
  });

  return {
    majors: Array.from(majorsSet),
    mappings,
  };
}

function loadMajorMappingDataset() {
  const candidates = new Set();
  if (process.env.MAPPING_DATA_PATH)
    candidates.add(process.env.MAPPING_DATA_PATH);
  if (process.env.MAPPING_ROOT_PATH)
    candidates.add(process.env.MAPPING_ROOT_PATH);
  candidates.add(path.join(__dirname, DEFAULT_MAJOR_MAPPING_FILENAME));
  candidates.add(path.join(process.cwd(), DEFAULT_MAJOR_MAPPING_FILENAME));
  candidates.add(path.join(__dirname, "Mapping"));
  candidates.add(path.join(process.cwd(), "Mapping"));
  candidates.add(
    path.join(__dirname, "Mapping", DEFAULT_MAJOR_MAPPING_FILENAME)
  );
  candidates.add(
    path.join(process.cwd(), "Mapping", DEFAULT_MAJOR_MAPPING_FILENAME)
  );

  const checked = new Set();

  for (const candidate of candidates) {
    const resolved = resolveCandidateFile(
      candidate,
      DEFAULT_MAJOR_MAPPING_FILENAME
    );
    const normalizedCandidate = normalizeCandidatePath(candidate) || candidate;
    const displayPath = resolved || normalizedCandidate || String(candidate);
    if (displayPath) {
      checked.add(displayPath);
    }
    if (!resolved) {
      console.warn(`[Mapping] Candidate not found: ${displayPath}`);
      continue;
    }
    try {
      const raw = fs
        .readFileSync(resolved, "utf8")
        .replace(/^\uFEFF/, "")
        .replace(/,\s*([\]}])/g, "$1");
      const records = parseStackedJsonArrays(raw);
      if (Array.isArray(records) && records.length) {
        console.log(
          `[Mapping] Parsed ${records.length} record chunks from ${resolved}`
        );
        return { records, source: resolved, checked: Array.from(checked) };
      } else {
        console.warn(
          `[Mapping] ${resolved} was readable but contained no records`
        );
      }
    } catch (err) {
      console.warn(
        `[Mapping] Failed to load mapping data from ${resolved}:`,
        err.message
      );
    }
  }
  return { records: [], source: null, checked: Array.from(checked) };
}

const PERSONALITIES_DISPLAY_PATH = path.join(
  __dirname,
  "PersonalityDisplay.txt"
);
let personalitiesDisplayCache = null;
let personalitiesDisplayMtime = null;
let personalitiesDisplayRecords = [];

async function loadPersonalitiesDisplay(force = false) {
  try {
    const stats = await fsp.stat(PERSONALITIES_DISPLAY_PATH);
    if (
      force ||
      !personalitiesDisplayCache ||
      !personalitiesDisplayMtime ||
      personalitiesDisplayMtime !== stats.mtimeMs
    ) {
      const raw = await fsp.readFile(PERSONALITIES_DISPLAY_PATH, "utf-8");
      const chunks = raw
        .split(/\r?\n-{3,}\r?\n/g)
        .map((chunk) => chunk.trim())
        .filter(Boolean);
      const map = {};
      const records = [];
      chunks.forEach((chunk, index) => {
        try {
          const parsed = JSON.parse(chunk);
          if (parsed?.personalityType) {
            let key = String(parsed.personalityType || "")
              .trim()
              .toUpperCase();
            if (key) {
              records.push(parsed);
              // Normalize parentheses format (A) or (T) to hyphen format -A or -T
              const normalizedKey = key.replace(/\(([AT])\)/g, "-$1");
              // Store with both original format and normalized format
              map[key] = parsed;
              if (normalizedKey !== key) {
                map[normalizedKey] = parsed;
              }
              // Extract letters for fallback (e.g., "ESTJ" from "ESTJ-A" or "ESTJ(A)")
              const lettersMatch = key.match(/^([A-Z]{4})/);
              if (lettersMatch) {
                const letters = lettersMatch[1];
                if (!map[letters]) {
                  map[letters] = parsed;
                }
              }
            }
          }
        } catch (err) {
          console.warn(
            `[DisplayData] Failed to parse personality chunk #${index + 1}: ${
              err.message || err
            }`
          );
        }
      });
      personalitiesDisplayRecords = records;
      personalitiesDisplayCache = map;
      personalitiesDisplayMtime = stats.mtimeMs;
      console.log(
        `[DisplayData] Loaded ${
          Object.keys(map).length
        } display personalities from PersonalityDisplay.txt`
      );
    }
    return personalitiesDisplayCache;
  } catch (err) {
    if (!["ENOENT", "ENAMETOOLONG"].includes(err.code)) {
      console.error(
        "[DisplayData] Unable to read PersonalityDisplay.txt:",
        err.message || err
      );
    }
    if (force) {
      personalitiesDisplayCache = null;
      personalitiesDisplayMtime = null;
    }
    throw err;
  }
}

async function getDisplayPersonality(type) {
  if (!type) return null;
  const cache = await loadPersonalitiesDisplay();
  const normalized = String(type).toUpperCase();
  if (cache[normalized]) return cache[normalized];
  const [letters, variant] = normalized.split("-");
  if (!letters) return null;
  const fallbackKeys = [
    variant ? `${letters}-${variant}` : null,
    `${letters}-A`,
    `${letters}-T`,
    letters,
  ].filter(Boolean);
  for (const key of fallbackKeys) {
    if (cache[key]) return cache[key];
  }
  return null;
}

async function upsertPersonalitiesFromDisplay({ forceReload = false } = {}) {
  try {
    await loadPersonalitiesDisplay(forceReload);
  } catch (err) {
    console.error(
      "[DisplayData] Unable to load PersonalityDisplay.txt:",
      err.message || err
    );
    throw err;
  }

  const records = Array.isArray(personalitiesDisplayRecords)
    ? personalitiesDisplayRecords
    : [];
  if (!records.length) {
    console.warn(
      "[DisplayData] PersonalityDisplay.txt loaded but contains no valid records"
    );
    return 0;
  }

  let count = 0;
  for (const record of records) {
    const baseType =
      record?.personalityType ||
      record?.type ||
      record?.code ||
      record?.codeName;
    const normalized = String(baseType || "")
      .trim()
      .toUpperCase();
    if (!normalized) continue;
    try {
      await Personality.updateOne(
        { type: normalized },
        { $set: { content: JSON.stringify(record) } },
        { upsert: true }
      );
      count++;
    } catch (err) {
      console.error(
        `[DisplayData] Failed to upsert personality ${normalized}:`,
        err.message || err
      );
    }
  }

  console.log(
    `[DisplayData] Upserted ${count} personality profiles from PersonalityDisplay.txt`
  );
  return count;
}

// Email (nodemailer) setup
let mailer = null;
(async () => {
  try {
    if (process.env.SMTP_HOST) {
      mailer = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              }
            : undefined,
        logger: String(process.env.SMTP_DEBUG || "").toLowerCase() === "true",
        debug: String(process.env.SMTP_DEBUG || "").toLowerCase() === "true",
      });
    } else {
      // Dev fallback: write emails to buffer/console
      mailer = nodemailer.createTransport({
        streamTransport: true,
        newline: "unix",
        buffer: true,
      });
      console.log("Email transport using stream (dev)");
    }
    try {
      await mailer.verify();
      console.log("SMTP verify: success");
    } catch (e) {
      console.warn("SMTP verify: failed ->", e.message);
    }
    if (process.env.SMTP_HOST) {
      console.log(
        `SMTP ready: ${process.env.SMTP_HOST}:${
          process.env.SMTP_PORT || "587"
        } secure=${String(process.env.SMTP_SECURE || "false")} user=${
          process.env.SMTP_USER
        }`
      );
    } else {
      console.log("Email transport ready (dev stream)");
    }
  } catch (e) {
    console.warn("Email transport initialization failed:", e.message);
  }
})();

// Middleware
// Allow local development origins (localhost, 127.0.0.1) with any port
const allowedOrigins = [
  /^http:\/\/localhost(?::\d+)?$/,
  /^http:\/\/127\.0\.0\.1(?::\d+)?$/,
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some((re) => re.test(origin));
      return callback(null, isAllowed);
    },
    credentials: true,
  })
);
app.use(bodyParser.json({ limit: "5mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "build")));
// Explicitly serve static assets path to avoid SPA fallback intercepting asset requests
app.use("/static", express.static(path.join(__dirname, "build", "static")));

// MongoDB connection (do not exit on failure so app can still serve frontend)
mongoose.set("strictQuery", true);
mongoose
  .connect(MONGODB_URI, { autoIndex: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    // Keep running; DB-dependent routes may fail until fixed
  });

// Schemas & Models
const userSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password_hash: {
    type: String,
    default: null,
    required: function () {
      return (this.auth_provider || "local") === "local";
    },
  },
  auth_provider: {
    type: String,
    enum: ["local", "google", "hybrid"],
    default: "local",
  },
  google_id: {
    type: String,
    default: null,
  },
  avatar_url: { type: String, default: null },
  university: { type: String, default: null },
  gender: {
    type: String,
    enum: ["male", "female", "other", "prefer_not_to_say"],
    required: true,
  },
  created_at: { type: Date, default: Date.now },
  last_login: { type: Date, default: null },
  // Email verification fields
  is_verified: { type: Boolean, default: false, index: true },
  verification_code_hash: { type: String, default: null },
  verification_expires: { type: Date, default: null },
  verification_last_sent_at: { type: Date, default: null },
  // Password reset fields
  reset_token_hash: { type: String, default: null },
  reset_expires: { type: Date, default: null },
  reset_last_sent_at: { type: Date, default: null },
});
userSchema.index(
  { google_id: 1 },
  {
    unique: true,
    background: true,
    partialFilterExpression: { google_id: { $exists: true, $ne: null } },
  }
);
const User = mongoose.model("User", userSchema);

const personalityResultSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: { type: String, required: true },
  raw_answers: { type: mongoose.Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
});
const PersonalityResult = mongoose.model(
  "PersonalityResult",
  personalityResultSchema
);

const personalityQuestionSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  text: { type: String, required: true },
  text_ar: { type: String, default: null },
  dimension: { type: String, required: true },
  direction: { type: String, required: true },
  language: { type: String, default: "en" },
});
// Compound unique index on id + language (allows same id for different languages)
personalityQuestionSchema.index({ id: 1, language: 1 }, { unique: true });
const PersonalityQuestion = mongoose.model(
  "PersonalityQuestion",
  personalityQuestionSchema
);

// Drop old unique index on id only if it exists (run after connection)
mongoose.connection.once("open", async () => {
  try {
    const indexes = await PersonalityQuestion.collection.getIndexes();
    if (indexes.id_1 && indexes.id_1.unique) {
      console.log("[Schema] Dropping old unique index on id only...");
      await PersonalityQuestion.collection.dropIndex("id_1");
      console.log("[Schema] Old index dropped successfully");
    }
    // Ensure compound index exists
    try {
      await PersonalityQuestion.collection.createIndex(
        { id: 1, language: 1 },
        { unique: true, background: true }
      );
      console.log("[Schema] Compound index (id, language) ensured");
    } catch (e) {
      if (!e.message.includes("already exists")) {
        console.warn("[Schema] Could not create compound index:", e.message);
      }
    }
  } catch (e) {
    // Index might not exist or already dropped, that's fine
    if (!e.message.includes("index not found")) {
      console.warn("[Schema] Could not manage indexes:", e.message);
    }
  }

  // Ensure the google_id index allows null values for local signups
  try {
    const indexes = await User.collection.listIndexes().toArray();
    const googleIndex = indexes.find((idx) => idx.name === "google_id_1");
    const desiredPartial = { google_id: { $exists: true, $ne: null } };
    const matchesDesired =
      googleIndex &&
      googleIndex.unique &&
      JSON.stringify(googleIndex.partialFilterExpression || {}) ===
        JSON.stringify(desiredPartial);

    if (!matchesDesired) {
      console.log(
        "[Schema] Rebuilding google_id index so null local accounts don't collide"
      );

      if (googleIndex) {
        try {
          await User.collection.dropIndex("google_id_1");
          console.log("[Schema] Dropped legacy google_id_1 index");
        } catch (dropErr) {
          if (!String(dropErr.message).includes("index not found")) {
            console.warn(
              "[Schema] Could not drop google_id_1 index:",
              dropErr.message || dropErr
            );
          }
        }
      }

      // Remove explicit null values so the new partial index can build cleanly
      await User.updateMany({ google_id: null }, { $unset: { google_id: "" } });

      await User.collection.createIndex(
        { google_id: 1 },
        {
          name: "google_id_1",
          unique: true,
          sparse: false,
          partialFilterExpression: desiredPartial,
          background: true,
        }
      );
      console.log("[Schema] google_id index ensured (partial filter)");
    }
  } catch (e) {
    console.warn("[Schema] Could not ensure google_id index:", e.message || e);
  }
});

const personalitySchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true, index: true },
  content: { type: String, required: true },
});
const Personality = mongoose.model("Personality", personalitySchema);

const majorQuestionSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  category: { type: String, required: true },
  topic: { type: String, default: null },
  question: { type: String, required: true },
  language: { type: String, default: "en" },
  micro_traits: { type: [String], default: [] },
});
// Compound unique index on id + language (allows same id for different languages)
majorQuestionSchema.index({ id: 1, language: 1 }, { unique: true });
const MajorQuestion = mongoose.model("MajorQuestion", majorQuestionSchema);

const majorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true },
  description: { type: String, default: "" },
  avg_salary: { type: String, default: "" },
  job_outlook: { type: String, default: "" },
  work_environment: { type: String, default: "" },
});
const Major = mongoose.model("Major", majorSchema);

const majorMappingSchema = new mongoose.Schema({
  category: { type: String, required: true },
  option_value: { type: String, required: true, index: true },
  major_name: { type: String, required: true, index: true },
  score: { type: Number, default: 1 },
});
const MajorMapping = mongoose.model("MajorMapping", majorMappingSchema);

const majorTestSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  raw_answers: { type: mongoose.Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
});
const MajorTest = mongoose.model("MajorTest", majorTestSchema);

const subscriptionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  stripe_customer_id: { type: String, required: true },
  stripe_subscription_id: { type: String, required: true },
  stripe_price_id: { type: String, required: true },
  status: { type: String, required: true }, // active, canceled, past_due, etc.
  current_period_start: { type: Date, required: true },
  current_period_end: { type: Date, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});
const Subscription = mongoose.model("Subscription", subscriptionSchema);

const ratingSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true,
  },
  value: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "", maxlength: 500 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});
ratingSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});
ratingSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updated_at: new Date() });
  next();
});
const Rating = mongoose.model("Rating", ratingSchema);

// Manual payments (e.g., Whish Money) submissions for later verification
const manualPaymentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  method: { type: String, required: true, enum: ["whish"] },
  reference: { type: String, required: true },
  sender_name: { type: String, required: true },
  phone: { type: String, default: null },
  notes: { type: String, default: null },
  amount_cents: { type: Number, required: true },
  currency: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
    index: true,
  },
  created_at: { type: Date, default: Date.now },
  verified_at: { type: Date, default: null },
});
const ManualPayment = mongoose.model("ManualPayment", manualPaymentSchema);

// Chat history schema
const chatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatConversationSchema = new mongoose.Schema({
  title: { type: String, default: "New chat" },
  messages: { type: [chatMessageSchema], default: [] },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const chatHistorySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  // Legacy single-thread storage (kept for backward compatibility)
  messages: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  conversations: {
    type: [chatConversationSchema],
    default: [],
  },
  updated_at: { type: Date, default: Date.now },
});
chatHistorySchema.index({ user_id: 1 }, { unique: true });
const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);

const DEFAULT_CHAT_TITLE = "New chat";

function createEmptyConversation(title = DEFAULT_CHAT_TITLE) {
  const now = new Date();
  return {
    _id: new mongoose.Types.ObjectId(),
    title: title || DEFAULT_CHAT_TITLE,
    messages: [],
    created_at: now,
    updated_at: now,
  };
}

function findConversationById(history, conversationId) {
  if (!history || !conversationId) return null;
  const list = Array.isArray(history.conversations)
    ? history.conversations
    : [];
  const targetId = String(conversationId);
  return (
    list.find((conv) => conv && conv._id && conv._id.toString() === targetId) ||
    null
  );
}

function sanitizeIncomingMessages(rawMessages = []) {
  return rawMessages
    .filter(
      (m) =>
        m &&
        (String(m.role).toLowerCase() === "user" ||
          String(m.role).toLowerCase() === "assistant")
    )
    .map((m) => ({
      role: String(m.role).toLowerCase() === "assistant" ? "assistant" : "user",
      content: String(m.content || ""),
      created_at: m.created_at ? new Date(m.created_at) : new Date(),
    }))
    .filter((m) => m.content.trim().length);
}

function normalizeMessagesForClient(messages = []) {
  return messages.map((m) => ({
    role:
      String(m.role).toLowerCase() === "assistant"
        ? "assistant"
        : String(m.role).toLowerCase() === "system"
        ? "system"
        : "user",
    content: String(m.content || ""),
    created_at: m.created_at || null,
  }));
}

function summarizeConversation(conversation) {
  if (!conversation) return null;
  const plain =
    typeof conversation.toObject === "function"
      ? conversation.toObject()
      : conversation;
  const msgs = Array.isArray(plain.messages) ? plain.messages : [];
  const last = msgs.length ? msgs[msgs.length - 1] : null;
  return {
    id: plain._id ? plain._id.toString() : null,
    title: plain.title || DEFAULT_CHAT_TITLE,
    created_at: plain.created_at || null,
    updated_at: plain.updated_at || null,
    preview: last ? String(last.content || "") : "",
  };
}

function formatConversationResponse(conversation) {
  if (!conversation) return null;
  const summary = summarizeConversation(conversation);
  const plain =
    typeof conversation.toObject === "function"
      ? conversation.toObject()
      : conversation;
  return {
    ...summary,
    messages: normalizeMessagesForClient(plain.messages || []),
  };
}

function migrateLegacyChatHistory(history) {
  if (!history) return false;
  let mutated = false;

  if (!Array.isArray(history.conversations)) {
    history.conversations = [];
    mutated = true;
  }

  if (
    history.messages &&
    Array.isArray(history.messages) &&
    history.messages.length
  ) {
    const legacyMessages = sanitizeIncomingMessages(history.messages);
    if (legacyMessages.length) {
      const target =
        history.conversations[0] || createEmptyConversation("First chat");
      if (!history.conversations.length) {
        history.conversations.push(target);
      }
      target.messages = legacyMessages;
      target.updated_at = new Date();
    }
    history.messages = [];
    mutated = true;
  }

  if (!history.conversations.length) {
    history.conversations.push(createEmptyConversation());
    mutated = true;
  }

  return mutated;
}

async function getOrCreateChatHistory(userId) {
  let history = await ChatHistory.findOne({ user_id: userId });
  if (!history) {
    history = new ChatHistory({
      user_id: userId,
      messages: [],
      conversations: [createEmptyConversation()],
    });
    await history.save();
    return history;
  }
  const mutated = migrateLegacyChatHistory(history);
  if (mutated) {
    history.updated_at = new Date();
    await history.save();
  }
  return history;
}

// Auth helpers
function generateToken(user) {
  return jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

function authMiddleware(req, res, next) {
  const token =
    req.cookies.token ||
    (req.headers.authorization && req.headers.authorization.split(" ")[1]);
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Email verification helpers
function generateNumericCode(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

async function sendVerificationEmail(toEmail, code) {
  const html = `
		<div style="font-family: Arial, sans-serif;">
			<h2>Verify your email</h2>
			<p>Your verification code is:</p>
			<div style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</div>
			<p>This code will expire in 15 minutes.</p>
			<p>If you did not sign up for Major Match, you can ignore this email.</p>
		</div>
	`;
  try {
    if (!mailer) throw new Error("Mailer not initialized");
    const info = await mailer.sendMail({
      from: EMAIL_FROM,
      to: toEmail,
      subject: "Major Match - Verify your email",
      html,
    });
    const isDevTransport = !process.env.SMTP_HOST;
    if (isDevTransport) {
      console.log("[DEV] Verification code for", toEmail, "=>", code);
      try {
        const raw =
          info && info.message && info.message.toString
            ? info.message.toString()
            : "";
        if (raw) console.log("[DEV] Raw email output:\n" + raw);
      } catch (_) {}
    } else {
      console.log("Sent verification email to", toEmail);
    }
  } catch (e) {
    console.warn("Failed to send verification email:", e.message);
  }
}

async function sendPasswordResetEmail(toEmail, code) {
  const html = `
		<div style="font-family: Arial, sans-serif;">
			<h2>Reset your password</h2>
			<p>You requested to reset your password. Your reset code is:</p>
			<div style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</div>
			<p>This code will expire in 15 minutes.</p>
			<p>If you did not request a password reset, you can safely ignore this email.</p>
		</div>
	`;
  try {
    if (!mailer) throw new Error("Mailer not initialized");
    const info = await mailer.sendMail({
      from: EMAIL_FROM,
      to: toEmail,
      subject: "Major Match - Reset your password",
      html,
    });
    const isDevTransport = !process.env.SMTP_HOST;
    if (isDevTransport) {
      console.log("[DEV] Password reset code for", toEmail, "=>", code);
      try {
        const raw =
          info && info.message && info.message.toString
            ? info.message.toString()
            : "";
        if (raw) console.log("[DEV] Raw email output:\n" + raw);
      } catch (_) {}
    } else {
      console.log("Sent password reset email to", toEmail);
    }
  } catch (e) {
    console.warn("Failed to send password reset email:", e.message);
  }
}

function loadJsonFileSafe(filePath) {
  try {
    if (!filePath) return null;
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[Seed] Failed to read JSON from ${filePath}:`, err.message);
    return null;
  }
}

async function dedupeCollectionByFields(model, fields, label) {
  if (!model || !Array.isArray(fields) || !fields.length) return;
  const groupId = fields.reduce((acc, field) => {
    acc[field] = `$${field}`;
    return acc;
  }, {});
  try {
    const duplicates = await model.aggregate([
      {
        $group: {
          _id: groupId,
          ids: { $addToSet: "$_id" },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);

    let removed = 0;
    for (const dup of duplicates) {
      const ids = Array.isArray(dup.ids) ? dup.ids : [];
      if (ids.length <= 1) continue;
      // Keep the first id, remove the rest
      const [, ...toDelete] = ids;
      if (!toDelete.length) continue;
      const res = await model.deleteMany({ _id: { $in: toDelete } });
      removed += res.deletedCount || 0;
    }
    if (removed > 0) {
      console.log(
        `[Seed] Deduped ${removed} duplicate documents for ${label || "model"}`
      );
    }
  } catch (err) {
    console.warn(
      `[Seed] Failed to dedupe ${label || "model"}:`,
      err.message || err
    );
  }
}

// Auto-seed from local files into MongoDB (runs once if collections are empty)
async function ensurePersonalitySeedMongo() {
  try {
    await dedupeCollectionByFields(
      PersonalityQuestion,
      ["id", "language"],
      "PersonalityQuestion (id+language)"
    );
    await dedupeCollectionByFields(Personality, ["type"], "Personality (type)");
    // Aggressively drop old unique index on id only - this is critical for multi-language support
    try {
      const indexes = await PersonalityQuestion.collection.getIndexes();
      console.log("[Seed] Current indexes:", Object.keys(indexes));
      console.log("[Seed] Index details:", JSON.stringify(indexes, null, 2));

      // Force drop id_1 index - try multiple methods
      if (indexes.id_1) {
        console.log("[Seed] Found id_1 index, attempting to drop...");
        try {
          await PersonalityQuestion.collection.dropIndex("id_1");
          console.log("[Seed] Successfully dropped id_1 index");
        } catch (dropErr) {
          console.warn(
            "[Seed] First attempt to drop id_1 failed:",
            dropErr.message
          );
          // Try dropping by specification
          try {
            await PersonalityQuestion.collection.dropIndex({ id: 1 });
            console.log(
              "[Seed] Successfully dropped id_1 index by specification"
            );
          } catch (e2) {
            console.warn(
              "[Seed] Second attempt to drop id_1 failed:",
              e2.message
            );
            // Last resort: try to drop all indexes and recreate
            console.warn("[Seed] Old index persists, may cause seeding issues");
          }
        }
      }

      // Also try to drop any other problematic single-field unique indexes on id
      for (const indexName of Object.keys(indexes)) {
        if (indexName !== "_id_" && indexes[indexName].unique) {
          const keys = indexes[indexName].key || {};
          const keyNames = Object.keys(keys);
          // If it's a unique index on just 'id' (single field)
          if (
            keyNames.length === 1 &&
            keyNames[0] === "id" &&
            indexName !== "_id_"
          ) {
            console.log(
              `[Seed] Found problematic unique index on id: ${indexName}, attempting to drop...`
            );
            try {
              await PersonalityQuestion.collection.dropIndex(indexName);
              console.log(`[Seed] Successfully dropped index: ${indexName}`);
            } catch (e) {
              console.warn(
                `[Seed] Could not drop index ${indexName}:`,
                e.message
              );
            }
          }
        }
      }

      // Wait a moment for index operations to complete
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (e) {
      console.warn("[Seed] Error during index management:", e.message);
    }

    // Ensure compound index exists - this allows same id for different languages
    try {
      // Drop existing compound index if it exists to recreate it cleanly
      try {
        await PersonalityQuestion.collection.dropIndex("id_1_language_1");
      } catch (e) {
        // Index might not exist, that's fine
      }
      // Create the compound index
      await PersonalityQuestion.collection.createIndex(
        { id: 1, language: 1 },
        { unique: true, background: true }
      );
      console.log("[Seed] Compound index (id, language) ensured");
    } catch (e) {
      if (e.message.includes("already exists")) {
        console.log("[Seed] Compound index already exists");
      } else {
        console.warn("[Seed] Could not create compound index:", e.message);
      }
    }

    // Migrate existing questions without language field to 'en'
    const questionsWithoutLang = await PersonalityQuestion.countDocuments({
      language: { $exists: false },
    });
    if (questionsWithoutLang > 0) {
      console.log(
        `[Seed] Found ${questionsWithoutLang} questions without language field, migrating to 'en'...`
      );
      await PersonalityQuestion.updateMany(
        { language: { $exists: false } },
        { $set: { language: "en" } }
      );
      console.log(
        `[Seed] Migrated ${questionsWithoutLang} questions to language 'en'`
      );
    }

    const qCountEn = await PersonalityQuestion.countDocuments({
      language: "en",
    });
    const qCountAr = await PersonalityQuestion.countDocuments({
      language: "ar",
    });
    const pCount = await Personality.countDocuments({});
    const needsEnglishReseed = qCountEn < MIN_ENGLISH_QUESTIONS;
    const needsArabicReseed = qCountAr < MIN_ARABIC_QUESTIONS;
    if (needsEnglishReseed) {
      console.warn(
        `[Seed] English questions count (${qCountEn}) below minimum threshold (${MIN_ENGLISH_QUESTIONS}). Attempting reseed...`
      );
    } else {
      console.log(
        `[Seed] English questions count (${qCountEn}) meets minimum threshold (${MIN_ENGLISH_QUESTIONS}).`
      );
    }
    if (needsArabicReseed) {
      console.warn(
        `[Seed] Arabic questions count (${qCountAr}) below minimum threshold (${MIN_ARABIC_QUESTIONS}). Attempting reseed...`
      );
    } else {
      console.log(
        `[Seed] Arabic questions count (${qCountAr}) meets minimum threshold (${MIN_ARABIC_QUESTIONS}).`
      );
    }

    // Seed English questions if missing or below minimum threshold
    let seededQ = 0;
    if (needsEnglishReseed) {
      console.log(
        `[Seed] Reseeding English questions (existing count: ${qCountEn})`
      );
      try {
        const qPath = path.join(__dirname, "MBTI Questions.txt");
        if (fs.existsSync(qPath)) {
          const raw = fs.readFileSync(qPath, "utf8");
          const lines = raw
            .split(newlineDelimiter)
            .filter((line) => line.trim().length > 0);
          const docs = [];
          for (const line of lines) {
            const parts = line.split("\t");
            if (parts.length >= 3) {
              const id = parseInt(parts[0]);
              const text = String(parts[1]).trim();
              const scoring = parts[2];
              const parts2 = scoring.split(" → ");
              if (parts2.length >= 2) {
                const dimension = String(parts2[0]).trim();
                const direction = String(parts2[1]).trim();
                docs.push({ id, text, dimension, direction, language: "en" });
              }
            }
          }
          if (docs.length) {
            try {
              await PersonalityQuestion.insertMany(docs);
              seededQ = docs.length;
              console.log(`[Seed] Seeded ${seededQ} English questions`);
            } catch (insertError) {
              // If duplicate key error, try inserting one by one
              if (
                insertError.code === 11000 ||
                insertError.name === "MongoServerError"
              ) {
                console.log(
                  `[Seed] Duplicate key error, trying to insert English questions one by one...`
                );
                let inserted = 0;
                for (const doc of docs) {
                  try {
                    await PersonalityQuestion.updateOne(
                      { id: doc.id, language: "en" },
                      { $set: doc },
                      { upsert: true }
                    );
                    inserted++;
                  } catch (e) {
                    console.error(
                      `[Seed] Error inserting English question ${doc.id}:`,
                      e.message
                    );
                  }
                }
                seededQ = inserted;
                console.log(`[Seed] Upserted ${seededQ} English questions`);
              } else {
                throw insertError;
              }
            }
          }
        } else {
          console.warn("Personality Questions.txt file not found");
        }
      } catch (e) {
        console.error("Error seeding English questions:", e.message);
      }
    }

    // Seed Arabic questions if missing or below minimum threshold
    let seededQAr = 0;
    if (needsArabicReseed) {
      console.log(
        `[Seed] Reseeding Arabic questions (existing count: ${qCountAr})`
      );
      try {
        const qPathAr = path.join(__dirname, "MBTI Questions - Arabic.txt");
        console.log(`[Seed] Checking for Arabic questions file at: ${qPathAr}`);
        console.log(`[Seed] File exists: ${fs.existsSync(qPathAr)}`);
        console.log(`[Seed] Current working directory: ${process.cwd()}`);
        console.log(`[Seed] __dirname: ${__dirname}`);

        if (fs.existsSync(qPathAr)) {
          console.log(`[Seed] Arabic questions file found, loading...`);
          const raw = fs.readFileSync(qPathAr, "utf8");
          const lines = raw
            .split(newlineDelimiter)
            .filter((line) => line.trim().length > 0);
          console.log(`[Seed] Parsed ${lines.length} lines from Arabic file`);
          const docs = [];
          for (const line of lines) {
            const parts = line.split("\t");
            if (parts.length >= 3) {
              const id = parseInt(parts[0]);
              const text = String(parts[1]).trim();
              const scoring = parts[2];
              const parts2 = scoring.split(" → ");
              if (parts2.length >= 2) {
                const dimension = String(parts2[0]).trim();
                const direction = String(parts2[1]).trim();
                docs.push({ id, text, dimension, direction, language: "ar" });
              }
            }
          }
          console.log(
            `[Seed] Parsed ${docs.length} Arabic questions from file`
          );
          if (docs.length) {
            // Delete all existing Arabic questions first to avoid index conflicts
            const deletedCount = await PersonalityQuestion.deleteMany({
              language: "ar",
            });
            console.log(
              `[Seed] Deleted ${deletedCount.deletedCount} existing Arabic questions to avoid conflicts`
            );

            // Wait a moment for deletion to complete
            await new Promise((resolve) => setTimeout(resolve, 200));

            // Now insert all Arabic questions fresh
            console.log(`[Seed] Inserting ${docs.length} Arabic questions...`);
            try {
              await PersonalityQuestion.insertMany(docs, { ordered: false });
              seededQAr = docs.length;
              console.log(
                `[Seed] Successfully inserted ${seededQAr} Arabic questions`
              );
            } catch (insertError) {
              console.error(
                `[Seed] Error inserting Arabic questions:`,
                insertError.message
              );
              // If bulk insert fails, try one by one
              if (
                insertError.code === 11000 ||
                insertError.name === "MongoServerError"
              ) {
                console.log(`[Seed] Bulk insert failed, trying one by one...`);
                let inserted = 0;
                let errors = 0;
                for (const doc of docs) {
                  try {
                    await PersonalityQuestion.create(doc);
                    inserted++;
                  } catch (e) {
                    if (e.code === 11000) {
                      // Duplicate key - try update instead
                      try {
                        await PersonalityQuestion.updateOne(
                          { id: doc.id, language: "ar" },
                          { $set: doc },
                          { upsert: true }
                        );
                        inserted++;
                      } catch (e2) {
                        console.error(
                          `[Seed] Error with Arabic question ${doc.id}:`,
                          e2.message
                        );
                        errors++;
                      }
                    } else {
                      console.error(
                        `[Seed] Error inserting Arabic question ${doc.id}:`,
                        e.message
                      );
                      errors++;
                    }
                  }
                }
                seededQAr = inserted;
                console.log(
                  `[Seed] Inserted ${inserted} Arabic questions (${errors} errors)`
                );
              } else {
                throw insertError;
              }
            }
          }
        } else {
          console.error(
            `[Seed] CRITICAL: Personality Questions - Arabic.txt file not found at ${qPathAr}`
          );
          console.error(
            `[Seed] Please ensure the Arabic questions file exists in the server directory`
          );
          // Try alternative paths
          const altPaths = [
            path.join(process.cwd(), "MBTI Questions - Arabic.txt"),
            path.join(__dirname, "..", "MBTI Questions - Arabic.txt"),
            path.join(
              process.cwd(),
              "majorMatch",
              "MBTI Questions - Arabic.txt"
            ),
          ];
          for (const altPath of altPaths) {
            if (fs.existsSync(altPath)) {
              console.log(
                `[Seed] Found Arabic file at alternative path: ${altPath}`
              );
              // Could retry with this path, but for now just log it
              break;
            }
          }
        }
      } catch (e) {
        console.error("[Seed] Error seeding Arabic questions:", e.message);
        console.error("[Seed] Stack:", e.stack);
      }
    }

    let seededP = 0;
    try {
      seededP = await upsertPersonalitiesFromDisplay();
      if (seededP > 0) {
        console.log(
          `[Seed] Upserted ${seededP} personality types from PersonalityDisplay.txt`
        );
      }
    } catch (e) {
      console.error("[Seed] Error seeding personalities:", e.message);
    }

    if (needsEnglishReseed && seededQ === 0) {
      const currentEn = await PersonalityQuestion.countDocuments({
        language: "en",
      });
      if (currentEn === 0) {
        console.warn(
          "[Seed] English questions still missing after reseed attempt, inserting fallback question"
        );
        await PersonalityQuestion.insertMany([
          {
            id: 1,
            text: "You enjoy social gatherings.",
            dimension: "IE",
            direction: "E",
            language: "en",
          },
        ]);
      } else {
        console.warn(
          `[Seed] Skipping fallback English question; ${currentEn} questions already present.`
        );
      }
    }
    if (needsArabicReseed && seededQAr === 0) {
      const currentAr = await PersonalityQuestion.countDocuments({
        language: "ar",
      });
      if (currentAr === 0) {
        console.warn(
          "[Seed] Arabic questions still missing after reseed attempt, inserting fallback question"
        );
        await PersonalityQuestion.insertMany([
          {
            id: 1,
            text: "تستمتع بالتجمعات الاجتماعية.",
            dimension: "IE",
            direction: "E",
            language: "ar",
          },
        ]);
      } else {
        console.warn(
          `[Seed] Skipping fallback Arabic question; ${currentAr} questions already present.`
        );
      }
    }
    if (!seededP) {
      await Personality.insertMany([
        { type: "INFP-T", content: "Default INFP-T description." },
      ]);
    }
    const totalQuestions = await PersonalityQuestion.countDocuments({});
    const enCount = await PersonalityQuestion.countDocuments({
      language: "en",
    });
    const arCount = await PersonalityQuestion.countDocuments({
      language: "ar",
    });
    console.log(
      `[Seed] Personality seed complete: total questions=${totalQuestions} (en=${enCount}, ar=${arCount}), personalities=${await Personality.countDocuments(
        {}
      )}`
    );

    // Reload cache after seeding
    try {
      await loadPersonalityCache();
    } catch (e) {
      console.error("[Seed] Error reloading cache after seeding:", e.message);
    }
  } catch (e) {
    console.warn("Personality auto-seed skipped:", e.message);
  }
}

function loadMajorSeedPayload() {
  const payload = loadJsonFileSafe(MAJOR_SEED_FILE);
  if (payload && payload.majors && Array.isArray(payload.majors)) {
    return payload;
  }
  return null;
}

async function seedMajorsFromPayload(payload) {
  if (!payload) return false;
  const majors = Array.isArray(payload.majors) ? payload.majors : [];
  const mapping = Array.isArray(payload.mapping) ? payload.mapping : [];
  const questions = payload.questions || {};
  const enQuestions = Array.isArray(questions.en) ? questions.en : [];
  const arQuestions = Array.isArray(questions.ar) ? questions.ar : [];
  const targetMajors = majors.length || MAJOR_TARGET_COUNT;

  const [majCount, mapCount, enCount, arCount] = await Promise.all([
    Major.countDocuments({}),
    MajorMapping.countDocuments({}),
    MajorQuestion.countDocuments({ language: "en" }),
    MajorQuestion.countDocuments({ language: "ar" }),
  ]);

  const shouldSeedMajors =
    FORCE_SEED || (targetMajors && majCount !== targetMajors);
  const shouldSeedMapping =
    FORCE_SEED || (mapping.length && mapCount !== mapping.length);
  const shouldSeedEnQuestions =
    FORCE_SEED || (enQuestions.length && enCount !== enQuestions.length);
  const shouldSeedArQuestions =
    FORCE_SEED || (arQuestions.length && arCount !== arQuestions.length);

  if (
    !shouldSeedMajors &&
    !shouldSeedMapping &&
    !shouldSeedEnQuestions &&
    !shouldSeedArQuestions
  ) {
    return false;
  }

  console.log(
    `[Seed] Using payload from ${MAJOR_SEED_FILE} to normalize majors/mapping/questions`
  );

  if (shouldSeedMajors) {
    await Major.deleteMany({});
    await Major.insertMany(majors);
    console.log(`[Seed] Reloaded ${majors.length} majors from payload`);
  }

  if (shouldSeedMapping) {
    await MajorMapping.deleteMany({});
    await MajorMapping.insertMany(mapping);
    console.log(`[Seed] Reloaded ${mapping.length} mappings from payload`);
  }

  if (shouldSeedEnQuestions) {
    await MajorQuestion.deleteMany({ language: "en" });
    await MajorQuestion.insertMany(
      enQuestions.map((q, idx) => ({
        ...q,
        id: parseInt(q.id ?? idx + 1),
        category: String(q.category || "General"),
        topic: q.topic ? String(q.topic) : null,
        question: String(q.question || q.text || ""),
        language: "en",
      }))
    );
    console.log(
      `[Seed] Reloaded ${enQuestions.length} English major questions from payload`
    );
  }

  if (shouldSeedArQuestions) {
    await MajorQuestion.deleteMany({ language: "ar" });
    await MajorQuestion.insertMany(
      arQuestions.map((q, idx) => ({
        ...q,
        id: parseInt(q.id ?? idx + 1),
        category: String(q.category || "General"),
        topic: q.topic ? String(q.topic) : null,
        question: String(q.question || q.text || ""),
        language: "ar",
      }))
    );
    console.log(
      `[Seed] Reloaded ${arQuestions.length} Arabic major questions from payload`
    );
  }

  return true;
}

async function ensureMajorSeedMongo() {
  try {
    await dedupeCollectionByFields(Major, ["name"], "Major (name)");
    await dedupeCollectionByFields(
      MajorMapping,
      ["category", "option_value", "major_name"],
      "MajorMapping (category/option_value/major_name)"
    );
    await dedupeCollectionByFields(
      MajorQuestion,
      ["id", "language"],
      "MajorQuestion (id+language)"
    );

    const payload = loadMajorSeedPayload();
    if (payload) {
      await seedMajorsFromPayload(payload);
      // If the payload exists, treat it as the single source of truth to avoid mixing datasets
      return;
    }

    // Drop old unique index on id only if it exists
    try {
      const indexes = await MajorQuestion.collection.getIndexes();
      console.log(
        "[Seed] Current MajorQuestion indexes:",
        Object.keys(indexes)
      );
      if (indexes.id_1) {
        console.log(
          "[Seed] Dropping old index on id only for MajorQuestion..."
        );
        try {
          await MajorQuestion.collection.dropIndex("id_1");
          console.log("[Seed] Old index id_1 dropped successfully");
        } catch (dropError) {
          if (dropError.message.includes("index not found")) {
            console.log("[Seed] Index id_1 already dropped or does not exist");
          } else {
            console.warn(
              "[Seed] Could not drop old index id_1:",
              dropError.message
            );
          }
        }
      } else {
        console.log("[Seed] No id_1 index found, skipping drop");
      }
    } catch (e) {
      console.warn("[Seed] Could not check indexes:", e.message);
    }

    // Ensure compound index exists
    try {
      await MajorQuestion.collection.createIndex(
        { id: 1, language: 1 },
        { unique: true, background: true }
      );
      console.log(
        "[Seed] Compound index (id, language) ensured for MajorQuestion"
      );
    } catch (e) {
      if (!e.message.includes("already exists")) {
        console.warn("[Seed] Could not create compound index:", e.message);
      }
    }

    // Migrate existing questions without language field to 'en'
    const questionsWithoutLang = await MajorQuestion.countDocuments({
      language: { $exists: false },
    });
    if (questionsWithoutLang > 0) {
      console.log(
        `[Seed] Found ${questionsWithoutLang} major questions without language field, migrating to 'en'...`
      );
      await MajorQuestion.updateMany(
        { language: { $exists: false } },
        { $set: { language: "en" } }
      );
      console.log(
        `[Seed] Migrated ${questionsWithoutLang} major questions to language 'en'`
      );
    }

    // Major questions - English
    const mqCountEn = await MajorQuestion.countDocuments({ language: "en" });
    if (mqCountEn === 0) {
      const englishSeed = loadMajorQuestionDocs("en");
      if (englishSeed?.docs?.length) {
        await MajorQuestion.insertMany(englishSeed.docs);
        console.log(
          `Seeded ${englishSeed.docs.length} major questions (en) from ${englishSeed.source}`
        );
      } else {
        console.warn(
          "[Seed] No English major question source found (looked for Question 2 Final.txt)"
        );
      }
    }

    // Major questions - Arabic
    const mqCountAr = await MajorQuestion.countDocuments({ language: "ar" });
    const MIN_ARABIC_MAJOR_QUESTIONS = parseInt(
      process.env.MAJOR_MIN_AR_QUESTIONS || "10",
      10
    );
    const needsArabicMajorReseed = mqCountAr < MIN_ARABIC_MAJOR_QUESTIONS;

    if (needsArabicMajorReseed) {
      console.log(
        `[Seed] Arabic major questions count (${mqCountAr}) below threshold (${MIN_ARABIC_MAJOR_QUESTIONS}), reseeding...`
      );
      const arabicSeed = loadMajorQuestionDocs("ar");
      if (arabicSeed?.docs?.length) {
        await MajorQuestion.deleteMany({ language: "ar" });
        try {
          await MajorQuestion.insertMany(arabicSeed.docs, { ordered: false });
          console.log(
            `[Seed] Seeded ${arabicSeed.docs.length} Arabic major questions from ${arabicSeed.source}`
          );
        } catch (insertError) {
          if (
            insertError.code === 11000 ||
            insertError.name === "MongoServerError"
          ) {
            console.log(
              "[Seed] Duplicate key error while inserting Arabic questions, upserting individually..."
            );
            let inserted = 0;
            for (const doc of arabicSeed.docs) {
              try {
                await MajorQuestion.replaceOne(
                  { id: doc.id, language: "ar" },
                  doc,
                  { upsert: true }
                );
                inserted++;
              } catch (e) {
                console.warn(
                  `[Seed] Error upserting Arabic major question ${doc.id}:`,
                  e.message
                );
              }
            }
            console.log(`[Seed] Upserted ${inserted} Arabic major questions`);
          } else {
            throw insertError;
          }
        }
      } else {
        console.warn(
          "[Seed] No Arabic major question source found. Set MAJOR_QUESTIONS_PATH_AR to enable Arabic seeding."
        );
      }
    }
  } catch (e) {
    console.warn("Major questions seed skipped:", e.message);
  }

  try {
    // Majors & mapping
    const majCount = await Major.countDocuments({});
    const mapCount = await MajorMapping.countDocuments({});
    if (majCount === 0 || mapCount === 0) {
      const dataset = loadMajorMappingDataset();
      console.log(
        `[Seed] Mapping dataset summary: source=${dataset.source}, records=${
          dataset?.records?.length || 0
        }, checked=${dataset?.checked ? dataset.checked.join(", ") : "none"}`
      );
      if (dataset?.records?.length) {
        const built = buildMappingsFromRecords(dataset.records);
        console.log(
          `[Seed] Built dataset summary: majors=${built.majors.length}, mappings=${built.mappings.length}`
        );
        if (majCount === 0 && built.majors.length) {
          await Major.insertMany(
            built.majors.map((name) => ({
              name,
              description: "",
              avg_salary: "",
              job_outlook: "",
              work_environment: "",
            }))
          );
          console.log(
            `[Seed] Inserted ${built.majors.length} majors from ${dataset.source}`
          );
        }
        if (mapCount === 0 && built.mappings.length) {
          await MajorMapping.insertMany(built.mappings);
          console.log(
            `[Seed] Inserted ${built.mappings.length} major mappings from ${dataset.source}`
          );
        }
      } else {
        const checkedPaths = dataset?.checked?.length
          ? dataset.checked
          : ["(no paths attempted)"];
        console.warn(
          `[Seed] Mapping dataset not found. Checked: ${checkedPaths.join(
            ", "
          )}`
        );
      }
    }
  } catch (e) {
    console.warn("Majors/mapping seed skipped:", e.message);
  }
}

const MIN_ENGLISH_QUESTIONS = parseInt(
  process.env.PERSONALITY_MIN_EN_QUESTIONS || "60",
  10
);
const MIN_ARABIC_QUESTIONS = parseInt(
  process.env.PERSONALITY_MIN_AR_QUESTIONS || "60",
  10
);
const QUESTION_FILE_MAP = {
  en: "MBTI Questions.txt",
  ar: "MBTI Questions - Arabic.txt",
};

let questionsCache = { en: [], ar: [] };
let personalitiesCache = {};

function parseQuestionFile(language) {
  const fileName = QUESTION_FILE_MAP[language] || QUESTION_FILE_MAP.en;
  const filePath = path.join(__dirname, fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(
      `[Questions] Could not find ${fileName} while enforcing minimum for ${language}`
    );
    return [];
  }
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw
    .split(newlineDelimiter)
    .map((line) => line.trim())
    .filter(Boolean);
  const docs = [];
  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length < 3) continue;
    const id = parseInt(parts[0], 10);
    const text = String(parts[1] || "").trim();
    const scoring = parts[2];
    const [dimension, direction] = (scoring || "")
      .split(" → ")
      .map((part) => String(part || "").trim());
    if (!id || !text || !dimension || !direction) continue;
    docs.push({ id, text, dimension, direction, language });
  }
  return docs;
}

async function ensureQuestionCount(language) {
  const target =
    language === "ar" ? MIN_ARABIC_QUESTIONS : MIN_ENGLISH_QUESTIONS;
  let current = questionsCache[language] || [];
  if (current.length >= target) return current;

  console.warn(
    `[Questions] ${language.toUpperCase()} cache has ${
      current.length
    } questions. Enforcing minimum ${target}.`
  );
  const docs = parseQuestionFile(language);
  if (!docs.length) {
    console.warn(
      `[Questions] Falling back skipped: no parsed docs available for ${language}`
    );
    return current;
  }

  let upserts = 0;
  for (const doc of docs) {
    try {
      await PersonalityQuestion.updateOne(
        { id: doc.id, language },
        { $set: doc },
        { upsert: true }
      );
      upserts++;
    } catch (e) {
      console.error(
        `[Questions] Failed to upsert ${language} question ${doc.id}:`,
        e.message
      );
    }
  }
  console.log(
    `[Questions] Ensured ${upserts} ${language} questions from fallback file`
  );

  const refreshed = await PersonalityQuestion.find({ language })
    .sort({ id: 1 })
    .lean();
  questionsCache[language] = Array.isArray(refreshed) ? refreshed : [];
  return questionsCache[language];
}

async function loadPersonalityCache() {
  try {
    let qRowsEn = await PersonalityQuestion.find({ language: "en" })
      .sort({ id: 1 })
      .lean();
    if (!Array.isArray(qRowsEn)) qRowsEn = [];
    if (qRowsEn.length < MIN_ENGLISH_QUESTIONS) {
      qRowsEn = await ensureQuestionCount("en");
    }
    let qRowsAr = await PersonalityQuestion.find({ language: "ar" })
      .sort({ id: 1 })
      .lean();
    if (!Array.isArray(qRowsAr)) qRowsAr = [];
    if (qRowsAr.length < MIN_ARABIC_QUESTIONS) {
      qRowsAr = await ensureQuestionCount("ar");
    }
    questionsCache.en = Array.isArray(qRowsEn) ? qRowsEn : [];
    questionsCache.ar = Array.isArray(qRowsAr) ? qRowsAr : [];

    const pRows = await Personality.find({}).lean();
    personalitiesCache = {};
    (pRows || []).forEach((r) => {
      personalitiesCache[r.type] = { type: r.type, content: r.content };
    });
    console.log(
      `[Cache] Loaded ${questionsCache.en.length} personality questions (en) and ${questionsCache.ar.length} personality questions (ar) from mongo`
    );
    console.log(
      `[Cache] Loaded ${
        Object.keys(personalitiesCache).length
      } personality types (mongo)`
    );

    // Debug: Show first few questions for each language
    if (questionsCache.en.length > 0) {
      console.log(
        `[Cache] Sample EN question: ${
          questionsCache.en[0].text?.substring(0, 50) || "N/A"
        }...`
      );
    }
    if (questionsCache.ar.length > 0) {
      console.log(
        `[Cache] Sample AR question: ${
          questionsCache.ar[0].text?.substring(0, 50) || "N/A"
        }...`
      );
    } else {
      console.warn(`[Cache] No Arabic questions found in database!`);
    }

    // Warn if Arabic questions count is suspiciously low
    if (questionsCache.ar.length > 0 && questionsCache.ar.length < 10) {
      console.warn(
        `[Cache] WARNING: Only ${questionsCache.ar.length} Arabic questions loaded. Expected more questions.`
      );
    }
  } catch (e) {
    console.error(`[Cache] Error loading personality cache:`, e.message);
    console.error(e.stack);
    // Ensure cache is at least initialized as empty arrays
    if (!questionsCache.en) questionsCache.en = [];
    if (!questionsCache.ar) questionsCache.ar = [];
    throw e;
  }
}

// No file-based seeding for majors/mappings/questions. Use admin bulk endpoints instead.

// Calculate Personality Type
function calculatePersonalityType(answers, language = "en") {
  const scores = {
    I: 0,
    E: 0,
    S: 0,
    N: 0,
    T: 0,
    F: 0,
    J: 0,
    P: 0,
    A: 0,
    T2: 0,
  };
  const cache = questionsCache[language] || questionsCache.en;
  answers.forEach((a) => {
    const q = cache.find((q) => q.id === a.questionId);
    if (!q) return;
    const value = a.value;
    if (value < 1 || value > 5) return;
    const signed = value - 3;
    if (signed === 0) return;
    const magnitude = Math.abs(signed);
    const dir = signed > 0 ? q.direction : getOpposite(q.direction);
    const key = dir === "T" && q.dimension === "AT" ? "T2" : dir; // avoid clash with Thinking(T)
    scores[key] = (scores[key] || 0) + magnitude;
  });
  const type =
    (scores.E >= scores.I ? "E" : "I") +
    (scores.N >= scores.S ? "N" : "S") +
    (scores.F >= scores.T ? "F" : "T") +
    (scores.P >= scores.J ? "P" : "J");
  const identity = (scores.A || 0) >= (scores.T2 || 0) ? "A" : "T";
  return `${type}-${identity}`;
}
function getOpposite(d) {
  const m = {
    I: "E",
    E: "I",
    S: "N",
    N: "S",
    T: "F",
    F: "T",
    J: "P",
    P: "J",
    A: "T",
    T: "A",
  };
  return m[d] || d;
}

// Stripe Payment Routes
app.post("/api/create-payment-intent", authMiddleware, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        error: "Payment system not configured. Please contact support.",
      });
    }

    // Check if user already has a payment
    const existingPayment = await Subscription.findOne({
      user_id: req.user.id,
      status: "active",
    }).lean();

    if (existingPayment) {
      return res
        .status(400)
        .json({ error: "User already has access to the major test" });
    }

    // Get or create Stripe customer
    let customer;
    const user = await User.findById(req.user.id).lean();

    try {
      customer = await stripe.customers.create({
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        metadata: {
          user_id: req.user.id,
        },
      });
    } catch (e) {
      // Customer might already exist
      const customers = await stripe.customers.list({ email: user.email });
      if (customers.data.length > 0) {
        customer = customers.data[0];
      } else {
        throw e;
      }
    }

    // Create payment intent for one-time payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1499, // $14.99 in cents
      currency: "usd",
      customer: customer.id,
      metadata: {
        user_id: req.user.id,
        product: "major_test_access",
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      customerId: customer.id,
    });
  } catch (e) {
    console.error("Stripe error:", e);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
});

app.post("/api/confirm-payment", authMiddleware, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        error: "Payment system not configured. Please contact support.",
      });
    }

    const { paymentIntentId } = req.body;
    if (!paymentIntentId)
      return res.status(400).json({ error: "Payment Intent ID is required" });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      // Save payment to database
      await Subscription.create({
        user_id: req.user.id,
        stripe_customer_id: paymentIntent.customer,
        stripe_subscription_id: paymentIntent.id, // Using payment intent ID for one-time payments
        stripe_price_id: "one_time_major_test", // Custom identifier for one-time payment
        status: "active",
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      });

      res.json({ success: true, paymentIntent: paymentIntent });
    } else {
      res.status(400).json({ error: "Payment was not successful" });
    }
  } catch (e) {
    console.error("Payment confirmation error:", e);
    res.status(500).json({ error: "Failed to confirm payment" });
  }
});

// Public payment configuration (used by frontend UI)
app.get("/api/payments/config", async (req, res) => {
  try {
    return res.json({
      stripeEnabled: !!stripe,
      whish: {
        accountName: WHISH_ACCOUNT_NAME,
        accountNumber: WHISH_ACCOUNT_NUMBER,
        amountCents: WHISH_AMOUNT_CENTS,
        currency: WHISH_CURRENCY,
        instructions: WHISH_INSTRUCTIONS,
      },
    });
  } catch (e) {
    return res
      .status(500)
      .json({ error: "Failed to load payment configuration" });
  }
});

// Submit Whish Money payment details for manual verification
app.post("/api/payments/whish/submit", authMiddleware, async (req, res) => {
  try {
    const { reference, senderName, phone, notes } = req.body || {};
    if (!reference || !String(reference).trim())
      return res.status(400).json({ error: "Reference is required" });
    if (!senderName || !String(senderName).trim())
      return res.status(400).json({ error: "Sender name is required" });

    // Optionally: prevent duplicate references for same user while pending
    const existing = await ManualPayment.findOne({
      user_id: req.user.id,
      reference: String(reference).trim(),
      status: "pending",
    }).lean();
    if (existing)
      return res.status(409).json({
        error: "A submission with this reference is already pending review",
      });

    await ManualPayment.create({
      user_id: req.user.id,
      method: "whish",
      reference: String(reference).trim(),
      sender_name: String(senderName).trim(),
      phone: phone ? String(phone).trim() : null,
      notes: notes ? String(notes).trim() : null,
      amount_cents: WHISH_AMOUNT_CENTS,
      currency: WHISH_CURRENCY,
      status: "pending",
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error("Whish submit error:", e);
    return res.status(500).json({ error: "Failed to submit payment details" });
  }
});

app.get("/api/subscription-status", authMiddleware, async (req, res) => {
  try {
    // Whitelist: grant access without payment for specific email
    const isWhitelisted =
      String(req.user?.email || "").toLowerCase() === "ammarbadawi18@gmail.com";
    if (isWhitelisted) {
      return res.json({
        hasSubscription: true,
        status: "active",
        current_period_end: new Date("2099-12-31").toISOString(),
        payment_type: "whitelist",
      });
    }

    const subscription = await Subscription.findOne({
      user_id: req.user.id,
      status: "active",
    }).lean();

    if (!subscription) {
      return res.json({ hasSubscription: false });
    }

    // Check if it's a one-time payment that's still valid
    const now = new Date();
    const isExpired =
      subscription.current_period_end &&
      new Date(subscription.current_period_end) < now;

    if (isExpired) {
      // Update status to expired
      await Subscription.updateOne(
        { _id: subscription._id },
        { status: "expired", updated_at: new Date() }
      );
      return res.json({ hasSubscription: false });
    }

    res.json({
      hasSubscription: true,
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      payment_type:
        subscription.stripe_price_id === "one_time_major_test"
          ? "one_time"
          : "subscription",
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to check subscription status" });
  }
});

app.post("/api/cancel-subscription", authMiddleware, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      user_id: req.user.id,
      status: "active",
    });

    if (!subscription) {
      return res.status(404).json({ error: "No active access found" });
    }

    // For one-time payments, just mark as canceled locally
    if (subscription.stripe_price_id === "one_time_major_test") {
      subscription.status = "canceled";
      subscription.updated_at = new Date();
      await subscription.save();
      res.json({ success: true, message: "Access has been revoked" });
      return;
    }

    // For recurring subscriptions, cancel in Stripe
    if (!stripe) {
      return res.status(503).json({
        error: "Payment system not configured. Please contact support.",
      });
    }

    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // Update local subscription status
    subscription.status = "canceled";
    subscription.updated_at = new Date();
    await subscription.save();

    res.json({ success: true });
  } catch (e) {
    console.error("Subscription cancellation error:", e);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

// Stripe webhook endpoint
app.post(
  "/api/stripe-webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ error: "Payment system not configured" });
    }

    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "payment_intent.succeeded":
          const paymentIntent = event.data.object;
          // Check if this is a major test payment
          if (
            paymentIntent.metadata &&
            paymentIntent.metadata.product === "major_test_access"
          ) {
            // Create or update subscription record for one-time payment
            await Subscription.updateOne(
              { stripe_subscription_id: paymentIntent.id },
              {
                user_id: paymentIntent.metadata.user_id,
                stripe_customer_id: paymentIntent.customer,
                stripe_subscription_id: paymentIntent.id,
                stripe_price_id: "one_time_major_test",
                status: "active",
                current_period_start: new Date(),
                current_period_end: new Date(
                  Date.now() + 365 * 24 * 60 * 60 * 1000
                ), // 1 year
                updated_at: new Date(),
              },
              { upsert: true }
            );
          }
          break;
        case "customer.subscription.updated":
          const subscription = event.data.object;
          await Subscription.updateOne(
            { stripe_subscription_id: subscription.id },
            {
              status: subscription.status,
              current_period_start: new Date(
                subscription.current_period_start * 1000
              ),
              current_period_end: new Date(
                subscription.current_period_end * 1000
              ),
              updated_at: new Date(),
            }
          );
          break;
        case "customer.subscription.deleted":
          const deletedSubscription = event.data.object;
          await Subscription.updateOne(
            { stripe_subscription_id: deletedSubscription.id },
            {
              status: "canceled",
              updated_at: new Date(),
            }
          );
          break;
      }
      res.json({ received: true });
    } catch (e) {
      console.error("Webhook processing error:", e);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

// Routes
app.get("/api/stats/summary", async (req, res) => {
  try {
    const [userCount, personalityResultCount, majorResultCount] =
      await Promise.all([
        User.countDocuments({}),
        PersonalityResult.countDocuments({}),
        MajorTest.countDocuments({}),
      ]);
    res.json({
      userCount,
      personalityResultCount,
      majorResultCount,
    });
  } catch (e) {
    console.error("[API] Error in /api/stats/summary:", e);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/questions", authMiddleware, async (req, res) => {
  try {
    const lang =
      req.query.lang ||
      req.headers["accept-language"]?.split(",")[0]?.split("-")[0] ||
      "en";
    const language = lang === "ar" ? "ar" : "en";

    console.log(
      `[API] Requesting personality questions in language: ${language}, query lang: ${req.query.lang}, accept-language: ${req.headers["accept-language"]}`
    );

    // Check cache first - if empty or low, reload from database (but don't seed on every request)
    if (
      !questionsCache[language] ||
      questionsCache[language].length === 0 ||
      questionsCache[language].length < 10
    ) {
      console.log(
        `[API] Cache empty or low for ${language} (${
          questionsCache[language]?.length || 0
        } questions), querying database directly...`
      );
      // Query database directly - much faster than seeding
      try {
        const directQuery = await PersonalityQuestion.find({
          language: language,
        })
          .sort({ id: 1 })
          .lean();
        if (Array.isArray(directQuery) && directQuery.length > 0) {
          questionsCache[language] = directQuery;
          console.log(
            `[API] Loaded ${directQuery.length} questions for ${language} from database`
          );
        } else {
          console.warn(`[API] No questions found in database for ${language}`);
          // Try reloading the full cache (this will update both languages)
          try {
            await loadPersonalityCache();
            console.log(
              `[API] Cache reloaded, ${language} now has ${
                questionsCache[language]?.length || 0
              } questions`
            );
          } catch (e) {
            console.error("[API] Error reloading cache:", e.message);
          }
        }
      } catch (e) {
        console.error(
          `[API] Error querying database for ${language}:`,
          e.message
        );
      }
    }

    let questions = questionsCache[language] || [];
    const minQuestions =
      language === "ar" ? MIN_ARABIC_QUESTIONS : MIN_ENGLISH_QUESTIONS;
    if ((questions?.length || 0) < minQuestions) {
      questions = await ensureQuestionCount(language);
    }

    // If still no questions or very few, check database count (but don't do expensive operations)
    if (questions.length < 10) {
      try {
        const dbCount = await MbtiQuestion.countDocuments({
          language: language,
        });
        console.log(
          `[API] Database has ${dbCount} questions for ${language}, cache has ${questions.length}`
        );
        if (dbCount > questions.length && dbCount > 0) {
          console.log(
            `[API] Database has more questions (${dbCount}) than cache (${questions.length}), reloading...`
          );
          const freshQuery = await MbtiQuestion.find({ language: language })
            .sort({ id: 1 })
            .lean();
          if (Array.isArray(freshQuery) && freshQuery.length > 0) {
            questionsCache[language] = freshQuery;
            questions = freshQuery;
            console.log(
              `[API] Reloaded ${freshQuery.length} questions for ${language} from database`
            );
          }
        }
      } catch (e) {
        console.error(`[API] Error checking database count:`, e.message);
      }
    }

    // If no questions found for requested language, fall back to English
    if (questions.length === 0 && language !== "en") {
      console.warn(
        `[API] No questions found for language: ${language}, falling back to English`
      );
      questions = questionsCache.en || [];
    }
    if (questions.length === 0) {
      console.error(`[API] No questions available in any language!`);
    }
    console.log(
      `[API] Returning ${questions.length} personality questions for language: ${language}`
    );

    // Map questions to include text field (for backward compatibility)
    const mappedQuestions = questions.map((q) => ({
      id: q.id,
      text: q.text,
      dimension: q.dimension,
      direction: q.direction,
    }));
    res.json(mappedQuestions);
  } catch (e) {
    console.error("[API] Error in /api/questions:", e);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/calculate", authMiddleware, async (req, res) => {
  try {
    const { answers, lang } = req.body;
    if (!answers || !Array.isArray(answers))
      return res.status(400).json({ error: "Invalid answers format" });
    const language = lang === "ar" ? "ar" : "en";
    if (
      !questionsCache[language] ||
      questionsCache[language].length === 0 ||
      !Object.keys(personalitiesCache).length
    )
      await loadPersonalityCache();
    const type = calculatePersonalityType(answers, language);
    const personality = personalitiesCache[type];
    if (!personality)
      return res.status(404).json({ error: "Personality type not found" });
    try {
      await PersonalityResult.create({
        user_id: req.user.id,
        type,
        raw_answers: answers,
      });
    } catch (e) {}
    res.json({ type, personality });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/personality/:type", async (req, res, next) => {
  try {
    const param = String(req.params.type || "");
    // Avoid shadowing the '/api/personality/latest' route
    if (param === "latest") return next();
    if (!Object.keys(personalitiesCache).length) await loadPersonalityCache();
    const p = personalitiesCache[param];
    if (!p)
      return res.status(404).json({ error: "Personality type not found" });
    res.json(p);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/personality/display/:type", async (req, res) => {
  try {
    const type = String(req.params.type || "").trim();
    if (!type) {
      return res.status(400).json({ error: "Missing personality type" });
    }
    const personality = await getDisplayPersonality(type);
    if (!personality) {
      return res
        .status(404)
        .json({ error: "Personality display data not found" });
    }
    res.json(personality);
  } catch (err) {
    console.error(
      "[API] Error in /api/personality/display:",
      err.message || err
    );
    res.status(500).json({ error: "Unable to load personality display data" });
  }
});

// Admin endpoint to check personality data in database
app.get("/api/admin/personality/check", authMiddleware, async (req, res) => {
  try {
    const { type } = req.query;
    if (type) {
      // Check specific type
      const fromDb = await Personality.findOne({ type }).lean();
      const fromCache = personalitiesCache[type];
      res.json({
        type,
        inDatabase: !!fromDb,
        inCache: !!fromCache,
        dbContent: fromDb ? fromDb.content.substring(0, 200) + "..." : null,
        cacheContent: fromCache
          ? fromCache.content.substring(0, 200) + "..."
          : null,
        dbLength: fromDb ? fromDb.content.length : 0,
        cacheLength: fromCache ? fromCache.content.length : 0,
      });
    } else {
      // List all types
      const allFromDb = await Personality.find({}).select("type").lean();
      const allFromCache = Object.keys(personalitiesCache);
      res.json({
        database: {
          count: allFromDb.length,
          types: allFromDb.map((p) => p.type),
        },
        cache: {
          count: allFromCache.length,
          types: allFromCache,
        },
        match: allFromDb.length === allFromCache.length,
      });
    }
  } catch (e) {
    res.status(500).json({ error: "Server error", details: e.message });
  }
});

// Latest personality result for the current user
app.get("/api/personality/latest", authMiddleware, async (req, res) => {
  try {
    const latest = await PersonalityResult.findOne({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .lean();
    if (!latest) return res.status(404).json({ hasResult: false });
    res.json({
      hasResult: true,
      type: latest.type,
      created_at: latest.created_at,
    });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Auth
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password, university, gender } =
      req.body || {};
    if (!firstName || !lastName || !email || !password || !gender)
      return res.status(400).json({ error: "Missing required fields" });

    // Validate password requirements
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }
    if (!/[A-Z]/.test(password)) {
      return res
        .status(400)
        .json({ error: "Password must contain at least one capital letter" });
    }
    if (!/[0-9]/.test(password)) {
      return res
        .status(400)
        .json({ error: "Password must contain at least one number" });
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      return res.status(400).json({
        error: "Password must contain at least one special character",
      });
    }

    const lower = String(email).toLowerCase();
    const existing = await User.findOne({ email: lower }).lean();
    if (existing)
      return res.status(409).json({ error: "Email already registered" });
    const password_hash = bcrypt.hashSync(password, 10);
    // Prepare verification
    const code = generateNumericCode(6);
    const codeHash = bcrypt.hashSync(code, 8);
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    const now = new Date();
    const allowedGenders = new Set([
      "male",
      "female",
      "other",
      "prefer_not_to_say",
    ]);
    if (
      typeof gender !== "string" ||
      !allowedGenders.has(gender.toLowerCase())
    ) {
      return res.status(400).json({ error: "Invalid gender value" });
    }
    const normalizedGender = gender.toLowerCase();

    const doc = await User.create({
      first_name: firstName,
      last_name: lastName,
      email: lower,
      password_hash,
      university: university || null,
      gender: normalizedGender,
      is_verified: false,
      verification_code_hash: codeHash,
      verification_expires: expires,
      verification_last_sent_at: now,
    });
    try {
      await sendVerificationEmail(lower, code);
    } catch (e) {}
    res.json({ requiresVerification: true, email: lower });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/google", async (req, res) => {
  try {
    if (!googleClient || !GOOGLE_CLIENT_ID) {
      return res
        .status(500)
        .json({ error: "Google Sign-In is not configured on the server" });
    }
    const { credential } = req.body || {};
    if (!credential)
      return res.status(400).json({ error: "Missing Google credential" });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      return res.status(401).json({ error: "Google authentication failed" });
    }

    const email = String(payload.email).toLowerCase();
    const googleId = payload.sub;
    const emailVerified =
      payload.email_verified === undefined ? true : !!payload.email_verified;
    const firstName =
      payload.given_name ||
      (payload.name ? payload.name.split(" ")[0] : "Google");
    const lastName =
      payload.family_name ||
      (payload.name
        ? payload.name.split(" ").slice(1).join(" ") || "User"
        : "User");

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        first_name: firstName,
        last_name: lastName,
        email,
        password_hash: null,
        university: null,
        gender: "prefer_not_to_say", // Default for Google signups
        is_verified: emailVerified,
        auth_provider: "google",
        google_id: googleId,
        avatar_url: payload.picture || null,
      });
    } else {
      if (!user.google_id) {
        user.google_id = googleId;
      }
      if (payload.picture && !user.avatar_url) {
        user.avatar_url = payload.picture;
      }
      if (user.auth_provider === "local" && user.password_hash) {
        user.auth_provider = "hybrid";
      }
      if (emailVerified && !user.is_verified) {
        user.is_verified = true;
      }
    }

    // Legacy accounts might be missing gender (schema now requires it)
    if (!user.gender) {
      user.gender = "prefer_not_to_say";
    }

    user.last_login = new Date();
    await user.save();

    const token = generateToken(user);
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
    res.json({
      id: user._id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      university: user.university,
      authProvider: user.auth_provider,
      avatarUrl: user.avatar_url,
    });
  } catch (e) {
    console.error("Google auth failed:", e.message || e);
    res.status(401).json({ error: "Google authentication failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Missing credentials" });
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user)
      return res.status(401).json({ error: "Invalid email or password" });
    if (!user.password_hash) {
      return res.status(400).json({
        error:
          "Password sign-in disabled for this account. Use Google Sign-In.",
      });
    }
    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok)
      return res.status(401).json({ error: "Invalid email or password" });
    if (!user.is_verified)
      return res.status(403).json({
        error: "Email not verified",
        requiresVerification: true,
        email: user.email,
      });

    // Legacy accounts might be missing required fields (e.g., gender).
    // Ensure a safe default before saving.
    if (!user.gender) {
      user.gender = "prefer_not_to_say";
    }

    // Update last login timestamp
    user.last_login = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
    res.json({
      id: user._id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      university: user.university,
      authProvider: user.auth_provider,
      avatarUrl: user.avatar_url,
    });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Email verification endpoints
app.post("/api/auth/verify", async (req, res) => {
  try {
    const { email, code } = req.body || {};
    const lower = String(email || "").toLowerCase();
    if (!lower || !code)
      return res.status(400).json({ error: "Missing email or code" });
    const user = await User.findOne({ email: lower });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.is_verified) return res.json({ ok: true, alreadyVerified: true });
    if (!user.verification_code_hash || !user.verification_expires)
      return res.status(400).json({ error: "No active verification code" });
    if (new Date() > new Date(user.verification_expires))
      return res.status(400).json({ error: "Code expired" });
    const match = bcrypt.compareSync(String(code), user.verification_code_hash);
    if (!match) return res.status(400).json({ error: "Invalid code" });
    user.is_verified = true;
    user.verification_code_hash = null;
    user.verification_expires = null;
    await user.save();
    const token = generateToken(user);
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/resend", async (req, res) => {
  try {
    const { email } = req.body || {};
    const lower = String(email || "").toLowerCase();
    if (!lower) return res.status(400).json({ error: "Missing email" });
    const user = await User.findOne({ email: lower });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.is_verified)
      return res.status(400).json({ error: "Already verified" });
    const last = user.verification_last_sent_at
      ? new Date(user.verification_last_sent_at).getTime()
      : 0;
    if (Date.now() - last < 60 * 1000)
      return res.status(429).json({ error: "Please wait before resending" });
    const code = generateNumericCode(6);
    user.verification_code_hash = bcrypt.hashSync(code, 8);
    user.verification_expires = new Date(Date.now() + 15 * 60 * 1000);
    user.verification_last_sent_at = new Date();
    await user.save();
    try {
      await sendVerificationEmail(lower, code);
    } catch (e) {}
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});
app.get("/api/me", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id, { password_hash: 0 }).lean();
  res.json({
    id: user._id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    university: user.university,
    gender: user.gender,
    authProvider: user.auth_provider,
    avatarUrl: user.avatar_url,
  });
});

async function buildRatingsSummary() {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  const [aggregate] = await Rating.aggregate([
    {
      $group: {
        _id: null,
        average: { $avg: "$value" },
        total: { $sum: 1 },
      },
    },
  ]);

  const distributionRaw = await Rating.aggregate([
    { $group: { _id: "$value", count: { $sum: 1 } } },
  ]);
  distributionRaw.forEach((item) => {
    const key = String(item._id);
    if (distribution[key] !== undefined) {
      distribution[key] = item.count;
    }
  });

  const recent = await Rating.find({ comment: { $exists: true, $ne: "" } })
    .sort({ updated_at: -1 })
    .limit(6)
    .select({ value: 1, comment: 1, updated_at: 1 })
    .lean();

  return {
    average: aggregate?.average ? Number(aggregate.average.toFixed(2)) : 0,
    total: aggregate?.total || 0,
    distribution,
    recent: recent.map((item) => ({
      value: item.value,
      comment: item.comment,
      updated_at: item.updated_at,
    })),
  };
}

app.get("/api/ratings/summary", async (req, res) => {
  try {
    const summary = await buildRatingsSummary();
    res.json(summary);
  } catch (e) {
    res.status(500).json({ error: "Failed to load ratings summary" });
  }
});

app.get("/api/ratings/me", authMiddleware, async (req, res) => {
  try {
    const rating = await Rating.findOne({ user_id: req.user.id }).lean();
    res.json({
      rating: rating ? rating.value : null,
      comment: rating ? rating.comment : "",
      updated_at: rating ? rating.updated_at : null,
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to load your rating" });
  }
});

app.post("/api/ratings", authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body || {};
    const value = Number(rating);
    if (!Number.isFinite(value) || value < 1 || value > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }
    const trimmedComment = String(comment || "").trim();
    if (trimmedComment.length > 500) {
      return res
        .status(400)
        .json({ error: "Comment must be 500 characters or fewer" });
    }

    const updated = await Rating.findOneAndUpdate(
      { user_id: req.user.id },
      {
        $set: {
          value,
          comment: trimmedComment,
          updated_at: new Date(),
        },
        $setOnInsert: {
          user_id: req.user.id,
          created_at: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    const summary = await buildRatingsSummary();
    res.json({
      ok: true,
      rating: {
        value: updated.value,
        comment: updated.comment,
        updated_at: updated.updated_at,
      },
      summary,
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to submit rating" });
  }
});

// Profile update endpoints
app.put("/api/profile/update", authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    if (!firstName || !lastName)
      return res
        .status(400)
        .json({ error: "First name and last name are required" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.first_name = String(firstName).trim();
    user.last_name = String(lastName).trim();
    await user.save();

    res.json({
      ok: true,
      firstName: user.first_name,
      lastName: user.last_name,
    });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/profile/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res
        .status(400)
        .json({ error: "Current password and new password are required" });

    // Validate new password requirements
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res
        .status(400)
        .json({ error: "Password must contain at least one capital letter" });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res
        .status(400)
        .json({ error: "Password must contain at least one number" });
    }
    if (!/[^a-zA-Z0-9]/.test(newPassword)) {
      return res.status(400).json({
        error: "Password must contain at least one special character",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.password_hash) {
      return res.status(400).json({
        error:
          "Password changes are not available for Google Sign-In accounts.",
      });
    }

    // Verify current password
    const ok = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!ok)
      return res.status(401).json({ error: "Current password is incorrect" });

    // Update password
    user.password_hash = bcrypt.hashSync(newPassword, 10);
    await user.save();

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Password reset endpoints (unauthenticated)
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body || {};
    const lower = String(email || "").toLowerCase();
    if (!lower) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email: lower });
    // Don't reveal if user exists or not for security
    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return res.json({ ok: true });
    }

    // Rate limiting: check if reset was sent recently
    const last = user.reset_last_sent_at
      ? new Date(user.reset_last_sent_at).getTime()
      : 0;
    if (Date.now() - last < 60 * 1000) {
      return res
        .status(429)
        .json({ error: "Please wait before requesting another reset" });
    }

    // Generate reset code
    const code = generateNumericCode(6);
    const codeHash = bcrypt.hashSync(code, 8);
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.reset_token_hash = codeHash;
    user.reset_expires = expires;
    user.reset_last_sent_at = new Date();
    await user.save();

    try {
      await sendPasswordResetEmail(lower, code);
    } catch (e) {
      console.warn("Failed to send password reset email:", e.message);
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body || {};
    const lower = String(email || "").toLowerCase();
    if (!lower || !code || !newPassword) {
      return res
        .status(400)
        .json({ error: "Email, code, and new password are required" });
    }

    // Validate new password requirements
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res
        .status(400)
        .json({ error: "Password must contain at least one capital letter" });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res
        .status(400)
        .json({ error: "Password must contain at least one number" });
    }
    if (!/[^a-zA-Z0-9]/.test(newPassword)) {
      return res.status(400).json({
        error: "Password must contain at least one special character",
      });
    }

    const user = await User.findOne({ email: lower });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.reset_token_hash || !user.reset_expires) {
      return res.status(400).json({ error: "No active reset code" });
    }

    if (new Date() > new Date(user.reset_expires)) {
      return res.status(400).json({ error: "Reset code expired" });
    }

    const match = bcrypt.compareSync(String(code), user.reset_token_hash);
    if (!match) {
      return res.status(400).json({ error: "Invalid reset code" });
    }

    // Update password and clear reset fields
    user.password_hash = bcrypt.hashSync(newPassword, 10);
    if (user.auth_provider === "google") {
      user.auth_provider = "hybrid";
    }
    user.reset_token_hash = null;
    user.reset_expires = null;
    await user.save();

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Admin JSON bulk endpoints
app.post("/api/admin/majors/bulk", authMiddleware, async (req, res) => {
  try {
    const list = req.body.majors;
    if (!Array.isArray(list))
      return res.status(400).json({ error: "majors must be an array" });
    await Major.deleteMany({});
    if (list.length)
      await Major.insertMany(
        list.map((m) => ({
          name: m.name,
          description: m.description || "",
          avg_salary: m.avg_salary || "",
          job_outlook: m.job_outlook || "",
          work_environment: m.work_environment || "",
        }))
      );
    res.json({ ok: true, count: list.length });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/admin/mapping/bulk", authMiddleware, async (req, res) => {
  try {
    const map = req.body.mapping;
    if (!Array.isArray(map))
      return res.status(400).json({ error: "mapping must be an array" });
    await MajorMapping.deleteMany({});
    if (map.length)
      await MajorMapping.insertMany(
        map.map((r) => ({
          category: r.category,
          option_value: r.option_value,
          major_name: r.major_name,
          score: parseInt(r.score || 1) || 1,
        }))
      );
    res.json({ ok: true, count: map.length });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// Force reload mappings from files
app.post("/api/admin/mapping/reload", authMiddleware, async (req, res) => {
  try {
    const dataset = loadMajorMappingDataset();
    const checkedPaths = dataset?.checked?.length
      ? dataset.checked
      : [
          process.env.MAPPING_DATA_PATH,
          process.env.MAPPING_ROOT_PATH,
          path.join(__dirname, DEFAULT_MAJOR_MAPPING_FILENAME),
          path.join(__dirname, "Mapping", DEFAULT_MAJOR_MAPPING_FILENAME),
        ].filter(Boolean);
    if (!dataset?.records?.length) {
      return res.status(404).json({
        error: "Mapping dataset not found",
        checked: checkedPaths,
      });
    }
    const built = buildMappingsFromRecords(dataset.records);

    await MajorMapping.deleteMany({});
    if (built.mappings.length) {
      await MajorMapping.insertMany(built.mappings);
    }
    res.json({
      ok: true,
      count: built.mappings.length,
      source: dataset.source,
      message: "Mappings reloaded from dataset",
    });
  } catch (e) {
    console.error("Mapping reload error:", e);
    res.status(500).json({ error: "Server error", details: e.message });
  }
});

// Comprehensive reload endpoint for all major-related data from Mapping folder
app.post("/api/admin/major/reload", authMiddleware, async (req, res) => {
  try {
    const dataset = loadMajorMappingDataset();
    const checkedPaths = dataset?.checked?.length
      ? dataset.checked
      : [
          process.env.MAPPING_DATA_PATH,
          process.env.MAPPING_ROOT_PATH,
          path.join(__dirname, DEFAULT_MAJOR_MAPPING_FILENAME),
          path.join(__dirname, "Mapping", DEFAULT_MAJOR_MAPPING_FILENAME),
        ].filter(Boolean);
    if (!dataset?.records?.length) {
      return res.status(404).json({
        error: "Mapping dataset not found",
        checked: checkedPaths,
      });
    }
    const built = buildMappingsFromRecords(dataset.records);

    const results = {
      majors: { updated: 0, created: 0 },
      mappings: { count: 0 },
      questions: { en: 0, ar: 0 },
      descriptions: { updated: 0 },
    };

    // Reload English questions
    try {
      const englishSeed = loadMajorQuestionDocs("en");
      if (englishSeed?.docs?.length) {
        await MajorQuestion.deleteMany({ language: "en" });
        await MajorQuestion.insertMany(englishSeed.docs);
        results.questions.en = englishSeed.docs.length;
        console.log(
          `[Major Reload] Loaded ${englishSeed.docs.length} English major questions from ${englishSeed.source}`
        );
      }
    } catch (e) {
      console.warn(
        `[Major Reload] Error loading English questions:`,
        e.message
      );
    }

    // Reload Arabic questions (optional)
    try {
      const arabicSeed = loadMajorQuestionDocs("ar");
      if (arabicSeed?.docs?.length) {
        await MajorQuestion.deleteMany({ language: "ar" });
        try {
          await MajorQuestion.insertMany(arabicSeed.docs, { ordered: false });
          results.questions.ar = arabicSeed.docs.length;
          console.log(
            `[Major Reload] Loaded ${arabicSeed.docs.length} Arabic major questions from ${arabicSeed.source}`
          );
        } catch (insertError) {
          if (
            insertError.code === 11000 ||
            insertError.name === "MongoServerError"
          ) {
            let inserted = 0;
            for (const doc of arabicSeed.docs) {
              try {
                await MajorQuestion.replaceOne(
                  { id: doc.id, language: "ar" },
                  doc,
                  { upsert: true }
                );
                inserted++;
              } catch (err) {
                console.warn(
                  `[Major Reload] Error upserting Arabic question ${doc.id}:`,
                  err.message
                );
              }
            }
            results.questions.ar = inserted;
          } else {
            throw insertError;
          }
        }
      } else {
        console.log(
          "[Major Reload] Arabic question dataset not found; skipping Arabic reseed"
        );
      }
    } catch (e) {
      console.warn(`[Major Reload] Error loading Arabic questions:`, e.message);
    }

    // Upsert majors
    if (built.majors.length) {
      for (const majorName of built.majors) {
        const writeResult = await Major.updateOne(
          { name: majorName },
          {
            $setOnInsert: {
              description: "",
              avg_salary: "",
              job_outlook: "",
              work_environment: "",
            },
          },
          { upsert: true }
        );
        if (writeResult.upsertedCount) {
          results.majors.created++;
        } else {
          results.majors.updated++;
        }
      }
    }

    // Reload mappings
    await MajorMapping.deleteMany({});
    if (built.mappings.length) {
      await MajorMapping.insertMany(built.mappings);
      results.mappings.count = built.mappings.length;
    }

    res.json({
      ok: true,
      message: "All major data reloaded from dataset",
      source: dataset.source,
      results: {
        majors: {
          total: built.majors.length,
          updated: results.majors.updated,
          created: results.majors.created,
        },
        mappings: {
          count: results.mappings.count,
        },
        questions: {
          english: results.questions.en,
          arabic: results.questions.ar,
        },
        descriptions: {
          updated: results.descriptions.updated,
        },
      },
    });
  } catch (e) {
    console.error("[Major Reload] Error:", e);
    res.status(500).json({
      error: "Server error",
      details: e.message,
      stack: process.env.NODE_ENV === "development" ? e.stack : undefined,
    });
  }
});

app.post(
  "/api/admin/personality/questions/bulk",
  authMiddleware,
  async (req, res) => {
    try {
      const qs = req.body.questions;
      if (!Array.isArray(qs))
        return res.status(400).json({ error: "questions must be an array" });
      await PersonalityQuestion.deleteMany({});
      if (qs.length)
        await PersonalityQuestion.insertMany(
          qs.map((q) => ({
            id: parseInt(q.id),
            text: String(q.text),
            dimension: String(q.dimension),
            direction: String(q.direction),
          }))
        );
      await loadPersonalityCache();
      res.json({ ok: true, count: qs.length });
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

app.post(
  "/api/admin/personality/personalities/bulk",
  authMiddleware,
  async (req, res) => {
    try {
      const ps = req.body.personalities;
      if (!Array.isArray(ps))
        return res
          .status(400)
          .json({ error: "personalities must be an array" });
      await Personality.deleteMany({});
      if (ps.length)
        await Personality.insertMany(
          ps.map((p) => ({ type: p.type, content: p.content }))
        );
      await loadPersonalityCache();
      res.json({ ok: true, count: ps.length });
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Force reload personality questions from local files (MBTI Questions*.txt)
app.post(
  "/api/admin/personality/questions/reload",
  authMiddleware,
  async (req, res) => {
    try {
      const requested = req.body?.languages;
      const languages = Array.isArray(requested) && requested.length
        ? requested.map((l) => (l === "ar" ? "ar" : "en"))
        : ["en", "ar"];

      const results = {};

      for (const language of languages) {
        const docs = parseQuestionFile(language);
        if (!docs.length) {
          results[language] = {
            reloaded: 0,
            error: `No questions found in ${
              QUESTION_FILE_MAP[language] || "unknown file"
            }`,
          };
          continue;
        }
        await PersonalityQuestion.deleteMany({ language });

        // De-duplicate by id to avoid violating the (id, language) unique index
        const uniqueMap = new Map();
        for (const doc of docs) {
          if (!uniqueMap.has(doc.id)) {
            uniqueMap.set(doc.id, doc);
          }
        }
        const uniqueDocs = Array.from(uniqueMap.values());

        await PersonalityQuestion.insertMany(uniqueDocs, { ordered: false });
        results[language] = {
          reloaded: uniqueDocs.length,
          skippedDuplicates: docs.length - uniqueDocs.length,
        };
        console.log(
          `[Admin] Reloaded ${uniqueDocs.length} personality questions for ${language} from file (skipped ${docs.length - uniqueDocs.length} duplicates by id)`
        );
      }

      await loadPersonalityCache();

      res.json({
        ok: true,
        results,
        message: "Personality questions reloaded from MBTI question files",
      });
    } catch (e) {
      console.error("Personality questions reload error:", e);
      res.status(500).json({
        error: "Server error",
        details: e.message,
        stack: process.env.NODE_ENV === "development" ? e.stack : undefined,
      });
    }
  }
);

// Force reload personalities from PersonalityDisplay.txt file
app.post("/api/admin/personality/reload", authMiddleware, async (req, res) => {
  try {
    const count = await upsertPersonalitiesFromDisplay({ forceReload: true });
    await loadPersonalityCache();
    res.json({
      ok: true,
      count,
      message: "Personalities reloaded from PersonalityDisplay.txt",
    });
  } catch (e) {
    console.error("Personality reload error:", e);
    if (e.code === "ENOENT") {
      return res.status(404).json({
        error: "PersonalityDisplay.txt file not found",
        path: PERSONALITIES_DISPLAY_PATH,
      });
    }
    res
      .status(500)
      .json({ error: "Server error", details: e.message, stack: e.stack });
  }
});

// Major test questions endpoints
app.get("/api/major/questions", authMiddleware, async (req, res) => {
  try {
    // Require personality test completion before allowing major test
    const latest = await PersonalityResult.findOne({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .lean();
    if (!latest)
      return res.status(403).json({ error: "Personality test required" });

    // TEMPORARILY DISABLED FOR DEMO - Subscription check bypassed
    // TODO: Re-enable subscription check after demo
    // Whitelist: allow specific email without subscription
    // const isWhitelisted =
    //   String(req.user?.email || "").toLowerCase() === "ammarbadawi18@gmail.com";
    // if (!isWhitelisted) {
    //   // Check subscription status
    //   const subscription = await Subscription.findOne({
    //     user_id: req.user.id,
    //     status: { $in: ["active", "trialing"] },
    //   }).lean();
    //   if (!subscription) {
    //     return res
    //       .status(402)
    //       .json({ error: "Subscription required to access major test" });
    //   }
    // }

    // Get language from query parameter or Accept-Language header
    const lang =
      req.query.lang ||
      req.headers["accept-language"]?.split(",")[0]?.split("-")[0] ||
      "en";
    const language = lang === "ar" ? "ar" : "en";

    console.log(
      `[API] Requesting major questions in language: ${language}, query lang: ${req.query.lang}, accept-language: ${req.headers["accept-language"]}`
    );

    let list = await MajorQuestion.find({ language: language })
      .sort({ id: 1 })
      .lean();
    console.log(
      `[API] Found ${
        list?.length || 0
      } major questions for language: ${language}`
    );

    // If Arabic questions are missing or low, try to seed/reseed
    if (language === "ar" && (!Array.isArray(list) || list.length < 10)) {
      console.log(
        `[API] Arabic major questions count (${
          list?.length || 0
        }) is low, attempting to seed...`
      );
      try {
        await ensureMajorSeedMongo();
        // Query again after seeding
        list = await MajorQuestion.find({ language: language })
          .sort({ id: 1 })
          .lean();
        console.log(
          `[API] After seeding, found ${
            list?.length || 0
          } Arabic major questions`
        );
      } catch (e) {
        console.error(`[API] Error seeding Arabic major questions:`, e.message);
      }
    }

    // If still low or empty, try seeding for any language
    if (!Array.isArray(list) || list.length < 10) {
      // Try structured seeding first
      try {
        await ensureMajorSeedMongo();
        list = await MajorQuestion.find({ language: language })
          .sort({ id: 1 })
          .lean();
        console.log(
          `[API] After ensureMajorSeedMongo, found ${
            list?.length || 0
          } questions for ${language}`
        );
      } catch (e) {
        console.error(`[API] Error in ensureMajorSeedMongo:`, e.message);
      }
    }

    // Last resort: reload from default dataset (English only)
    if (!Array.isArray(list) || (list.length < 10 && language === "en")) {
      const englishSeed = loadMajorQuestionDocs("en");
      if (englishSeed?.docs?.length) {
        await MajorQuestion.deleteMany({ language: "en" });
        await MajorQuestion.insertMany(englishSeed.docs);
        list = await MajorQuestion.find({ language: language })
          .sort({ id: 1 })
          .lean();
      }
    }

    // If still empty, seed minimal fallback (only for English)
    if (!Array.isArray(list) || (list.length === 0 && language === "en")) {
      const fallback = [
        {
          id: 1,
          category: "Academic Strength",
          topic: "Mathematics",
          question:
            "I enjoy solving equations and math problems in my free time.",
          language: "en",
        },
        {
          id: 2,
          category: "Academic Strength",
          topic: "Physics",
          question:
            "I enjoy solving real-world problems using physics concepts.",
          language: "en",
        },
        {
          id: 3,
          category: "Academic Strength",
          topic: "Programming & Logic",
          question:
            "I am curious about how software or applications are built.",
          language: "en",
        },
        {
          id: 4,
          category: "Core Value",
          topic: "Creativity",
          question:
            "I feel fulfilled when I'm inventing or creating something new.",
          language: "en",
        },
        {
          id: 5,
          category: "RIASEC",
          topic: "I",
          question: "I enjoy analyzing problems logically.",
          language: "en",
        },
      ];
      try {
        await MajorQuestion.insertMany(fallback);
        list = await MajorQuestion.find({ language: language })
          .sort({ id: 1 })
          .lean();
      } catch (e) {}
    }

    // Final check: if Arabic is requested but still empty, try one more time to seed
    if (language === "ar" && (!Array.isArray(list) || list.length === 0)) {
      console.log(
        `[API] Arabic major questions still empty after seeding attempts, trying one more time...`
      );
      try {
        // Force reseed Arabic questions
        await ensureMajorSeedMongo();
        // Wait a moment for seeding to complete
        await new Promise((resolve) => setTimeout(resolve, 500));
        // Query again
        list = await MajorQuestion.find({ language: language })
          .sort({ id: 1 })
          .lean();
        console.log(
          `[API] After final seeding attempt, found ${
            list?.length || 0
          } Arabic major questions`
        );
      } catch (e) {
        console.error(`[API] Final seeding attempt failed:`, e.message);
      }
    }

    // Fallback to English ONLY if requested language is truly not available after all attempts
    if (!Array.isArray(list) || list.length === 0) {
      if (language !== "en") {
        console.warn(
          `[API] No major questions found for language: ${language} after all seeding attempts, falling back to English`
        );
        list = await MajorQuestion.find({ language: "en" })
          .sort({ id: 1 })
          .lean();
        // Log that we're returning English instead of Arabic
        console.warn(
          `[API] WARNING: Returning ${
            list?.length || 0
          } English questions instead of Arabic`
        );
      }
    }

    console.log(
      `[API] Returning ${
        list?.length || 0
      } major questions for language: ${language} (requested: ${language})`
    );

    // Log the actual language of questions being returned
    if (list && list.length > 0) {
      const actualLang = list[0].language;
      if (actualLang !== language) {
        console.warn(
          `[API] WARNING: Returning questions in language '${actualLang}' but requested '${language}'`
        );
      }
    }

    res.json(
      (list || []).map((q) => ({
        id: q.id,
        category: q.category,
        topic: q.topic,
        question: q.question,
      }))
    );
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post(
  "/api/admin/major/questions/bulk",
  authMiddleware,
  async (req, res) => {
    try {
      const qs = req.body.questions;
      if (!Array.isArray(qs))
        return res.status(400).json({ error: "questions must be an array" });
      await MajorQuestion.deleteMany({});
      if (qs.length) {
        await MajorQuestion.insertMany(
          qs.map((q, idx) => ({
            id: parseInt(q.id ?? idx + 1),
            category: String(q.category || "General"),
            topic: q.topic ? String(q.topic) : null,
            question: String(q.question || q.text || ""),
          }))
        );
      }
      res.json({ ok: true, count: qs.length });
    } catch (e) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// TEMP DEBUG: Seed major questions from a local file
// Usage:
//   GET /api/debug/seed-major-questions
//   GET /api/debug/seed-major-questions?path=C:/full/path/to/Question%202.txt
app.get("/api/debug/seed-major-questions", async (req, res) => {
  try {
    res
      .status(410)
      .json({ error: "Deprecated. Use /api/admin/major/questions/bulk" });
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" });
  }
});

// Request logging middleware for major calculate
app.use("/api/major/calculate", (req, res, next) => {
  if (req.method === "POST") {
    const timestamp = new Date().toISOString();
    process.stdout.write(
      `\n\n[REQUEST] ${timestamp} - POST /api/major/calculate\n`
    );
    console.error(`[REQUEST] ${timestamp} - POST /api/major/calculate`);
    console.log(`[REQUEST] ${timestamp} - POST /api/major/calculate`);
  }
  next();
});

// Major calculation
app.post("/api/major/calculate", authMiddleware, async (req, res) => {
  // Use both console.log and console.error to ensure visibility
  // Also use process.stdout.write for immediate output
  process.stdout.write(
    "\n\n[MAJOR CALC] ========== STARTING MAJOR CALCULATION ==========\n"
  );
  console.error(
    "[MAJOR CALC] ========== STARTING MAJOR CALCULATION =========="
  );
  console.log(
    "\n\n[MAJOR CALC] ========== STARTING MAJOR CALCULATION =========="
  );
  process.stdout.write(`[MAJOR CALC] User ID: ${req.user.id}\n`);
  process.stdout.write(`[MAJOR CALC] Timestamp: ${new Date().toISOString()}\n`);
  console.log(`[MAJOR CALC] User ID: ${req.user.id}`);
  console.log(`[MAJOR CALC] Timestamp: ${new Date().toISOString()}`);
  try {
    // Block calculation until personality test is completed
    const latestCheck = await PersonalityResult.findOne({
      user_id: req.user.id,
    })
      .sort({ created_at: -1 })
      .lean();
    if (!latestCheck) {
      console.log("[MAJOR CALC] ERROR: Personality test required");
      return res.status(403).json({ error: "Personality test required" });
    }
    console.log(`[MAJOR CALC] Personality type found: ${latestCheck.type}`);

    // TEMPORARILY DISABLED FOR DEMO - Subscription check bypassed
    // TODO: Re-enable subscription check after demo
    // Whitelist: allow specific email without subscription
    // const isWhitelisted =
    //   String(req.user?.email || "").toLowerCase() === "ammarbadawi18@gmail.com";
    // if (!isWhitelisted) {
    //   // Check subscription status
    //   const subscription = await Subscription.findOne({
    //     user_id: req.user.id,
    //     status: { $in: ["active", "trialing"] },
    //   }).lean();
    //   if (!subscription) {
    //     return res
    //       .status(402)
    //       .json({ error: "Subscription required to access major test" });
    //   }
    // }

    const { answers } = req.body;
    console.log(
      `[MAJOR CALC] Received ${Object.keys(answers || {}).length} answers`
    );
    if (!answers || typeof answers !== "object") {
      console.log("[MAJOR CALC] ERROR: Invalid answers");
      return res.status(400).json({ error: "Invalid answers" });
    }
    const mapping = await MajorMapping.find({}).lean();
    console.log(`[MAJOR CALC] Database: ${MONGODB_URI}`);
    console.log(`[MAJOR CALC] Mapping entries loaded: ${mapping.length}`);
    if (mapping.length === 0)
      return res.status(400).json({ error: "Major mapping not loaded" });
    const majorsList = await Major.find({}).lean();
    console.log(`[MAJOR CALC] Majors loaded: ${majorsList.length}`);
    if (majorsList.length === 0)
      return res.status(400).json({ error: "Majors list not loaded" });

    // Check for duplicate Tourism/Hospitality entries in Business & Management
    const tourismInBusiness = mapping
      .filter(
        (m) =>
          m.major_name === "Tourism & Event Mgmt." ||
          m.major_name === "Hospitality Management"
      )
      .filter((m) => {
        // Check if it's from Business & Management category (would have Business-related traits)
        const businessTraits = [
          "business & economics",
          "accounting",
          "finance",
          "marketing",
        ];
        return businessTraits.some(
          (trait) =>
            m.option_value && m.option_value.toLowerCase().includes(trait)
        );
      });
    if (tourismInBusiness.length > 0) {
      console.log(
        `[MAJOR CALC] ⚠️  WARNING: Found ${tourismInBusiness.length} Tourism/Hospitality entries that might be duplicates from Business & Management`
      );
    }
    const tally = new Map();
    const scoreBreakdown = new Map(); // Track which traits contribute to which majors

    // Translation map: Arabic topic names -> English mapping values
    // This is needed because questions can be in Arabic but mapping is in English
    const topicTranslationMap = new Map([
      // Academic Strengths
      ["الرياضيات", "Mathematics"],
      ["الفيزياء", "Physics"],
      ["الكيمياء", "Chemistry"],
      ["الأحياء", "Biology"],
      ["البرمجة والمنطق", "Programming & Logic"],
      ["الكتابة والتواصل", "Writing & Communication"],
      ["القراءة والتحليل", "Reading & Analysis"],
      ["العلوم الاجتماعية", "Social Sciences"],
      ["التفكير البصري المكاني", "Visual-Spatial Thinking"],
      ["التصميم والإبداع", "Design & Creativity"],
      ["الأعمال والاقتصاد", "Business & Economics"],
      ["اللغات الأجنبية", "Foreign Languages"],
      ["القيادة والخطابة العامة", "Leadership & Public Speaking"],
      ["البحث والتحقيق", "Research & Investigation"],
      // Core Values
      ["الإبداع", "Creativity"],
      ["الاستقرار", "Stability"],
      ["مساعدة الآخرين", "Helping Others"],
      ["القيادة", "Leadership"],
      ["ال prestigio", "Prestige"], // Note: typo in Arabic file
      ["prestigio", "Prestige"], // Handle both
      ["التحدي الفكري", "Intellectual Challenge"],
      ["العمل الجماعي", "Teamwork"],
      ["الاستقلالية", "Independence"],
      ["الابتكار", "Innovation"],
      ["التأثير", "Impact"],
      ["الكفاءة والنظام", "Efficiency & Order"],
      ["التقدير الثقافي", "Cultural Appreciation"],
      ["الطبيعة والبيئة", "Nature & Environment"],
      ["المكافأة المالية", "Financial Reward"],
      // Categories (for fallback)
      ["القوة الأكاديمية", "Academic Strength"],
      ["القيمة الأساسية", "Core Value"],
    ]);

    // Function to translate Arabic topics to English
    const translateTopic = (topic) => {
      if (!topic) return topic;
      const normalized = String(topic).trim();
      // Check if it's already English (contains Latin characters)
      if (/[a-zA-Z]/.test(normalized)) {
        return normalized; // Already English
      }
      // Try to translate from Arabic
      return (
        topicTranslationMap.get(normalized) ||
        topicTranslationMap.get(normalized.toLowerCase()) ||
        topic
      );
    };

    // Calculate inverse frequency weighting: traits that appear in many majors get lower weight
    // This prevents generic traits (like "E", "Teamwork", "Leadership & Public Speaking") from dominating
    const traitFrequency = new Map(); // key: "category::value" -> Set of major names
    for (const r of mapping) {
      const key = `${String(r.category || "").toLowerCase()}::${String(
        r.option_value || ""
      ).toLowerCase()}`;
      if (!traitFrequency.has(key)) traitFrequency.set(key, new Set());
      traitFrequency.get(key).add(r.major_name);
    }
    const maxFrequency = Math.max(
      ...Array.from(traitFrequency.values()).map((s) => s.size),
      1
    );
    console.log(`[MAJOR CALC] Max trait frequency: ${maxFrequency}`);

    // Inverse frequency weight: rare traits get higher weight, common traits get lower weight
    // Very aggressive formula to heavily penalize very common traits and boost rare ones
    // Formula: weight = 0.15 + (1 - frequency/maxFrequency) * 1.5
    // This gives very common traits (appearing in many majors) weight of 0.15-0.3, rare traits weight up to 1.65
    // This significantly reduces the impact of generic traits like "E", "Teamwork", "Leadership & Public Speaking"
    // And boosts unique traits like "Programming & Logic" that strongly indicate specific majors
    const getInverseFrequencyWeight = (category, value) => {
      const key = `${String(category || "").toLowerCase()}::${String(
        value || ""
      ).toLowerCase()}`;
      const frequency = traitFrequency.get(key)?.size || 1;
      const normalizedFreq = frequency / maxFrequency;
      // Very aggressive: common traits get 0.15-0.3x weight, rare traits get up to 1.65x
      return 0.15 + (1 - normalizedFreq) * 1.5; // Range: 0.15 (very common) to 1.65 (very rare)
    };

    // Track strong positive signals for context-aware scoring
    const strongSignals = new Map(); // trait -> total positive weight
    const negativeSignals = new Map(); // trait -> total negative weight

    // Major-specific core trait multipliers
    // These traits are essential for these majors and should get extra weight
    const coreTraitMultipliers = new Map([
      // Computing majors: Programming & Logic is critical
      ["computer science & data", new Map([["programming & logic", 1.5]])],
      [
        "computer & communications eng.",
        new Map([["programming & logic", 1.5]]),
      ],
      ["computer engineering", new Map([["programming & logic", 1.4]])],
      ["information technology", new Map([["programming & logic", 1.4]])],
      ["software engineering", new Map([["programming & logic", 1.5]])],
      ["cybersecurity", new Map([["programming & logic", 1.4]])],
      ["animation & multimedia", new Map([["programming & logic", 1.3]])],
      // Engineering: Mathematics and Physics are important but Programming can offset negatives
      [
        "computer & communications eng.",
        new Map([
          ["programming & logic", 1.5],
          ["mathematics", 0.7],
        ]),
      ],
      [
        "computer engineering",
        new Map([
          ["programming & logic", 1.4],
          ["mathematics", 0.7],
        ]),
      ],
      // Business: Leadership and Business & Economics are core
      [
        "entrepreneurship & innovation",
        new Map([
          ["leadership", 1.3],
          ["business & economics", 1.2],
          ["programming & logic", 1.2],
        ]),
      ],
      [
        "business administration & mgmt.",
        new Map([
          ["leadership", 1.3],
          ["business & economics", 1.2],
        ]),
      ],
    ]);

    function addScoreForValue(rawVal, category, factor = 1) {
      const value = String(rawVal || "")
        .trim()
        .toLowerCase();
      const cat = String(category || "")
        .trim()
        .toLowerCase();
      if (!value) return;
      const f = Number.isFinite(factor) ? factor : 1;
      // Only process if factor is meaningful (not zero or NaN)
      if (!Number.isFinite(f) || f === 0) return;

      // Track strong signals for context-aware scoring
      if (f > 0) {
        strongSignals.set(value, (strongSignals.get(value) || 0) + f);
      } else if (f < 0) {
        negativeSignals.set(
          value,
          (negativeSignals.get(value) || 0) + Math.abs(f)
        );
      }

      // Apply inverse frequency weighting to reduce impact of common traits
      const rarityWeight = getInverseFrequencyWeight(cat, value);
      let adjustedFactor = f * rarityWeight;
      const traitFreq = traitFrequency.get(`${cat}::${value}`)?.size || 0;

      for (const r of mapping) {
        const rVal = String(r.option_value || "")
          .trim()
          .toLowerCase();
        const rCat = String(r.category || "")
          .trim()
          .toLowerCase();
        // Exact match on value, and category must match if provided
        if (rVal === value && (!cat || rCat === cat)) {
          const majorNameLower = String(r.major_name || "").toLowerCase();

          // Apply major-specific core trait multiplier
          let coreMultiplier = 1.0;
          const majorMultipliers = coreTraitMultipliers.get(majorNameLower);
          if (majorMultipliers) {
            const traitMultiplier = majorMultipliers.get(value);
            if (traitMultiplier) {
              coreMultiplier = traitMultiplier;
              // Only apply multiplier for positive signals
              if (f > 0) {
                adjustedFactor = f * rarityWeight * coreMultiplier;
              }
            }
          }

          const base = parseInt(r.score || 1) || 1;
          const currentScore = tally.get(r.major_name) || 0;
          const scoreDelta = base * adjustedFactor;
          const newScore = currentScore + scoreDelta;
          tally.set(r.major_name, newScore);

          // Track breakdown for debugging
          const majorName = r.major_name;
          if (!scoreBreakdown.has(majorName)) {
            scoreBreakdown.set(majorName, []);
          }
          scoreBreakdown.get(majorName).push({
            trait: value,
            category: cat,
            baseScore: base,
            likertFactor: f,
            rarityWeight: rarityWeight.toFixed(3),
            coreMultiplier:
              coreMultiplier !== 1.0 ? coreMultiplier.toFixed(2) : "1.00",
            traitFrequency: traitFreq,
            contribution: scoreDelta.toFixed(3),
          });
        }
      }
    }

    // Proxy question IDs that should also boost Teaching academic strength
    const teachingProxyIds = new Set([102, 107]);

    // Scores from major test answers
    // Signed Likert: positive boosts, negative reduces
    const likertWeight = {
      "strongly agree": 2,
      agree: 1,
      neutral: 0,
      disagree: -1,
      "strongly disagree": -2,
    };
    try {
      const list = await MajorQuestion.find({}).lean();
      const byId = new Map();
      (list || []).forEach((q) => byId.set(String(q.id), q));
      // Normalize per-topic so repeated topics don't overweight
      const topicCounts = new Map();
      (list || []).forEach((q) => {
        const key = `${String(q.category || "").toLowerCase()}::${String(
          q.topic || q.category || ""
        ).toLowerCase()}`;
        topicCounts.set(key, (topicCounts.get(key) || 0) + 1);
      });
      const MICRO_TRAIT_FACTOR = parseFloat(
        process.env.MICRO_TRAIT_FACTOR || "1"
      );

      Object.entries(answers).forEach(([qid, choice]) => {
        const q = byId.get(String(qid));
        if (!q) return;
        const w = likertWeight[String(choice).toLowerCase()] || 0;
        if (w !== 0) {
          const key = `${String(q.category || "").toLowerCase()}::${String(
            q.topic || q.category || ""
          ).toLowerCase()}`;
          const denom = topicCounts.get(key) || 1;
          const normalizedW = w / denom; // average contribution per topic
          // Prefer topic over category for more specific matching
          // Only use category as fallback if topic is not available
          let matchValue = q.topic ? q.topic : q.category;
          // Translate Arabic topics to English for mapping
          const translatedValue = translateTopic(matchValue);
          const translatedCategory = translateTopic(q.category);

          if (translatedValue !== matchValue) {
            console.log(
              `[MAJOR CALC] Q${qid}: Translated "${matchValue}" -> "${translatedValue}"`
            );
          }

          if (translatedValue) {
            console.log(
              `[MAJOR CALC] Q${qid}: "${q.question?.substring(
                0,
                50
              )}..." -> ${choice} (weight: ${w}, normalized: ${normalizedW.toFixed(
                3
              )}, matching: "${translatedValue}")`
            );
            addScoreForValue(translatedValue, translatedCategory, normalizedW);

            // Treat select Social questions as Teaching academic strength without changing the question bank
            if (teachingProxyIds.has(Number(qid))) {
              addScoreForValue("Teaching", "Academic Strength", normalizedW);
            }

            // Micro-trait signals (optional) boost specific behaviors
            if (Array.isArray(q.micro_traits) && q.micro_traits.length) {
              console.log(
                `[MAJOR CALC] Q${qid}: micro traits -> [${q.micro_traits
                  .map((t) => `"${String(t)}"`)
                  .join(", ")}] (factor: ${(
                  normalizedW * MICRO_TRAIT_FACTOR
                ).toFixed(3)})`
              );
              q.micro_traits.forEach((trait) => {
                const trimmedTrait = String(trait || "").trim();
                if (!trimmedTrait) return;
                addScoreForValue(
                  trimmedTrait,
                  "Micro Trait",
                  normalizedW * MICRO_TRAIT_FACTOR
                );
              });
            }
          }
        }
      });
    } catch (e) {}

    // Blend latest personality result for logged-in user if available
    try {
      const token =
        req.cookies.token ||
        (req.headers.authorization && req.headers.authorization.split(" ")[1]);
      if (token) {
        const { id } = jwt.verify(token, JWT_SECRET);
        const latest = await PersonalityResult.findOne({ user_id: id })
          .sort({ created_at: -1 })
          .lean();
        const type = latest?.type;
        if (type) {
          const four = String(type).split("-")[0];
          const letters = four.split("");
          console.log(
            `[MAJOR CALC] Adding personality type: ${type} (letters: ${letters.join(
              ", "
            )})`
          );
          const PERSONALITY_BLEND = 0.5; // reduce personality influence and avoid cross-category double counting
          letters.forEach((v) =>
            addScoreForValue(v, "Personality", PERSONALITY_BLEND)
          );
        }
      }
    } catch (e) {
      console.log(`[MAJOR CALC] Error processing questions: ${e.message}`);
    }

    // Post-processing: Mitigate negative scores for computing majors when core traits are strong
    // If user strongly agrees with Programming & Logic, reduce the impact of negative Mathematics/Physics
    // for computing-related majors
    const programmingStrength = strongSignals.get("programming & logic") || 0;
    if (programmingStrength > 1.0) {
      // User has strong positive signal for Programming & Logic
      const computingMajors = [
        "Computer Science & Data",
        "Computer & Communications Eng.",
        "Computer Engineering",
        "Information Technology",
        "Software Engineering",
        "Cybersecurity",
        "Animation & Multimedia",
      ];

      computingMajors.forEach((majorName) => {
        const currentScore = tally.get(majorName) || 0;
        if (currentScore > 0) {
          // Check if this major was hurt by negative Mathematics or Physics
          const mathNegative = negativeSignals.get("mathematics") || 0;
          const physicsNegative = negativeSignals.get("physics") || 0;

          // If Programming is strong (>= 1.5) and there are math/physics negatives, apply mitigation
          if (
            programmingStrength >= 1.5 &&
            (mathNegative > 0 || physicsNegative > 0)
          ) {
            // Reduce the impact of negatives by 40% for computing majors when Programming is very strong
            const mitigationFactor = 0.4;
            let mitigation = 0;

            // Find negative contributions from Mathematics and Physics for this major
            const breakdown = scoreBreakdown.get(majorName) || [];
            breakdown.forEach((item) => {
              if (
                (item.trait === "mathematics" || item.trait === "physics") &&
                parseFloat(item.contribution) < 0
              ) {
                mitigation +=
                  Math.abs(parseFloat(item.contribution)) * mitigationFactor;
              }
            });

            if (mitigation > 0) {
              const newScore = currentScore + mitigation;
              tally.set(majorName, newScore);
              console.log(
                `[MAJOR CALC] Applied negative mitigation for ${majorName}: +${mitigation.toFixed(
                  3
                )} (Programming strength: ${programmingStrength.toFixed(2)})`
              );
            }
          }
        }
      });
    }

    // Log detailed breakdown for top majors
    const enriched = majorsList.map((m) => ({
      name: m.name,
      match: tally.get(m.name) || 0,
      description: m.description,
      averageSalary: m.avg_salary,
      jobOutlook: m.job_outlook,
      workEnvironment: m.work_environment,
    }));
    enriched.sort((a, b) => b.match - a.match);
    const positives = enriched.filter((e) => e.match > 0);
    const top = (positives.length ? positives : enriched).slice(0, 10); // Show top 10 for debugging

    process.stdout.write("\n========== MAJOR SCORING BREAKDOWN ==========\n");
    console.error("\n========== MAJOR SCORING BREAKDOWN ==========");
    console.log("\n========== MAJOR SCORING BREAKDOWN ==========");
    top.forEach((major, idx) => {
      const msg = `\n#${idx + 1} ${major.name}: ${major.match.toFixed(
        3
      )} points`;
      process.stdout.write(msg + "\n");
      console.error(msg);
      console.log(
        `\n#${idx + 1} ${major.name}: ${major.match.toFixed(3)} points`
      );
      const breakdown = scoreBreakdown.get(major.name) || [];
      if (breakdown.length > 0) {
        // Group by trait and sum contributions
        const byTrait = new Map();
        breakdown.forEach((item) => {
          const key = `${item.category}::${item.trait}`;
          if (!byTrait.has(key)) {
            byTrait.set(key, {
              trait: item.trait,
              category: item.category,
              frequency: item.traitFrequency,
              rarityWeight: item.rarityWeight,
              coreMultiplier: item.coreMultiplier,
              totalContribution: 0,
            });
          }
          byTrait.get(key).totalContribution += parseFloat(item.contribution);
        });

        // Sort by contribution
        const sorted = Array.from(byTrait.values())
          .sort(
            (a, b) =>
              Math.abs(b.totalContribution) - Math.abs(a.totalContribution)
          )
          .slice(0, 10); // Top 10 contributing traits

        sorted.forEach((item) => {
          const coreMult =
            item.coreMultiplier && parseFloat(item.coreMultiplier) !== 1.0
              ? `, core: ${item.coreMultiplier}x`
              : "";
          console.log(
            `  - ${item.category}::"${item.trait}" (freq: ${
              item.frequency
            }, rarity: ${
              item.rarityWeight
            }x${coreMult}) -> +${item.totalContribution.toFixed(3)}`
          );
        });
      } else {
        console.log(`  (No matching traits found)`);
      }
    });
    process.stdout.write("==========================================\n\n");
    console.error("==========================================\n");
    console.log("==========================================\n");

    const top3 = top.slice(0, 3);
    const maxScore = top3[0]?.match > 0 ? top3[0].match : 1;
    const normalized = top3.map((e) => ({
      ...e,
      match: Math.max(0, Math.round((e.match / maxScore) * 100)),
    }));
    try {
      if (req.cookies.token) {
        const { id } = jwt.verify(req.cookies.token, JWT_SECRET);
        await MajorTest.create({ user_id: id, raw_answers: answers });
        console.log("[MAJOR CALC] Test results saved to database");
      }
    } catch (e) {
      console.log(`[MAJOR CALC] Error saving test: ${e.message}`);
    }

    console.log("\n[MAJOR CALC] Final top 3 results:");
    normalized.forEach((r, idx) => {
      console.log(`  ${idx + 1}. ${r.name}: ${r.match}%`);
    });
    console.log("[MAJOR CALC] ========== CALCULATION COMPLETE ==========\n\n");

    res.json({ results: normalized });
  } catch (e) {
    console.error("[MAJOR CALC] FATAL ERROR:", e);
    console.error("[MAJOR CALC] Stack:", e.stack);
    res.status(500).json({ error: "Server error" });
  }
});

// User profile endpoint
app.get("/api/profile", authMiddleware, async (req, res) => {
  try {
    console.log("Profile endpoint called for user:", req.user.id);
    const user = await User.findById(req.user.id).lean();
    console.log("User found:", user ? "Yes" : "No");
    if (!user) return res.status(404).json({ error: "User not found" });

    console.log("Fetching personality result...");
    // Get latest personality result
    const personalityResult = await PersonalityResult.findOne({
      user_id: req.user.id,
    })
      .sort({ created_at: -1 })
      .lean();
    console.log("Personality result found:", personalityResult ? "Yes" : "No");

    console.log("Fetching major test result...");
    // Get latest major test result
    const majorTest = await MajorTest.findOne({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .lean();
    console.log("Major test found:", majorTest ? "Yes" : "No");

    console.log("Fetching major mapping and majors...");
    // Get major mapping and majors for calculation
    const mapping = await MajorMapping.find({}).lean();
    const majorsList = await Major.find({}).lean();
    console.log("Major mapping count:", mapping.length);
    console.log("Majors list count:", majorsList.length);

    let majorResult = null;
    if (majorTest && majorTest.raw_answers) {
      try {
        console.log("Processing major test results...");
        console.log("Raw answers:", majorTest.raw_answers);

        // Calculate major scores from stored answers
        const tally = new Map();

        // Translation map: Arabic topic names -> English mapping values (same as calculate endpoint)
        const topicTranslationMap = new Map([
          ["الرياضيات", "Mathematics"],
          ["الفيزياء", "Physics"],
          ["الكيمياء", "Chemistry"],
          ["الأحياء", "Biology"],
          ["البرمجة والمنطق", "Programming & Logic"],
          ["الكتابة والتواصل", "Writing & Communication"],
          ["القراءة والتحليل", "Reading & Analysis"],
          ["العلوم الاجتماعية", "Social Sciences"],
          ["التفكير البصري المكاني", "Visual-Spatial Thinking"],
          ["التصميم والإبداع", "Design & Creativity"],
          ["الأعمال والاقتصاد", "Business & Economics"],
          ["اللغات الأجنبية", "Foreign Languages"],
          ["القيادة والخطابة العامة", "Leadership & Public Speaking"],
          ["البحث والتحقيق", "Research & Investigation"],
          ["الإبداع", "Creativity"],
          ["الاستقرار", "Stability"],
          ["مساعدة الآخرين", "Helping Others"],
          ["القيادة", "Leadership"],
          ["ال prestigio", "Prestige"],
          ["prestigio", "Prestige"],
          ["التحدي الفكري", "Intellectual Challenge"],
          ["العمل الجماعي", "Teamwork"],
          ["الاستقلالية", "Independence"],
          ["الابتكار", "Innovation"],
          ["التأثير", "Impact"],
          ["الكفاءة والنظام", "Efficiency & Order"],
          ["التقدير الثقافي", "Cultural Appreciation"],
          ["الطبيعة والبيئة", "Nature & Environment"],
          ["المكافأة المالية", "Financial Reward"],
          ["القوة الأكاديمية", "Academic Strength"],
          ["القيمة الأساسية", "Core Value"],
        ]);
        const translateTopic = (topic) => {
          if (!topic) return topic;
          const normalized = String(topic).trim();
          if (/[a-zA-Z]/.test(normalized)) return normalized;
          return (
            topicTranslationMap.get(normalized) ||
            topicTranslationMap.get(normalized.toLowerCase()) ||
            topic
          );
        };

        // Calculate inverse frequency weighting: traits that appear in many majors get lower weight
        const traitFrequency = new Map(); // key: "category::value" -> Set of major names
        for (const r of mapping) {
          const key = `${String(r.category || "").toLowerCase()}::${String(
            r.option_value || ""
          ).toLowerCase()}`;
          if (!traitFrequency.has(key)) traitFrequency.set(key, new Set());
          traitFrequency.get(key).add(r.major_name);
        }
        const maxFrequency = Math.max(
          ...Array.from(traitFrequency.values()).map((s) => s.size),
          1
        );

        // Inverse frequency weight: rare traits get higher weight, common traits get lower weight
        // Very aggressive formula to heavily penalize very common traits and boost rare ones
        const getInverseFrequencyWeight = (category, value) => {
          const key = `${String(category || "").toLowerCase()}::${String(
            value || ""
          ).toLowerCase()}`;
          const frequency = traitFrequency.get(key)?.size || 1;
          const normalizedFreq = frequency / maxFrequency;
          // Very aggressive: common traits get 0.15-0.3x weight, rare traits get up to 1.65x
          return 0.15 + (1 - normalizedFreq) * 1.5; // Range: 0.15 (very common) to 1.65 (very rare)
        };

        // Track strong positive signals for context-aware scoring
        const strongSignals = new Map(); // trait -> total positive weight
        const negativeSignals = new Map(); // trait -> total negative weight

        // Major-specific core trait multipliers (same as calculate endpoint)
        const coreTraitMultipliers = new Map([
          ["computer science & data", new Map([["programming & logic", 1.5]])],
          [
            "computer & communications eng.",
            new Map([["programming & logic", 1.5]]),
          ],
          ["computer engineering", new Map([["programming & logic", 1.4]])],
          ["information technology", new Map([["programming & logic", 1.4]])],
          ["software engineering", new Map([["programming & logic", 1.5]])],
          ["cybersecurity", new Map([["programming & logic", 1.4]])],
          ["animation & multimedia", new Map([["programming & logic", 1.3]])],
          [
            "computer & communications eng.",
            new Map([
              ["programming & logic", 1.5],
              ["mathematics", 0.7],
            ]),
          ],
          [
            "computer engineering",
            new Map([
              ["programming & logic", 1.4],
              ["mathematics", 0.7],
            ]),
          ],
          [
            "entrepreneurship & innovation",
            new Map([
              ["leadership", 1.3],
              ["business & economics", 1.2],
              ["programming & logic", 1.2],
            ]),
          ],
          [
            "business administration & mgmt.",
            new Map([
              ["leadership", 1.3],
              ["business & economics", 1.2],
            ]),
          ],
        ]);

        function addScoreForValue(rawVal, category, factor = 1) {
          const value = String(rawVal || "")
            .trim()
            .toLowerCase();
          const cat = String(category || "")
            .trim()
            .toLowerCase();
          if (!value) return;
          const f = Number.isFinite(factor) ? factor : 1;
          // Only process if factor is meaningful (not zero or NaN)
          if (!Number.isFinite(f) || f === 0) return;

          // Track strong signals for context-aware scoring
          if (f > 0) {
            strongSignals.set(value, (strongSignals.get(value) || 0) + f);
          } else if (f < 0) {
            negativeSignals.set(
              value,
              (negativeSignals.get(value) || 0) + Math.abs(f)
            );
          }

          // Apply inverse frequency weighting to reduce impact of common traits
          const rarityWeight = getInverseFrequencyWeight(cat, value);
          let adjustedFactor = f * rarityWeight;

          for (const r of mapping) {
            const rVal = String(r.option_value || "")
              .trim()
              .toLowerCase();
            const rCat = String(r.category || "")
              .trim()
              .toLowerCase();
            // Exact match on value, and category must match if provided
            if (rVal === value && (!cat || rCat === cat)) {
              const majorNameLower = String(r.major_name || "").toLowerCase();

              // Apply major-specific core trait multiplier
              let coreMultiplier = 1.0;
              const majorMultipliers = coreTraitMultipliers.get(majorNameLower);
              if (majorMultipliers) {
                const traitMultiplier = majorMultipliers.get(value);
                if (traitMultiplier) {
                  coreMultiplier = traitMultiplier;
                  // Only apply multiplier for positive signals
                  if (f > 0) {
                    adjustedFactor = f * rarityWeight * coreMultiplier;
                  }
                }
              }

              const base = parseInt(r.score || 1) || 1;
              const currentScore = tally.get(r.major_name) || 0;
              const newScore = currentScore + base * adjustedFactor;
              tally.set(r.major_name, newScore);
            }
          }
        }

        // Process stored answers using the same logic as the calculate endpoint
        const likertWeight = {
          "strongly agree": 2,
          agree: 1,
          neutral: 0,
          disagree: -1,
          "strongly disagree": -2,
        };
        const questions = await MajorQuestion.find({}).lean();
        const byId = new Map();
        (questions || []).forEach((q) => byId.set(String(q.id), q));

        // Normalize per-topic so repeated topics don't overweight
        const topicCounts = new Map();
        (questions || []).forEach((q) => {
          const key = `${String(q.category || "").toLowerCase()}::${String(
            q.topic || q.category || ""
          ).toLowerCase()}`;
          topicCounts.set(key, (topicCounts.get(key) || 0) + 1);
        });

        Object.entries(majorTest.raw_answers).forEach(([qid, choice]) => {
          const q = byId.get(String(qid));
          if (!q) return;
          const w = likertWeight[String(choice).toLowerCase()] || 0;
          if (w !== 0) {
            const key = `${String(q.category || "").toLowerCase()}::${String(
              q.topic || q.category || ""
            ).toLowerCase()}`;
            const denom = topicCounts.get(key) || 1;
            const normalizedW = w / denom; // average contribution per topic
            // Prefer topic over category for more specific matching
            // Only use category as fallback if topic is not available
            let matchValue = q.topic ? q.topic : q.category;
            // Translate Arabic topics to English for mapping
            const translatedValue = translateTopic(matchValue);
            const translatedCategory = translateTopic(q.category);
            if (translatedValue) {
              addScoreForValue(
                translatedValue,
                translatedCategory,
                normalizedW
              );
            }
          }
        });

        // Blend latest personality result for logged-in user if available
        try {
          const latest = await PersonalityResult.findOne({
            user_id: req.user.id,
          })
            .sort({ created_at: -1 })
            .lean();
          const type = latest?.type;
          if (type) {
            const four = String(type).split("-")[0];
            const letters = four.split("");
            const PERSONALITY_BLEND = 0.5; // reduce personality influence and avoid cross-category double counting
            letters.forEach((v) =>
              addScoreForValue(v, "Personality", PERSONALITY_BLEND)
            );
          }
        } catch (e) {}

        // Post-processing: Mitigate negative scores for computing majors when core traits are strong
        // (Simplified version for profile endpoint - no detailed breakdown tracking)
        const programmingStrength =
          strongSignals.get("programming & logic") || 0;
        if (programmingStrength > 1.0) {
          const computingMajors = [
            "Computer Science & Data",
            "Computer & Communications Eng.",
            "Computer Engineering",
            "Information Technology",
            "Software Engineering",
            "Cybersecurity",
            "Animation & Multimedia",
          ];

          computingMajors.forEach((majorName) => {
            const currentScore = tally.get(majorName) || 0;
            if (currentScore > 0) {
              const mathNegative = negativeSignals.get("mathematics") || 0;
              const physicsNegative = negativeSignals.get("physics") || 0;

              if (
                programmingStrength >= 1.5 &&
                (mathNegative > 0 || physicsNegative > 0)
              ) {
                // Estimate mitigation: reduce negative impact by 30% when Programming is very strong
                const estimatedNegativeImpact =
                  (mathNegative + physicsNegative) * 0.3;
                if (estimatedNegativeImpact > 0) {
                  const newScore = currentScore + estimatedNegativeImpact;
                  tally.set(majorName, newScore);
                }
              }
            }
          });
        }

        // Get top majors
        const enriched = majorsList.map((m) => ({
          name: m.name,
          match: tally.get(m.name) || 0,
          description: m.description,
          averageSalary: m.avg_salary,
          jobOutlook: m.job_outlook,
          workEnvironment: m.work_environment,
        }));
        enriched.sort((a, b) => b.match - a.match);
        const positives = enriched.filter((e) => e.match > 0);
        const top = (positives.length ? positives : enriched).slice(0, 3);
        const maxScore = top[0]?.match > 0 ? top[0].match : 1;
        const normalized = top.map((e) => ({
          ...e,
          score: Math.max(0, Math.round((e.match / maxScore) * 100)),
          career_paths: ["Various career opportunities"], // Default career paths
        }));

        majorResult = {
          top_majors: normalized,
          created_at: majorTest.created_at,
        };
        console.log("Major result processing completed successfully");
        console.log("Major result:", majorResult);
      } catch (majorError) {
        console.error("Error processing major results:", majorError);
        console.error("Major error stack:", majorError.stack);
        // Continue without major results rather than failing completely
        majorResult = null;
      }
    }

    // Format personality result
    let formattedPersonalityResult = null;
    if (personalityResult) {
      // Load personality cache if needed
      if (!Object.keys(personalitiesCache).length) await loadPersonalityCache();

      const personalityData = personalitiesCache[personalityResult.type];
      formattedPersonalityResult = {
        type: personalityResult.type,
        description: personalityData?.content || "No description available",
        strengths: [], // These fields don't exist in current schema
        weaknesses: [], // These fields don't exist in current schema
        famous_matches: [], // These fields don't exist in current schema
        created_at: personalityResult.created_at,
      };
    }

    res.json({
      user: {
        id: user._id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        created_at: user.created_at,
        last_login: user.last_login || user.created_at,
      },
      personality_result: formattedPersonalityResult,
      major_result: majorResult,
      has_personality_test: !!personalityResult,
      has_major_test: !!majorTest,
    });
  } catch (e) {
    console.error("Profile fetch error:", e);
    console.error("Error stack:", e.stack);
    res
      .status(500)
      .json({ error: "Failed to fetch profile data", details: e.message });
  }
});

// Helper: build major-test/personality context for AI grounding
function sanitizeContextSnapshot(input) {
  if (!input || typeof input !== "object") return null;
  const safe = {};

  if (
    input.personality &&
    typeof input.personality === "object" &&
    typeof input.personality.type === "string"
  ) {
    safe.personality = {
      type: String(input.personality.type).slice(0, 32),
      description:
        typeof input.personality.description === "string"
          ? String(input.personality.description).slice(0, 2000)
          : undefined,
    };
  }

  if (Array.isArray(input.topMajors)) {
    const mapped = input.topMajors
      .map((item) => {
        if (!item || typeof item !== "object" || !item.name) return null;
        return {
          name: String(item.name).slice(0, 200),
          match: Number.isFinite(Number(item.match))
            ? Math.max(0, Math.min(100, parseInt(item.match, 10)))
            : undefined,
          description:
            typeof item.description === "string"
              ? String(item.description).slice(0, 2000)
              : undefined,
        };
      })
      .filter(Boolean)
      .slice(0, 5);
    if (mapped.length) safe.topMajors = mapped;
  }

  if (Array.isArray(input.majorAnswers)) {
    const answers = input.majorAnswers
      .map((ans) => {
        if (!ans || typeof ans !== "object") return null;
        return {
          id: Number.isFinite(Number(ans.id)) ? Number(ans.id) : undefined,
          category: ans.category ? String(ans.category).slice(0, 120) : null,
          topic: ans.topic ? String(ans.topic).slice(0, 120) : null,
          question: ans.question ? String(ans.question).slice(0, 400) : null,
          choice: ans.choice ? String(ans.choice).slice(0, 120) : null,
        };
      })
      .filter(Boolean)
      .slice(0, 50);
    if (answers.length) safe.majorAnswers = answers;
  }

  if (Number.isFinite(Number(input.answeredCount))) {
    safe.answeredCount = Number(input.answeredCount);
  }

  if (!Object.keys(safe).length) return null;
  safe.source =
    typeof input.source === "string"
      ? String(input.source).slice(0, 64)
      : "client";
  safe.collected_at = new Date().toISOString();
  return safe;
}

function mergeContextSources(serverContext, clientContext) {
  if (serverContext && clientContext) {
    return {
      ...serverContext,
      personality: clientContext.personality || serverContext.personality,
      clientSnapshot: clientContext,
    };
  }
  return serverContext || clientContext || null;
}

async function buildMajorAiContext(userId) {
  try {
    // Latest major test answers
    const latestTest = await MajorTest.findOne({ user_id: userId })
      .sort({ created_at: -1 })
      .lean();
    if (!latestTest || !latestTest.raw_answers) {
      return null;
    }
    const rawAnswers = latestTest.raw_answers || {};

    // Load dependencies
    const [mapping, majorsList, questions, latestPersonality] =
      await Promise.all([
        MajorMapping.find({}).lean(),
        Major.find({}).lean(),
        MajorQuestion.find({}).lean(),
        PersonalityResult.findOne({ user_id: userId })
          .sort({ created_at: -1 })
          .lean()
          .catch(() => null),
      ]);
    if (
      !Array.isArray(mapping) ||
      mapping.length === 0 ||
      !Array.isArray(majorsList) ||
      majorsList.length === 0
    ) {
      return {
        note: "Mapping or majors list not loaded",
        personality: latestPersonality?.type || null,
      };
    }

    // Index mapping by category+option
    const idx = new Map();
    for (const r of mapping) {
      const key = `${String(r.category || "").toLowerCase()}::${String(
        r.option_value || ""
      ).toLowerCase()}`;
      if (!idx.has(key)) idx.set(key, []);
      idx.get(key).push(r);
    }

    const byId = new Map();
    (questions || []).forEach((q) => byId.set(String(q.id), q));
    const topicCounts = new Map();
    (questions || []).forEach((q) => {
      const cat = String(q.category || "").toLowerCase();
      const topic = String(q.topic || q.category || "").toLowerCase();
      const key = `${cat}::${topic}`;
      topicCounts.set(key, (topicCounts.get(key) || 0) + 1);
    });

    const likertWeight = {
      "strongly agree": 2,
      agree: 1,
      neutral: 0,
      disagree: -1,
      "strongly disagree": -2,
    };
    const tallies = new Map(); // major_name -> score
    const contribs = new Map(); // major_name -> [ {category, topic, delta} ]
    function add(majorName, delta, category, topic) {
      if (!Number.isFinite(delta) || delta === 0) return;
      tallies.set(majorName, (tallies.get(majorName) || 0) + delta);
      if (!contribs.has(majorName)) contribs.set(majorName, []);
      contribs.get(majorName).push({ category, topic, impact: delta });
    }

    // From major answers
    for (const [qid, choice] of Object.entries(rawAnswers)) {
      const q = byId.get(String(qid));
      if (!q) continue;
      const w = likertWeight[String(choice).toLowerCase()] || 0;
      if (w === 0) continue;
      const cat = String(q.category || "").toLowerCase();
      const topic = String(q.topic || q.category || "").toLowerCase();
      const denom = topicCounts.get(`${cat}::${topic}`) || 1;
      const normalizedW = w / denom;
      const key = `${cat}::${topic}`;
      const rows = idx.get(key) || [];
      for (const r of rows) {
        const base = parseInt(r.score || 1) || 1;
        const delta = base * normalizedW;
        add(r.major_name, delta, r.category, q.topic || q.category || "");
      }
    }

    // Build full QA list for model grounding
    const majorAnswers = Object.entries(rawAnswers).map(([qid, choice]) => {
      const q = byId.get(String(qid));
      return {
        id: q ? q.id : Number(qid),
        category: q ? q.category : null,
        topic: q ? q.topic || q.category || null : null,
        question: q ? q.question : null,
        choice: String(choice),
      };
    });

    // Personality blend (same as /api/major/calculate)
    let personalityType = latestPersonality?.type || null;
    if (personalityType) {
      const PERSONALITY_BLEND = 0.5;
      const letters = String(personalityType).split("-")[0].split("");
      for (const letter of letters) {
        const key = `personality::${String(letter).toLowerCase()}`;
        const rows = idx.get(key) || [];
        for (const r of rows) {
          const base = parseInt(r.score || 1) || 1;
          const delta = base * PERSONALITY_BLEND;
          add(r.major_name, delta, "Personality", letter);
        }
      }
    }

    const enriched = majorsList.map((m) => ({
      name: m.name,
      score: tallies.get(m.name) || 0,
      description: m.description,
    }));
    enriched.sort((a, b) => b.score - a.score);
    const positives = enriched.filter((e) => e.score > 0);
    const top = (positives.length ? positives : enriched).slice(0, 3);
    const maxScore = top[0]?.score > 0 ? top[0].score : 1;
    const normalizedTop = top.map((e) => ({
      name: e.name,
      match: Math.max(0, Math.round((e.score / maxScore) * 100)),
      description: e.description,
    }));

    function summarizeReasons(majorName) {
      const list = contribs.get(majorName) || [];
      const byKey = new Map();
      for (const c of list) {
        const key = `${String(c.category || "").toLowerCase()}::${String(
          c.topic || ""
        ).toLowerCase()}`;
        byKey.set(key, (byKey.get(key) || 0) + c.impact);
      }
      const arr = Array.from(byKey.entries())
        .map(([key, impact]) => {
          const [category, topic] = key.split("::");
          return { category, topic, impact };
        })
        .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
      return arr.slice(0, 8);
    }

    // Optionally include a short personality description snippet
    let personalitySnippet = null;
    try {
      if (
        personalityType &&
        personalitiesCache[personalityType] &&
        personalitiesCache[personalityType].content
      ) {
        const raw = String(personalitiesCache[personalityType].content);
        personalitySnippet = raw.slice(0, 700);
      }
    } catch (_) {}

    return {
      personality: { type: personalityType, snippet: personalitySnippet },
      topMajors: normalizedTop.map((t) => ({
        name: t.name,
        match: t.match,
        reasons: summarizeReasons(t.name),
      })),
      answeredCount: Object.keys(rawAnswers || {}).length,
      majorAnswers,
    };
  } catch (e) {
    return null;
  }
}

// OpenAI Chat endpoint
app.post("/api/chat", authMiddleware, async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res
        .status(500)
        .json({ error: "Server not configured: missing OPENAI_API_KEY" });
    }

    const body = req.body || {};
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    const single = body.message ? String(body.message) : "";
    const temperatureRaw = Number(body.temperature);
    const model = String(body.model || "").trim() || "gpt-4o-mini";
    const temperature = Number.isFinite(temperatureRaw)
      ? Math.min(Math.max(temperatureRaw, 0), 2)
      : 0.7;
    const requestedConversationId = body.conversationId
      ? String(body.conversationId)
      : null;
    const requestedTitle =
      typeof body.conversationTitle === "string"
        ? body.conversationTitle.trim()
        : "";

    const userMessages = rawMessages.length
      ? rawMessages
      : single
      ? [{ role: "user", content: single }]
      : [];
    if (!userMessages.length) {
      return res.status(400).json({ error: "messages or message is required" });
    }

    const history = await getOrCreateChatHistory(req.user.id);
    let conversation = requestedConversationId
      ? findConversationById(history, requestedConversationId)
      : null;
    if (!conversation) {
      conversation = history.conversations[0];
    }
    if (!conversation) {
      const fallback = createEmptyConversation(
        requestedTitle || DEFAULT_CHAT_TITLE
      );
      history.conversations.unshift(fallback);
      conversation = history.conversations[0];
    }

    const sanitizedConversationMessages =
      sanitizeIncomingMessages(userMessages);
    if (sanitizedConversationMessages.length) {
      conversation.messages = sanitizedConversationMessages;
    } else if (!Array.isArray(conversation.messages)) {
      conversation.messages = [];
    }

    // Lightweight domain-specific system instruction
    let systemContent =
      "You are Major Match AI, a helpful assistant for students exploring majors and careers. Your role is to explain and explore connections, not to justify or defend recommendations. When users ask about their major match, help them understand how their test responses connect to the major. Focus on explaining the connections between their answers and the major's characteristics. Be educational, exploratory, and supportive. Prioritize their specific major test results over personality test results. Always reference their actual test answers, categories, and topics that contributed to the match. Be specific, avoid generic statements, and format every response using clean HTML (use <p>, <strong>, <em>, <ul>, <ol>, <li>, <code>, and <br /> as needed). Never return Markdown.";

    // Build latest test/personality context for grounding
    const providedContext = sanitizeContextSnapshot(body.contextSnapshot);
    const serverContext = await buildMajorAiContext(req.user.id);
    const majorContext = mergeContextSources(serverContext, providedContext);
    const contextMessage = majorContext
      ? {
          role: "system",
          content: `User's test results context (JSON): ${JSON.stringify(
            majorContext
          )}. 

IMPORTANT INSTRUCTIONS FOR EXPLANATORY RESPONSES:
- Your goal is to help the user understand and explore connections, not to justify the recommendation
- Explain how their test responses connect to the major's characteristics and requirements
- ALWAYS prioritize major test results over personality when explaining connections
- Reference specific categories and topics from the "reasons" array, ordered by impact (highest impact first)
- Show how their actual answers (from majorAnswers) relate to what the major involves
- Include personality type as supporting context, but make major test results the primary focus
- Use exploratory language: "Your responses show...", "This connects to...", "You indicated interest in..."
- Avoid defensive language: don't say "this proves" or "this justifies" - instead say "this suggests" or "this indicates"
- Be specific: cite exact categories, topics, and the user's responses that show the connection
- Help them understand what the major involves and how their answers align with it
- Format the final response using semantic HTML (paragraphs, strong/emphasis tags, lists, line breaks). Never return Markdown.`,
        }
      : null;

    let focusInstruction = null;
    if (majorContext && Array.isArray(majorContext.topMajors)) {
      const latestUserMessage = [...userMessages]
        .reverse()
        .find((m) => String(m.role).toLowerCase() === "user");
      if (latestUserMessage && latestUserMessage.content) {
        const normalizedContent = String(
          latestUserMessage.content
        ).toLowerCase();
        // Enhanced "why" detection - catch more variations
        const askedWhy =
          (normalizedContent.includes("why") ||
            normalizedContent.includes("explain") ||
            normalizedContent.includes("reason")) &&
          (normalizedContent.includes("major") ||
            normalizedContent.includes("recommend") ||
            normalizedContent.includes("match") ||
            normalizedContent.includes("get") ||
            normalizedContent.includes("this") ||
            normalizedContent.includes("that"));

        if (askedWhy) {
          // Try to find mentioned major by name
          let mentioned = majorContext.topMajors.find((m) => {
            const majorNameLower = String(m.name || "").toLowerCase();
            return normalizedContent.includes(majorNameLower);
          });

          // If no specific major mentioned, use the top match
          if (!mentioned && majorContext.topMajors.length > 0) {
            mentioned = majorContext.topMajors[0];
          }

          if (mentioned && mentioned.reasons && mentioned.reasons.length > 0) {
            // Get relevant user answers for the top contributing categories/topics
            const topReasons = mentioned.reasons.slice(0, 5); // Top 5 reasons
            const relevantAnswers = majorContext.majorAnswers
              ? majorContext.majorAnswers.filter((ans) => {
                  return topReasons.some((reason) => {
                    const reasonCat = String(
                      reason.category || ""
                    ).toLowerCase();
                    const reasonTopic = String(
                      reason.topic || ""
                    ).toLowerCase();
                    const ansCat = String(ans.category || "").toLowerCase();
                    const ansTopic = String(ans.topic || "").toLowerCase();
                    return (
                      ansCat === reasonCat ||
                      ansTopic === reasonTopic ||
                      ansCat.includes(reasonCat) ||
                      ansTopic.includes(reasonTopic)
                    );
                  });
                })
              : [];

            // Build detailed explanation instruction
            const reasonsText = topReasons
              .map((r, idx) => {
                const impactDesc =
                  r.impact > 0 ? "strongly contributed" : "contributed";
                return `${idx + 1}. ${r.category || "General"} - ${
                  r.topic || "N/A"
                } (${impactDesc} with impact: ${r.impact.toFixed(2)})`;
              })
              .join("\n");

            const answersText =
              relevantAnswers.length > 0
                ? relevantAnswers
                    .slice(0, 8)
                    .map((ans) => {
                      return `- Question: "${
                        ans.question || "N/A"
                      }" → You answered: "${ans.choice}" (Category: ${
                        ans.category || "N/A"
                      }, Topic: ${ans.topic || "N/A"})`;
                    })
                    .join("\n")
                : "No specific matching answers found";

            focusInstruction = {
              role: "system",
              content: `The user wants to understand how their test responses connect to "${
                mentioned.name
              }" (${mentioned.match}% match).

EXPLORE AND EXPLAIN (Major Test Results - PRIMARY FOCUS):
The key connections from their major test are:
${reasonsText}

Their relevant answers that show these connections:
${answersText}

SUPPORTING CONTEXT (Personality - Mention as additional insight):
Personality Type: ${majorContext.personality?.type || "Not available"}
${
  majorContext.personality?.snippet
    ? `\nPersonality traits: ${majorContext.personality.snippet.substring(
        0,
        300
      )}...`
    : ""
}

RESPONSE APPROACH - EXPLANATORY AND EXPLORATORY:
1. Start by exploring the connections: "Your test responses show strong alignment with ${
                mentioned.name
              } in several areas..."
2. Explain what the major involves and how their answers connect to those aspects
3. Use the top 3-4 categories/topics from the reasons list to show specific connections
4. Reference specific questions and answers to illustrate the connections: "When you indicated [answer], this connects to [major aspect] because..."
5. Help them understand: "This suggests you have interest/aptitude in [area], which is central to ${
                mentioned.name
              }"
6. Mention personality type as additional insight, but keep major test results as the main focus
7. Use exploratory language: "Your responses indicate...", "This aligns with...", "You showed interest in..."
8. Avoid defensive or justificatory language - focus on helping them understand and explore
9. Keep explanations grounded in their actual data, not generic statements
10. Format using clean HTML elements (<p>, <strong>, <em>, <ul>, <li>, <code>, <br />) and never return Markdown`,
            };
          }
        }
      }
    }

    const messages = [
      { role: "system", content: systemContent },
      ...(contextMessage ? [contextMessage] : []),
      ...(focusInstruction ? [focusInstruction] : []),
      ...userMessages.map((m) => ({
        role: String(m.role || "user"),
        content: String(m.content || ""),
      })),
    ];

    const resp = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model,
        messages,
        temperature,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const text =
      resp.data &&
      resp.data.choices &&
      resp.data.choices[0] &&
      resp.data.choices[0].message &&
      resp.data.choices[0].message.content
        ? String(resp.data.choices[0].message.content).trim()
        : "";

    const assistantMessage = {
      role: "assistant",
      content: text || "...",
      created_at: new Date(),
    };
    conversation.messages.push(assistantMessage);
    conversation.updated_at = new Date();
    history.updated_at = new Date();
    await history.save();

    const formattedConversation = formatConversationResponse(conversation);
    return res.json({
      reply: text,
      conversationId: formattedConversation?.id,
      conversation: formattedConversation,
    });
  } catch (e) {
    const status = e.response && e.response.status ? e.response.status : 500;
    const detail =
      e.response &&
      e.response.data &&
      (e.response.data.error || e.response.data)
        ? e.response.data
        : { error: "Server error" };
    return res
      .status(status >= 400 && status < 600 ? status : 500)
      .json(detail);
  }
});

// Get chat history endpoint (conversations + active thread)
app.get("/api/chat/history", authMiddleware, async (req, res) => {
  try {
    const requestedConversationId = req.query.conversationId
      ? String(req.query.conversationId)
      : null;
    const history = await getOrCreateChatHistory(req.user.id);
    const conversations = Array.isArray(history.conversations)
      ? [...history.conversations].sort(
          (a, b) =>
            new Date(b.updated_at || 0).getTime() -
            new Date(a.updated_at || 0).getTime()
        )
      : [];
    const summaries = conversations
      .map((conv) => summarizeConversation(conv))
      .filter(Boolean);

    let activeConversation =
      conversations.find(
        (conv) =>
          requestedConversationId &&
          conv._id &&
          conv._id.toString() === requestedConversationId
      ) ||
      conversations[0] ||
      null;

    return res.json({
      conversations: summaries,
      activeConversation: activeConversation
        ? formatConversationResponse(activeConversation)
        : null,
    });
  } catch (e) {
    console.error("Failed to load chat history:", e);
    return res.status(500).json({ error: "Failed to load chat history" });
  }
});

// Create a new conversation
app.post("/api/chat/conversations", authMiddleware, async (req, res) => {
  try {
    const title =
      typeof req.body?.title === "string" && req.body.title.trim().length
        ? req.body.title.trim()
        : DEFAULT_CHAT_TITLE;
    const history = await getOrCreateChatHistory(req.user.id);
    const newConversation = createEmptyConversation(title);
    history.conversations.unshift(newConversation);
    history.updated_at = new Date();
    await history.save();

    return res.json({
      conversation: formatConversationResponse(newConversation),
    });
  } catch (e) {
    console.error("Failed to create conversation:", e);
    return res.status(500).json({ error: "Failed to create conversation" });
  }
});

// Rename conversation
app.patch(
  "/api/chat/conversations/:conversationId",
  authMiddleware,
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const title =
        typeof req.body?.title === "string" && req.body.title.trim().length
          ? req.body.title.trim()
          : DEFAULT_CHAT_TITLE;
      const history = await getOrCreateChatHistory(req.user.id);
      const conversation = findConversationById(history, conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      conversation.title = title;
      conversation.updated_at = new Date();
      history.updated_at = new Date();
      await history.save();

      return res.json({
        conversation: formatConversationResponse(conversation),
      });
    } catch (e) {
      console.error("Failed to rename conversation:", e);
      return res.status(500).json({ error: "Failed to rename conversation" });
    }
  }
);

// Delete conversation
app.delete(
  "/api/chat/conversations/:conversationId",
  authMiddleware,
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const history = await getOrCreateChatHistory(req.user.id);
      const beforeLength = history.conversations.length;
      history.conversations = history.conversations.filter(
        (conv) => !conv._id || conv._id.toString() !== conversationId
      );
      if (history.conversations.length === beforeLength) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      if (!history.conversations.length) {
        history.conversations.push(createEmptyConversation());
      }
      history.updated_at = new Date();
      history.markModified("conversations");
      await history.save();

      return res.json({ success: true });
    } catch (e) {
      console.error("Failed to delete conversation:", e);
      return res.status(500).json({ error: "Failed to delete conversation" });
    }
  }
);

// Save chat history endpoint (manual save to a conversation)
app.post("/api/chat/history", authMiddleware, async (req, res) => {
  try {
    const { messages, conversationId } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be an array" });
    }

    const history = await getOrCreateChatHistory(req.user.id);
    let conversation = conversationId
      ? history.conversations.id(String(conversationId))
      : history.conversations[0];
    if (!conversation) {
      const fallback = createEmptyConversation();
      history.conversations.unshift(fallback);
      conversation = history.conversations[0];
    }

    const sanitizedMessages = sanitizeIncomingMessages(messages);
    conversation.messages = sanitizedMessages;
    conversation.updated_at = new Date();
    history.updated_at = new Date();
    await history.save();

    return res.json({
      success: true,
      conversation: formatConversationResponse(conversation),
    });
  } catch (e) {
    console.error("Failed to save chat history:", e);
    return res.status(500).json({ error: "Failed to save chat history" });
  }
});

// Start
// Start server and perform seeding when Mongo is connected
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  if (req.path.startsWith("/static/")) return next();
  if (req.path.includes(".")) return next();
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(
    `📝 Logging is ACTIVE - check this terminal for [MAJOR CALC] logs`
  );
  console.log(`========================================\n`);
  process.stdout.write(`\n🚀 Server started on port ${PORT}\n`);
  process.stdout.write(`📝 All [MAJOR CALC] logs will appear here\n\n`);
});

// Test endpoint to verify logging works
app.get("/api/test-logging", (req, res) => {
  console.log("[TEST] Logging test endpoint called");
  process.stdout.write("[TEST] STDOUT test\n");
  console.error("[TEST] STDERR test");
  res.json({
    message: "Check server console for test logs",
    timestamp: new Date().toISOString(),
  });
});

if (mongoose.connection) {
  mongoose.connection.once("open", async () => {
    try {
      await ensurePersonalitySeedMongo();
      await ensureMajorSeedMongo();
      await loadPersonalityCache();
      console.log("Initial seed and cache load completed after DB open");
    } catch (e) {
      console.warn("Post-connection seed/cache failed:", e.message);
    }
  });
}
