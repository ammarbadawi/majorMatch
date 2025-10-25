const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();
const nodemailer = require('nodemailer');
const axios = require('axios');
// Initialize Stripe only if API key is provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_secret_key_here') {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    console.log('✅ Stripe initialized successfully');
} else {
    console.warn('⚠️  Stripe not initialized - STRIPE_SECRET_KEY not configured');
    console.log('   To enable payments, add your Stripe secret key to .env file');
}

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/major_match';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Major Match <no-reply@majormatch.local>';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
// Whish Money config
const WHISH_ACCOUNT_NAME = process.env.WHISH_ACCOUNT_NAME || 'Whish Money';
const WHISH_ACCOUNT_NUMBER = process.env.WHISH_ACCOUNT_NUMBER || '0000000000';
const WHISH_AMOUNT_CENTS = parseInt(process.env.WHISH_AMOUNT_CENTS || '1499');
const WHISH_CURRENCY = (process.env.WHISH_CURRENCY || 'USD').toUpperCase();
const WHISH_INSTRUCTIONS = process.env.WHISH_INSTRUCTIONS || 'Send the exact amount and keep your transaction reference. Verification may take up to 24 hours.';

// Email (nodemailer) setup
let mailer = null;
(async () => {
    try {
        if (process.env.SMTP_HOST) {
            mailer = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
                auth: (process.env.SMTP_USER && process.env.SMTP_PASS) ? {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                } : undefined,
                logger: String(process.env.SMTP_DEBUG || '').toLowerCase() === 'true',
                debug: String(process.env.SMTP_DEBUG || '').toLowerCase() === 'true'
            });
        } else {
            // Dev fallback: write emails to buffer/console
            mailer = nodemailer.createTransport({ streamTransport: true, newline: 'unix', buffer: true });
            console.log('Email transport using stream (dev)');
        }
        try {
            await mailer.verify();
            console.log('SMTP verify: success');
        } catch (e) {
            console.warn('SMTP verify: failed ->', e.message);
        }
        if (process.env.SMTP_HOST) {
            console.log(`SMTP ready: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || '587'} secure=${String(process.env.SMTP_SECURE || 'false')} user=${process.env.SMTP_USER}`);
        } else {
            console.log('Email transport ready (dev stream)');
        }
    } catch (e) {
        console.warn('Email transport initialization failed:', e.message);
    }
})();

// Middleware
// Allow local development origins (localhost, 127.0.0.1) with any port
const allowedOrigins = [/^http:\/\/localhost(?::\d+)?$/, /^http:\/\/127\.0\.0\.1(?::\d+)?$/];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const isAllowed = allowedOrigins.some((re) => re.test(origin));
        return callback(null, isAllowed);
    },
    credentials: true
}));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'build')));
// Explicitly serve static assets path to avoid SPA fallback intercepting asset requests
app.use('/static', express.static(path.join(__dirname, 'build', 'static')));

// MongoDB connection (do not exit on failure so app can still serve frontend)
mongoose.set('strictQuery', true);
mongoose
    .connect(MONGODB_URI, { autoIndex: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => {
        console.error('MongoDB connection error:', err.message);
        // Keep running; DB-dependent routes may fail until fixed
    });

// Schemas & Models
const userSchema = new mongoose.Schema({
	first_name: { type: String, required: true },
	last_name: { type: String, required: true },
	email: { type: String, required: true, unique: true, index: true },
	password_hash: { type: String, required: true },
	university: { type: String, default: null },
	created_at: { type: Date, default: Date.now },
	last_login: { type: Date, default: null },
	// Email verification fields
	is_verified: { type: Boolean, default: false, index: true },
	verification_code_hash: { type: String, default: null },
	verification_expires: { type: Date, default: null },
	verification_last_sent_at: { type: Date, default: null }
});
const User = mongoose.model('User', userSchema);

const personalityResultSchema = new mongoose.Schema({
	user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	type: { type: String, required: true },
	raw_answers: { type: mongoose.Schema.Types.Mixed },
	created_at: { type: Date, default: Date.now }
});
const PersonalityResult = mongoose.model('PersonalityResult', personalityResultSchema);

const mbtiQuestionSchema = new mongoose.Schema({
	id: { type: Number, required: true, unique: true, index: true },
	text: { type: String, required: true },
	dimension: { type: String, required: true },
	direction: { type: String, required: true }
});
const MbtiQuestion = mongoose.model('MbtiQuestion', mbtiQuestionSchema);

const mbtiPersonalitySchema = new mongoose.Schema({
	type: { type: String, required: true, unique: true, index: true },
	content: { type: String, required: true }
});
const MbtiPersonality = mongoose.model('MbtiPersonality', mbtiPersonalitySchema);

const majorQuestionSchema = new mongoose.Schema({
	id: { type: Number, required: true, unique: true, index: true },
	category: { type: String, required: true },
	topic: { type: String, default: null },
	question: { type: String, required: true }
});
const MajorQuestion = mongoose.model('MajorQuestion', majorQuestionSchema);

const majorSchema = new mongoose.Schema({
	name: { type: String, required: true, unique: true, index: true },
	description: { type: String, default: '' },
	avg_salary: { type: String, default: '' },
	job_outlook: { type: String, default: '' },
	work_environment: { type: String, default: '' }
});
const Major = mongoose.model('Major', majorSchema);

const majorMappingSchema = new mongoose.Schema({
	category: { type: String, required: true },
	option_value: { type: String, required: true, index: true },
	major_name: { type: String, required: true, index: true },
	score: { type: Number, default: 1 }
});
const MajorMapping = mongoose.model('MajorMapping', majorMappingSchema);

const majorTestSchema = new mongoose.Schema({
	user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
	raw_answers: { type: mongoose.Schema.Types.Mixed },
	created_at: { type: Date, default: Date.now }
});
const MajorTest = mongoose.model('MajorTest', majorTestSchema);

const subscriptionSchema = new mongoose.Schema({
	user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	stripe_customer_id: { type: String, required: true },
	stripe_subscription_id: { type: String, required: true },
	stripe_price_id: { type: String, required: true },
	status: { type: String, required: true }, // active, canceled, past_due, etc.
	current_period_start: { type: Date, required: true },
	current_period_end: { type: Date, required: true },
	created_at: { type: Date, default: Date.now },
	updated_at: { type: Date, default: Date.now }
});
const Subscription = mongoose.model('Subscription', subscriptionSchema);

// Manual payments (e.g., Whish Money) submissions for later verification
const manualPaymentSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    method: { type: String, required: true, enum: ['whish'] },
    reference: { type: String, required: true },
    sender_name: { type: String, required: true },
    phone: { type: String, default: null },
    notes: { type: String, default: null },
    amount_cents: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, required: true, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    created_at: { type: Date, default: Date.now },
    verified_at: { type: Date, default: null }
});
const ManualPayment = mongoose.model('ManualPayment', manualPaymentSchema);

