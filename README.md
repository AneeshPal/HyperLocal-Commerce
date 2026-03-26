<div align="center">

<img src="https://img.shields.io/badge/Status-In%20Development-yellow?style=for-the-badge" />
<img src="https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge" />
<img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />

# 🛒 HyperLocal Commerce Platform

### *Think Instagram meets OLX — everything on a map, payments built in, and AI tells you if you're getting a fair deal.*

<br/>

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

<br/>

[🌐 Live Demo](#) &nbsp;·&nbsp; [📸 Screenshots](#screenshots) &nbsp;·&nbsp; [🚀 Quick Start](#quick-start) &nbsp;·&nbsp; [📖 Docs](#api-documentation)

<br/>

</div>

---

## 📌 What is this?

A **full-stack hyper-local commerce platform** where buyers discover nearby listings on a live interactive map, negotiate via real-time chat, and pay through a secure escrow system — with an **AI-powered pricing engine** that tells you if a deal is fair.

Built specifically for **India's local economy** — from kirana shops and home-based sellers to students reselling textbooks and local service providers.

> **Tagline:** *"Discover. Buy. Sell. Everything around you."*

---

## ✨ Key Features

| Feature | Description |
|--------|-------------|
| 🗺️ **Map-Based Discovery** | Browse all nearby listings on a live Google Maps interface with real-time pin updates |
| 🤖 **AI Price Engine** | Claude API suggests fair prices for sellers and shows buyers a Fair/Overpriced badge |
| 💬 **Real-Time Chat** | Socket.io powered chat with Make Offer / Accept / Decline flow |
| 💳 **Escrow Payments** | Razorpay integration with escrow — money released only after buyer confirms receipt |
| 📊 **Seller Dashboard** | Revenue charts, views heatmap, category analytics, and AI-generated insights |
| 📱 **Social Feed** | Instagram-style feed, follow sellers, like/save/comment on listings |
| 🔔 **Push Notifications** | Firebase Cloud Messaging for real-time alerts |
| ⭐ **Trust System** | Reviews, ratings, and Verified Seller badges |

---

## 🛠️ Tech Stack

### Frontend
```
React.js          → Core UI framework
Tailwind CSS      → Styling
React Query       → Data fetching & caching
Zustand           → Global state management
React Hook Form   → Form handling
Zod               → Schema validation
Recharts          → Analytics dashboards
Socket.io Client  → Real-time features
Google Maps API   → Map & geolocation
```

### Backend
```
Node.js + Express → REST API server
Socket.io         → Real-time bidirectional communication
JWT + Passport.js → Authentication & Google OAuth
Multer            → File upload handling
Bull + Redis      → Background job queues
Razorpay SDK      → Payment gateway
Claude API        → AI pricing & insights
```

### Database & Infrastructure
```
MongoDB Atlas     → Primary database (with 2dsphere geospatial index)
Redis             → Caching, sessions, queue backend
Cloudinary        → Image storage & CDN
Firebase          → Push notifications
Vercel            → Frontend hosting
Render            → Backend hosting
```

---

## 📸 Screenshots

> *Coming soon — app in development*

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Redis (local or Upstash)
- Google Maps API key
- Razorpay test account
- Cloudinary account
- Anthropic API key (Claude)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/hyperlocal-commerce.git
cd hyperlocal-commerce
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in your environment variables (see below)
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Fill in your environment variables
npm run dev
```

### 4. Environment Variables

**Backend `.env`**
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

ANTHROPIC_API_KEY=your_claude_api_key

REDIS_URL=your_redis_url

FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

**Frontend `.env`**
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_FIREBASE_CONFIG=your_firebase_config_json
```

---

## 📁 Project Structure

```
hyperlocal-commerce/
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Route-level pages
│   │   ├── hooks/            # Custom React hooks
│   │   ├── store/            # Zustand global state
│   │   ├── services/         # API call functions
│   │   └── utils/            # Helper functions
│   └── public/
│
├── backend/
│   ├── controllers/          # Route handler logic
│   ├── models/               # Mongoose schemas
│   ├── routes/               # Express route definitions
│   ├── middleware/           # Auth, upload, rate limit
│   ├── services/             # Business logic (AI, payments)
│   ├── sockets/              # Socket.io event handlers
│   └── utils/                # Helpers & constants
│
└── README.md
```

---

## 🔌 API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get JWT |
| GET | `/api/auth/google` | Google OAuth |
| POST | `/api/auth/refresh` | Refresh access token |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/nearby` | Get products near coordinates |
| POST | `/api/products` | Create new listing (protected) |
| GET | `/api/products/:id` | Get single product |
| PATCH | `/api/products/:id` | Update listing (owner only) |
| DELETE | `/api/products/:id` | Delete listing (owner only) |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/price-suggestion` | Get AI price for a product |
| POST | `/api/ai/seller-insights` | Get AI insights for seller dashboard |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment signature |
| POST | `/api/payments/confirm-receipt` | Buyer confirms item received |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chats` | Get all conversations |
| GET | `/api/chats/:productId` | Get chat for a product |

> Full API docs available in `/docs/api.md`

---

## 🗺️ Geospatial Query Example

Products are fetched using MongoDB's `$near` operator with a `2dsphere` index:

```javascript
// Find products within 5km of user
const products = await Product.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [lng, lat] },
      $maxDistance: 5000   // 5km in meters
    }
  },
  isAvailable: true
});
```

---

## 🤖 AI Price Suggestion

The Claude API receives product details and returns structured pricing:

```javascript
// Sample prompt sent to Claude
`You are a pricing expert for India's second-hand market.
Product: ${title}, Category: ${category}, 
Condition: ${condition}, Age: ${age} years, City: ${city}

Return JSON with: recommendedPrice, minPrice, maxPrice, reasoning`

// Sample response
{
  "recommendedPrice": 8500,
  "minPrice": 7000,
  "maxPrice": 10000,
  "reasoning": "Sony WH-1000XM4 retails at ₹26,000. After 2 years, 
                 typical depreciation is 60-65% in Indian market..."
}
```

---

## 🏗️ Development Roadmap

- [x] Project setup & architecture planning
- [ ] **Phase 1** — Auth + Product listings + Google Maps
- [ ] **Phase 2** — Real-time chat + Social feed + Reviews
- [ ] **Phase 3** — Payments + AI engine + Seller dashboard
- [ ] **Phase 4** — Polish + PWA + Deployment

---

## 🤝 Contributing

This is a major BTech project currently in active development. Contributions, suggestions, and feedback are welcome!

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## 👨‍💻 Team

| Role | Responsibility |
|------|---------------|
| Frontend Lead | Map UI, social feed, product listings, PWA |
| Backend Lead | APIs, auth, geospatial queries, payments |
| Full-Stack + AI | Seller dashboard, Claude API, notifications, deployment |

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

**Built with ❤️ for India's local economy**

*If you found this useful, please give it a ⭐ on GitHub!*

</div>
