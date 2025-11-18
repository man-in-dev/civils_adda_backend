# Civils Adda Backend API

Backend API for the Civils Adda mock test platform built with Express.js and MongoDB.

## Features

- ✅ User authentication (JWT-based)
- ✅ Test management
- ✅ Purchase system
- ✅ Test attempts and scoring
- ✅ Performance analytics
- ✅ Input validation with Joi
- ✅ Error handling middleware
- ✅ MongoDB integration

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Joi** - Validation
- **dotenv** - Environment variables
- **CORS** - Cross-origin resource sharing

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory (copy from `env.example`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/civils_adda
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
ALLOWED_ORIGINS=http://localhost:3000
```

3. Make sure MongoDB is running on your system.

4. Seed the database with sample tests:
```bash
npm run seed
```

5. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

### Tests
- `GET /api/tests` - Get all tests (with optional query params: category, search)
- `GET /api/tests/:id` - Get single test details (Protected)

### Purchases
- `POST /api/purchases` - Purchase tests (Protected)
- `GET /api/purchases` - Get user's purchased tests (Protected)
- `GET /api/purchases/check/:testId` - Check if test is purchased (Protected)

### Attempts
- `POST /api/attempts` - Create new test attempt (Protected)
- `GET /api/attempts` - Get user's attempts (Protected)
- `GET /api/attempts/:id` - Get attempt details (Protected)
- `PUT /api/attempts/:id` - Update attempt answers (Protected)
- `POST /api/attempts/:id/submit` - Submit attempt (Protected)

### Performance
- `GET /api/performance` - Get user performance analytics (Protected)

## Authentication

Protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Project Structure

```
backend/
├── config/           # Configuration files (database, JWT)
├── controllers/      # Route controllers
├── middleware/       # Custom middleware (auth, error handling)
├── models/          # Mongoose models
├── routes/          # API routes
├── scripts/         # Utility scripts (seed)
├── validations/     # Joi validation schemas
├── server.js        # Main server file
└── package.json
```

## Environment Variables

| Variable | Description | Default |
|---------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment mode | development |
| MONGODB_URI | MongoDB connection string | - |
| JWT_SECRET | Secret key for JWT | - |
| JWT_EXPIRE | JWT expiration time | 7d |
| ALLOWED_ORIGINS | Allowed CORS origins | http://localhost:3000 |

## Error Handling

All errors are handled by the centralized error handler middleware. Errors are returned in the following format:

```json
{
  "success": false,
  "message": "Error message"
}
```

## Validation

Request validation is handled using Joi schemas. Invalid requests return:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

## License

ISC