// Auth helpers
function generateToken(user) {
	return jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
	const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
	if (!token) return res.status(401).json({ error: 'Unauthorized' });
	try {
		const payload = jwt.verify(token, JWT_SECRET);
		req.user = payload;
		next();
	} catch (e) {
		return res.status(401).json({ error: 'Invalid token' });
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
		if (!mailer) throw new Error('Mailer not initialized');
		const info = await mailer.sendMail({
			from: EMAIL_FROM,
			to: toEmail,
			subject: 'Major Match - Verify your email',
			html
		});
		const isDevTransport = !process.env.SMTP_HOST;
		if (isDevTransport) {
			console.log('[DEV] Verification code for', toEmail, '=>', code);
			try {
				const raw = info && info.message && info.message.toString ? info.message.toString() : '';
				if (raw) console.log('[DEV] Raw email output:\n' + raw);
			} catch (_) {}
		} else {
			console.log('Sent verification email to', toEmail);
		}
	} catch (e) {
		console.warn('Failed to send verification email:', e.message);
	}
}

// Auto-seed from local files into MongoDB (runs once if collections are empty)
async function ensureMbtiSeedMongo() {
	try {
		const qCount = await MbtiQuestion.countDocuments({});
		const pCount = await MbtiPersonality.countDocuments({});
		if (qCount > 0 && pCount > 0) return;

		let seededQ = 0;
		try {
			const qPath = path.join(__dirname, 'MBTI Questions.txt');
			if (fs.existsSync(qPath)) {
				const raw = fs.readFileSync(qPath, 'utf8');
				const lines = raw.split(/\r?\n/).filter(l => l.trim());
				const docs = [];
				for (const line of lines) {
					const parts = line.split('\t');
					if (parts.length >= 3) {
						const id = parseInt(parts[0]);
						const text = String(parts[1]).trim();
						const scoring = parts[2];
						const parts2 = scoring.split(' → ');
						if (parts2.length >= 2) {
							const dimension = String(parts2[0]).trim();
							const direction = String(parts2[1]).trim();
							docs.push({ id, text, dimension, direction });
						}
					}
				}
				if (docs.length) {
					await MbtiQuestion.insertMany(docs);
					seededQ = docs.length;
				}
			}
		} catch (e) {}

		let seededP = 0;
		try {
			const pPath = path.join(__dirname, 'MBTI personalities.txt');
			if (fs.existsSync(pPath)) {
				const data = fs.readFileSync(pPath, 'utf8');
				const sections = data.split(/🟣|🟡|🔴|🔵|🟢|🟦|🟤|🟠/);
				const docs = [];
				for (const section of sections) {
					if (!section || !section.trim()) continue;
					const firstLine = (section.split(/\r?\n/).find(l => l.trim()) || '').trim();
					const m = firstLine.match(/\(([A-Z]{4}[‑-][AT])\)/);
					if (m) {
						const type = m[1].replace('‑', '-');
						docs.push({ type, content: section.trim() });
					}
				}
				if (docs.length) {
					await MbtiPersonality.insertMany(docs);
					seededP = docs.length;
				}
			}
		} catch (e) {}

		if (!seededQ) {
			await MbtiQuestion.insertMany([
				{ id: 1, text: 'You enjoy social gatherings.', dimension: 'IE', direction: 'E' }
			]);
		}
		if (!seededP) {
			await MbtiPersonality.insertMany([
				{ type: 'INFP-T', content: 'Default INFP-T description.' }
			]);
		}
		console.log(`MBTI seed complete: questions=${await MbtiQuestion.countDocuments({})}, personalities=${await MbtiPersonality.countDocuments({})}`);
	} catch (e) {
		console.warn('MBTI auto-seed skipped:', e.message);
	}
}

async function ensureMajorSeedMongo() {
	try {
		// Major questions
		const mqCount = await MajorQuestion.countDocuments({});
		if (mqCount === 0) {
			const qCandidates = [
				process.env.MAJOR_QUESTIONS_PATH,
				path.join(__dirname, 'Mapping-20250819T113244Z-1-001', 'Mapping', 'Question 2.txt'),
				path.join(process.cwd(), 'Mapping-20250819T113244Z-1-001', 'Mapping', 'Question 2.txt'),
				path.join(__dirname, 'Mapping', 'Question 2.txt'),
				path.join(process.cwd(), 'Mapping', 'Question 2.txt')
			].filter(Boolean);
			for (const p of qCandidates) {
				try {
					if (p && fs.existsSync(p)) {
						const raw = fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
						const parsed = JSON.parse(raw);
						if (Array.isArray(parsed) && parsed.length) {
							const docs = parsed.map((q, idx) => ({
								id: parseInt(q.id ?? (idx + 1)),
								category: String(q.category || 'General'),
								topic: q.topic ? String(q.topic) : null,
								question: String(q.question || q.text || '')
							}));
							await MajorQuestion.insertMany(docs);
							console.log(`Seeded ${docs.length} major questions from ${p}`);
							break;
						}
					}
				} catch (e) {}
			}
		}
	} catch (e) {
		console.warn('Major questions seed skipped:', e.message);
	}

	try {
		// Majors & mapping
		const majCount = await Major.countDocuments({});
		const mapCount = await MajorMapping.countDocuments({});
		if (majCount === 0 || mapCount === 0) {
			const mappingRoots = [
				process.env.MAPPING_ROOT_PATH,
				path.join(__dirname, 'Mapping-20250819T113244Z-1-001', 'Mapping'),
				path.join(process.cwd(), 'Mapping-20250819T113244Z-1-001', 'Mapping'),
				path.join(__dirname, 'Mapping'),
				path.join(process.cwd(), 'Mapping')
			].filter(Boolean);
			let rootDir = null;
			for (const r of mappingRoots) { if (r && fs.existsSync(r)) { rootDir = r; break; } }
			if (rootDir) {
				const entries = fs.readdirSync(rootDir, { withFileTypes: true });
				const majorsSet = new Set();
				const mappings = [];
				const descriptions = {};
				const addMap = (optionValue, majorName, score, category) => {
					if (!optionValue || !majorName) return;
					mappings.push({ category: category || 'derived', option_value: String(optionValue), major_name: String(majorName), score: parseInt(score || 1) || 1 });
				};
				const weight = { ria_sec: 2, academic_strengths: 3, core_values: 2, mbti_traits: 1 };
				for (const entry of entries) {
					if (!entry.isDirectory()) continue;
					const dir = path.join(rootDir, entry.name);
					const algo = (fs.readdirSync(dir).find(f => /Algorithm .*\.txt$/i.test(f)) || null);
					const descFile = fs.readdirSync(dir).find(f => /Description\.txt$/i.test(f)) || null;
					if (!algo) continue;
					try {
						const content = fs.readFileSync(path.join(dir, algo), 'utf8');
						const list = JSON.parse(content);
						if (!Array.isArray(list)) continue;
						list.forEach(item => {
							const majorName = item.parent_major;
							if (!majorName) return;
							majorsSet.add(majorName);
							(item.ria_sec || []).forEach(v => addMap(v, majorName, weight.ria_sec, 'RIASEC'));
							(item.academic_strengths || []).forEach(v => addMap(v, majorName, weight.academic_strengths, 'Academic Strength'));
							(item.core_values || []).forEach(v => addMap(v, majorName, weight.core_values, 'Core Value'));
							(item.mbti_traits || []).forEach(v => addMap(v, majorName, weight.mbti_traits, 'MBTI'));
						});
					} catch (e) {}

					// Parse major descriptions if available
					try {
						if (descFile) {
							const raw = fs.readFileSync(path.join(dir, descFile), 'utf8');
							const lines = raw.split(/\r?\n/);
							let currentMajor = null;
							let buffer = [];
							const flush = () => {
								if (currentMajor) {
									const text = buffer.join('\n').trim();
									if (text) descriptions[currentMajor] = text;
								}
								currentMajor = null;
								buffer = [];
							};
							for (const line of lines) {
								const mHdr = line.match(/^\s*-\s*([^–\-]+?)\s*[–\-]\s*(.*)$/);
								if (mHdr) {
									flush();
									currentMajor = String(mHdr[1] || '').trim();
									const tagline = String(mHdr[2] || '').trim();
									if (tagline) buffer.push(tagline);
									continue;
								}
								buffer.push(line);
							}
							flush();
						}
					} catch (e) {}
				}
				if (majCount === 0 && majorsSet.size) {
					await Major.insertMany(Array.from(majorsSet).map(name => ({ name, description: descriptions[name] || '', avg_salary: '', job_outlook: '', work_environment: '' })));
					console.log(`Seeded ${majorsSet.size} majors from mapping folder`);
				}
				if (mapCount === 0 && mappings.length) {
					await MajorMapping.insertMany(mappings);
					console.log(`Seeded ${mappings.length} major mappings from mapping folder`);
				}

				// Backfill missing descriptions for already-seeded majors
				try {
					const existingMajors = await Major.find({}).lean();
					for (const m of existingMajors) {
						if ((!m.description || !String(m.description).trim()) && descriptions[m.name]) {
							await Major.updateOne({ _id: m._id }, { $set: { description: descriptions[m.name] } });
						}
					}
				} catch (e) {}
			}
		}
	} catch (e) {
		console.warn('Majors/mapping seed skipped:', e.message);
	}
}

