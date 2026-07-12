// backend/seed.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'forum_db', // Keep your corrected DB name from image_bf1dc5.png!
  password: '1234', // Your actual DB password
  port: 5432,
});

const mockPosts = [
  // 🚀 Startups
  {
    username: 'koramangala_hustler',
    title: 'Is it even possible to build a profitable D2C brand in India without burning crores on Meta ads?',
    content: 'We are scaling a clean-label snack brand out of Bangalore. Our CAC on Instagram is absolutely killing our unit economics. Logistics through Delhivery/Xpressbees eats another huge chunk. Has anyone successfully cracked organic distribution or quick-commerce (Blinkit/Zepto) optimization early on?',
    category: '🚀 Startups',
    score: 54,
    comments: [
      { username: 'zepto_vendor', content: 'Quick commerce is the new SEO. If you aren’t on Blinkit or Zepto in top metros, you don’t exist for India 1 consumers.' },
      { username: 'bootstrapped_raj', content: 'Focus on WhatsApp community building. Sounds old school, but our repeat order rate there is 45% with zero ad spend.' }
    ]
  },
  {
    username: 'tech_mazdoor',
    title: 'The tech talent market in Gurgaon right now is getting out of hand again',
    content: 'Trying to hire a senior backend engineer (3-5 YOE). Candidates with an current CTC of 18 LPA are casually asking for 35 LPA + joining bonus, only to drop the offer on day 1 because an AI startup outbid them. How are early-stage founders competing?',
    category: '🚀 Startups',
    score: 41,
    comments: [
      { username: 'cto_indiranagar', content: 'Stop hiring from big tech. Look for tier-2/3 college grads who have solid GitHub profiles and give them aggressive equity. Loyalty is higher.' }
    ]
  },
  {
    username: 'saas_babu',
    title: 'Building from Chennai, Selling to US: Cracking the $10k MRR barrier',
    content: 'Cross-border SaaS from India is the ultimate cheat code. Our operating costs are in INR but we collect in USD via Stripe. The hardest part is setting up a clean Delaware flip-flip structure for future institutional funding.',
    category: '🚀 Startups',
    score: 63,
    comments: []
  },

  // 💰 Finance
  {
    username: 'ca_aniket',
    title: 'Angel Tax nightmare: Dealing with recent Section 56(2)(viib) IT notices',
    content: 'Just received an assessment order questioning our valuations from an angel round we did 2 years ago. Any startup founders here figured out a clean process with their CAs to resolve this without getting bank accounts frozen?',
    category: '💰 Finance',
    score: 38,
    comments: [
      { username: 'legal_eagle_delhi', content: 'File an appeal under the DPIIT startup recognition exemption immediately. Don’t delay this.' }
    ]
  },
  {
    username: 'crore_dreamer',
    title: 'Why early-stage VCs in India are pivoting hard toward manufacturing and EV infrastructure',
    content: 'Spoke to three associates this week from top funds. Nobody wants to fund pure consumer apps anymore. The consensus is shifted entirely toward deep-tech, electronics manufacturing (EMS), and localization of the EV supply chain under Make in India.',
    category: '💰 Finance',
    score: 27,
    comments: []
  },
  {
    username: 'equity_guy',
    title: 'How to structure ESOP pools for first 10 employees in an Indian pvt ltd company',
    content: 'Should I keep a standard 1-year cliff with 4-year linear vesting, or are people doing monthly vesting post-cliff now to keep tech teams happy in Bangalore?',
    category: '💰 Finance',
    score: 19,
    comments: [
      { username: 'founder_alpha', content: 'Stick to a 1-year cliff. If someone leaves in 6 months, managing unvested shares on the MCA portal is a compliance headache.' }
    ]
  },

  // 📈 Marketing
  {
    username: 'chai_and_growth',
    title: 'Cracking the "Bharat" market: Why English copy is losing you 80% of India 2',
    content: 'We localized our fintech onboarding app into Hindi, Telugu, and Marathi last month. Conversion rates shot up by 210%. If your product targets users outside south Mumbai or south Delhi, you need vernacular micro-influencers.',
    category: '📈 Marketing',
    score: 48,
    comments: [
      { username: 'pixel_tracker', content: 'Spot on. Tier-2 and Tier-3 users trust local YouTube creators way more than flashy Instagram ads.' }
    ]
  },
  {
    username: 'memelord_startup',
    title: 'Is anyone else tired of corporate LinkedIn posts by Indian founders?',
    content: 'Every post is either "Extremely humbled and honored to be featured in Inc42" or a 10-paragraph story about how hiring a delivery driver taught them a lesson about product-market fit. Does this actually drive B2B leads or is it pure ego?',
    category: '📈 Marketing',
    score: 92,
    comments: [
      { username: 'cynical_dev', content: 'It is pure cringe, but unfortunately, the LinkedIn algorithm rewards it. It helps with recruitment more than lead generation.' }
    ]
  },
  {
    username: 'wa_api_user',
    title: 'WhatsApp Business API is becoming an expensive spam trap',
    content: 'Meta just hiked utility and marketing conversation rates for India again. Customers are getting so much spam from brands that block rates are hitting an all-time high. What alternatives are you using for transactional alerts?',
    category: '📈 Marketing',
    score: 35,
    comments: []
  },

  // 🤖 Tech & AI
  {
    username: 'jugaad_engineer',
    title: 'Handling UPI payment success callbacks reliably during flash sales',
    content: 'Razorpay/Cashfree webhooks sometimes drop or experience latency during high traffic. We had to build a fallback polling system that queries the bank gateway every 5 seconds to ensure orders are confirmed before users close the app.',
    category: '🤖 Tech & AI',
    score: 72,
    comments: [
      { username: 'prod_manager_fin', content: 'We built a Redis-backed queue specifically for this. Never rely 100% on a single webhook provider in India.' }
    ]
  },
  {
    username: 'ai_bhai',
    title: 'Building Indic LLMs: Fine-tuning models on regional Indian languages',
    content: 'We are training an open model on specialized Kannada and Tamil legal data datasets. The tokenization overhead for Indic scripts is massive compared to English—costing us 4x more in compute tokens. Anyone optimized this?',
    category: '🤖 Tech & AI',
    score: 51,
    comments: [
      { username: 'cuda_shredder', content: 'Look into custom sentencepiece tokenizers trained specifically on your target corpus. It reduces the token-to-word ratio drastically.' }
    ]
  },
  {
    username: 'cloud_optimizer',
    title: 'AWS Mumbai region vs GCP Delhi region: Which has better latency for real-time gaming?',
    content: 'Setting up an infrastructure cluster for a fantasy sports app. Most users are based out of UP and Bihar. Testing shows GCP Delhi drops ping rates by around 8ms.',
    category: '🤖 Tech & AI',
    score: 23,
    comments: []
  },

  // ☕ Lounge
  {
    username: 'filter_coffee_only',
    title: 'Third-wave coffee culture in Bangalore has completely taken over entrepreneurship',
    content: 'Every table at Third Wave, Blue Tokai, or Maverick & Farmer in Indiranagar is just people yelling about valuations, cap tables, and pitch decks over a ₹300 oat milk latte. Miss the days when you could just code in peace.',
    category: '☕ Lounge',
    score: 84,
    comments: [
      { username: 'poha_lover', content: 'Come to Hyderabad/Pune, we deal in Biryani/Poha and real revenues instead of just pitch decks!' },
      { username: 'koramangala_hustler', content: 'Hey, I met my co-founder at a Third Wave meetup, don’t attack our sacred workspace!' }
    ]
  },
  {
    username: 'remote_goa',
    title: 'Moving the dev team from Bangalore to Goa for a 3-month workation',
    content: 'Found a massive villa in Anjuna with 100 Mbps fiber. The burn rate is literally half of what we pay for a cramped office setup in HSR Layout. Anyone done this? Does productivity actually hold up?',
    category: '☕ Lounge',
    score: 42,
    comments: [
      { username: 'kingfisher_coder', content: 'Productivity will drop for the first 2 weeks while everyone gets the partying out of their system, then it stabilizes.' }
    ]
  },
  {
    username: 'founder_burnout',
    title: 'Dealing with the isolation of being a solo founder in India',
    content: 'Parents want me to get a stable corporate job or get married, friends think I am rich because I run a startup, but in reality, I am scraping together money to clear vendor invoices by the end of the month. How do you guys manage the mental strain?',
    category: '☕ Lounge',
    score: 115,
    comments: [
      { username: 'saas_babu', content: 'Hang in there brother. The dark days are part of the process. Find a peer group of other founders who understand the ground reality.' }
    ]
  }
];

async function seedDatabase() {
  console.log("🚀 Starting hyper-focused Indian ecosystem data migration...");
  try {
    for (const post of mockPosts) {
      const postResult = await pool.query(
        `INSERT INTO posts (username, title, content, category, score, created_at) 
         VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id`,
        [post.username, post.title, post.content, post.category, post.score]
      );
      
      const postId = postResult.rows[0].id;

      for (const comment of post.comments) {
        await pool.query(
          `INSERT INTO comments (post_id, username, content, created_at) 
           VALUES ($1, $2, $3, NOW())`,
          [postId, comment.username, comment.content]
        );
      }
    }
    console.log("✨ Seeding complete! 15 local ecosystem discussion nodes deployed successfully.");
  } catch (error) {
    console.error("❌ Data execution failed:", error);
  } finally {
    await pool.end();
  }
}

seedDatabase();