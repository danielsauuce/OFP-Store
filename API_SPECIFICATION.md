# OFP Store — Backend API Specification

This document is the single source of truth for integrating the **OFP Store** mobile client against the Node.js/Express backend. OFP Store is the Olayinka Furniture Palace online furniture store. The API is RESTful over HTTP and uses Socket.IO for real-time chat and notifications. All monetary values are in **GBP (£)**.

---

**Base URL:** `http://your-server/api`

**Auth header (all protected routes):** `Authorization: Bearer <accessToken>`

**Content-Type:** `application/json` for all request bodies except file uploads (`multipart/form-data`).

---

## Table of Contents

1. [Authentication Flow](#1-authentication-flow)
2. [Authentication Endpoints](#2-authentication-endpoints-apiauth)
3. [User Profile](#3-user-profile-apiuser)
4. [Addresses](#4-addresses-apiuseraddresses)
5. [Products](#5-products-apiproduct)
6. [Categories](#6-categories-apicategories)
7. [Cart](#7-cart-apicart)
8. [Orders](#8-orders-apiorders)
9. [Payments](#9-payments-apipayment)
10. [Wishlist](#10-wishlist-apiwishlist)
11. [Reviews](#11-reviews-apireviews)
12. [Notifications](#12-notifications-apinotifications)
13. [Chat / Live Support](#13-chat--live-support)
14. [Support Tickets](#14-support-tickets-apisupport)
15. [Admin Endpoints](#15-admin-endpoints-apiadmin)
16. [Media Upload (Admin)](#16-media-upload-admin-apiupload)
17. [Socket.IO Events Reference](#17-socketio-events-reference)
18. [Error Response Format](#18-error-response-format)
19. [Stripe Webhook Events](#19-stripe-webhook-events)
20. [Environment Variables](#20-environment-variables)

---

## 1. Authentication Flow

The API uses a **JWT access token + opaque refresh token** pair.

| Token          | Storage advice                                                    | Lifetime   |
| -------------- | ----------------------------------------------------------------- | ---------- |
| `accessToken`  | In-memory / secure storage                                        | 60 minutes |
| `refreshToken` | Secure persistent storage (Keychain / EncryptedSharedPreferences) | 7 days     |

**Typical flow:**

1. Call `POST /api/auth/register` or `POST /api/auth/login` — receive both tokens in the response.
2. Attach the `accessToken` to every request as `Authorization: Bearer <accessToken>`.
3. When a request returns `401`, call `POST /api/auth/refresh-token` with the stored `refreshToken` to get a new pair (the old refresh token is rotated and invalidated).
4. On logout, call `POST /api/auth/logout` — all refresh tokens for the user are deleted server-side.
5. After `POST /api/auth/change-password` or `POST /api/auth/reset-password`, **all** existing refresh tokens are invalidated. Redirect the user to login.

**Socket.IO authentication:** Pass the `accessToken` in the socket handshake `auth` object:

```js
const socket = io("http://your-server/notifications", {
  auth: { token: "<accessToken>" },
});
```

Guest users (unauthenticated chat) use a `guestId` string (16–64 alphanumeric/hyphen/underscore chars) instead of a token.

---

## 2. Authentication Endpoints (`/api/auth`)

| Method | Path                        | Description                              | Access        |
| ------ | --------------------------- | ---------------------------------------- | ------------- |
| POST   | `/api/auth/register`        | Register a new customer account          | Public        |
| POST   | `/api/auth/login`           | Login with email and password            | Public        |
| POST   | `/api/auth/logout`          | Logout and invalidate all refresh tokens | Authenticated |
| POST   | `/api/auth/refresh-token`   | Rotate token pair using a refresh token  | Public        |
| POST   | `/api/auth/forgot-password` | Request a password-reset email           | Public        |
| POST   | `/api/auth/reset-password`  | Set a new password using the reset token | Public        |
| POST   | `/api/auth/change-password` | Change password while authenticated      | Authenticated |
| GET    | `/api/auth/me`              | Get the currently authenticated user     | Authenticated |

---

### POST `/api/auth/register`

**Request body:**

```json
{
  "fullName": "Ade Oluwaseun",
  "email": "ade@example.com",
  "password": "SecurePass123!"
}
```

**Success `201`:**

```json
{
  "success": true,
  "message": "Registration successful",
  "accessToken": "<jwt>",
  "refreshToken": "<opaque>",
  "user": {
    "id": "64f...",
    "fullName": "Ade Oluwaseun",
    "email": "ade@example.com",
    "role": "customer"
  }
}
```

---

### POST `/api/auth/login`

**Request body:**

```json
{
  "email": "ade@example.com",
  "password": "SecurePass123!"
}
```

**Success `200`:**

```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "<jwt>",
  "refreshToken": "<opaque>",
  "user": {
    "id": "64f...",
    "fullName": "Ade Oluwaseun",
    "email": "ade@example.com",
    "role": "customer",
    "phone": "+2348012345678"
  }
}
```

> `role` is either `"customer"` or `"admin"`. Persist this to conditionally show admin features.

---

### POST `/api/auth/logout`

**Headers:** `Authorization: Bearer <accessToken>`  
No body required.

**Success `200`:**

```json
{ "success": true, "message": "Logged out successfully" }
```

---

### POST `/api/auth/refresh-token`

**Request body:**

```json
{ "refreshToken": "<opaque>" }
```

**Success `200`:**

```json
{
  "success": true,
  "accessToken": "<new-jwt>",
  "refreshToken": "<new-opaque>"
}
```

> The old `refreshToken` is immediately deleted. Store the new pair before making any further requests.

---

### POST `/api/auth/forgot-password`

**Request body:**

```json
{ "email": "ade@example.com" }
```

**Success `200`** (always, to prevent email enumeration):

```json
{
  "success": true,
  "message": "If the email exists, a password reset link has been sent."
}
```

> The server sends an email containing a reset link. The link token expires in **1 hour**.

---

### POST `/api/auth/reset-password`

**Request body:**

```json
{
  "token": "<token-from-email-link>",
  "newPassword": "NewSecurePass456!"
}
```

**Success `200`:**

```json
{
  "success": true,
  "message": "Password reset successful. You can now log in with your new password."
}
```

---

### POST `/api/auth/change-password`

**Headers:** `Authorization: Bearer <accessToken>`

**Request body:**

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

**Success `200`:**

```json
{ "success": true, "message": "Password changed successfully" }
```

> All existing refresh tokens are invalidated. The user must log in again on other devices.

---

### GET `/api/auth/me`

**Headers:** `Authorization: Bearer <accessToken>`

**Success `200`:**

```json
{
  "success": true,
  "user": {
    "_id": "64f...",
    "fullName": "Ade Oluwaseun",
    "email": "ade@example.com",
    "phone": "+2348012345678",
    "role": "customer",
    "isActive": true,
    "emailVerified": false,
    "lastLogin": "2026-04-01T10:00:00.000Z",
    "profilePicture": {
      "_id": "65a...",
      "secureUrl": "https://res.cloudinary.com/...",
      "publicId": "profile-pictures/abc123",
      "url": "https://res.cloudinary.com/..."
    },
    "addresses": [
      /* see Addresses section */
    ],
    "preferences": {},
    "createdAt": "2025-01-15T08:00:00.000Z",
    "updatedAt": "2026-04-01T10:00:00.000Z"
  }
}
```

---

## 3. User Profile (`/api/user`)

All routes require authentication.

| Method | Path                        | Description                      | Access        |
| ------ | --------------------------- | -------------------------------- | ------------- |
| GET    | `/api/user/profile`         | Get current user's full profile  | Authenticated |
| PUT    | `/api/user/profile`         | Update profile fields            | Authenticated |
| PATCH  | `/api/user/profile-picture` | Upload / replace profile picture | Authenticated |
| DELETE | `/api/user/profile-picture` | Remove profile picture           | Authenticated |
| DELETE | `/api/user/account`         | Deactivate own account           | Authenticated |

---

### GET `/api/user/profile`

Same response shape as `GET /api/auth/me`.

---

### PUT `/api/user/profile`

**Request body** (all fields optional, send only what changes):

```json
{
  "fullName": "Adewale Oluwaseun",
  "phone": "+2348012345678",
  "preferences": {
    "newsletter": "true",
    "currency": "GBP"
  }
}
```

> `preferences` is a free-form `Map<String, String>`. Only `fullName`, `phone`, and `preferences` are updatable via this endpoint. Email and password are changed through dedicated endpoints.

**Success `200`:**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    /* full user object */
  }
}
```

---

### PATCH `/api/user/profile-picture`

**Content-Type:** `multipart/form-data`  
**Form field:** `profilePicture` — image file (JPEG / PNG / WebP recommended).

**Success `200`:**

```json
{
  "success": true,
  "message": "Profile picture updated successfully",
  "user": {
    /* full user object with populated profilePicture */
  }
}
```

> The old picture is deleted from Cloudinary automatically.

---

### DELETE `/api/user/profile-picture`

**Success `200`:**

```json
{ "success": true, "message": "Profile picture deleted successfully" }
```

---

### DELETE `/api/user/account`

Soft-deactivates the account (`isActive: false`). The user can reactivate by contacting support.

**Success `200`:**

```json
{
  "success": true,
  "message": "Account deactivated successfully. You can reactivate by contacting support."
}
```

---

## 4. Addresses (`/api/user/addresses`)

All routes require authentication.

| Method | Path                                     | Description              | Access        |
| ------ | ---------------------------------------- | ------------------------ | ------------- |
| GET    | `/api/user/addresses`                    | List all saved addresses | Authenticated |
| POST   | `/api/user/addresses`                    | Add a new address        | Authenticated |
| PUT    | `/api/user/addresses/:addressId`         | Update an address        | Authenticated |
| DELETE | `/api/user/addresses/:addressId`         | Delete an address        | Authenticated |
| PATCH  | `/api/user/addresses/:addressId/default` | Set address as default   | Authenticated |

---

### Address Object Shape

```json
{
  "_id": "65b...",
  "fullName": "Ade Oluwaseun",
  "phone": "+2348012345678",
  "street": "12 Banana Island Road",
  "city": "Lagos",
  "state": "Lagos",
  "postalCode": "101233",
  "country": "Nigeria",
  "type": "home",
  "isDefault": true
}
```

**Address `type` values:** `"home"` | `"work"` | `"other"`

> `fullName`, `phone`, `state`, and `country` are optional fields. `street`, `city`, and `postalCode` are required.

---

### POST `/api/user/addresses`

**Request body:**

```json
{
  "street": "12 Banana Island Road",
  "city": "Lagos",
  "postalCode": "101233",
  "fullName": "Ade Oluwaseun",
  "phone": "+2348012345678",
  "state": "Lagos",
  "country": "Nigeria",
  "type": "home",
  "isDefault": true
}
```

> If `isDefault: true` or this is the first address, all other addresses have `isDefault` cleared.

**Success `201`:**

```json
{
  "success": true,
  "message": "Address added successfully",
  "addresses": [
    /* array of all addresses */
  ]
}
```

---

### PUT `/api/user/addresses/:addressId`

Send only the fields to update (partial update supported).

**Success `200`:**

```json
{
  "success": true,
  "message": "Address updated successfully",
  "addresses": [
    /* full updated addresses array */
  ]
}
```

---

### PATCH `/api/user/addresses/:addressId/default`

No body required.

**Success `200`:**

```json
{
  "success": true,
  "message": "Default address updated successfully",
  "addresses": [
    /* full addresses array */
  ]
}
```

---

## 5. Products (`/api/product`)

All product list/detail routes are **public** and cached server-side for 30 minutes.

| Method | Path                          | Description                           | Access |
| ------ | ----------------------------- | ------------------------------------- | ------ |
| GET    | `/api/product`                | List products (paginated, filterable) | Public |
| GET    | `/api/product/:id`            | Get product by MongoDB ID             | Public |
| GET    | `/api/product/category/:slug` | List products for a category slug     | Public |

---

### GET `/api/product`

**Query parameters:**

| Parameter  | Type   | Description                                   |
| ---------- | ------ | --------------------------------------------- |
| `page`     | number | Page number (default: `1`)                    |
| `limit`    | number | Items per page, max `100` (default: `12`)     |
| `search`   | string | Full-text search against name and description |
| `category` | string | Category name or slug (case-insensitive)      |
| `minPrice` | number | Minimum price filter                          |
| `maxPrice` | number | Maximum price filter                          |

**Success `200`:**

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "64f...",
        "name": "Lagos Comfort Sofa",
        "slug": "lagos-comfort-sofa",
        "description": "A premium three-seater sofa...",
        "shortDescription": "Premium three-seater sofa",
        "price": 450.0,
        "compareAtPrice": 550.0,
        "primaryImage": {
          "_id": "65a...",
          "secureUrl": "https://res.cloudinary.com/...",
          "publicId": "products/abc",
          "url": "https://res.cloudinary.com/..."
        },
        "images": [
          /* array of Media objects */
        ],
        "category": {
          "_id": "63e...",
          "name": "Sofas",
          "slug": "sofas"
        },
        "variants": [
          {
            "sku": "SOFA-BLK-L",
            "price": 460.0,
            "stockQuantity": 5,
            "attributes": { "color": "Black", "size": "Large" }
          }
        ],
        "material": "Leather",
        "dimensions": { "width": 220, "height": 85, "depth": 95 },
        "stockQuantity": 12,
        "inStock": true,
        "isFeatured": false,
        "isActive": true,
        "averageRating": 4.5,
        "reviewCount": 8,
        "createdAt": "2025-03-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 48,
      "page": 1,
      "pages": 4,
      "limit": 12
    }
  }
}
```

---

### GET `/api/product/:id`

**Success `200`:**

```json
{
  "success": true,
  "product": {
    /* same shape as above */
  }
}
```

---

### GET `/api/product/category/:slug`

Equivalent to `GET /api/product?category=<slug>`. Returns the same paginated shape. Accepts the same `page`, `limit`, `minPrice`, `maxPrice` query parameters.

---

## 6. Categories (`/api/categories`)

Public routes are cached server-side (60 minutes for list, 30 minutes for single).

| Method | Path                        | Description                            | Access |
| ------ | --------------------------- | -------------------------------------- | ------ |
| GET    | `/api/categories`           | List all active categories             | Public |
| GET    | `/api/categories/:slug`     | Get a single category by slug          | Public |
| GET    | `/api/categories/admin/all` | List all categories including inactive | Admin  |
| POST   | `/api/categories`           | Create a new category                  | Admin  |
| PUT    | `/api/categories/:id`       | Update a category                      | Admin  |
| DELETE | `/api/categories/:id`       | Delete a category                      | Admin  |
| PATCH  | `/api/categories/:id/order` | Update category display order          | Admin  |

---

### Category Object Shape

```json
{
  "_id": "63e...",
  "name": "Sofas",
  "slug": "sofas",
  "description": "Comfortable seating solutions",
  "image": {
    "secureUrl": "https://res.cloudinary.com/...",
    "publicId": "categories/sofas",
    "url": "https://res.cloudinary.com/..."
  },
  "parent": null,
  "order": 1,
  "isActive": true
}
```

> `parent` is populated as `{ "_id", "name", "slug" }` when the category has a parent (subcategory support).

### GET `/api/categories`

**Success `200`:**

```json
{
  "success": true,
  "count": 8,
  "categories": [
    /* array of category objects, sorted by order asc */
  ]
}
```

---

### POST `/api/categories` (Admin)

**Request body:**

```json
{
  "name": "Bedroom",
  "description": "Beds, wardrobes, and dressers",
  "image": "<mediaId>",
  "parent": "<parentCategoryId or null>",
  "order": 3,
  "isActive": true
}
```

> `slug` is auto-generated from `name` if omitted.

---

## 7. Cart (`/api/cart`)

All routes require authentication.

| Method | Path                         | Description             | Access        |
| ------ | ---------------------------- | ----------------------- | ------------- |
| GET    | `/api/cart`                  | Get current user's cart | Authenticated |
| POST   | `/api/cart/items`            | Add item to cart        | Authenticated |
| PUT    | `/api/cart/items/:productId` | Update item quantity    | Authenticated |
| DELETE | `/api/cart/items/:productId` | Remove item from cart   | Authenticated |
| DELETE | `/api/cart`                  | Clear entire cart       | Authenticated |

---

### Cart Object Shape

```json
{
  "_id": "66a...",
  "items": [
    {
      "product": {
        "_id": "64f...",
        "name": "Lagos Comfort Sofa",
        "slug": "lagos-comfort-sofa",
        "primaryImage": { "secureUrl": "...", "publicId": "..." }
      },
      "variantSku": "SOFA-BLK-L",
      "quantity": 2,
      "priceSnapshot": 460.0,
      "nameSnapshot": "Lagos Comfort Sofa",
      "imageSnapshot": "https://res.cloudinary.com/..."
    }
  ],
  "total": 920.0
}
```

> `priceSnapshot` and `nameSnapshot` capture price/name at the time of adding to cart. `imageSnapshot` is a resolved URL string (not an object).

---

### POST `/api/cart/items`

**Request body:**

```json
{
  "product": "<productId>",
  "quantity": 1,
  "variantSku": "SOFA-BLK-L"
}
```

> `variantSku` is **required** if the product has `variants`. Omit for products without variants.  
> Server validates stock — returns `400` if quantity exceeds available stock.

**Success `200`:**

```json
{
  "success": true,
  "message": "Item added to cart",
  "cart": {
    /* cart object */
  }
}
```

---

### PUT `/api/cart/items/:productId`

**Request body:**

```json
{ "quantity": 3 }
```

> To remove by setting quantity to 0, use the DELETE endpoint instead.  
> Add `?variantSku=SOFA-BLK-L` to the query string if removing a specific variant.

**Success `200`:**

```json
{
  "success": true,
  "message": "Cart item updated",
  "cart": {
    /* cart object */
  }
}
```

---

### DELETE `/api/cart/items/:productId`

**Query parameter (optional):** `?variantSku=SOFA-BLK-L`  
If `variantSku` is provided, only that specific variant is removed. Otherwise, all items with the matching `productId` are removed.

**Success `200`:**

```json
{
  "success": true,
  "message": "Item removed from cart",
  "cart": {
    /* updated cart */
  }
}
```

---

### DELETE `/api/cart`

**Success `200`:**

```json
{ "success": true, "message": "Cart cleared successfully" }
```

---

## 8. Orders (`/api/orders`)

All routes require authentication.

| Method | Path                           | Description                            | Access        |
| ------ | ------------------------------ | -------------------------------------- | ------------- |
| POST   | `/api/orders`                  | Create a new order                     | Authenticated |
| GET    | `/api/orders`                  | Get current user's orders (paginated)  | Authenticated |
| GET    | `/api/orders/:id`              | Get a single order by ID               | Authenticated |
| PATCH  | `/api/orders/:id/cancel`       | Cancel a pending/processing order      | Authenticated |
| GET    | `/api/orders/admin`            | Get all orders (paginated, filterable) | Admin         |
| PATCH  | `/api/orders/admin/:id/status` | Update order status                    | Admin         |

---

### POST `/api/orders`

**Request body:**

```json
{
  "items": [
    {
      "product": "<productId>",
      "quantity": 2,
      "variantSku": "SOFA-BLK-L"
    }
  ],
  "shippingAddress": {
    "fullName": "Ade Oluwaseun",
    "email": "ade@example.com",
    "phone": "+2348012345678",
    "street": "12 Banana Island Road",
    "city": "Lagos",
    "state": "Lagos",
    "postalCode": "101233",
    "country": "Nigeria"
  },
  "paymentMethod": "card",
  "notes": "Please deliver after 5pm"
}
```

**`paymentMethod` values:** `"card"` | `"pay_on_delivery"` | `"bank"`

> `shippingAddress.state` and `shippingAddress.country` are optional. All other `shippingAddress` fields are required.

**Shipping cost logic (server-calculated):**

- Subtotal >= £500 → free shipping (£0)
- Subtotal < £500 → £50 shipping charge

**Success `201`:**

```json
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "_id": "67b...",
    "orderNumber": "ORD-12345678-432",
    "items": [
      /* order items with snapshots */
    ],
    "shippingAddress": {
      /* address */
    },
    "subtotal": 460.0,
    "shippingCost": 50.0,
    "total": 510.0,
    "paymentMethod": "card",
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "statusHistory": [],
    "createdAt": "2026-04-04T09:00:00.000Z"
  }
}
```

> Creating an order automatically **clears the user's cart** and **decrements product stock**.  
> A `order_placed` notification is sent in real-time via Socket.IO.  
> For card payments, follow up immediately with `POST /api/payment/create-payment-intent`.

---

### GET `/api/orders`

**Query parameters:**

| Parameter | Values                                                               | Description               |
| --------- | -------------------------------------------------------------------- | ------------------------- |
| `page`    | number                                                               | Page (default: `1`)       |
| `limit`   | number                                                               | Max `100` (default: `10`) |
| `status`  | `pending` \| `processing` \| `shipped` \| `delivered` \| `cancelled` | Filter by order status    |

**Success `200`:**

```json
{
  "success": true,
  "orders": [
    /* array of order objects */
  ],
  "pagination": { "total": 5, "page": 1, "pages": 1, "limit": 10 }
}
```

---

### PATCH `/api/orders/:id/cancel`

Only cancellable if `orderStatus` is `"pending"` or `"processing"`.

**Success `200`:**

```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "order": {
    /* updated order */
  }
}
```

---

### Order Status Values

| `orderStatus` | Meaning                                      |
| ------------- | -------------------------------------------- |
| `pending`     | Just created, awaiting payment or processing |
| `processing`  | Payment confirmed, being prepared            |
| `shipped`     | Dispatched, in transit                       |
| `delivered`   | Delivered to customer                        |
| `cancelled`   | Cancelled                                    |

| `paymentStatus` | Meaning           |
| --------------- | ----------------- |
| `pending`       | Not yet paid      |
| `paid`          | Payment confirmed |
| `failed`        | Payment failed    |
| `refunded`      | Refund processed  |

---

## 9. Payments (`/api/payment`)

| Method | Path                                 | Description                                        | Access               |
| ------ | ------------------------------------ | -------------------------------------------------- | -------------------- |
| POST   | `/api/payment/create-payment-intent` | Create a Stripe payment intent for an order        | Authenticated        |
| POST   | `/api/payment/confirm-success`       | Confirm a succeeded payment intent from the client | Authenticated        |
| POST   | `/api/payment/webhook`               | Stripe webhook receiver                            | Public (Stripe only) |

---

### POST `/api/payment/create-payment-intent`

Call this after creating an order with `paymentMethod: "card"`.

**Request body:**

```json
{ "orderId": "<orderId>" }
```

**Success `200`:**

```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_yyy"
}
```

> Use `clientSecret` with the **Stripe SDK** on the mobile client to present the payment sheet.  
> Calling this endpoint again for an order that already has a pending intent returns the existing `clientSecret` (idempotent).  
> If the order is already paid, returns `400`.

---

### POST `/api/payment/confirm-success`

**Headers:** `Authorization: Bearer <accessToken>`

Call this immediately after the Stripe SDK's `confirmPayment()` resolves with `"succeeded"`. This ensures the `Payment` and `Order` records are marked paid even when the Stripe webhook has not yet arrived (e.g., during local development or network delays).

**Request body:**

```json
{ "stripePaymentIntentId": "pi_xxx..." }
```

**Success `200`:**

```json
{ "success": true }
```

**Error responses:**

- `400` — `stripePaymentIntentId` missing, or Stripe reports the intent has not yet succeeded.
- `500` — Internal error while updating records.

> The server re-retrieves the payment intent from Stripe to verify its status before updating records. This endpoint is a safety net — the webhook (`POST /api/payment/webhook`) handles the same update asynchronously.

---

### POST `/api/payment/webhook`

This endpoint is called by **Stripe only**. The request body must be the raw byte stream — do not send JSON from the client. See [Stripe Webhook Events](#19-stripe-webhook-events) below.

---

## 10. Wishlist (`/api/wishlist`)

All routes require authentication.

| Method | Path                       | Description                    | Access        |
| ------ | -------------------------- | ------------------------------ | ------------- |
| GET    | `/api/wishlist`            | Get current user's wishlist    | Authenticated |
| POST   | `/api/wishlist`            | Add a product to wishlist      | Authenticated |
| DELETE | `/api/wishlist/:productId` | Remove a product from wishlist | Authenticated |
| DELETE | `/api/wishlist`            | Clear entire wishlist          | Authenticated |

---

### GET `/api/wishlist`

**Success `200`:**

```json
{
  "success": true,
  "wishlist": {
    "_id": "68c...",
    "products": [
      {
        "_id": "64f...",
        "name": "Lagos Comfort Sofa",
        "slug": "lagos-comfort-sofa",
        "price": 450.0,
        "compareAtPrice": 550.0,
        "inStock": true,
        "primaryImage": { "secureUrl": "...", "publicId": "..." },
        "variants": [
          /* variant array */
        ]
      }
    ],
    "count": 1
  }
}
```

---

### POST `/api/wishlist`

**Request body:**

```json
{ "productId": "<productId>" }
```

Returns `400` if the product is already in the wishlist.

**Success `200`:**

```json
{
  "success": true,
  "message": "Product added to wishlist",
  "wishlist": {
    /* wishlist object */
  }
}
```

---

## 11. Reviews (`/api/reviews`)

| Method | Path                                   | Description                        | Access        |
| ------ | -------------------------------------- | ---------------------------------- | ------------- |
| GET    | `/api/reviews/product/:productId`      | Get approved reviews for a product | Public        |
| POST   | `/api/reviews`                         | Submit a new review                | Authenticated |
| PUT    | `/api/reviews/:reviewId`               | Update own review                  | Authenticated |
| DELETE | `/api/reviews/:reviewId`               | Delete own review                  | Authenticated |
| GET    | `/api/reviews/admin`                   | List all reviews (filterable)      | Admin         |
| PATCH  | `/api/reviews/admin/:reviewId/approve` | Approve or reject a review         | Admin         |

---

### GET `/api/reviews/product/:productId`

**Query parameters:**

| Parameter | Values                                                            | Description                        |
| --------- | ----------------------------------------------------------------- | ---------------------------------- |
| `page`    | number                                                            | Page (default: `1`)                |
| `limit`   | number                                                            | Max `50` (default: `10`)           |
| `sort`    | `-createdAt` \| `createdAt` \| `rating` \| `-rating` \| `helpful` | Sort order (default: `-createdAt`) |

**Success `200`:**

```json
{
  "success": true,
  "reviews": [
    {
      "_id": "69d...",
      "product": "64f...",
      "user": {
        "_id": "64a...",
        "fullName": "Ade Oluwaseun",
        "profilePicture": {
          "_id": "65a...",
          "secureUrl": "https://res.cloudinary.com/...",
          "publicId": "profile-pictures/abc123",
          "url": "https://res.cloudinary.com/..."
        }
      },
      "rating": 5,
      "content": "Absolutely love this sofa! Great quality and very comfortable.",
      "isVerifiedPurchase": false,
      "isApproved": true,
      "helpfulCount": 3,
      "createdAt": "2026-03-20T00:00:00.000Z"
    }
  ],
  "pagination": { "total": 8, "page": 1, "pages": 1, "limit": 10 }
}
```

> `profilePicture` on the user object is fully populated (nested populate). It will be `null` if the user has no profile picture.  
> `isVerifiedPurchase` is always `false` on new reviews — the field is reserved for future use.

---

### POST `/api/reviews`

Any **authenticated user** may submit a review. No purchase history is required. One review per user per product is enforced.

**Request body:**

```json
{
  "product": "<productId>",
  "rating": 5,
  "content": "Absolutely love this sofa! Great quality and very comfortable."
}
```

> `rating` must be an integer between `1` and `5`.  
> `content` must be 10–1000 characters.

**Success `201`:**

```json
{
  "success": true,
  "message": "Review submitted successfully. It will appear after admin approval.",
  "review": {
    /* review object */
  }
}
```

> Reviews are not publicly visible until an admin approves them (`isApproved: false` by default).

---

### PUT `/api/reviews/:reviewId`

Update your own review. Send only the fields to change (`rating` and/or `content`). At least one field is required.

**Success `200`:**

```json
{
  "success": true,
  "message": "Review updated successfully",
  "review": {
    /* updated review object */
  }
}
```

---

### DELETE `/api/reviews/:reviewId`

**Success `200`:**

```json
{ "success": true, "message": "Review deleted successfully" }
```

---

### GET `/api/reviews/admin` (Admin)

**Query parameters:**

| Parameter   | Type                  | Description                           |
| ----------- | --------------------- | ------------------------------------- |
| `page`      | number                | Page (default: `1`)                   |
| `limit`     | number                | Max `50` (default: `20`)              |
| `approved`  | `"true"` \| `"false"` | Filter by approval status             |
| `productId` | ObjectId string       | Filter by product (24-char hex only)  |

**Success `200`:**

```json
{
  "success": true,
  "reviews": [
    /* reviews with populated product (name, slug) and user (fullName, email) */
  ],
  "pagination": { "total": 40, "page": 1, "pages": 2, "limit": 20 }
}
```

---

### PATCH `/api/reviews/admin/:reviewId/approve` (Admin)

**Request body:**

```json
{ "isApproved": true }
```

**Success `200`:**

```json
{
  "success": true,
  "message": "Review approved successfully",
  "review": { /* updated review */ }
}
```

> Approving a review triggers a re-calculation of the product's `averageRating` and `reviewCount`.

---

## 12. Notifications (`/api/notifications`)

All routes require authentication.

| Method | Path                              | Description                        | Access        |
| ------ | --------------------------------- | ---------------------------------- | ------------- |
| GET    | `/api/notifications`              | Get paginated notification list    | Authenticated |
| GET    | `/api/notifications/unread-count` | Get count of unread notifications  | Authenticated |
| PATCH  | `/api/notifications/:id/read`     | Mark a single notification as read | Authenticated |
| PATCH  | `/api/notifications/read-all`     | Mark all notifications as read     | Authenticated |

---

### GET `/api/notifications`

**Query parameters:** `page` (default: `1`), `limit` (max `50`, default: `10`).

**Success `200`:**

```json
{
  "success": true,
  "notifications": [
    {
      "_id": "70e...",
      "user": "64a...",
      "type": "order_status_updated",
      "title": "Order Status Updated",
      "message": "Your order #ORD-12345678-432 status has been updated to shipped.",
      "isRead": false,
      "metadata": {
        "orderId": "67b...",
        "orderNumber": "ORD-12345678-432",
        "orderStatus": "shipped"
      },
      "createdAt": "2026-04-04T12:00:00.000Z"
    }
  ],
  "pagination": { "total": 12, "page": 1, "pages": 2, "limit": 10 }
}
```

**Notification `type` values:**

| Type                   | Trigger                                        |
| ---------------------- | ---------------------------------------------- |
| `order_placed`         | Order created or payment confirmed             |
| `order_status_updated` | Admin updates order status                     |
| `order_cancelled`      | Refund processed                               |
| `chat_message`         | New support message received                   |
| `system`               | General system notifications, payment failures |

---

### GET `/api/notifications/unread-count`

**Success `200`:**

```json
{ "success": true, "count": 3 }
```

---

## 13. Chat / Live Support

The chat system uses **Socket.IO** for real-time messaging and a REST API for conversation history. Both authenticated users and unauthenticated guests are supported.

### REST Endpoints (`/api/chat`)

| Method | Path                                               | Description                       | Access        |
| ------ | -------------------------------------------------- | --------------------------------- | ------------- |
| POST   | `/api/chat/conversations`                          | Create or resume own conversation | Authenticated |
| GET    | `/api/chat/conversations/:conversationId/messages` | Get message history (paginated)   | Authenticated |
| GET    | `/api/chat/conversations`                          | List all conversations            | Admin         |
| PATCH  | `/api/chat/conversations/:conversationId/close`    | Close a conversation              | Admin         |

---

### POST `/api/chat/conversations`

Creates a new conversation (or resumes an existing open one) for the authenticated user. The `conversationId` format is `conv:<userId>`.

**Success `200`:**

```json
{
  "success": true,
  "conversationId": "conv:64a...",
  "status": "pending",
  "messages": [
    /* last 50 messages, sorted createdAt asc */
  ]
}
```

---

### GET `/api/chat/conversations/:conversationId/messages`

**Query parameters:** `page` (default: `1`), `limit` (max `100`, default: `50`).

**Success `200`:**

```json
{
  "success": true,
  "messages": [
    {
      "_id": "71f...",
      "conversationId": "conv:64a...",
      "sender": {
        "userId": {
          "_id": "64a...",
          "fullName": "Ade Oluwaseun",
          "email": "ade@example.com",
          "profilePicture": {
            "_id": "65a...",
            "secureUrl": "https://res.cloudinary.com/...",
            "publicId": "profile-pictures/abc123",
            "url": "https://res.cloudinary.com/..."
          }
        },
        "role": "customer",
        "senderName": null
      },
      "message": "Hello, I need help with my order.",
      "readBy": ["64a..."],
      "createdAt": "2026-04-04T09:30:00.000Z"
    }
  ],
  "pagination": { "total": 12, "page": 1, "pages": 1, "limit": 50 }
}
```

> `sender.userId.profilePicture` is fully populated (nested populate). It will be `null` if the sender has no profile picture.  
> Fetching messages as admin automatically marks all messages in the conversation as read and resets `unreadByAdmin` to `0`.

---

### GET `/api/chat/conversations` (Admin)

Returns all conversations sorted by most recent activity, with each conversation's `userId` nested-populated (including `profilePicture`).

**Success `200`:**

```json
{
  "success": true,
  "conversations": [
    {
      "_id": "...",
      "conversationId": "conv:64a...",
      "userId": {
        "_id": "64a...",
        "fullName": "Ade Oluwaseun",
        "email": "ade@example.com",
        "profilePicture": { /* media object or null */ }
      },
      "adminId": { "_id": "...", "fullName": "Admin" },
      "status": "active",
      "lastMessage": "Hello, I need help with my order.",
      "lastMessageAt": "2026-04-04T09:30:00.000Z",
      "unreadByAdmin": 2,
      "displayName": "Ade Oluwaseun"
    }
  ]
}
```

> `displayName` is derived server-side: `userId.fullName` → `userId.email` → `guestName` → `"Guest"`.

---

### Conversation Status Values

| `status`  | Meaning                                 |
| --------- | --------------------------------------- |
| `pending` | User initiated, no admin has joined yet |
| `active`  | Admin has joined and is responding      |
| `closed`  | Conversation has been closed            |

---

## 14. Support Tickets (`/api/support`)

Support tickets are a separate async channel (e.g., for email-style support).

| Method | Path                           | Description                              | Access                          |
| ------ | ------------------------------ | ---------------------------------------- | ------------------------------- |
| POST   | `/api/support`                 | Create a support ticket                  | Public (guest or authenticated) |
| GET    | `/api/support/my-tickets`      | List own tickets                         | Authenticated                   |
| GET    | `/api/support/:id`             | Get a single ticket                      | Authenticated                   |
| POST   | `/api/support/:id/reply`       | Reply to a ticket                        | Authenticated                   |
| GET    | `/api/support/admin`           | List all tickets (paginated, filterable) | Admin                           |
| GET    | `/api/support/admin/:id`       | Get any ticket (full detail)             | Admin                           |
| PATCH  | `/api/support/admin/:id`       | Update ticket status/priority/assignee   | Admin                           |
| POST   | `/api/support/admin/:id/reply` | Add admin reply to a ticket              | Admin                           |

---

### POST `/api/support`

Can be submitted by guests (provide `name` and `email`) or authenticated users.

**Request body:**

```json
{
  "subject": "Missing item from my order",
  "message": "I received my delivery today but one item was missing from the package.",
  "priority": "high",
  "name": "Jane Smith",
  "email": "jane@example.com"
}
```

> For authenticated users, `name` and `email` are ignored (taken from user account).  
> `priority` values: `"low"` | `"medium"` | `"high"` (default: `"medium"`).  
> `subject` must be 3–200 characters. `message` must be 10–2000 characters.

**Success `201`:**

```json
{
  "success": true,
  "message": "Support ticket created successfully",
  "ticketId": "72g..."
}
```

---

### POST `/api/support/:id/reply`

**Request body:**

```json
{ "text": "Could you please provide the order number so we can investigate?" }
```

> `text` must be at least 2 characters.  
> Replying to a `"new"` ticket transitions its status to `"open"` automatically.  
> Cannot reply to tickets with status `"closed"` or `"resolved"`.

---

### PATCH `/api/support/admin/:id` (Admin)

Update a ticket's `status`, `priority`, or `assignedTo`. At least one field is required.

**Request body** (all fields optional, at least one required):

```json
{
  "status": "in_progress",
  "priority": "high",
  "assignedTo": "<adminUserId or null>"
}
```

---

### POST `/api/support/admin/:id/reply` (Admin)

**Request body:**

```json
{ "text": "We have investigated and will dispatch a replacement." }
```

> Admin replying to a `"new"` ticket transitions its status to `"in_progress"` (not `"open"`).

---

### Ticket Status Values

`"new"` → `"open"` → `"in_progress"` → `"resolved"` / `"closed"`

| Status transition           | Trigger                                |
| --------------------------- | -------------------------------------- |
| `"new"` → `"open"`          | Customer replies to a new ticket       |
| `"new"` → `"in_progress"`   | Admin replies to a new ticket          |
| Any → `"resolved"/"closed"` | Admin explicitly sets via PATCH        |

---

## 15. Admin Endpoints (`/api/admin`)

All admin endpoints require `Authorization: Bearer <accessToken>` where the user has `role: "admin"`.

| Method | Path                             | Description                            | Access |
| ------ | -------------------------------- | -------------------------------------- | ------ |
| GET    | `/api/admin/dashboard/stats`     | Get dashboard statistics               | Admin  |
| GET    | `/api/admin/payments/stats`      | Get payment analytics                  | Admin  |
| GET    | `/api/admin/users`               | List all users (paginated, searchable) | Admin  |
| GET    | `/api/admin/users/:id`           | Get a user by ID                       | Admin  |
| PATCH  | `/api/admin/users/:id/status`    | Activate / deactivate a user           | Admin  |
| PATCH  | `/api/admin/users/:id/role`      | Change user role                       | Admin  |
| DELETE | `/api/admin/users/delete/:id`    | Permanently delete a user              | Admin  |
| GET    | `/api/admin/products`            | List all products (cached)             | Admin  |
| GET    | `/api/admin/products/:id`        | Get product by ID (cached)             | Admin  |
| POST   | `/api/admin/products/create`     | Create a new product                   | Admin  |
| PUT    | `/api/admin/products/update/:id` | Update a product                       | Admin  |
| DELETE | `/api/admin/products/delete/:id` | Delete a product                       | Admin  |

---

### GET `/api/admin/dashboard/stats`

**Success `200`:**

```json
{
  "success": true,
  "stats": {
    "totalUsers": 312,
    "totalOrders": 89,
    "totalProducts": 46,
    "totalRevenue": 24850.0,
    "newUsersLast7Days": 14,
    "recentOrders": [
      /* last 8 orders with user (fullName, email), orderNumber, total, orderStatus, paymentStatus */
    ],
    "ordersByStatus": {
      "pending": 12,
      "processing": 5,
      "shipped": 8,
      "delivered": 60,
      "cancelled": 4
    },
    "ordersLast30Days": [{ "_id": "2026-04-01", "orders": 3, "revenue": 890.0 }]
  }
}
```

> `totalProducts` counts only active products. `totalRevenue` is the sum of `total` for all orders with `paymentStatus: "paid"`.

---

### GET `/api/admin/payments/stats`

**Success `200`:**

```json
{
  "success": true,
  "stats": {
    "totalRevenue": 24850.0,
    "totalPayments": 89,
    "statusBreakdown": {
      "succeeded": { "count": 76, "total": 24850.0 },
      "pending": { "count": 8, "total": 0 },
      "failed": { "count": 5, "total": 0 }
    },
    "revenueByMethod": {
      "card": { "count": 76, "total": 24850.0 }
    },
    "recentPayments": [
      /* last 10 payments with populated user (fullName, email) and order (orderNumber, total) */
    ],
    "dailyRevenue": [{ "_id": "2026-04-01", "revenue": 450.0, "count": 2 }]
  }
}
```

---

### GET `/api/admin/users`

**Query parameters:**

| Parameter  | Type                  | Description              |
| ---------- | --------------------- | ------------------------ |
| `page`     | number                | Page (default: `1`)      |
| `limit`    | number                | Per page (default: `20`) |
| `search`   | string                | Search by name or email  |
| `role`     | `customer` \| `admin` | Filter by role           |
| `isActive` | `true` \| `false`     | Filter by active status  |

---

### PATCH `/api/admin/users/:id/status`

**Request body:**

```json
{ "isActive": false }
```

---

### PATCH `/api/admin/users/:id/role`

**Request body:**

```json
{ "role": "admin" }
```

> Admins cannot change their own role or status.

---

### POST `/api/admin/products/create`

**Request body:**

```json
{
  "name": "Lagos Comfort Sofa",
  "description": "A premium three-seater sofa with hand-stitched leather upholstery.",
  "shortDescription": "Premium three-seater sofa",
  "price": 450.0,
  "compareAtPrice": 550.0,
  "primaryImage": "<mediaId>",
  "images": ["<mediaId1>", "<mediaId2>"],
  "category": "<categoryId>",
  "variants": [
    {
      "sku": "SOFA-BLK-L",
      "price": 460.0,
      "stockQuantity": 5,
      "attributes": { "color": "Black", "size": "Large" }
    }
  ],
  "material": "Leather",
  "dimensions": { "width": 220, "height": 85, "depth": 95 },
  "stockQuantity": 12,
  "isFeatured": false
}
```

> `primaryImage` and `images` are Media document IDs obtained from `POST /api/upload/single` or `POST /api/upload/multiple` first.  
> `slug` is auto-generated from `name` if not provided.

---

## 16. Media Upload (Admin) (`/api/upload`)

All upload routes require `Admin` access.

| Method | Path                   | Description                         | Access |
| ------ | ---------------------- | ----------------------------------- | ------ |
| POST   | `/api/upload/single`   | Upload a single image to Cloudinary | Admin  |
| POST   | `/api/upload/multiple` | Upload up to 10 images at once      | Admin  |
| GET    | `/api/upload/all`      | List all uploaded media             | Admin  |

---

### POST `/api/upload/single`

**Content-Type:** `multipart/form-data`

| Field    | Type   | Description                                             |
| -------- | ------ | ------------------------------------------------------- |
| `image`  | File   | Image file (required)                                   |
| `folder` | string | Cloudinary folder name (optional, default: `"general"`) |

**Success `200`:**

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "media": {
    "id": "65a...",
    "url": "https://res.cloudinary.com/...",
    "publicId": "products/abc123",
    "mimeType": "image/jpeg",
    "folder": "products"
  }
}
```

> Use the returned `id` as `primaryImage` or in the `images` array when creating/updating products or categories.

---

### POST `/api/upload/multiple`

**Content-Type:** `multipart/form-data`

| Field    | Type   | Description                  |
| -------- | ------ | ---------------------------- |
| `images` | File[] | Up to 10 image files         |
| `folder` | string | Cloudinary folder (optional) |

**Success `200`:**

```json
{
  "success": true,
  "message": "Images uploaded successfully",
  "media": [
    {
      "id": "65a...",
      "url": "...",
      "publicId": "...",
      "mimeType": "image/jpeg",
      "folder": "products"
    }
  ]
}
```

> If any file in a batch fails, all successful uploads in that batch are rolled back (atomic behaviour).

---

### GET `/api/upload/all`

**Query parameters:** `page` (default: `1`), `limit` (max `50`, default: `20`), `folder` (alphanumeric/hyphens/underscores only), `uploadedBy` (valid ObjectId).

---

## 17. Socket.IO Events Reference

The server exposes two namespaces. Both require the `accessToken` in the handshake `auth` object. The `/chat` namespace additionally accepts a `guestId` for unauthenticated users.

```js
// Authenticated connection
const notifSocket = io("http://your-server/notifications", {
  auth: { token: "<accessToken>" },
});

const chatSocket = io("http://your-server/chat", {
  auth: { token: "<accessToken>" },
  // OR for guests:
  // auth: { guestId: "a1b2c3d4e5f6a7b8c9d0e1f2" }
});
```

---

### Namespace: `/notifications`

| Direction       | Event                     | Payload                      | Description                                                 |
| --------------- | ------------------------- | ---------------------------- | ----------------------------------------------------------- |
| Server → Client | `notification:new`        | Notification object          | Emitted whenever a new notification is created for the user |
| Client → Server | `notifications:mark-read` | `{ notificationId: "<id>" }` | Mark a notification as read without an HTTP round-trip      |

**`notification:new` payload:**

```json
{
  "_id": "70e...",
  "user": "64a...",
  "type": "order_status_updated",
  "title": "Order Status Updated",
  "message": "Your order #ORD-12345678-432 status has been updated to shipped.",
  "isRead": false,
  "metadata": {
    "orderId": "67b...",
    "orderNumber": "ORD-12345678-432",
    "orderStatus": "shipped"
  },
  "createdAt": "2026-04-04T12:00:00.000Z"
}
```

---

### Namespace: `/chat`

#### Client → Server Events

| Event                    | Payload                                                        | Description                                                                  |
| ------------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `chat:init`              | `{ forceNew?: boolean }`                                       | Initialize or resume the user's conversation. Emits `chat:initialized` back. |
| `chat:join-conversation` | `{ conversationId: string }`                                   | Join a specific conversation room. Admins use this to take a conversation.   |
| `chat:send`              | `{ conversationId: string, message: string, tempId?: string }` | Send a message.                                                              |
| `chat:typing`            | `{ conversationId: string, isTyping: boolean }`                | Broadcast typing indicator to the other party.                               |
| `chat:close`             | `{ conversationId: string }`                                   | Close a conversation (admin only).                                           |

#### Server → Client Events

| Event               | Payload                                  | Description                                              |
| ------------------- | ---------------------------------------- | -------------------------------------------------------- |
| `chat:initialized`  | `{ conversationId, status, messages[] }` | Returned after `chat:init`. Contains message history.    |
| `chat:message`      | Message object + `tempId`                | A new message was sent in the conversation.              |
| `chat:new-message`  | `{ conversationId, message }`            | Broadcast to admin room when a customer sends a message. |
| `chat:admin-joined` | `{ conversationId }`                     | Notifies the customer that an admin has joined.          |
| `chat:typing`       | `{ userId: string, isTyping: boolean }`  | Typing indicator from the other party.                   |
| `chat:closed`       | `{ conversationId }`                     | Conversation was closed by admin.                        |
| `chat:error`        | `{ message: string }`                    | An error occurred processing a chat action.              |

**Message object shape (emitted in `chat:message`):**

```json
{
  "_id": "71f...",
  "conversationId": "conv:64a...",
  "sender": {
    "userId": {
      "_id": "64a...",
      "fullName": "Ade Oluwaseun",
      "email": "ade@example.com",
      "profilePicture": {
        "_id": "65a...",
        "secureUrl": "https://res.cloudinary.com/...",
        "publicId": "profile-pictures/abc123",
        "url": "https://res.cloudinary.com/..."
      }
    },
    "role": "customer",
    "senderName": null
  },
  "message": "Hello, I need help with my order.",
  "readBy": ["64a..."],
  "createdAt": "2026-04-04T09:30:00.000Z",
  "tempId": "client-generated-id-123"
}
```

> Use `tempId` to match the confirmed server message back to your optimistic UI update.  
> `sender.userId.profilePicture` is nested-populated and will be `null` if the sender has no profile picture.  
> For guest senders, `sender.userId` is `null` and `sender.senderName` is `"Guest"`.

---

## 18. Error Response Format

All error responses follow a consistent shape:

```json
{
  "success": false,
  "message": "Human-readable error description",
  "errors": ["Validation detail 1", "Validation detail 2"]
}
```

> `errors` array is only present on validation failures (`400`).

**Common HTTP status codes:**

| Code  | Meaning                                                |
| ----- | ------------------------------------------------------ |
| `200` | Success                                                |
| `201` | Resource created                                       |
| `400` | Bad request / validation failed                        |
| `401` | Not authenticated (missing or invalid token)           |
| `403` | Forbidden (authenticated but insufficient permissions) |
| `404` | Resource not found                                     |
| `500` | Server error                                           |

**Example validation error (`400`):**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "\"rating\" must be between 1 and 5",
    "\"content\" must be at least 10 characters"
  ]
}
```

**Example auth error (`401`):**

```json
{
  "success": false,
  "message": "User is not authenticated"
}
```

**Example access error (`403`):**

```json
{
  "success": false,
  "message": "Access denied, admin only allowed"
}
```

---

## 19. Stripe Webhook Events

The server listens for the following Stripe events at `POST /api/payment/webhook`. This endpoint must receive the **raw request body** (not parsed JSON) so Stripe signature verification works. Configure this in your Express setup with `express.raw()` for this route.

| Event                           | Server action                                                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `payment_intent.succeeded`      | Sets `Payment.status = "succeeded"`, sets `Order.paymentStatus = "paid"`, sends `"Payment Confirmed"` push notification to user via Socket.IO. |
| `payment_intent.payment_failed` | Sets `Payment.status = "failed"`, sets `Order.paymentStatus = "failed"`, sends `"Payment Failed"` notification to user.                        |
| `charge.refunded`               | Sets `Payment.status = "refunded"`, sets `Order.paymentStatus = "refunded"`, sends `"Refund Processed"` notification to user.                  |

> The webhook immediately responds `200 { received: true }` before processing. Processing errors are logged but do not cause Stripe to retry unnecessarily.

**Stripe dashboard configuration:**  
Point your Stripe webhook to `https://your-domain.com/api/payment/webhook` and subscribe to the three events above. Set the `STRIPE_WEBHOOK_SECRET` environment variable to the signing secret provided by Stripe.

---

## 20. Environment Variables

The following environment variables must be set on the server for full functionality:

| Variable                | Description                                                                     |
| ----------------------- | ------------------------------------------------------------------------------- |
| `PORT`                  | HTTP server port (e.g., `5000`)                                                 |
| `MONGO_URI`             | MongoDB connection string                                                       |
| `JWT_SECRET`            | Secret key for signing access tokens                                            |
| `CLIENT_URL`            | Frontend base URL (used in password reset emails, e.g., `https://ofpstore.com`) |
| `STRIPE_SECRET_KEY`     | Stripe secret API key (`sk_live_...` or `sk_test_...`)                          |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`)                                     |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for media uploads                                         |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                                                              |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                                                           |
| `EMAIL_HOST`            | SMTP host for transactional email                                               |
| `EMAIL_PORT`            | SMTP port (e.g., `587`)                                                         |
| `EMAIL_SECURE`          | `"true"` for TLS, `"false"` for STARTTLS                                        |
| `EMAIL_USER`            | SMTP username                                                                   |
| `EMAIL_PASS`            | SMTP password                                                                   |
| `EMAIL_FROM`            | From address for outbound emails (e.g., `noreply@ofpstore.com`)                 |

---

_Updated: 2026-04-04 — OFP Store API v1_
