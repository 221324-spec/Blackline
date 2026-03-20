# Blackline Matrix - Trading Journal & Community Platform

A full-stack MERN application for traders to track their performance, access educational resources, and connect with the trading community.

## 🚀 Features

### Phase 1 (Complete)
- ✅ **User Authentication** - JWT-based registration and login
- ✅ **Trading Journal** - Track trades with detailed metrics
- ✅ **Performance Grading** - Automated A-E grading system based on win rate, R:R, and consistency
- ✅ **Dashboard Analytics** - Visual charts showing performance metrics
- ✅ **Educational Resources** - Curated learning materials
- ✅ **Community Forum** - Discussion threads and replies
- ✅ **Admin Panel** - User management and system statistics
- ✅ **Responsive Design** - Mobile-friendly UI

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

## 🛠️ Installation

### Backend Setup

1. Navigate to the Backend directory:
```bash
cd Backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

4. Seed sample resources (optional):
```bash
node seed-resources.js
```

5. Start the backend server:
```bash
node server.js
```

Server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults to localhost:5000):
```env
REACT_APP_API_BASE=http://localhost:5000
```

4. Start the development server:
```bash
npm start
```

Frontend will run on `http://localhost:3000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/request-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Trades
- `GET /api/trades` - Get user's trades
- `POST /api/trades` - Create new trade
- `PUT /api/trades/:id` - Update trade
- `DELETE /api/trades/:id` - Delete trade
- `POST /api/trades/:id/notes` - Add note to trade

### Metrics
- `GET /api/metrics` - Get performance metrics and grade

### Resources
- `GET /api/resources` - Get approved resources
- `POST /api/resources` - Create resource (authenticated)

### Community
- `GET /api/community` - Get forum posts
- `POST /api/community` - Create post
- `GET /api/community/:id` - Get post details
- `POST /api/community/:id/reply` - Reply to post

### Admin (Admin role required)
- `GET /api/admin/users` - List all users
- `POST /api/admin/users/:id/block` - Block user
- `POST /api/admin/users/:id/unblock` - Unblock user
- `GET /api/admin/stats` - System statistics

## 🎯 Grading System

Trades are automatically graded based on:
- **Win Rate** (40% weight)
- **Average Risk:Reward Ratio** (30% weight)
- **Profit Percentage** (30% weight)

### Grade Thresholds:
- **A Grade**: Win rate ≥ 60%, Avg R:R ≥ 2.0
- **B Grade**: Win rate ≥ 50%, Avg R:R ≥ 1.5
- **C Grade**: Win rate ≥ 40%, Avg R:R ≥ 1.0
- **D Grade**: Win rate ≥ 30%
- **E Grade**: Below all thresholds

## 🧪 Testing

Run frontend tests:
```bash
cd frontend
npm test
```

## 📦 Production Build

Build the frontend for production:
```bash
cd frontend
npm run build
```

## 🔐 Default Users

After seeding, you can create an admin user by registering with role "Admin" through the API or by manually updating a user's role in MongoDB.

## 🎨 Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT for authentication
- bcryptjs for password hashing

### Frontend
- React 19
- React Router v6
- Chart.js + react-chartjs-2
- Axios for API calls
- CSS3 with custom properties

## 📱 Usage

1. **Register** - Create an account as Trader or Mentor
2. **Add Trades** - Log your trading activity
3. **View Dashboard** - See your performance metrics and grade
4. **Browse Resources** - Access educational materials
5. **Join Forum** - Participate in community discussions
6. **Admin** (if admin) - Manage users and moderate content

## 🚧 Roadmap

### Phase 2 (Planned)
- Buyer's API integration
- AI-powered trade analysis
- Advanced pattern recognition
- Email notifications
- Real-time chat

### Phase 3 (Planned)
- Mobile app (React Native)
- Social trading features
- Copy trading integration
- Advanced analytics and reports

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

## 📄 License

Proprietary - All rights reserved

## 🐛 Known Issues

- Password reset currently logs token to console (email integration planned for Phase 2)
- MongoDB deprecation warnings for connection options (non-breaking)

## 📞 Support

For technical support or questions:
- Backend: Check server logs and MongoDB connection
- Frontend: Check browser console for errors
- API: Use the `/api/debug` endpoints for troubleshooting

---

**Built with ❤️ for the trading community**