let questionsCache = [];
let personalitiesCache = {};

async function loadMbtiCache() {
	const qRows = await MbtiQuestion.find({}).sort({ id: 1 }).lean();
	questionsCache = Array.isArray(qRows) ? qRows : [];
	const pRows = await MbtiPersonality.find({}).lean();
	personalitiesCache = {};
	(pRows || []).forEach(r => { personalitiesCache[r.type] = { type: r.type, content: r.content }; });
	console.log(`Loaded ${questionsCache.length} MBTI questions (mongo)`);
	console.log(`Loaded ${Object.keys(personalitiesCache).length} personality types (mongo)`);
}

// No file-based seeding for majors/mappings/questions. Use admin bulk endpoints instead.

// Calculate MBTI
function calculateMBTIType(answers) {
	const scores = { I: 0, E: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0, A: 0, T2: 0 };
	answers.forEach(a => {
		const q = questionsCache.find(q => q.id === a.questionId);
		if (!q) return;
		const value = a.value;
		if (value < 1 || value > 5) return;
		const signed = value - 3;
		if (signed === 0) return;
		const magnitude = Math.abs(signed);
		const dir = signed > 0 ? q.direction : getOpposite(q.direction);
		const key = dir === 'T' && q.dimension === 'AT' ? 'T2' : dir; // avoid clash with Thinking(T)
		scores[key] = (scores[key] || 0) + magnitude;
	});
	const type = (scores.E >= scores.I ? 'E' : 'I') + (scores.N >= scores.S ? 'N' : 'S') + (scores.F >= scores.T ? 'F' : 'T') + (scores.P >= scores.J ? 'P' : 'J');
	const identity = (scores.A || 0) >= (scores.T2 || 0) ? 'A' : 'T';
	return `${type}-${identity}`;
}
function getOpposite(d) { const m = { I: 'E', E: 'I', S: 'N', N: 'S', T: 'F', F: 'T', J: 'P', P: 'J', A: 'T', T: 'A' }; return m[d] || d; }

