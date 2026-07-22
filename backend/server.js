const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_nexus_key_123';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Seed data array with 75 pre-existing nodes
const SEED_POSTS = [
  // ==================== 🚀 STARTUPS ====================
  { username: "rohit_iitd", title: "Building D2C from Jaipur: Why logistics in Tier-2 cities is breaking our margins", content: "We expanded our organic personal care brand to Tier-2 Rajasthan. RTO (Return to Origin) rates on Cash-on-Delivery are sitting at 35%. Anyone solved COD verification for Tier-2 buyers without tanking checkout conversion?", category: "🚀 Startups", score: 84 },
  { username: "aarav_builds", title: "Bootstrapping vs Angel Money in Bengaluru right now", content: "Got an angel check offer of ₹25 Lakhs for 8% equity. But our SaaS tool is already pulling ₹1.8L MRR. Should we dilute this early or stay bootstrapped till ₹5L MRR?", category: "🚀 Startups", score: 112 },
  { username: "priya_agritech", title: "AgriTech pitch deck realities: VCs don't care about tech if ground distribution fails", content: "Pitched to 14 VCs in Mumbai. Every single partner asked the exact same question: 'How do you convince a farmer in Nashik to replace their local distributor?' Lesson: Build distribution before showing AI models.", category: "🚀 Startups", score: 156 },
  { username: "karan_solo", title: "College founder struggle: Juggling semester exams while closing enterprise clients", content: "Final year B.Tech at VTU. Client demo scheduled at 10 AM, Internal lab exam at 11:30 AM. How are student founders managing sanity during placements week?", category: "🚀 Startups", score: 67 },
  { username: "sneha_qcommerce", title: "Quick-commerce dark stores in Hyderabad are getting brutally competitive", content: "Blinkit and Zepto are setting up hubs within 1.5 km radius everywhere in Gachibowli. If you're building hyper-local supply chain tools, focus on inventory prediction, not delivery speed.", category: "🚀 Startups", score: 93 },
  { username: "vikram_b2b", title: "Cold emailing Indian CFOs: What actually worked for our B2B SaaS startup", content: "Sent 450 cold emails. Zero response from long paragraphs. Converted 4 pilots after changing subject line to 'Quick question regarding [Company] GST reconciliation workflow'. Keep it under 60 words.", category: "🚀 Startups", score: 210 },
  { username: "dev_pune", title: "Co-founder breakup at seed stage — Protect your startup with proper Vesting", content: "My technical co-founder left after 7 months to join Big Tech. Luckily we had a 4-year vesting schedule with a 1-year cliff. Set up your SHA carefully on day 1!", category: "🚀 Startups", score: 178 },
  { username: "tanya_edtech", title: "EdTech post-2024 pivot: B2C is dead, focus on B2B university integrations", content: "Direct consumer acquisition cost (CAC) for selling skill courses in India is higher than average order value. Shifted to selling B2B AI-evaluators directly to Tier-2 engineering colleges.", category: "🚀 Startups", score: 124 },
  { username: "harsh_hardware", title: "Manufacturing EV components locally in Pune: Sourcing headaches", content: "Finding reliable CNC machining vendors who deliver on time without 40% defect rates is insanely hard. Any EV hardware founders here got vendor recommendations in MH industrial belt?", category: "🚀 Startups", score: 45 },
  { username: "ananya_climate", title: "Grants vs Equity for Sustainability startups in India", content: "Just secured ₹15L BIRAC BIG Grant! For deep-tech and climate startups, exhaust government grant schemes before taking VC money. It gives you 18 months of burn runway without dilution.", category: "🚀 Startups", score: 132 },
  { username: "kabir_product", title: "Why young Indian founders over-engineer products before talking to 10 users", content: "Spent 3 months building microservices and complex dashboards. Launched to zero users. Redid everything into a simple WhatsApp bot and closed our first 50 paid users in 10 days.", category: "🚀 Startups", score: 290 },
  { username: "megha_legal", title: "DPDP Act compliance for Indian startups: Don't ignore privacy laws", content: "Digital Personal Data Protection rules are getting enforced heavily. Make sure your user sign-up flows have clear consent language for Indian phone numbers and OTP verification.", category: "🚀 Startups", score: 88 },
  { username: "varun_health", title: "ABDM Integration for HealthTech: Trial by fire", content: "Connecting our clinic software to Ayushman Bharat Digital Mission APIs was rough. But once certified, doctors trust the platform way more. Worth the tech headache.", category: "🚀 Startups", score: 59 },
  { username: "ritika_design", title: "Hiring product designers in Koramangala vs Remote Tier-3 talent", content: "Bangalore designers asking 25 LPA for 2 YOE. Found an incredible UI designer from Bhopal on Twitter paying 8 LPA who works 2x faster. Don't restrict hiring to metro cities.", category: "🚀 Startups", score: 204 },
  { username: "sid_pivot", title: "Shut down my first startup at 22. Here is everything I learned", content: "Spent ₹6 Lakhs of saved internship money on an event booking app. Burned out after 14 months. Main takeaway: Monetization plan must exist from week 2, not 'someday after scale'.", category: "🚀 Startups", score: 310 },

  // ==================== 💰 FINANCE ====================
  { username: "fintech_rahul", title: "UPI Autopay integration for recurring SaaS subscriptions in India", content: "Credit card penetration in India is <4%, but UPI Autopay mandate approval rate is still tricky for micro-transactions under ₹200. Anyone using Razorpay or Cashfree for monthly SaaS?", category: "💰 Finance", score: 142 },
  { username: "ca_shivam", title: "GST registration for registered freelancers and bootstrapped solo founders", content: "Friendly reminder: If your export revenue (selling SaaS to US/EU) crosses ₹20L, get GST + LUT filed immediately. Don't pay 18% GST out of pocket due to missed paperwork.", category: "💰 Finance", score: 198 },
  { username: "neha_invests", title: "How we manage startup treasury: Nifty Liquid Funds vs FD yields", content: "Keeping ₹40L idle in a current account is burning money to inflation. We move 70% of unused runway into overnight/liquid funds with instant redemption to earn ~6.5% yield.", category: "💰 Finance", score: 87 },
  { username: "aditya_quant", title: "Building algo-trading APIs with Zerodha Kite & Dhan: System Latency insights", content: "If you are building fintech tools on top of broker APIs in India, WebSocket connection drops around 9:15 AM market open are common. Always implement auto-reconnect fallback queues.", category: "💰 Finance", score: 115 },
  { username: "pawan_esop", title: "ESOP pool taxation for early employees in Indian startups", content: "Pre-seed founders: Please explain tax at exercise vs tax at sale to your first 5 engineers. Many young devs don't know they face tax liabilities on paper valuation gains during exercise.", category: "💰 Finance", score: 164 },
  { username: "deepak_debt", title: "Venture Debt in India: Is 14-16% interest rate worth avoiding equity dilution?", content: "We are at ₹15L MRR and considering venture debt from Stride / Alteria to fund inventory for Diwali rush. Is debt safer than taking another bridge equity round?", category: "💰 Finance", score: 76 },
  { username: "pooja_bootstrapped", title: "Invoicing overseas clients from India without losing 4% to Forex conversion fees", content: "Switched from PayPal to Wise & Skydo for receiving USD client payments in HDFC bank account. Saved almost ₹35,000 every month on auto-FIRC and conversion spreads.", category: "💰 Finance", score: 240 },
  { username: "kunal_wealth", title: "Gen-Z money habits in Gurgaon: 50% salary straight into SIPs and Nifty 50", content: "Worked 2 years in tech startup, monthly salary ₹95k. Rent is ₹22k, living expenses ₹25k, remaining ₹48k split into Index funds + Emergency fund. Stay disciplined early!", category: "💰 Finance", score: 189 },
  { username: "siddharth_ca", title: "Section 80IAC Tax Exemption for DPIIT Recognized Startups", content: "Most founders forget to apply for Inter-Ministerial Board (IMB) tax exemption certificate after DPIIT startup registration. It gives 3 consecutive years 100% tax holiday!", category: "💰 Finance", score: 130 },
  { username: "tarun_credit", title: "Corporate Credit Cards for Indian Startups (EnKash / RazorpayX)", content: "Which corporate card provider offers best forex markup rates for paying AWS, OpenAI, and GitHub bills? Currently getting slapped with 3.5% markup charges.", category: "💰 Finance", score: 95 },
  { username: "yash_micro", title: "Micro-loans vs BNPL models under RBI's latest digital lending guidelines", content: "Building fintech in India means regulatory compliance moves fast. FLDG (First Loss Default Guarantee) caps at 5% forced us to restructure our entire credit risk algorithm.", category: "💰 Finance", score: 62 },
  { username: "shruti_cashflow", title: "Managing B2B payment terms: How we reduced payment delays from 90 days to 15 days", content: "Indian corporate clients love 90-day payment cycles. We started offering a 2% discount for payments cleared within 10 days. Cashflow improved instantly.", category: "💰 Finance", score: 173 },
  { username: "aman_valuation", title: "Pre-revenue valuation formulas VC associates actually use in India", content: "Don't fall for DCF models when you have zero revenue. VCs look at team pedigree, TAM size in India, and comparable seed rounds in your sector (usually ₹8Cr - ₹20Cr cap).", category: "💰 Finance", score: 151 },
  { username: "divya_crypto", title: "1% TDS on Virtual Digital Assets in India: Compliance nightmare for Web3", content: "Managing Web3 startup payroll in crypto while staying 100% tax compliant with Indian IT department guidelines requires heavy ledger auditing. Keep clean records from day 1.", category: "💰 Finance", score: 54 },
  { username: "gautam_banking", title: "Current Account setup speed: Neo-banks vs Traditional Public/Private Banks", content: "State Bank vs ICICI vs Neo-banks (Open / Jupiter). Took 3 weeks with traditional bank paperwork versus 48 hours with digital onboarding. Pick banking partners wisely.", category: "💰 Finance", score: 108 },

  // ==================== 📈 MARKETING ====================
  { username: "tanmay_growth", title: "LinkedIn organic distribution in India is currently the cheat code for B2B", content: "We posted daily breakdown carousels about Indian supply chain bottlenecks. Reached 1.2M impressions in 60 days without spent on ads. 14 enterprise inbound leads generated.", category: "📈 Marketing", score: 230 },
  { username: "radhika_d2c", title: "Meta Ads ROAS in India dropped from 3.5x to 1.4x — What changed?", content: "Customer acquisition cost on Instagram reels ads skyrocketed in Tier-1 cities. We shifted 40% ad budget into micro-influencers on Moj & Josh for Tier-2 reach with much better conversion.", category: "📈 Marketing", score: 167 },
  { username: "whatsapp_hustle", title: "WhatsApp Marketing > Email Marketing for Indian consumers. Period.", content: "Email open rates in India are barely 12%. Our WhatsApp broadcast campaigns get 82% open rates and 24% click-through rate. Use official WhatsApp Business API with green tick.", category: "📈 Marketing", score: 285 },
  { username: "rohan_seo", title: "SEO strategy for targeting regional language searches (Hindi, Tamil, Telugu)", content: "Over 70% of new internet users in India consume content in regional languages. Translating landing pages into Hindi & Tamil boosted our organic search traffic by 180%.", category: "📈 Marketing", score: 141 },
  { username: "ishita_brand", title: "Memes as a performance marketing tool for Indian Gen-Z tech products", content: "Hired an 18-year-old meme page admin as a marketing intern. Replaced boring banners with trending Instagram meme templates. Conversions went up 3x on our app downloads.", category: "📈 Marketing", score: 320 },
  { username: "nikhil_copy", title: "Hinglish Ad Copy vs Clean English Copy testing results", content: "Ran A/B test on Facebook Ads. Headline A: 'Get affordable cloud hosting today'. Headline B: 'Sasta aur durable cloud hosting for your startup'. Headline B had 45% lower Cost Per Click!", category: "📈 Marketing", score: 195 },
  { username: "varun_community", title: "Building a Telegram community before product launch: 0 to 5,000 members", content: "Instead of building a waitlist page, we built a Telegram group sharing daily high-value crypto & fintech updates. When we launched our beta, 800 members signed up instantly.", category: "📈 Marketing", score: 110 },
  { username: "kriti_influencer", title: "Micro-influencer scams in Mumbai & Bangalore: Watch out for fake engagement", content: "Paid ₹20,000 to a fashion creator with 100k followers. Got 3 sales total. Checked analytics: 80% followers were bot accounts from click farms. Always ask for 30-day story view screenshots!", category: "📈 Marketing", score: 215 },
  { username: "sahil_producthunt", title: "How an Indian dev team hit #2 Product of the Day on Product Hunt", content: "Key learning: Build an active Twitter pre-launch audience 2 months prior. Don't post at 12 PM IST — time your launch exactly at 12:01 AM PST (12:31 PM IST) to capture US upvotes.", category: "📈 Marketing", score: 260 },
  { username: "mayank_b2bgrowth", title: "Sponsoring college tech fests in IITs/NITs: Is it worth the marketing spend?", content: "Spent ₹1 Lakh sponsoring a hackathon at IIT Bombay. Got 400 high-quality developer signups and 3 top-tier intern hires. Incredible ROI if you are selling dev-tools.", category: "📈 Marketing", score: 135 },
  { username: "deepa_pr", title: "Getting featured in YourStory / Inc42 / Entrackr without paying PR agencies", content: "PR agencies asked for ₹1.5 Lakhs/month retainer. Instead, I messaged tech journalists directly on Twitter with concise data points on our recent traction. Got covered organically in 1 week.", category: "📈 Marketing", score: 201 },
  { username: "harsh_youtube", title: "YouTube long-form tutorials are the ultimate top-of-funnel for dev products", content: "Created a 45-minute step-by-step Hindi tutorial on setting up backend APIs. Got 45,000 organic views and hundreds of stars on our GitHub repo. Don't sleep on YouTube SEO.", category: "📈 Marketing", score: 177 },
  { username: "anita_retention", title: "Churn reduction strategy: SMS & Push notifications in Indian app market", content: "Apps in India face 70% 30-day churn. We started sending contextual push notifications (e.g. 'Your cashback expires in 3 hours') which boosted Day-30 retention by 22%.", category: "📈 Marketing", score: 98 },
  { username: "karan_referral", title: "Viral referral loops: Why 'Refer & Earn ₹50' works so well in India", content: "Gpay mastered it, now every consumer app uses UPI scratch cards. We added a instant ₹25 UPI transfer on successful friend referral. CAC dropped from ₹140 to ₹35.", category: "📈 Marketing", score: 288 },
  { username: "praveen_b2c", title: "Cold Calling in India: Dead or still kicking for high-ticket services?", content: "Outbound tele-calling still works amazingly well for real estate and high-ticket B2B in India, but Truecaller spam flags are a major blocker. Clean your caller ID list daily.", category: "📈 Marketing", score: 82 },

  // ==================== 🤖 TECH & AI ====================
  { username: "vikas_ai", title: "Fine-tuning Llama-3 models for Indian languages (Indic LLMs)", content: "Trained Llama-3 8B on Hindi-English code-switched customer support transcripts. GPU costs on AWS p4d instances were getting insane, so we switched to local RTX 4090 rig. Insights inside.", category: "🤖 Tech & AI", score: 215 },
  { username: "arjun_devops", title: "AWS Cloud bill optimization: Dropped monthly bill from $3,200 to $850", content: "Indian early-stage startups burn so much cash on misconfigured RDS instances and unattached EBS volumes. Moved dev workloads to Hetzner / DigitalOcean and used Spot instances on AWS.", category: "🤖 Tech & AI", score: 340 },
  { username: "pooja_fullstack", title: "React Native vs Flutter for building cross-platform apps in India", content: "Built products with both. If you need deep native modules (like sound level detection or bluetooth thermal printers for billing machines), React Native still wins. What's your pick?", category: "🤖 Tech & AI", score: 128 },
  { username: "siddharth_rust", title: "Why our engineering team rewrote our core payment ingestion pipeline in Rust", content: "Golang was great, but handling 10,000 concurrent webhooks/sec during flash sales was causing garbage collection latency spikes. Rust cut our server memory consumption by 70%.", category: "🤖 Tech & AI", score: 275 },
  { username: "bengaluru_coder", title: "System Design for handling Diwali Sale traffic surges (100k RPM)", content: "Lessons learned from scaling our e-commerce microservices: Redis caching everywhere, rate limiting at Cloudflare edge, and async event queues (Kafka) for inventory updates.", category: "🤖 Tech & AI", score: 198 },
  { username: "priyanka_rag", title: "Building RAG pipelines over complex Indian legal & GST PDF documents", content: "Chunking structured tables inside government circular PDFs is notoriously hard. Standard LangChain recursive splitters fail. Using LlamaIndex + Unstructured parser gave us 90% retrieval accuracy.", category: "🤖 Tech & AI", score: 162 },
  { username: "gokul_backend", title: "Postgres vector database vs Pinecone for early stage AI startups", content: "Don't pay $70/mo for managed vector DBs when you have under 500k embeddings. `pgvector` extension running on your existing PostgreSQL database works seamlessly and costs zero extra.", category: "🤖 Tech & AI", score: 230 },
  { username: "tanvi_sec", title: "Security vulnerabilities found in popular Indian fintech APIs during audit", content: "Audited 12 startup web applications last month. Most common flaw: Broken Object Level Authorization (BOLA) where changing `user_id` in API payload exposes another user's personal data.", category: "🤖 Tech & AI", score: 310 },
  { username: "rahul_mobile", title: "Offline-first sync architectures for apps built for rural connectivity", content: "If your app is used by field agents in rural Bihar or Odisha, network drops are constant. We built an offline SQLite queue using WatermelonDB that syncs in background when 2G returns.", category: "🤖 Tech & AI", score: 145 },
  { username: "sumit_mlops", title: "Deploying AI models on edge devices (Raspberry Pi & Jetson) for smart retail", content: "Running computer vision models locally inside retail stores to track shelf stock. Quantizing YOLOv8 models to ONNX runtime reduced inference time from 200ms to 24ms per frame.", category: "🤖 Tech & AI", score: 118 },
  { username: "aditi_web3", title: "Zero-Knowledge proofs (ZK-Rollups) implementation for private identity verification", content: "Exploring how ZK circuits can let users verify their age/income without exposing full Aadhaar or bank statement details to 3rd party dApps.", category: "🤖 Tech & AI", score: 82 },
  { username: "kartik_nextjs", title: "Next.js App Router performance optimizations on Vercel deployment", content: "Server side rendering cold starts were killing our Google Lighthouse speed score in India (slow mobile 4G networks). Implementing aggressive static page generation made our site load under 1.2s.", category: "🤖 Tech & AI", score: 184 },
  { username: "chetan_data", title: "Apache Kafka vs RabbitMQ for real-time order processing architecture", content: "If you need event replay capabilities for audit logs, Kafka is the clear winner. For simple task distribution among background workers, RabbitMQ setup took us 10 minutes.", category: "🤖 Tech & AI", score: 104 },
  { username: "divya_qa", title: "Automating E2E testing with Playwright instead of Cypress", content: "Playwright's multi-tab support and speed when running parallel test suites saved our frontend deployment pipeline hours every week. Highly recommended for React apps.", category: "🤖 Tech & AI", score: 91 },
  { username: "neeraj_cloud", title: "Self-hosting open source AI tools on local GPUs vs paying OpenAI API credits", content: "We were spending $1,200/month on GPT-4 API calls for text summarization. Renting a dedicated GPU server on local cloud for $250/mo running Mixtral model handled 10x traffic.", category: "🤖 Tech & AI", score: 265 },

  // ==================== ☕ LOUNGE ====================
  { username: "koramangala_coder", title: "Best cafes with reliable Wi-Fi and power sockets in HSR / Koramangala", content: "Third Wave Coffee and Blue Tokai are always packed after 2 PM. Found a quiet work-friendly spot in HSR Sector 3 with 200 Mbps Wi-Fi and plenty of charging ports. What's your go-to spot?", category: "☕ Lounge", score: 175 },
  { username: "sleep_deprived_dev", title: "How many cups of filter coffee / chai before your heart starts beating in code?", content: "Currently on cup #4 of cutting chai at 3:00 AM while trying to fix a production bug before morning sprint demo. Send help or extra caffeine recommendations.", category: "☕ Lounge", score: 210 },
  { username: "gurgaon_commute", title: "Cyber City traffic vs Working From Home burnout", content: "Spent 1.5 hours on Rapid Metro and Cyber Hub flyover today. WFH felt lonely, but going to office eats up 3 hours of life daily. How are Gurgaon founders managing hybrid work balance?", category: "☕ Lounge", score: 154 },
  { username: "ananya_books", title: "Top 3 books every 20-something founder in India should read", content: "My list: 1. 'The Mom Test' by Rob Fitzpatrick (must read for user interviews), 2. 'Zero to One' by Peter Thiel, 3. 'The Hard Thing About Hard Things' by Ben Horowitz. What's on your bookshelf?", category: "☕ Lounge", score: 245 },
  { username: "standing_desk_guy", title: "Ergonomics warning: Don't ruin your back at 23 by coding on a bed", content: "Spent 2 years working on laptop lying on bed during COVID/startup days. Now facing lower back stiffness. Invest in a decent ergonomic chair (Featherlite / Green Soul) before it hurts!", category: "☕ Lounge", score: 380 },
  { username: "prateek_desk", title: "Show off your minimal desk setup / dev environment!", content: "M2 MacBook Air + 27-inch 4K LG Monitor + Keychron K2 Mechanical Keyboard + Green plants on desk. What does your late-night coding setup look like?", category: "☕ Lounge", score: 190 },
  { username: "startup_family", title: "How to explain to Indian parents what 'Building a SaaS Startup' actually means", content: "My relatives still ask why I didn't take up the TCS / Infosys campus placement offer or prepare for UPSC exams. Anyone else dealing with the 'When will you get a real job?' question?", category: "☕ Lounge", score: 410 },
  { username: "pune_vibe", title: "Balewadi High Street vs Baner for networking meetups", content: "Organizing a casual weekend meetup for early-stage founders and tech builders in Pune. Any good open places that can accommodate ~20 folks without booking fees?", category: "☕ Lounge", score: 88 },
  { username: "fitness_founder", title: "Preventing startup burnout: 45 minutes of daily gym / running saves productivity", content: "Used to think working 16 hours straight was a badge of honor. Got sluggish and unfocused. Switched to 10 hours of focused work + 1 hour gym daily. Output doubled.", category: "☕ Lounge", score: 295 },
  { username: "chai_point_fan", title: "Irani Chai vs Filter Coffee: The debate that divides Indian dev teams", content: "Our office in Hyderabad is split 50/50. Team South wants hot Filter Coffee, while the north/west folks want hot Irani Chai & Osmania biscuits at 4 PM daily.", category: "☕ Lounge", score: 165 },
  { username: "remote_life_goa", title: "Working remotely from Goa for 3 months: Expectations vs Reality", content: "Expectation: Coding on the beach under coconut trees. Reality: Glare on laptop screen, humidity killing electronics, and power cuts during rain. Get a good co-working space pass instead!", category: "☕ Lounge", score: 330 },
  { username: "music_for_code", title: "What music genre do you listen to while writing complex logic?", content: "Lofi Beats, Synthwave/Cyberpunk, or Indian Classical (Sitar / Flute instrumental)? Drop your Spotify / YouTube music playlists for deep work focus!", category: "☕ Lounge", score: 140 },
  { username: "tech_podcast_listener", title: "Best Indian startup podcasts for long commutes", content: "Currently loving 'The Indian Startup Show', '3ixp Podcast', and 'The Ranveer Show' tech episodes. What podcasts are keeping you company on daily commutes?", category: "☕ Lounge", score: 112 },
  { username: "side_hustle_diaries", title: "Building a side project on weekends while working a 9-to-5 job", content: "Rule #1: Restrict side project scope so MVP takes 2 weekends max. Rule #2: Don't touch side project code during company hours. Stay clean, stay focused.", category: "☕ Lounge", score: 270 },
  { username: "weekend_hackathon", title: "Who else is staying up all night for the online hackathon this weekend?", content: "Building an open-source tool for indie hackers in 48 hours. Coffee stocked, RedBull on standby, Discord voice channel active. Let's build!", category: "☕ Lounge", score: 182 }
];

