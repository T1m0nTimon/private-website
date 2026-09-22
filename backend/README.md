# Instagram Clone Backend (MySQL Version)

This is the MySQL-based backend for the Instagram clone application, replacing the original Firebase Cloud Functions.

## Features

- User authentication (registration, login, JWT-based auth)
- Post creation and retrieval
- Like/unlike functionality
- Follow/unfollow functionality
- Comment system
- Media file uploads
- RESTful API endpoints
- Docker support

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- MySQL (v5.7+ or v8.0+)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up the database:
   - Create a MySQL database named `instagram_clone`
   - Run the schema.sql file to create tables and insert default user:
     ```bash
     mysql -u root -p instagram_clone < schema.sql
     ```
   - Or if you prefer to use a different database name, update the .env file accordingly

3. Configure environment variables:
   - Copy the `.env.example` to `.env` (if it exists) or create a new `.env` file
   - Update the values as needed for your environment
   - Default values in .env:
     ```
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=
     DB_NAME=instagram_clone
     JWT_SECRET=your-super-secret-jwt-key-change-in-production
     PORT=5000
     ```

### Default User

The system creates a default user during schema setup:
- Username: TImon
- Password: Beet6
- Email: timon@example.com

### Running the Server

#### Development Mode
```bash
npm run dev
```
This uses nodemon for automatic restart on file changes.

#### Production Mode
```bash
npm start
```

The server will run on `http://localhost:5000` by default.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/me` - Get current user profile (requires auth)
- `POST /api/auth/logout` - Invalidate token (client-side removal)

### Posts
- `GET /api/posts` - Get all posts with user info and counts
- `POST /api/posts` - Create a new post (requires auth, media upload)

### Likes
- `POST /api/posts/:postId/like` - Like a post (requires auth)
- `DELETE /api/posts/:postId/like` - Unlike a post (requires auth)

### Follows
- `POST /api/users/:userId/follow` - Follow a user (requires auth)
- `DELETE /api/users/:userId/follow` - Unfollow a user (requires auth)

### Comments
- `GET /api/posts/:postId/comments` - Get comments for a post (requires auth)
- `POST /api/posts/:postId/comments` - Add a comment to a post (requires auth)

### Upload
- `POST /api/upload` - Upload a media file (requires auth)

### Static Files
- `/uploads/*` - Serves uploaded media files

## Docker Support

The backend includes Docker support for easy deployment.

### Dockerfile
A Dockerfile is provided to containerize the Node.js application.

### docker-compose.yml
A docker-compose.yml file is provided to run both the backend and MySQL database together.

### Running with Docker

1. Make sure Docker and Docker Compose are installed
2. Build and start the containers:
   ```bash
   docker-compose up --build
   ```
3. The backend will be available at `http://localhost:5000`
4. MySQL will be available on port 3306 (mapped to host)

To stop and remove containers:
```bash
docker-compose down
```

To rebuild containers (after code changes):
```bash
docker-compose up --build
```

## Database Schema

The backend uses the following tables:
- `users`: Stores user information
- `posts`: Stores posts with media URLs
- `likes`: Stores post likes
- `follows`: Stores user follow relationships
- `comments`: Stores comments on posts

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DB_HOST | MySQL host | localhost |
| DB_USER | MySQL username | root |
| DB_PASSWORD | MySQL password | (empty) |
| DB_NAME | Database name | instagram_clone |
| JWT_SECRET | Secret for JWT signing | your-super-secret-jwt-key-change-in-production |
| PORT | Server port | 5000 |
| NODE_ENV | Environment | development |

## Implementation Notes

This backend replaces the original Firebase Cloud Functions with a MySQL-based REST API. The frontend will need to be updated to point to this API instead of using Firebase directly.

Key differences from Firebase implementation:
- Authentication uses JWT tokens instead of Firebase Auth
- Data is stored in MySQL tables instead of Firestore collections
- Media files are stored locally in the `uploads/` directory (can be changed to cloud storage)
- Real-time updates are not implemented (would require WebSockets or polling)
- All data manipulation is done through REST API endpoints

## Troubleshooting

1. **Database connection errors**: Check your MySQL server is running and the .env file has correct credentials
2. **Port already in use**: Change the PORT in .env or stop the conflicting service
3. **Authentication issues**: Make sure you're sending the JWT token in the Authorization header as `Bearer <token>`
4. **File upload errors**: Check that the uploads directory exists and is writable
5. **CORS issues**: The cors middleware is enabled, but adjust if needed for your frontend URL

## License

ISC