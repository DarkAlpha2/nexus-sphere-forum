const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// A secret key used to sign your JWT digital passports. 
// In production, keep this hidden in your .env file!
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_nexus_key_123';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // This prevents live cloud connection rejections
  }
});

// Automatically create tables if they do not exist
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

  } catch (err) {
    console.error("🔴 SYSTEM CHECK FAILED / DATABASE INITIALIZATION ERROR:", err);
  }
};


// Execute the database check
initDb();

// ==========================================
// AUTHENTICATION ROUTES (Register & Login)
// ==========================================

// 1. REGISTER A NEW USER
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Fill out all fields' });

    // Check if username already exists
    const userExist = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Hash the password securely before saving!
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user to database
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

// 2. USER LOGIN (Generates the Passport Token)
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid Username or Password' });
    }

    const user = userResult.rows[0];

    // Compare typed password against the encrypted hash in database
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid Username or Password' });
    }

    // Generate a JWT Passport valid for 24 hours
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send the token and user identity back to the frontend
    res.json({ token, username: user.username });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// CORE FORUM ROUTES
// ==========================================

// FETCH ALL POSTS WITH SCORES AND COMMENTS
app.get('/api/posts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.username, p.title, p.content, p.category, p.image_url, p.score, p.created_at,
             COALESCE(json_agg(c.* ORDER BY c.created_at ASC) FILTER (WHERE c.id IS NOT NULL), '[]') AS comments
      FROM posts p
      LEFT JOIN comments c ON p.id = c.post_id
      GROUP BY p.id, p.username, p.title, p.content, p.category, p.image_url, p.score, p.created_at
      ORDER BY p.score DESC, p.created_at DESC;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// CREATE POST WITH OPTIONAL IMAGE AND CATEGORY
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

// PATCH ROUTE TO HANDLE THREAD VOTING INCREMENTS/DECREMENTS
app.patch('/api/posts/:id/vote', async (req, res) => {
  const { id } = req.params;
  const { direction } = req.body; // 'up' or 'down'

  // Determine numerical value based on user action direction string
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

    res.json(result.rows[0]); // Return the updated post object row
  } catch (error) {
    console.error("Database voting execution error:", error);
    res.status(500).json({ error: "Internal server database modification failure." });
  }
});

// ADMINISTRATIVE DELETE ROUTE
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, clear associated comments to satisfy foreign key constraints
    await pool.query('DELETE FROM comments WHERE post_id = $1', [id]);
    
    // Delete the target post
    const result = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Thread node not found." });
    }
    
    res.json({ message: "Thread node securely terminated from database.", deletedPost: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Administrative Server Error');
  }
});

// ADMINISTRATIVE SOFT-DELETE ROUTE (VIRTUAL DELETE WITH HARDCODED PASSPHRASE CHK)
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const adminSecret = req.headers['x-admin-secret'];

    // Replace 'my_ultra_secret_admin_password_123' with any secret key you want
    if (adminSecret !== 'my_ultra_secret_admin_password_123') {
      return res.status(403).json({ error: "Access Denied: Insufficient administrative clearance." });
    }
    
    // Flag item as deleted virtually
    const result = await pool.query(
      'UPDATE posts SET is_deleted = TRUE WHERE id = $1 RETURNING *', 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Thread node not found." });
    }
    
    res.json({ message: "Thread node securely archived and virtually hidden.", deletedPost: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Administrative Server Error');
  }
});

// ==========================================
// SERVER INITIALIZATION
// ==========================================
const PORT = process.env.PORT || 10000; // Updated to 10000 to match Render's target port environment

app.listen(PORT, () => {
  console.log(`==> Server running securely on port ${PORT}`);
});