// Automatically create tables if they do not exist AND seed initial posts
const initDb = async () => {
  try {
    // 1. Create Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL
      );
    `);
    console.log("🟢 SYSTEM CHECK: 'users' table verified/created.");

    // 2. Create Posts Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(255) NOT NULL DEFAULT '🚀 Startups',
        image_url TEXT DEFAULT '',
        score INTEGER DEFAULT 1,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("🟢 SYSTEM CHECK: 'posts' table verified/created.");

    // 3. Create Comments Table (linked securely to posts)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        username VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("🟢 SYSTEM CHECK: 'comments' table verified/created.");

    // 4. AUTO-SEED DATABASE WITH INITIAL NODES IF EMPTY
    const postCount = await pool.query('SELECT COUNT(*) FROM posts');
    if (parseInt(postCount.rows[0].count) === 0) {
      console.log("🌱 SEEDING DATABASE: Inserting 75 pre-existing community nodes...");
      for (const node of SEED_POSTS) {
        await pool.query(
          `INSERT INTO posts (username, title, content, category, score) 
           VALUES ($1, $2, $3, $4, $5)`,
          [node.username, node.title, node.content, node.category, node.score]
        );
      }
      console.log("🟢 SEED COMPLETE: 75 founder nodes successfully loaded into PostgreSQL!");
    }

  } catch (err) {
    console.error("🔴 SYSTEM CHECK FAILED / DATABASE INITIALIZATION ERROR:", err);
  }
};

// Execute the database check & seed process
initDb();

// Safely ensure is_deleted column exists on older tables
pool.query(`
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
`)
.then(() => console.log("🟢 DATABASE UPDATE: 'is_deleted' column successfully verified in 'posts' table."))
.catch(err => console.error("🔴 DATABASE UPDATE FAILED:", err));

// ==========================================
// AUTHENTICATION ROUTES (Register & Login)
// ==========================================

// 1. REGISTER A NEW USER
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Fill out all fields' });

    const userExist = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
      [username, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error("REGISTRATION DATABASE ERROR:", error);
    res.status(500).json({ error: 'Authentication Failed', details: error.message });
  }
});

// 2. USER LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid Username or Password' });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid Username or Password' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, username: user.username });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// CORE FORUM ROUTES
// ==========================================

// FETCH ALL ACTIVE POSTS
app.get('/api/posts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.username, p.title, p.content, p.category, p.image_url, p.score, p.created_at,
             COALESCE(
               (SELECT json_agg(c.* ORDER BY c.created_at ASC) 
                FROM comments c 
                WHERE c.post_id = p.id), 
               '[]'
             ) AS comments
      FROM posts p
      WHERE p.is_deleted = FALSE OR p.is_deleted IS NULL
      ORDER BY p.score DESC, p.created_at DESC;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// CREATE POST
app.post('/api/posts', async (req, res) => {
  try {
    const { username, title, content, category, imageUrl } = req.body;
    const selectedCategory = category || '🚀 Startups'; 
    const finalImage = imageUrl || '';
    
    const newPost = await pool.query(
      'INSERT INTO posts (username, title, content, category, image_url, score) VALUES($1, $2, $3, $4, $5, 1) RETURNING *',
      [username, title, content, selectedCategory, finalImage]
    );
    res.json(newPost.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// CREATE A NEW COMMENT
app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, content } = req.body;
    
    const newComment = await pool.query(
      'INSERT INTO comments (post_id, username, content) VALUES($1, $2, $3) RETURNING *',
      [id, username, content]
    );
    res.json(newComment.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PATCH ROUTE TO HANDLE THREAD VOTING
app.patch('/api/posts/:id/vote', async (req, res) => {
  const { id } = req.params;
  const { direction } = req.body;

  const voteValue = direction === 'up' ? 1 : direction === 'down' ? -1 : 0;

  if (voteValue === 0) {
    return res.status(400).json({ error: "Invalid voting parameters provided." });
  }

  try {
    const result = await pool.query(
      `UPDATE posts 
       SET score = score + $1 
       WHERE id = $2 
       RETURNING *`,
      [voteValue, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Target thread node not found." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Database voting execution error:", error);
    res.status(500).json({ error: "Internal server database modification failure." });
  }
});

// ADMINISTRATIVE DELETE ROUTE (SOFT DELETE WITH ADMIN SECRET CONTROL)
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const adminSecret = req.headers['x-admin-secret'];

    if (adminSecret === 'my_ultra_secret_admin_password_123') {
      // Soft Delete
      const result = await pool.query(
        'UPDATE posts SET is_deleted = TRUE WHERE id = $1 RETURNING *', 
        [id]
      );
      if (result.rows.length === 0) return res.status(404).json({ message: "Thread node not found." });
      return res.json({ message: "Thread node securely archived and virtually hidden.", deletedPost: result.rows[0] });
    } else {
      // Hard Delete
      await pool.query('DELETE FROM comments WHERE post_id = $1', [id]);
      const result = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) return res.status(404).json({ message: "Thread node not found." });
      return res.json({ message: "Thread node permanently deleted.", deletedPost: result.rows[0] });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Administrative Server Error');
  }
});

// ==========================================
// SERVER INITIALIZATION
// ==========================================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`==> Server running securely on port ${PORT}`);
});