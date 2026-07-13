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
    console.error("REGISTRATION DATABASE ERROR:", error); // <-- Add this!
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

// FETCH ALL POSTS (With comments and explicit category selections)
app.get('/api/posts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.username, p.title, p.content, p.category, p.created_at,
             COALESCE(json_agg(c.* ORDER BY c.created_at ASC) FILTER (WHERE c.id IS NOT NULL), '[]') AS comments
      FROM posts p
      LEFT JOIN comments c ON p.id = c.post_id
      GROUP BY p.id, p.username, p.title, p.content, p.category, p.created_at
      ORDER BY p.created_at DESC;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// CREATE A NEW POST WITH CATEGORY
app.post('/api/posts', async (req, res) => {
  try {
    const { username, title, content, category } = req.body;
    const selectedCategory = category || '🚀 Startups'; 
    
    const newPost = await pool.query(
      'INSERT INTO posts (username, title, content, category) VALUES($1, $2, $3, $4) RETURNING *',
      [username, title, content, selectedCategory]
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

// CREATE A NEW POST WITH CATEGORY
app.post('/api/posts', async (req, res) => {
  try {
    const { username, title, content, category } = req.body;
    // We default to '🚀 Startups' if no category is passed
    const selectedCategory = category || '🚀 Startups'; 
    
    const newPost = await pool.query(
      'INSERT INTO posts (username, title, content, category) VALUES($1, $2, $3, $4) RETURNING *',
      [username, title, content, selectedCategory]
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

const PORT = process.env.PORT || 5000; 

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// FETCH ALL POSTS WITH SCORES
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

// CREATE POST WITH OPTIONAL IMAGE
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

// UPVOTE / DOWNVOTE ROUTE
app.patch('/api/posts/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body; // 'up' or 'down'
    const value = direction === 'up' ? 1 : -1;

    const updated = await pool.query(
      'UPDATE posts SET score = score + $1 WHERE id = $2 RETURNING *',
      [value, id]
    );
    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
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

// backend/server.js

// PATCH route to handle thread voting increments/decrements
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