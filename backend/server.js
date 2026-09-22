const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MySQL connection
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'instagram_clone',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to MySQL database');
  connection.release();
});

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// File upload configuration
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Images and Videos Only!');
    }
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// API Routes

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, username } = req.body;

  // Validation
  if (!email || !password || !name || !username) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Check if username already exists
    const [usernameExists] = await db.promise().query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (usernameExists.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Check if email already exists
    const [emailExists] = await db.promise().query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (emailExists.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await db.promise().query(
      'INSERT INTO users (email, password_hash, name, username, image, followersCount, followingCount) VALUES (?, ?, ?, ?, ?, 0, 0)',
      [email, passwordHash, name, username, 'default']
    );

    const userId = result.insertId;

    // Generate JWT token
    const token = jwt.sign({ userId, email, username }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: userId,
        email,
        name,
        username,
        image: 'default'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find user by email
    const [users] = await db.promise().query(
      'SELECT id, email, password_hash, name, username, image FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        image: user.image
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.promise().query(
      'SELECT id, email, name, username, image, followersCount, followingCount FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Post Routes
app.get('/api/posts', authenticateToken, async (req, res) => {
  try {
    const [posts] = await db.promise().query(`
      SELECT p.*, u.username, u.name as userName, u.image as userImage,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likesCount,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as commentsCount
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);

    res.json({ posts });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/posts', authenticateToken, upload.single('media'), async (req, res) => {
  const { caption } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'Media file is required' });
  }

  try {
    const mediaUrl = `/uploads/${req.file.filename}`;

    const [result] = await db.promise().query(
      'INSERT INTO posts (user_id, image_url, caption) VALUES (?, ?, ?)',
      [req.user.userId, mediaUrl, caption || '']
    );

    const postId = result.insertId;

    // Get the created post with user info
    const [posts] = await db.promise().query(`
      SELECT p.*, u.username, u.name as userName, u.image as userImage,
             0 as likesCount, 0 as commentsCount
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [postId]);

    res.status(201).json({ post: posts[0] });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Like Routes
app.post('/api/posts/:postId/like', authenticateToken, async (req, res) => {
  const { postId } = req.params;

  try {
    // Check if post exists
    const [posts] = await db.promise().query(
      'SELECT id FROM posts WHERE id = ?',
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if already liked
    const [existingLike] = await db.promise().query(
      'SELECT id FROM likes WHERE post_id = ? AND user_id = ?',
      [postId, req.user.userId]
    );

    if (existingLike.length > 0) {
      return res.status(400).json({ error: 'Post already liked' });
    }

    // Add like
    await db.promise().query(
      'INSERT INTO likes (post_id, user_id) VALUES (?, ?)',
      [postId, req.user.userId]
    );

    res.json({ message: 'Post liked successfully' });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/posts/:postId/like', authenticateToken, async (req, res) => {
  const { postId } = req.params;

  try {
    // Remove like
    const [result] = await db.promise().query(
      'DELETE FROM likes WHERE post_id = ? AND user_id = ?',
      [postId, req.user.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: 'Like not found' });
    }

    res.json({ message: 'Post unliked successfully' });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Follow Routes
app.post('/api/users/:userId/follow', authenticateToken, async (req, res) => {
  const { userId } = req.params;

  if (parseInt(userId) === req.user.userId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  try {
    // Check if user to follow exists
    const [users] = await db.promise().query(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const [existingFollow] = await db.promise().query(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [req.user.userId, userId]
    );

    if (existingFollow.length > 0) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Add follow
    await db.promise().query(
      'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
      [req.user.userId, userId]
    );

    // Update counters
    await db.promise().query(
      'UPDATE users SET followersCount = followersCount + 1 WHERE id = ?',
      [userId]
    );

    await db.promise().query(
      'UPDATE users SET followingCount = followingCount + 1 WHERE id = ?',
      [req.user.userId]
    );

    res.json({ message: 'User followed successfully' });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/users/:userId/follow', authenticateToken, async (req, res) => {
  const { userId } = req.params;

  try {
    // Remove follow
    const [result] = await db.promise().query(
      'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
      [req.user.userId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: 'Follow relationship not found' });
    }

    // Update counters
    await db.promise().query(
      'UPDATE users SET followersCount = followersCount - 1 WHERE id = ?',
      [userId]
    );

    await db.promise().query(
      'UPDATE users SET followingCount = followingCount - 1 WHERE id = ?',
      [req.user.userId]
    );

    res.json({ message: 'User unfollowed successfully' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Comment Routes
app.get('/api/posts/:postId/comments', authenticateToken, async (req, res) => {
  const { postId } = req.params;

  try {
    const [comments] = await db.promise().query(`
      SELECT c.*, u.username, u.name as userName, u.image as userImage
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `, [postId]);

    res.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/posts/:postId/comments', authenticateToken, async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  try {
    // Check if post exists
    const [posts] = await db.promise().query(
      'SELECT id FROM posts WHERE id = ?',
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Add comment
    const [result] = await db.promise().query(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [postId, req.user.userId, content]
    );

    const commentId = result.insertId;

    // Get the created comment with user info
    const [comments] = await db.promise().query(`
      SELECT c.*, u.username, u.name as userName, u.image as userImage
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [commentId]);

    res.status(201).json({ comment: comments[0] });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get users that current user follows
app.get('/api/users/followed', authenticateToken, async (req, res) => {
  try {
    const [followed] = await db.promise().query(`
      SELECT u.id, u.username, u.name, u.image, u.followersCount, u.followingCount
      FROM users u
      JOIN follows f ON u.id = f.following_id
      WHERE f.follower_id = ?
    `, [req.user.userId]);

    res.json({ followed });
  } catch (error) {
    console.error('Get followed users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get posts for a specific user
app.get('/api/users/:userId/posts', authenticateToken, async (req, res) => {
  const { userId } = req.params;

  try {
    const [posts] = await db.promise().query(`
      SELECT p.*, u.username, u.name as userName, u.image as userImage,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likesCount,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as commentsCount
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `, [userId]);

    res.json({ posts });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific post
app.get('/api/posts/:postId', authenticateToken, async (req, res) => {
  const { postId } = req.params;

  try {
    const [posts] = await db.promise().query(`
      SELECT p.*, u.username, u.name as userName, u.image as userImage,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likesCount,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as commentsCount
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [postId]);

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ post: posts[0] });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a post
app.delete('/api/posts/:postId', authenticateToken, async (req, res) => {
  const { postId } = req.params;

  try {
    // Check if post exists and belongs to current user
    const [posts] = await db.promise().query(
      'SELECT id, user_id FROM posts WHERE id = ?',
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (posts[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this post' });
    }

    // Delete post (cascade will delete likes and comments due to foreign key constraints)
    await db.promise().query(
      'DELETE FROM posts WHERE id = ?',
      [postId]
    );

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile
app.get('/api/users/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;

  try {
    const [users] = await db.promise().query(
      'SELECT id, email, name, username, image, followersCount, followingCount FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users by username
app.get('/api/users/search/:username', authenticateToken, async (req, res) => {
  const { username } = req.params;

  try {
    const [users] = await db.promise().query(
      'SELECT id, email, name, username, image, followersCount, followingCount FROM users WHERE username LIKE ? LIMIT 10',
      [`${username}%`]
    );

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload Route (alternative to the one in posts)
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// Upload Route (alternative to the one in posts)
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;