// Stripe Payment Routes
app.post('/api/create-payment-intent', authMiddleware, async (req, res) => {
	try {
		if (!stripe) {
			return res.status(503).json({ error: 'Payment system not configured. Please contact support.' });
		}

		// Check if user already has a payment
		const existingPayment = await Subscription.findOne({ 
			user_id: req.user.id, 
			status: 'active'
		}).lean();
		
		if (existingPayment) {
			return res.status(400).json({ error: 'User already has access to the major test' });
		}

		// Get or create Stripe customer
		let customer;
		const user = await User.findById(req.user.id).lean();
		
		try {
			customer = await stripe.customers.create({
				email: user.email,
				name: `${user.first_name} ${user.last_name}`,
				metadata: {
					user_id: req.user.id
				}
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
			currency: 'usd',
			customer: customer.id,
			metadata: {
				user_id: req.user.id,
				product: 'major_test_access'
			}
		});

		res.json({
			clientSecret: paymentIntent.client_secret,
			customerId: customer.id
		});
	} catch (e) {
		console.error('Stripe error:', e);
		res.status(500).json({ error: 'Failed to create payment intent' });
	}
});

app.post('/api/confirm-payment', authMiddleware, async (req, res) => {
	try {
		if (!stripe) {
			return res.status(503).json({ error: 'Payment system not configured. Please contact support.' });
		}

		const { paymentIntentId } = req.body;
		if (!paymentIntentId) return res.status(400).json({ error: 'Payment Intent ID is required' });

		const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
		
		if (paymentIntent.status === 'succeeded') {
			// Save payment to database
			await Subscription.create({
				user_id: req.user.id,
				stripe_customer_id: paymentIntent.customer,
				stripe_subscription_id: paymentIntent.id, // Using payment intent ID for one-time payments
				stripe_price_id: 'one_time_major_test', // Custom identifier for one-time payment
				status: 'active',
				current_period_start: new Date(),
				current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
			});

			res.json({ success: true, paymentIntent: paymentIntent });
		} else {
			res.status(400).json({ error: 'Payment was not successful' });
		}
	} catch (e) {
		console.error('Payment confirmation error:', e);
		res.status(500).json({ error: 'Failed to confirm payment' });
	}
});

// Public payment configuration (used by frontend UI)
app.get('/api/payments/config', async (req, res) => {
    try {
    return res.json({
    stripeEnabled: !!stripe,
    whish: {
    accountName: WHISH_ACCOUNT_NAME,
    accountNumber: WHISH_ACCOUNT_NUMBER,
    amountCents: WHISH_AMOUNT_CENTS,
    currency: WHISH_CURRENCY,
    instructions: WHISH_INSTRUCTIONS
    }
    });
    } catch (e) {
    return res.status(500).json({ error: 'Failed to load payment configuration' });
    }
});

// Submit Whish Money payment details for manual verification
app.post('/api/payments/whish/submit', authMiddleware, async (req, res) => {
    try {
    const { reference, senderName, phone, notes } = req.body || {};
    if (!reference || !String(reference).trim()) return res.status(400).json({ error: 'Reference is required' });
    if (!senderName || !String(senderName).trim()) return res.status(400).json({ error: 'Sender name is required' });

    // Optionally: prevent duplicate references for same user while pending
    const existing = await ManualPayment.findOne({ user_id: req.user.id, reference: String(reference).trim(), status: 'pending' }).lean();
    if (existing) return res.status(409).json({ error: 'A submission with this reference is already pending review' });

    await ManualPayment.create({
    user_id: req.user.id,
    method: 'whish',
    reference: String(reference).trim(),
    sender_name: String(senderName).trim(),
    phone: phone ? String(phone).trim() : null,
    notes: notes ? String(notes).trim() : null,
    amount_cents: WHISH_AMOUNT_CENTS,
    currency: WHISH_CURRENCY,
    status: 'pending'
    });

    return res.json({ ok: true });
    } catch (e) {
    console.error('Whish submit error:', e);
    return res.status(500).json({ error: 'Failed to submit payment details' });
    }
});

app.get('/api/subscription-status', authMiddleware, async (req, res) => {
	try {
		// Whitelist: grant access without payment for specific email
		const isWhitelisted = String(req.user?.email || '').toLowerCase() === 'ammarbadawi18@gmail.com';
		if (isWhitelisted) {
			return res.json({
				hasSubscription: true,
				status: 'active',
				current_period_end: new Date('2099-12-31').toISOString(),
				payment_type: 'whitelist'
			});
		}

		const subscription = await Subscription.findOne({ 
			user_id: req.user.id,
			status: 'active'
		}).lean();

		if (!subscription) {
			return res.json({ hasSubscription: false });
		}

		// Check if it's a one-time payment that's still valid
		const now = new Date();
		const isExpired = subscription.current_period_end && new Date(subscription.current_period_end) < now;
		
		if (isExpired) {
			// Update status to expired
			await Subscription.updateOne(
				{ _id: subscription._id },
				{ status: 'expired', updated_at: new Date() }
			);
			return res.json({ hasSubscription: false });
		}

		res.json({ 
			hasSubscription: true, 
			status: subscription.status,
			current_period_end: subscription.current_period_end,
			payment_type: subscription.stripe_price_id === 'one_time_major_test' ? 'one_time' : 'subscription'
		});
	} catch (e) {
		res.status(500).json({ error: 'Failed to check subscription status' });
	}
});

app.post('/api/cancel-subscription', authMiddleware, async (req, res) => {
	try {
		const subscription = await Subscription.findOne({ 
			user_id: req.user.id,
			status: 'active'
		});

		if (!subscription) {
			return res.status(404).json({ error: 'No active access found' });
		}

		// For one-time payments, just mark as canceled locally
		if (subscription.stripe_price_id === 'one_time_major_test') {
			subscription.status = 'canceled';
			subscription.updated_at = new Date();
			await subscription.save();
			res.json({ success: true, message: 'Access has been revoked' });
			return;
		}

		// For recurring subscriptions, cancel in Stripe
		if (!stripe) {
			return res.status(503).json({ error: 'Payment system not configured. Please contact support.' });
		}

		await stripe.subscriptions.update(subscription.stripe_subscription_id, {
			cancel_at_period_end: true
		});

		// Update local subscription status
		subscription.status = 'canceled';
		subscription.updated_at = new Date();
		await subscription.save();

		res.json({ success: true });
	} catch (e) {
		console.error('Subscription cancellation error:', e);
		res.status(500).json({ error: 'Failed to cancel subscription' });
	}
});

// Stripe webhook endpoint
app.post('/api/stripe-webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
	if (!stripe) {
		return res.status(503).json({ error: 'Payment system not configured' });
	}

	const sig = req.headers['stripe-signature'];
	let event;

	try {
		event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
	} catch (err) {
		console.error('Webhook signature verification failed:', err.message);
		return res.status(400).send(`Webhook Error: ${err.message}`);
	}

	try {
		switch (event.type) {
			case 'payment_intent.succeeded':
				const paymentIntent = event.data.object;
				// Check if this is a major test payment
				if (paymentIntent.metadata && paymentIntent.metadata.product === 'major_test_access') {
					// Create or update subscription record for one-time payment
					await Subscription.updateOne(
						{ stripe_subscription_id: paymentIntent.id },
						{
							user_id: paymentIntent.metadata.user_id,
							stripe_customer_id: paymentIntent.customer,
							stripe_subscription_id: paymentIntent.id,
							stripe_price_id: 'one_time_major_test',
							status: 'active',
							current_period_start: new Date(),
							current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
							updated_at: new Date()
						},
						{ upsert: true }
					);
				}
				break;
			case 'customer.subscription.updated':
				const subscription = event.data.object;
				await Subscription.updateOne(
					{ stripe_subscription_id: subscription.id },
					{
						status: subscription.status,
						current_period_start: new Date(subscription.current_period_start * 1000),
						current_period_end: new Date(subscription.current_period_end * 1000),
						updated_at: new Date()
					}
				);
				break;
			case 'customer.subscription.deleted':
				const deletedSubscription = event.data.object;
				await Subscription.updateOne(
					{ stripe_subscription_id: deletedSubscription.id },
					{
						status: 'canceled',
						updated_at: new Date()
					}
				);
				break;
		}
		res.json({ received: true });
	} catch (e) {
		console.error('Webhook processing error:', e);
		res.status(500).json({ error: 'Webhook processing failed' });
	}
});

// Routes
app.get('/api/questions', authMiddleware, async (req, res) => {
	try {
		if (!questionsCache.length) {
			try {
				await ensureMbtiSeedMongo();
			} catch (_) {}
			try {
				await loadMbtiCache();
			} catch (_) {}
		}
		res.json(questionsCache);
	} catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/calculate', authMiddleware, async (req, res) => {
	try {
		const { answers } = req.body;
		if (!answers || !Array.isArray(answers)) return res.status(400).json({ error: 'Invalid answers format' });
		const type = calculateMBTIType(answers);
		const personality = personalitiesCache[type];
		if (!personality) return res.status(404).json({ error: 'Personality type not found' });
		try { await PersonalityResult.create({ user_id: req.user.id, type, raw_answers: answers }); } catch (e) {}
		res.json({ type, personality });
	} catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/personality/:type', async (req, res, next) => {
	try {
		const param = String(req.params.type || '');
		// Avoid shadowing the '/api/personality/latest' route
		if (param === 'latest') return next();
		if (!Object.keys(personalitiesCache).length) await loadMbtiCache();
		const p = personalitiesCache[param];
		if (!p) return res.status(404).json({ error: 'Personality type not found' });
		res.json(p);
	} catch (e) { res.status(500).json({ error: 'Server error' }); }
});


