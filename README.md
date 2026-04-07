# OFP Store — Web & API

![GitHub repo size](https://img.shields.io/github/repo-size/danielsauuce/OFP-Store)
![GitHub issues](https://img.shields.io/github/issues/danielsauuce/OFP-Store)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)

The web storefront and REST API for **Olayinka Furniture Palace (OFP)** — a full-featured furniture e-commerce platform with a React/Vite frontend, Express/Node.js backend, real-time chat, Stripe payments, and a full observability stack.

> **Related repositories**
>
> - Mobile client: [danielsauuce/OFP-Store-Mobile](https://github.com/danielsauuce/OFP-Store-Mobile)
> - API Reference: [API_SPECIFICATION.md](API_SPECIFICATION.md)

---

## Features

### Shopping

- **Product Catalogue** — browse by category, filter by price range, sort by relevance or price, and full-text search
- **Product Detail** — multi-image gallery with thumbnail strip, stock badge, star ratings, customer reviews, and related products
- **Wishlist** — save and manage products across sessions
- **Cart** — add/remove items, adjust quantities, and view a live order summary with shipping calculation

### Checkout & Payments

- **Multi-step Checkout** — address → payment → confirmation flow with a visual step progress bar
- **Stripe Payments** — card processing via Stripe PaymentIntents (`@stripe/react-stripe-js`)
- **Order Confirmation** — post-purchase confirmation with order reference and itemised summary
- **Webhook Handling** — Stripe webhook endpoint for reliable payment state updates

### Account & Profile

- **Authentication** — JWT-based sign-up and login with access + refresh token rotation
- **Profile Management** — edit name, email, profile picture (Cloudinary upload), and contact details
- **Order History** — view all past orders with status tracking
- **Address Management** — manage saved delivery addresses
- **Notifications** — in-app notification centre with real-time badge updates

### Admin Panel

- **Dashboard** — key metrics: revenue, orders, users, and conversion rate with trend indicators
- **Analytics** — interactive charts (Recharts) for revenue over time, top-selling products, and order status breakdown
- **Product Management** — create, edit, and delete products with multi-image gallery upload (up to 10 images via Cloudinary), category assignment, stock control, and pricing
- **Order Management** — view and update order status across all orders
- **User Management** — view registered users, roles, and account status
- **Review Moderation** — review all customer reviews, hide/restore visibility, and delete with confirmation
- **Payments** — view payment records and Stripe payment intent statuses
- **Live Chat** — real-time support chat agent interface
- **Notifications** — broadcast and manage admin notifications

### Real-time

- **Live Support Chat** — Socket.IO-powered bidirectional chat between customers and support agents
- **Support Tickets** — raise and track support requests with ticket history
- **Notifications** — real-time delivery of system and order notifications

### Observability

- **Prometheus metrics** — HTTP request duration, request count, and status codes exported from the API at `/metrics`
- **Grafana dashboards** — auto-provisioned with Prometheus as datasource
- **Node Exporter** — host-level system metrics (CPU, memory, disk)
- **cAdvisor** — per-container resource metrics
- **Blackbox Exporter** — HTTP endpoint health probing
- **Uptime Kuma** — uptime monitoring dashboard

---

## Tech Stack

### API (server/)

| Category       | Technology                            |
| -------------- | ------------------------------------- |
| Runtime        | Node.js 20                            |
| Framework      | Express 5                             |
| Database       | MongoDB 7 + Mongoose 8                |
| Authentication | JWT (access + refresh tokens), Argon2 |
| Real-time      | Socket.IO 4                           |
| Payments       | Stripe 21                             |
| File Storage   | Cloudinary                            |
| Caching        | Upstash Redis + ioredis               |
| Rate Limiting  | rate-limiter-flexible + Arcjet        |
| Validation     | Joi                                   |
| Email          | Nodemailer                            |
| Metrics        | prom-client                           |
| Logging        | Winston                               |
| Security       | Helmet, express-mongo-sanitize, CORS  |
| Testing        | Jest + Supertest                      |
| Linting        | ESLint + Prettier                     |

### Web (client/)

| Category        | Technology                          |
| --------------- | ----------------------------------- |
| Framework       | React 19 + Vite 7                   |
| Language        | JavaScript (JSX) + TypeScript types |
| Routing         | React Router v7                     |
| Styling         | Tailwind CSS v4                     |
| HTTP Client     | Axios                               |
| Real-time       | Socket.IO Client 4                  |
| Payments        | Stripe React + Stripe.js            |
| Charts          | Recharts                            |
| Animations      | GSAP                                |
| Form Validation | Zod                                 |
| Notifications   | react-hot-toast                     |
| Icons           | Lucide React + React Icons          |
| Testing         | Jest + Testing Library + Cypress    |
| Linting         | ESLint + Prettier                   |

### Infrastructure

| Service          | Technology                            |
| ---------------- | ------------------------------------- |
| Reverse Proxy    | Caddy 2 (gzip, security headers, TLS) |
| Containerisation | Docker + Docker Compose               |
| Monorepo         | Turborepo                             |
| Metrics          | Prometheus + Grafana                  |
| Uptime           | Uptime Kuma                           |

---

## Project Structure

```text
.
├── client/                         # React / Vite web application
│   └── src/
│       ├── views/                  # Page-level components
│       │   ├── Home.jsx
│       │   ├── Shop.jsx
│       │   ├── ProductDetails.jsx
│       │   ├── Cart.jsx
│       │   ├── CheckOutPage.jsx
│       │   ├── Profile.jsx
│       │   ├── Notifications.jsx
│       │   ├── AuthPage.jsx
│       │   ├── About.jsx
│       │   ├── Contact.jsx
│       │   └── admin/              # Admin panel
│       │       ├── Dashboard.jsx
│       │       ├── Analytics.jsx
│       │       ├── Products.jsx
│       │       ├── Orders.jsx
│       │       ├── Users.jsx
│       │       ├── Reviews.jsx
│       │       ├── Payments.jsx
│       │       ├── Chat.jsx
│       │       ├── Notifications.jsx
│       │       └── components/     # Shared admin UI primitives
│       ├── components/             # Reusable UI components
│       │   ├── Navbar.jsx
│       │   ├── Footer.jsx
│       │   ├── ProductCard.jsx
│       │   ├── ChatWidget.jsx
│       │   ├── StripeCheckout.jsx
│       │   ├── OrderSummaryCard.jsx
│       │   ├── NotificationBell.jsx
│       │   └── ...
│       └── services/               # Axios API service layer
│           ├── axiosInstance.js
│           ├── authService.js
│           ├── productService.js
│           ├── orderService.js
│           ├── paymentService.js
│           ├── reviewService.js
│           ├── chatService.js
│           └── ...
│
├── server/                         # Express / Node.js API
│   ├── server.js                   # Entry point (HTTP server + Socket.IO init)
│   ├── app.js                      # Express app (middleware + routes)
│   ├── models/                     # Mongoose schemas
│   │   ├── user.js
│   │   ├── product.js
│   │   ├── order.js
│   │   ├── payment.js
│   │   ├── review.js
│   │   ├── cart.js
│   │   ├── wishlist.js
│   │   ├── category.js
│   │   ├── media.js
│   │   ├── notification.js
│   │   ├── conversation.js
│   │   ├── chatMessage.js
│   │   ├── ticket.js
│   │   └── refreshToken.js
│   ├── controllers/                # Route handlers
│   ├── routes/                     # Express routers
│   ├── middleware/                 # Auth, rate limiting, upload, error handling
│   │   ├── adminAuth.js
│   │   ├── checkAuthMiddleware.js
│   │   ├── rateLimiter.js
│   │   ├── uploadMiddleware.js
│   │   ├── cacheMiddleware.js
│   │   └── errorHandler.js
│   ├── config/                     # DB, CORS, Prometheus, Cloudinary config
│   └── socket/                     # Socket.IO event handlers
│
├── observability/
│   ├── prometheus/
│   │   ├── prometheus.yml          # Scrape config
│   │   └── blackbox.yml            # HTTP probe config
│   └── grafana/
│       └── provisioning/           # Auto-provisioned datasources + dashboards
│
├── Caddyfile                       # Reverse proxy config
├── docker-compose.yml              # Full dev stack
├── turbo.json                      # Turborepo pipeline
└── API_SPECIFICATION.md            # Full API reference
```

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended — runs the entire stack)
- **Or**, for local development without Docker:
  - [Node.js](https://nodejs.org/) 20+
  - [MongoDB](https://www.mongodb.com/) 7 running locally or a MongoDB Atlas connection string

### Environment Variables

Create `server/.env` with the following variables:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb://mongo:27017/OFPStore

# JWT
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Email (Nodemailer)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password

# Arcjet (rate limiting / bot protection)
ARCJET_KEY=ajkey_...

# Grafana
GRAFANA_PASSWORD=admin

# Caddy
CADDY_DOMAIN=localhost
CADDY_PORT=80
CADDY_AUTO_HTTPS=off
```

---

## Running with Docker (Recommended)

The entire stack — API, web, database, and observability — runs via a single Docker Compose command.

```bash
# First run (or after dependency changes)
docker-compose down -v && docker-compose up --build

# Subsequent runs
docker-compose up
```

All source files are bind-mounted, so any change to `server/` or `client/` is reflected immediately without rebuilding.

### Service URLs

| Service         | URL                      | Description                       |
| --------------- | ------------------------ | --------------------------------- |
| Web (via Caddy) | http://localhost         | React SPA (proxied through Caddy) |
| Web (direct)    | http://localhost:5173    | Vite dev server                   |
| API (via Caddy) | http://localhost/api     | REST API (proxied through Caddy)  |
| API (direct)    | http://localhost:3000    | Express server                    |
| Grafana         | http://localhost/grafana | Metrics dashboards                |
| Prometheus      | http://localhost:9090    | Metrics scraper                   |
| Uptime Kuma     | http://localhost/kuma    | Uptime monitoring                 |
| cAdvisor        | http://localhost:8080    | Container metrics                 |
| Node Exporter   | http://localhost:9100    | Host system metrics               |
| Blackbox        | http://localhost:9115    | HTTP endpoint prober              |

---

## Running Locally (Without Docker)

### Install dependencies

```bash
npm install        # installs all workspaces via Turborepo
```

### Start the API

```bash
cd server
npm run dev        # nodemon — hot reload on file changes
```

### Start the web app

```bash
cd client
npm run dev        # Vite dev server at http://localhost:5173
```

> Ensure MongoDB is running locally and `MONGO_URI` in `server/.env` points to it.

---

## Available Scripts

Run from the **root** of the monorepo via Turborepo:

| Script                 | Description                      |
| ---------------------- | -------------------------------- |
| `npm run dev`          | Start API + web in parallel      |
| `npm run build`        | Build both packages              |
| `npm run lint`         | Lint all workspaces              |
| `npm run lint:fix`     | Lint and auto-fix all workspaces |
| `npm run format`       | Format all files with Prettier   |
| `npm run format:check` | Check formatting without writing |
| `npm test`             | Run all test suites              |

Or run within each workspace (`cd server` / `cd client`) for the same commands scoped to that package.

### Client-only scripts

| Script                 | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run preview`      | Preview the production Vite build    |
| `npm run cypress:open` | Open Cypress interactive test runner |
| `npm run cypress:run`  | Run Cypress tests headlessly         |

---

## API Overview

All endpoints are prefixed with `/api`. See [API_SPECIFICATION.md](API_SPECIFICATION.md) for the full reference.

| Prefix               | Description                            |
| -------------------- | -------------------------------------- |
| `/api/auth`          | Register, login, logout, token refresh |
| `/api/product`       | Product listing, search, detail        |
| `/api/admin`         | Admin-only product, user, order ops    |
| `/api/categories`    | Product categories                     |
| `/api/cart`          | Cart CRUD                              |
| `/api/orders`        | Order creation and history             |
| `/api/payments`      | Stripe PaymentIntent + webhook         |
| `/api/reviews`       | Submit and retrieve product reviews    |
| `/api/wishlist`      | Wishlist management                    |
| `/api/users`         | User profile management                |
| `/api/support`       | Support tickets                        |
| `/api/chat`          | Chat conversation history              |
| `/api/notifications` | In-app notifications                   |
| `/api/media/upload`  | Cloudinary image uploads               |
| `/metrics`           | Prometheus metrics endpoint            |

---

## Observability

The stack ships with a full observability setup out of the box.

### Prometheus

Scrapes four targets every 15 seconds:

- **ofp-server** (`server:3000/metrics`) — custom HTTP request duration histograms and counters
- **node-exporter** (`node_exporter:9100`) — host CPU, memory, disk, and network
- **cadvisor** (`cadvisor:8080`) — per-container CPU and memory
- **blackbox** — probes `GET /api/categories` for HTTP 2xx availability

### Grafana

Auto-provisioned with Prometheus as the default datasource. Access at `http://localhost/grafana` (default credentials: `admin` / value of `GRAFANA_PASSWORD`).

### Uptime Kuma

Lightweight uptime monitoring dashboard accessible at `http://localhost/kuma`.

---

## Architecture

```text
Browser / Mobile App
        │
        ▼
  ┌──────────────┐
  │    Caddy 2   │  ← reverse proxy, gzip, security headers
  └──────┬───────┘
         │
   ┌─────┴──────┬────────────────┐
   ▼            ▼                ▼
React SPA   Express API     Uptime Kuma
(Vite:5173) (Node:3000)     (3001)
                │
       ┌────────┼────────┐
       ▼        ▼        ▼
   MongoDB   Redis    Cloudinary
   (27017)  (Upstash)  (CDN)
                │
           Socket.IO
          (live chat)
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Run format and lint before committing (`npm run format && npm run lint`)
4. Commit your changes (`git commit -m 'feat: add your feature'`)
5. Push to the branch (`git push origin feature/your-feature`)
6. Open a Pull Request

---

## Related

- **Mobile app** — [danielsauuce/OFP-Store-Mobile](https://github.com/danielsauuce/OFP-Store-Mobile) — React Native / Expo client for iOS and Android
- **API reference** — [API_SPECIFICATION.md](API_SPECIFICATION.md)

---

## License

This project is licensed under the [MIT License](LICENSE).
