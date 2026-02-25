# PaperTrade

AI-Powered Stock Trading Simulator.

PaperTrade is a full-stack web application that lets users practice stock trading with virtual money. It features a realistic trading experience with simulated market data, portfolio analytics, and AI-powered insights from two specialized agents — a Stock Advisor and a Portfolio Analyst.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite, Tailwind CSS, React Router v7, Recharts |
| **Backend** | Node.js, Express.js 5 |
| **Database** | PostgreSQL, Prisma ORM |
| **Auth** | JWT, bcryptjs |
| **AI** | Anthropic Claude API |
| **HTTP Client** | Axios |

## Project Structure

```
Paper-Trade/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx           # Sidebar navigation layout
│   │   │   └── ProtectedRoute.jsx   # Auth guard for routes
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Global auth state (React Context)
│   │   ├── lib/
│   │   │   └── api.js               # Axios instance with JWT interceptor
│   │   ├── pages/
│   │   │   ├── AIInsights.jsx       # Chat with AI agents
│   │   │   ├── Dashboard.jsx        # Portfolio overview + pie chart
│   │   │   ├── History.jsx          # Transaction history with filters
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── Register.jsx         # Registration page
│   │   │   ├── Trade.jsx            # Buy/Sell interface
│   │   │   └── Watchlist.jsx        # Monitor stock symbols
│   │   ├── App.jsx                  # Router setup
│   │   └── main.jsx                 # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Express Backend
│   ├── src/
│   │   ├── lib/
│   │   │   ├── anthropic.js         # Anthropic API client
│   │   │   ├── prisma.js            # Prisma ORM instance
│   │   │   └── stockPrices.js       # Simulated stock pricing engine
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── ai.js                # AI chat endpoints
│   │   │   ├── auth.js              # Register & Login
│   │   │   ├── portfolio.js         # Portfolio summary & holdings
│   │   │   ├── trade.js             # Buy, Sell, Quote, History
│   │   │   ├── user.js              # Profile management
│   │   │   └── watchlist.js         # Watchlist CRUD
│   │   └── index.js                 # Server entry point (port 5000)
│   └── package.json
│
├── prisma/                          # Database
│   ├── schema.prisma                # Data models & relations
│   ├── seed.js                      # Demo seed data
│   └── migrations/                  # Migration history
│
├── package.json                     # Root package.json
└── .gitignore
```

## Features

### Trading
- Buy and sell stocks with simulated real-time prices
- 20 supported symbols: AAPL, GOOGL, MSFT, AMZN, TSLA, META, NVDA, NFLX, JPM, V, DIS, BA, INTC, AMD, PYPL, UBER, COIN, SQ, SNAP, PLTR
- Prices simulate ±2% variance on every quote
- Average cost basis tracking for positions
- Real-time profit/loss calculations

### Portfolio & Analytics
- Dashboard with total portfolio value and asset allocation pie chart
- Individual position breakdown with current price, P&L, and percentage gain/loss
- Full transaction history with Buy/Sell filtering

### Watchlist
- Add and remove stocks to a personal watchlist
- View current prices and daily percentage changes

### AI Insights
- **Stock Advisor** — get trading ideas and market analysis
- **Portfolio Analyst** — receive personalized portfolio feedback
- Both agents receive your current holdings and recent transactions as context

### Authentication
- Email/password registration and login
- JWT-based session management (7-day expiry)
- Protected routes with automatic redirect to login
- Password hashing with bcryptjs

## Getting Started

### Prerequisites

- **Node.js** v18+
- **PostgreSQL** running locally
- **Anthropic API Key** (for AI features)

### 1. Clone the repository

```bash
git clone https://github.com/AJ-damco/Paper-Trade.git
cd Paper-Trade
```

### 2. Set up environment variables

Create a `.env` file inside the `server/` directory:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/papertrade"
JWT_SECRET="your-secret-key-change-in-production"
PORT=5000
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

### 3. Install dependencies

```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

### 4. Set up the database

```bash
# From the server directory
cd ../server

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# (Optional) Seed demo data
npx prisma db seed
```

### 5. Start the application

```bash
# Terminal 1 — Start the backend
cd server
npm run dev

# Terminal 2 — Start the frontend
cd client
npm run dev
```

- **Backend** runs at `http://localhost:5000`
- **Frontend** runs at `http://localhost:5173`

## Demo Accounts

After running the seed script, two accounts are available:

| Account | Email | Password | Balance | Tier |
|---------|-------|----------|---------|------|
| Demo User | `demo@papertrade.com` | `demo1234` | $10,000 | FREE |
| Premium User | `premium@papertrade.com` | `premium1234` | $50,000 | PREMIUM |

The premium user comes pre-loaded with holdings in AAPL, GOOGL, and TSLA, plus sample transaction history.

## API Endpoints

All protected endpoints require an `Authorization: Bearer <token>` header.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create a new account (starts with $100k) |
| POST | `/api/auth/login` | Login and receive JWT token |

### Trading
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trade/symbols` | List all available stock symbols |
| GET | `/api/trade/quote/:symbol` | Get current price for a symbol |
| POST | `/api/trade/buy` | Execute a buy order |
| POST | `/api/trade/sell` | Execute a sell order |
| GET | `/api/trade/history` | Get transaction history (filterable) |

### Portfolio
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/portfolio` | Portfolio summary with holdings and P&L |

### Watchlist
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/watchlist` | Get watchlist items |
| POST | `/api/watchlist` | Add a stock to watchlist |
| DELETE | `/api/watchlist/:symbol` | Remove a stock from watchlist |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get user profile |
| PUT | `/api/user/profile` | Update user profile |
| PUT | `/api/user/password` | Change password |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/stock-advisor` | Chat with the Stock Advisor agent |
| POST | `/api/ai/portfolio-analyst` | Chat with the Portfolio Analyst agent |

## Database Schema

```
User ──┬── Holding        (1:many)  Active stock positions
       ├── Transaction    (1:many)  Buy/Sell history
       ├── Watchlist      (1:many)  Monitored symbols
       └── Subscription   (1:1)     Plan & billing status
```

Key constraints:
- One holding per symbol per user (`userId + stockSymbol` unique)
- One watchlist entry per symbol per user
- Cascade delete on all user-related records
