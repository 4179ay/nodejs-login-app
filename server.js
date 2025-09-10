const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = 3000;

// In-memory user storage (in production, use a database)
const users = [
  {
    id: 1,
    username: 'hire-me',
    email: 'hire-me@anshumat.org',
    password: 'HireMe@2025!' 
  }
];

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Session configuration
app.use(session({
  secret: 'your-secret-key-here', // Change this to a secure secret in production
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Routes

// Home page - redirect to login if not authenticated
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

// Login page
app.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('login', { error: null });
});

// Replace the login route with this simpler version:
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simple check without hashing (TESTING ONLY!)
  if (username === 'hire-me@anshumat.org' && password === 'HireMe@2025!') {
    req.session.userId = 1;
    req.session.username = 'hire-me@anshumat.org';
    res.redirect('/dashboard');
  } else {
    res.render('login', { error: 'Invalid credentials' });
  }
});
    

// Register page
app.get('/register', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('register', { error: null, success: null });
});

// Handle registration
app.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  
  try {
    // Validation
    if (!username || !email || !password || !confirmPassword) {
      return res.render('register', { 
        error: 'All fields are required', 
        success: null 
      });
    }
    
    if (password !== confirmPassword) {
      return res.render('register', { 
        error: 'Passwords do not match', 
        success: null 
      });
    }
    
    if (password.length < 6) {
      return res.render('register', { 
        error: 'Password must be at least 6 characters long', 
        success: null 
      });
    }
    
    // Check if user already exists
    const existingUser = users.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return res.render('register', { 
        error: 'Username or email already exists', 
        success: null 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = {
      id: users.length + 1,
      username,
      email,
      password: hashedPassword
    };
    
    users.push(newUser);
    
    res.render('register', { 
      error: null, 
      success: 'Registration successful! You can now log in.' 
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.render('register', { 
      error: 'An error occurred during registration', 
      success: null 
    });
  }
});

// Dashboard - protected route
app.get('/dashboard', requireAuth, (req, res) => {
  const user = users.find(u => u.id === req.session.userId);
  res.render('dashboard', { user });
});

// Profile page - protected route
app.get('/profile', requireAuth, (req, res) => {
  const user = users.find(u => u.id === req.session.userId);
  res.render('profile', { user });
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Default login credentials:');
  console.log('Username: hire-me@anshumat.org');
  console.log('Password: HireMe@2025!');
  console.log('Waiting for default user initialization...');
});

// Utility function to create a hashed password (for testing)
async function createHashedPassword(password) {
  const hashed = await bcrypt.hash(password, 10);
  console.log(`Hashed password for "${password}":`, hashed);
}

