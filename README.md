<div align="center">

# 🛍️ Aas-Paas

### Discover. Buy. Sell. Everything around you.

A hyperlocal marketplace connecting people with nearby sellers, with secure transactions and AI-powered shopping assistance planned.

![Status](https://img.shields.io/badge/Status-In%20Development-yellow?style=for-the-badge)
![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20MongoDB-blue?style=for-the-badge)

</div>

## About

**Aas-Paas** is a hyperlocal commerce platform designed to help people discover nearby listings, connect with sellers, and make local buying and selling easier.

The project currently includes user authentication, listing management, location-based discovery, image uploads, and real-time chat. Secure payment workflows and two AI agents are planned as upcoming features.

## Features

### Implemented / in progress
- **User authentication** — account registration and login using JWT.
- **Local listings** — create, view, update, and delete listings.
- **Location-based discovery** — search nearby listings using geolocation and MongoDB geospatial queries.
- **Image uploads** — listing images stored using Cloudinary.
- **Real-time chat** — buyer–seller conversations powered by Socket.IO.
- **Profiles and user listings** — display account details and listings associated with a user.
- **Razorpay setup** — test credentials configured; payment-order and transaction workflow is under development.

### Planned
- **Escrow-style transaction workflow** — payment verification, fulfilment tracking, dispute handling, refunds, and eligible seller settlement through a suitable approved payment arrangement.
- **AI Negotiation Agent** — negotiate with sellers within user-approved price limits, including when the buyer is offline.
- **AI Grocery Shopping Agent** — understand a grocery list, find products from local Aas-Paas shops, prepare a quantity-aware cart, and let the user review and pay.
- **Order and transaction history** — track purchases and their status.
- **Notifications** — alerts for messages, offers, and order updates.
- **Trust features** — seller reviews, ratings, and verification.

> **Payment note:** The escrow and payment features are not yet a completed production service. A database status alone does not hold funds. Real-money settlement depends on an eligible payment provider arrangement, account approval, and applicable regulations.

## Tech Stack

**Frontend**
- React
- React Router
- Material UI
- Socket.IO Client

**Backend**
- Node.js and Express
- MongoDB and Mongoose
- JWT authentication
- Socket.IO
- Cloudinary
- Razorpay SDK (integration in progress)

## Getting Started

### Requirements
- Node.js and npm
- MongoDB connection string
- Cloudinary account for image uploads
- Razorpay test account for payment development

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd <YOUR_REPOSITORY_FOLDER>
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `backend/.env` file using the variable names required by your project. For example:

```env
PORT=8080
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

RAZORPAY_KEY_ID=your_razorpay_test_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_key_secret
```

Start the backend using the script defined in `backend/package.json`, for example:

```bash
npm run dev
```

### 3. Set up the frontend

Open a second terminal:

```bash
cd Frontend
npm install
npm run dev
```

Use the actual folder name and scripts in your repository if they differ. Configure the frontend API URL according to the existing app setup.

**Never commit `.env` files or payment secrets.** Add them to `.gitignore` and use test credentials during development.

## Project Structure

```text
Aas-Paas/
├── Frontend/
│   └── src/
│       ├── components/
│       ├── layouts/
│       └── pages/
└── backend/
    ├── config/
    ├── middleware/
    ├── models/
    ├── routes/
    └── services/
```

*The structure above is representative; folders may vary as development continues.*

## Development Roadmap

- [x] Authentication and user accounts
- [x] Listing creation and management
- [x] Geolocation-based listing search
- [x] Cloudinary listing image uploads
- [x] Real-time chat
- [ ] Complete and test transaction lifecycle
- [ ] Integrate and verify payment-provider webhooks
- [ ] Confirm a compliant marketplace settlement arrangement
- [ ] Build fulfilment, refund, and dispute workflows
- [ ] Build AI Negotiation Agent
- [ ] Build AI Grocery Shopping Agent and cart
- [ ] Add notifications and trust features
- [ ] Production security review and deployment

## Contributing

This is an active major project. Suggestions and contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push the branch and open a pull request.

## License

Add the project's chosen license here once confirmed.

<div align="center">

**Built with ❤️ for local commerce.**

</div>