// Latest MBTI result for the current user
app.get('/api/personality/latest', authMiddleware, async (req, res) => {
	try {
		const latest = await PersonalityResult.findOne({ user_id: req.user.id }).sort({ created_at: -1 }).lean();
		if (!latest) return res.status(404).json({ hasResult: false });
		res.json({ hasResult: true, type: latest.type, created_at: latest.created_at });
	} catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Auth
app.post('/api/auth/signup', async (req, res) => {
	try {
		const { firstName, lastName, email, password, university } = req.body;
		if (!firstName || !lastName || !email || !password) return res.status(400).json({ error: 'Missing required fields' });
		const lower = String(email).toLowerCase();
		const existing = await User.findOne({ email: lower }).lean();
		if (existing) return res.status(409).json({ error: 'Email already registered' });
		const password_hash = bcrypt.hashSync(password, 10);
		// Prepare verification
		const code = generateNumericCode(6);
		const codeHash = bcrypt.hashSync(code, 8);
		const expires = new Date(Date.now() + 15 * 60 * 1000);
		const now = new Date();
		const doc = await User.create({
			first_name: firstName,
			last_name: lastName,
			email: lower,
			password_hash,
			university: university || null,
			is_verified: false,
			verification_code_hash: codeHash,
			verification_expires: expires,
			verification_last_sent_at: now
		});
		try { await sendVerificationEmail(lower, code); } catch (e) {}
		res.json({ requiresVerification: true, email: lower });
	} catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/auth/login', async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
		const user = await User.findOne({ email: String(email).toLowerCase() });
		if (!user) return res.status(401).json({ error: 'Invalid email or password' });
		const ok = bcrypt.compareSync(password, user.password_hash);
		if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
		if (!user.is_verified) return res.status(403).json({ error: 'Email not verified', requiresVerification: true, email: user.email });
		
		// Update last login timestamp
		user.last_login = new Date();
		await user.save();
		
		const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
		res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
		res.json({ id: user._id, email: user.email, firstName: user.first_name, lastName: user.last_name, university: user.university });
	} catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Email verification endpoints
app.post('/api/auth/verify', async (req, res) => {
	try {
		const { email, code } = req.body || {};
		const lower = String(email || '').toLowerCase();
		if (!lower || !code) return res.status(400).json({ error: 'Missing email or code' });
		const user = await User.findOne({ email: lower });
		if (!user) return res.status(404).json({ error: 'User not found' });
		if (user.is_verified) return res.json({ ok: true, alreadyVerified: true });
		if (!user.verification_code_hash || !user.verification_expires) return res.status(400).json({ error: 'No active verification code' });
		if (new Date() > new Date(user.verification_expires)) return res.status(400).json({ error: 'Code expired' });
		const match = bcrypt.compareSync(String(code), user.verification_code_hash);
		if (!match) return res.status(400).json({ error: 'Invalid code' });
		user.is_verified = true;
		user.verification_code_hash = null;
		user.verification_expires = null;
		await user.save();
		const token = generateToken(user);
		res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
		res.json({ ok: true });
	} catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/auth/resend', async (req, res) => {
	try {
		const { email } = req.body || {};
		const lower = String(email || '').toLowerCase();
		if (!lower) return res.status(400).json({ error: 'Missing email' });
		const user = await User.findOne({ email: lower });
		if (!user) return res.status(404).json({ error: 'User not found' });
		if (user.is_verified) return res.status(400).json({ error: 'Already verified' });
		const last = user.verification_last_sent_at ? new Date(user.verification_last_sent_at).getTime() : 0;
		if (Date.now() - last < 60 * 1000) return res.status(429).json({ error: 'Please wait before resending' });
		const code = generateNumericCode(6);
		user.verification_code_hash = bcrypt.hashSync(code, 8);
		user.verification_expires = new Date(Date.now() + 15 * 60 * 1000);
		user.verification_last_sent_at = new Date();
		await user.save();
		try { await sendVerificationEmail(lower, code); } catch (e) {}
		res.json({ ok: true });
	} catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/auth/logout', (req, res) => { res.clearCookie('token'); res.json({ ok: true }); });
app.get('/api/me', authMiddleware, async (req, res) => {
	const user = await User.findById(req.user.id, { password_hash: 0 }).lean();
	res.json({ id: user._id, firstName: user.first_name, lastName: user.last_name, email: user.email, university: user.university });
});

// Admin JSON bulk endpoints
app.post('/api/admin/majors/bulk', authMiddleware, async (req, res) => {
	try {
		const list = req.body.majors;
		if (!Array.isArray(list)) return res.status(400).json({ error: 'majors must be an array' });
		await Major.deleteMany({});
		if (list.length) await Major.insertMany(list.map(m => ({ name: m.name, description: m.description || '', avg_salary: m.avg_salary || '', job_outlook: m.job_outlook || '', work_environment: m.work_environment || '' })));
		res.json({ ok: true, count: list.length });
	} catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/admin/mapping/bulk', authMiddleware, async (req, res) => {
	try {
		const map = req.body.mapping;
		if (!Array.isArray(map)) return res.status(400).json({ error: 'mapping must be an array' });
		await MajorMapping.deleteMany({});
		if (map.length) await MajorMapping.insertMany(map.map(r => ({ category: r.category, option_value: r.option_value, major_name: r.major_name, score: parseInt(r.score || 1) || 1 })));
		res.json({ ok: true, count: map.length });
	} catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/admin/mbti/questions/bulk', authMiddleware, async (req, res) => {
	try {
		const qs = req.body.questions;
		if (!Array.isArray(qs)) return res.status(400).json({ error: 'questions must be an array' });
		await MbtiQuestion.deleteMany({});
		if (qs.length) await MbtiQuestion.insertMany(qs.map(q => ({ id: parseInt(q.id), text: String(q.text), dimension: String(q.dimension), direction: String(q.direction) })));
		await loadMbtiCache();
		res.json({ ok: true, count: qs.length });
	} catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/admin/mbti/personalities/bulk', authMiddleware, async (req, res) => {
	try {
		const ps = req.body.personalities;
		if (!Array.isArray(ps)) return res.status(400).json({ error: 'personalities must be an array' });
		await MbtiPersonality.deleteMany({});
		if (ps.length) await MbtiPersonality.insertMany(ps.map(p => ({ type: p.type, content: p.content })));
		await loadMbtiCache();
		res.json({ ok: true, count: ps.length });
	} catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Major test questions endpoints
app.get('/api/major/questions', authMiddleware, async (req, res) => {
	try {
		// Require MBTI completion before allowing major test
		const latest = await PersonalityResult.findOne({ user_id: req.user.id }).sort({ created_at: -1 }).lean();
		if (!latest) return res.status(403).json({ error: 'MBTI test required' });

		// Whitelist: allow specific email without subscription
		const isWhitelisted = String(req.user?.email || '').toLowerCase() === 'ammarbadawi18@gmail.com';
		if (!isWhitelisted) {
			// Check subscription status
			const subscription = await Subscription.findOne({ 
				user_id: req.user.id,
				status: { $in: ['active', 'trialing'] }
			}).lean();
			if (!subscription) {
				return res.status(402).json({ error: 'Subscription required to access major test' });
			}
		}

		let list = await MajorQuestion.find({}).sort({ id: 1 }).lean();
		if (!Array.isArray(list) || list.length < 10) {
			// Try structured seeding first
			try {
				await ensureMajorSeedMongo();
				list = await MajorQuestion.find({}).sort({ id: 1 }).lean();
			} catch (e) {}

			// Last resort: read from local file candidates and persist
			if (!Array.isArray(list) || list.length < 10) {
				const candidates = [
					process.env.MAJOR_QUESTIONS_PATH,
					path.join(__dirname, 'Mapping-20250819T113244Z-1-001', 'Mapping', 'Question 2.txt'),
					path.join(process.cwd(), 'Mapping-20250819T113244Z-1-001', 'Mapping', 'Question 2.txt'),
					path.join(__dirname, 'Mapping', 'Question 2.txt'),
					path.join(process.cwd(), 'Mapping', 'Question 2.txt')
				].filter(Boolean);

				for (const p of candidates) {
					try {
						if (p && fs.existsSync(p)) {
							const raw = fs.readFileSync(p, 'utf8').replace(/^[\uFEFF\ufeff]/, '');
							let parsed = null;
							try {
								parsed = JSON.parse(raw);
							} catch (e1) {
								try {
									const fixed = raw
										.replace(/}\s*\n+\s*\{/g, '},{')
										.replace(/,\s*([\]}])/g, '$1');
									parsed = JSON.parse(fixed);
								} catch (e2) {
									parsed = null;
								}
							}
							if (Array.isArray(parsed) && parsed.length) {
								const docs = parsed.map((q, idx) => ({
									id: parseInt(q.id ?? (idx + 1)),
									category: String(q.category || 'General'),
									topic: q.topic ? String(q.topic) : null,
									question: String(q.question || q.text || '')
								}));
								await MajorQuestion.deleteMany({});
								await MajorQuestion.insertMany(docs);
								list = await MajorQuestion.find({}).sort({ id: 1 }).lean();
								break;
							}
						}
					} catch (e) {}
				} // ✅ closes for loop
			} // ✅ closes "if (list < 10)" for file seeding

			// If still empty, seed minimal fallback
			if (!Array.isArray(list) || list.length === 0) {
				const fallback = [
					{ id: 1, category: 'Academic Strength', topic: 'Mathematics', question: 'I enjoy solving equations and math problems in my free time.' },
					{ id: 2, category: 'Academic Strength', topic: 'Physics', question: 'I enjoy solving real-world problems using physics concepts.' },
					{ id: 3, category: 'Academic Strength', topic: 'Programming & Logic', question: 'I am curious about how software or applications are built.' },
					{ id: 4, category: 'Core Value', topic: 'Creativity', question: 'I feel fulfilled when I’m inventing or creating something new.' },
					{ id: 5, category: 'RIASEC', topic: 'I', question: 'I enjoy analyzing problems logically.' }
				];
				try {
					await MajorQuestion.insertMany(fallback);
					list = await MajorQuestion.find({}).sort({ id: 1 }).lean();
				} catch (e) {}
			}
		}
		res.json((list || []).map(q => ({ id: q.id, category: q.category, topic: q.topic, question: q.question })));
	} catch (e) {
		res.status(500).json({ error: 'Server error' });
	}
});


app.post('/api/admin/major/questions/bulk', authMiddleware, async (req, res) => {
	try {
		const qs = req.body.questions;
		if (!Array.isArray(qs)) return res.status(400).json({ error: 'questions must be an array' });
		await MajorQuestion.deleteMany({});
		if (qs.length) {
			await MajorQuestion.insertMany(qs.map((q, idx) => ({
				id: parseInt(q.id ?? (idx + 1)),
				category: String(q.category || 'General'),
				topic: q.topic ? String(q.topic) : null,
				question: String(q.question || q.text || '')
			})));
		}
		res.json({ ok: true, count: qs.length });
	} catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// TEMP DEBUG: Seed major questions from a local file
// Usage:
//   GET /api/debug/seed-major-questions
//   GET /api/debug/seed-major-questions?path=C:/full/path/to/Question%202.txt
app.get('/api/debug/seed-major-questions', async (req, res) => {
	try {
		res.status(410).json({ error: 'Deprecated. Use /api/admin/major/questions/bulk' });
	} catch (e) {
		res.status(500).json({ error: e.message || 'Server error' });
	}
});

// Major calculation
app.post('/api/major/calculate', authMiddleware, async (req, res) => {
	try {
		// Block calculation until MBTI is completed
		const latestCheck = await PersonalityResult.findOne({ user_id: req.user.id }).sort({ created_at: -1 }).lean();
		if (!latestCheck) return res.status(403).json({ error: 'MBTI test required' });

		// Whitelist: allow specific email without subscription
		const isWhitelisted = String(req.user?.email || '').toLowerCase() === 'ammarbadawi18@gmail.com';
		if (!isWhitelisted) {
			// Check subscription status
			const subscription = await Subscription.findOne({ 
				user_id: req.user.id,
				status: { $in: ['active', 'trialing'] }
			}).lean();
			if (!subscription) {
				return res.status(402).json({ error: 'Subscription required to access major test' });
			}
		}

		const { answers } = req.body;
		if (!answers || typeof answers !== 'object') return res.status(400).json({ error: 'Invalid answers' });
		const mapping = await MajorMapping.find({}).lean();
		if (mapping.length === 0) return res.status(400).json({ error: 'Major mapping not loaded' });
		const majorsList = await Major.find({}).lean();
		if (majorsList.length === 0) return res.status(400).json({ error: 'Majors list not loaded' });
		const tally = new Map();

		function addScoreForValue(rawVal, category, factor = 1) {
			const value = String(rawVal).trim().toLowerCase();
			const cat = String(category || '').trim().toLowerCase();
			if (!value) return;
			const f = Number.isFinite(factor) ? factor : 1;
			for (const r of mapping) {
				const rVal = String(r.option_value || '').toLowerCase();
				const rCat = String(r.category || '').toLowerCase();
				if (rVal === value && (!cat || rCat === cat)) {
					const base = parseInt(r.score || 1) || 1;
					tally.set(r.major_name, (tally.get(r.major_name) || 0) + base * f);
				}
			}
		}

		// Scores from major test answers
		// Signed Likert: positive boosts, negative reduces
		const likertWeight = { 'strongly agree': 2, 'agree': 1, 'neutral': 0, 'disagree': -1, 'strongly disagree': -2 };
		try {
			const list = await MajorQuestion.find({}).lean();
			const byId = new Map();
			(list || []).forEach(q => byId.set(String(q.id), q));
			// Normalize per-topic so repeated topics don't overweight
			const topicCounts = new Map();
			(list || []).forEach(q => {
				const key = `${String(q.category || '').toLowerCase()}::${String(q.topic || q.category || '').toLowerCase()}`;
				topicCounts.set(key, (topicCounts.get(key) || 0) + 1);
			});
			Object.entries(answers).forEach(([qid, choice]) => {
				const q = byId.get(String(qid));
				if (!q) return;
				const w = likertWeight[String(choice).toLowerCase()] || 0;
				if (w !== 0) {
					const key = `${String(q.category || '').toLowerCase()}::${String(q.topic || q.category || '').toLowerCase()}`;
					const denom = topicCounts.get(key) || 1;
					const normalizedW = w / denom; // average contribution per topic
					addScoreForValue(q.topic || q.category, q.category, normalizedW);
				}
			});
		} catch (e) {}

		// Blend latest MBTI result for logged-in user if available
		try {
			const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
			if (token) {
				const { id } = jwt.verify(token, JWT_SECRET);
				const latest = await PersonalityResult.findOne({ user_id: id }).sort({ created_at: -1 }).lean();
				const type = latest?.type;
				if (type) {
					const four = String(type).split('-')[0];
					const letters = four.split('');
					const MBTI_BLEND = 0.5; // reduce MBTI influence and avoid cross-category double counting
					letters.forEach(v => addScoreForValue(v, 'MBTI', MBTI_BLEND));
				}
			}
		} catch (e) {}
		const enriched = majorsList.map(m => ({ name: m.name, match: tally.get(m.name) || 0, description: m.description, averageSalary: m.avg_salary, jobOutlook: m.job_outlook, workEnvironment: m.work_environment }));
		enriched.sort((a, b) => b.match - a.match);
		const positives = enriched.filter(e => e.match > 0);
		const top = (positives.length ? positives : enriched).slice(0, 3);
		const maxScore = (top[0]?.match > 0) ? top[0].match : 1;
		const normalized = top.map(e => ({ ...e, match: Math.max(0, Math.round((e.match / maxScore) * 100)) }));
		try { if (req.cookies.token) { const { id } = jwt.verify(req.cookies.token, JWT_SECRET); await MajorTest.create({ user_id: id, raw_answers: answers }); } } catch (e) {}
		res.json({ results: normalized });
	} catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// User profile endpoint
app.get('/api/profile', authMiddleware, async (req, res) => {
	try {
		console.log('Profile endpoint called for user:', req.user.id);
		const user = await User.findById(req.user.id).lean();
		console.log('User found:', user ? 'Yes' : 'No');
		if (!user) return res.status(404).json({ error: 'User not found' });

		console.log('Fetching personality result...');
		// Get latest personality result
		const personalityResult = await PersonalityResult.findOne({ user_id: req.user.id })
			.sort({ created_at: -1 })
			.lean();
		console.log('Personality result found:', personalityResult ? 'Yes' : 'No');

		console.log('Fetching major test result...');
		// Get latest major test result
		const majorTest = await MajorTest.findOne({ user_id: req.user.id })
			.sort({ created_at: -1 })
			.lean();
		console.log('Major test found:', majorTest ? 'Yes' : 'No');

		console.log('Fetching major mapping and majors...');
		// Get major mapping and majors for calculation
		const mapping = await MajorMapping.find({}).lean();
		const majorsList = await Major.find({}).lean();
		console.log('Major mapping count:', mapping.length);
		console.log('Majors list count:', majorsList.length);

		let majorResult = null;
		if (majorTest && majorTest.raw_answers) {
			try {
				console.log('Processing major test results...');
				console.log('Raw answers:', majorTest.raw_answers);
				
				// Calculate major scores from stored answers
				const tally = new Map();
				
				function addScoreForValue(rawVal, category, factor = 1) {
					const value = String(rawVal).trim().toLowerCase();
					const cat = String(category || '').trim().toLowerCase();
					if (!value) return;
					const f = Number.isFinite(factor) ? factor : 1;
					for (const r of mapping) {
						const rVal = String(r.option_value || '').toLowerCase();
						const rCat = String(r.category || '').toLowerCase();
						if (rVal === value && (!cat || rCat === cat)) {
							const base = parseInt(r.score || 1) || 1;
							tally.set(r.major_name, (tally.get(r.major_name) || 0) + base * f);
						}
					}
				}

				// Process stored answers using the same logic as the calculate endpoint
				const likertWeight = { 'strongly agree': 2, 'agree': 1, 'neutral': 0, 'disagree': -1, 'strongly disagree': -2 };
				const questions = await MajorQuestion.find({}).lean();
				const byId = new Map();
				(questions || []).forEach(q => byId.set(String(q.id), q));
				
				// Normalize per-topic so repeated topics don't overweight
				const topicCounts = new Map();
				(questions || []).forEach(q => {
					const key = `${String(q.category || '').toLowerCase()}::${String(q.topic || q.category || '').toLowerCase()}`;
					topicCounts.set(key, (topicCounts.get(key) || 0) + 1);
				});
				
				Object.entries(majorTest.raw_answers).forEach(([qid, choice]) => {
					const q = byId.get(String(qid));
					if (!q) return;
					const w = likertWeight[String(choice).toLowerCase()] || 0;
					if (w !== 0) {
						const key = `${String(q.category || '').toLowerCase()}::${String(q.topic || q.category || '').toLowerCase()}`;
						const denom = topicCounts.get(key) || 1;
						const normalizedW = w / denom; // average contribution per topic
						addScoreForValue(q.topic || q.category, q.category, normalizedW);
					}
				});

				// Blend latest MBTI result for logged-in user if available
				try {
					const latest = await PersonalityResult.findOne({ user_id: req.user.id }).sort({ created_at: -1 }).lean();
					const type = latest?.type;
					if (type) {
						const four = String(type).split('-')[0];
						const letters = four.split('');
						const MBTI_BLEND = 0.5; // reduce MBTI influence and avoid cross-category double counting
						letters.forEach(v => addScoreForValue(v, 'MBTI', MBTI_BLEND));
					}
				} catch (e) {}

				// Get top majors
				const enriched = majorsList.map(m => ({ 
					name: m.name, 
					match: tally.get(m.name) || 0, 
					description: m.description, 
					averageSalary: m.avg_salary, 
					jobOutlook: m.job_outlook, 
					workEnvironment: m.work_environment 
				}));
				enriched.sort((a, b) => b.match - a.match);
				const positives = enriched.filter(e => e.match > 0);
				const top = (positives.length ? positives : enriched).slice(0, 3);
				const maxScore = (top[0]?.match > 0) ? top[0].match : 1;
				const normalized = top.map(e => ({ 
					...e, 
					score: Math.max(0, Math.round((e.match / maxScore) * 100)),
					career_paths: ['Various career opportunities'] // Default career paths
				}));

				majorResult = {
					top_majors: normalized,
					created_at: majorTest.created_at
				};
				console.log('Major result processing completed successfully');
				console.log('Major result:', majorResult);
			} catch (majorError) {
				console.error('Error processing major results:', majorError);
				console.error('Major error stack:', majorError.stack);
				// Continue without major results rather than failing completely
				majorResult = null;
			}
		}

		// Format personality result
		let formattedPersonalityResult = null;
		if (personalityResult) {
			// Load personality cache if needed
			if (!Object.keys(personalitiesCache).length) await loadMbtiCache();
			
			const personalityData = personalitiesCache[personalityResult.type];
			formattedPersonalityResult = {
				type: personalityResult.type,
				description: personalityData?.content || 'No description available',
				strengths: [], // These fields don't exist in current schema
				weaknesses: [], // These fields don't exist in current schema
				famous_matches: [], // These fields don't exist in current schema
				created_at: personalityResult.created_at
			};
		}

		res.json({
			user: {
				id: user._id,
				name: `${user.first_name} ${user.last_name}`,
				email: user.email,
				created_at: user.created_at,
				last_login: user.last_login || user.created_at
			},
			personality_result: formattedPersonalityResult,
			major_result: majorResult,
			has_personality_test: !!personalityResult,
			has_major_test: !!majorTest
		});
	} catch (e) {
		console.error('Profile fetch error:', e);
		console.error('Error stack:', e.stack);
		res.status(500).json({ error: 'Failed to fetch profile data', details: e.message });
	}
});

// Helper: build major-test/MBTI context for AI grounding
async function buildMajorAiContext(userId) {
	try {
		// Latest major test answers
		const latestTest = await MajorTest.findOne({ user_id: userId }).sort({ created_at: -1 }).lean();
		if (!latestTest || !latestTest.raw_answers) {
			return null;
		}
		const rawAnswers = latestTest.raw_answers || {};

		// Load dependencies
		const [mapping, majorsList, questions, latestMbti] = await Promise.all([
			MajorMapping.find({}).lean(),
			Major.find({}).lean(),
			MajorQuestion.find({}).lean(),
			PersonalityResult.findOne({ user_id: userId }).sort({ created_at: -1 }).lean().catch(() => null)
		]);
		if (!Array.isArray(mapping) || mapping.length === 0 || !Array.isArray(majorsList) || majorsList.length === 0) {
			return { note: 'Mapping or majors list not loaded', mbti: latestMbti?.type || null };
		}

		// Index mapping by category+option
		const idx = new Map();
		for (const r of mapping) {
			const key = `${String(r.category || '').toLowerCase()}::${String(r.option_value || '').toLowerCase()}`;
			if (!idx.has(key)) idx.set(key, []);
			idx.get(key).push(r);
		}

		const byId = new Map();
		(questions || []).forEach(q => byId.set(String(q.id), q));
		const topicCounts = new Map();
		(questions || []).forEach(q => {
			const cat = String(q.category || '').toLowerCase();
			const topic = String(q.topic || q.category || '').toLowerCase();
			const key = `${cat}::${topic}`;
			topicCounts.set(key, (topicCounts.get(key) || 0) + 1);
		});

		const likertWeight = { 'strongly agree': 2, 'agree': 1, 'neutral': 0, 'disagree': -1, 'strongly disagree': -2 };
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
			const cat = String(q.category || '').toLowerCase();
			const topic = String(q.topic || q.category || '').toLowerCase();
			const denom = topicCounts.get(`${cat}::${topic}`) || 1;
			const normalizedW = w / denom;
			const key = `${cat}::${topic}`;
			const rows = idx.get(key) || [];
			for (const r of rows) {
				const base = parseInt(r.score || 1) || 1;
				const delta = base * normalizedW;
				add(r.major_name, delta, r.category, q.topic || q.category || '');
			}
		}

		// Build full QA list for model grounding
		const majorAnswers = Object.entries(rawAnswers).map(([qid, choice]) => {
			const q = byId.get(String(qid));
			return {
				id: q ? q.id : Number(qid),
				category: q ? q.category : null,
				topic: q ? (q.topic || q.category || null) : null,
				question: q ? q.question : null,
				choice: String(choice)
			};
		});

		// MBTI blend (same as /api/major/calculate)
		let mbtiType = latestMbti?.type || null;
		if (mbtiType) {
			const MBTI_BLEND = 0.5;
			const letters = String(mbtiType).split('-')[0].split('');
			for (const letter of letters) {
				const key = `mbti::${String(letter).toLowerCase()}`;
				const rows = idx.get(key) || [];
				for (const r of rows) {
					const base = parseInt(r.score || 1) || 1;
					const delta = base * MBTI_BLEND;
					add(r.major_name, delta, 'MBTI', letter);
				}
			}
		}

		const enriched = majorsList.map(m => ({ name: m.name, score: tallies.get(m.name) || 0, description: m.description }));
		enriched.sort((a, b) => b.score - a.score);
		const positives = enriched.filter(e => e.score > 0);
		const top = (positives.length ? positives : enriched).slice(0, 3);
		const maxScore = (top[0]?.score > 0) ? top[0].score : 1;
		const normalizedTop = top.map(e => ({ name: e.name, match: Math.max(0, Math.round((e.score / maxScore) * 100)), description: e.description }));

		function summarizeReasons(majorName) {
			const list = contribs.get(majorName) || [];
			const byKey = new Map();
			for (const c of list) {
				const key = `${String(c.category || '').toLowerCase()}::${String(c.topic || '').toLowerCase()}`;
				byKey.set(key, (byKey.get(key) || 0) + c.impact);
			}
			const arr = Array.from(byKey.entries()).map(([key, impact]) => {
				const [category, topic] = key.split('::');
				return { category, topic, impact };
			}).sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
			return arr.slice(0, 8);
		}

		// Optionally include a short MBTI description snippet
		let mbtiSnippet = null;
		try {
			if (mbtiType && personalitiesCache[mbtiType] && personalitiesCache[mbtiType].content) {
				const raw = String(personalitiesCache[mbtiType].content);
				mbtiSnippet = raw.slice(0, 700);
			}
		} catch (_) {}

		return {
			mbti: { type: mbtiType, snippet: mbtiSnippet },
			topMajors: normalizedTop.map(t => ({
				name: t.name,
				match: t.match,
				reasons: summarizeReasons(t.name)
			})),
			answeredCount: Object.keys(rawAnswers || {}).length,
			majorAnswers
		};
	} catch (e) {
		return null;
	}
}

// OpenAI Chat endpoint
app.post('/api/chat', authMiddleware, async (req, res) => {
    try {
        if (!OPENAI_API_KEY) return res.status(500).json({ error: 'Server not configured: missing OPENAI_API_KEY' });
        const body = req.body || {};
        const rawMessages = Array.isArray(body.messages) ? body.messages : [];
        const single = body.message ? String(body.message) : '';
        const temperatureRaw = Number(body.temperature);
        const model = String(body.model || '').trim() || 'gpt-4o-mini';
        const temperature = Number.isFinite(temperatureRaw) ? Math.min(Math.max(temperatureRaw, 0), 2) : 0.7;

        const userMessages = rawMessages.length ? rawMessages : (single ? [{ role: 'user', content: single }] : []);
        if (!userMessages.length) return res.status(400).json({ error: 'messages or message is required' });

		// Lightweight domain-specific system instruction
		let systemContent = 'You are Major Match AI, a helpful assistant for students exploring majors and careers. Be concise and clear. Always ground your answers in the user\'s own test responses and MBTI when applicable.';

		// Build latest test/MBTI context for grounding
		const majorContext = await buildMajorAiContext(req.user.id);
		const contextMessage = majorContext ? {
			role: 'system',
			content: `User context (JSON): ${JSON.stringify(majorContext)}. When explaining why a major was recommended, explicitly reference the most influential categories/topics from reasons. Avoid generic statements.`
		} : null;

		const messages = [
			{ role: 'system', content: systemContent },
			...(contextMessage ? [contextMessage] : []),
			...userMessages.map(m => ({ role: String(m.role || 'user'), content: String(m.content || '') }))
		];

        const resp = await axios.post('https://api.openai.com/v1/chat/completions', {
            model,
            messages,
            temperature,
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        const text = (resp.data && resp.data.choices && resp.data.choices[0] && resp.data.choices[0].message && resp.data.choices[0].message.content) ? String(resp.data.choices[0].message.content).trim() : '';
        return res.json({ reply: text });
    } catch (e) {
        const status = (e.response && e.response.status) ? e.response.status : 500;
        const detail = (e.response && e.response.data && (e.response.data.error || e.response.data)) ? e.response.data : { error: 'Server error' };
        return res.status(status >= 400 && status < 600 ? status : 500).json(detail);
    }
});

// Start
// Start server and perform seeding when Mongo is connected
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    if (req.path.startsWith('/static/')) return next();
    if (req.path.includes('.')) return next();
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });

if (mongoose.connection) {
    mongoose.connection.once('open', async () => {
        try {
            await ensureMbtiSeedMongo();
            await ensureMajorSeedMongo();
            await loadMbtiCache();
            console.log('Initial seed and cache load completed after DB open');
        } catch (e) {
            console.warn('Post-connection seed/cache failed:', e.message);
        }
    });
}