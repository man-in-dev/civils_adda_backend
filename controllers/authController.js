import User from '../models/User.js';
import { generateToken } from '../config/jwt.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { OAuth2Client } from 'google-auth-library';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email',
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false,
      },
      token,
    },
    message: 'User registered successfully',
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists and get password
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // If user is OAuth-only (has googleId but no password), allow login without password check
  if (user.googleId && (!password || password === undefined || password === null)) {
    // Generate token for OAuth user
    const token = generateToken(user._id);

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        token,
      },
      message: 'Login successful',
    });
  }

  // For regular users or if password is provided, verify password
  if (!user.password) {
    return res.status(401).json({
      success: false,
      message: 'Password is required',
    });
  }

  // Check password
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Generate token
  const token = generateToken(user._id);

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false,
      },
      token,
    },
    message: 'Login successful',
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false,
      },
    },
  });
});

// @desc    Get Google OAuth URL
// @route   GET /api/auth/google
// @access  Public
export const getGoogleAuthUrl = asyncHandler(async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${backendUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      success: false,
      message: 'Google OAuth not configured',
    });
  }

  const oauth2Client = new OAuth2Client(
    clientId,
    clientSecret,
    redirectUri
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
    prompt: 'consent',
  });

  res.json({
    success: true,
    data: {
      authUrl,
    },
  });
});

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
export const googleCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${backendUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return res.redirect(`${frontendUrl}/login?error=oauth_not_configured`);
  }

  try {
    const oauth2Client = new OAuth2Client(
      clientId,
      clientSecret,
      redirectUri
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.name) {
      return res.redirect(`${frontendUrl}/login?error=invalid_google_data`);
    }

    // Find or create user
    let user = await User.findOne({ email: payload.email.toLowerCase() });

    if (!user) {
      // Create new user without password for OAuth users
      user = await User.create({
        name: payload.name,
        email: payload.email.toLowerCase(),
        googleId: payload.sub,
        // Password field is omitted - not required for OAuth users
      });
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = payload.sub;
      await user.save();
    }

    // Generate token
    const token = generateToken(user._id);

    // Redirect to frontend with token
    res.redirect(`${frontendUrl}/auth/google/success?token=${token}`);
  } catch (error) {
    console.error('Google OAuth Error:', error);
    res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
});

