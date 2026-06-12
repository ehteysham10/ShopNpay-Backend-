# ShopNPay Backend API Documentation

Welcome to the **ShopNPay API Documentation**! This guide is designed specifically for frontend developers. It details every API endpoint, authentication flow, role-based restriction, validation rule, and integration best practice required to connect your React/Vercel frontend to the ShopNPay Node.js/Express backend.

---

## 🚀 General Configuration

### Base URL
* **Development:** `http://localhost:5000/api/v1`
* **Production:** *Update this to your hosted backend URL (e.g., `https://your-backend.herokuapp.com/api/v1`)*

### CORS Policy
The backend is configured to accept cross-origin requests from:
* `http://localhost:5173` (Local React Development)
* `https://shopnpay.vercel.app` (Production Live Frontend)

### Authentication Flow
The system uses **JWT (JSON Web Token)** for authorization.
1. **Login/Signup:** Call `/auth/login`, `/auth/register`, or `/auth/google`.
2. **Token Storage:** Store the returned `token` securely on the frontend (e.g., `localStorage`, `sessionStorage`, or state).
3. **Protected Requests:** Attach the token to the `Authorization` header of all protected requests:
   ```http
   Authorization: Bearer <YOUR_JWT_TOKEN>
   ```
4. **Token Expiry:** Standard tokens are valid for **30 days**. Password reset tokens are valid for **10 minutes**.

### Role-Based Access Control (RBAC)
* **`role: 'user'`**: The default role for registered customers. Can manage their own profile, cart, wishlist, orders, and post product reviews.
* **`role: 'admin'`**: Administrative users. Can manage products (CRUD), update user roles, view all system users, and manage order statuses. Admins *cannot* have a cart/wishlist or purchase items.

---

## ⚠️ Global Error Response Format

All API errors return a standard JSON structure with appropriate HTTP status codes:

| Status Code | Meaning |
|-------------|---------|
| `400` | Bad Request (Validation failure, missing parameters, duplicate records) |
| `401` | Unauthorized (Missing or invalid token, password incorrect) |
| `403` | Forbidden (Insufficient role permissions, trying to review unpurchased product) |
| `404` | Not Found (Resource does not exist) |
| `500` | Internal Server Error (Database or Stripe connection failure) |

### Error Payload Example
```json
{
  "status": "error",
  "message": "You are not logged in"
}
```

---

## 🔑 1. Authentication APIs

### Register User
* **URL:** `/auth/register`
* **Method:** `POST`
* **Auth Required:** No
* **Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "johndoe@example.com",
    "password": "Password123"
  }
  ```
* **Validation Rules:**
  * `name`: Required, trim, minimum 2 characters.
  * `email`: Required, must be a valid email format, must be unique in DB.
  * `password`: Required, minimum 6 characters.
* **Success Response (`201 Created`):**
  ```json
  {
    "status": "success",
    "message": "Registration successful. Please check your email to verify your account.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "data": {
      "user": {
        "id": "60d0fe4f5311236168a109ca",
        "name": "John Doe",
        "email": "johndoe@example.com",
        "role": "user",
        "isVerified": false
      }
    }
  }
  ```

---

### Verify Email
* **URL:** `/auth/verify-email/:token`
* **Method:** `GET`
* **Auth Required:** No
* **Params:** `token` (String, verification token received in email link)
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Email verified successfully! You can now log in."
  }
  ```

---

### Login User
* **URL:** `/auth/login`
* **Method:** `POST`
* **Auth Required:** No
* **Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "email": "johndoe@example.com",
    "password": "Password123"
  }
  ```
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "data": {
      "user": {
        "id": "60d0fe4f5311236168a109ca",
        "name": "John Doe",
        "email": "johndoe@example.com",
        "role": "user",
        "isVerified": true
      }
    }
  }
  ```

---

### Google OAuth Login/Signup
* **URL:** `/auth/google`
* **Method:** `POST`
* **Auth Required:** No
* **Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "token": "GOOGLE_ID_TOKEN_FROM_FRONTEND"
  }
  ```
* **Description:** Verifies the Google credentials, automatically creates a new account if one doesn't exist, and returns a JWT token.
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "data": {
      "user": {
        "id": "60d0fe4f5311236168a109cb",
        "name": "Google User",
        "email": "googleuser@gmail.com",
        "role": "user",
        "isVerified": true
      }
    }
  }
  ```

---

### Forgot Password
* **URL:** `/auth/forgot-password`
* **Method:** `POST`
* **Auth Required:** No
* **Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "email": "johndoe@example.com"
  }
  ```
* **Description:** Generates a temporary reset token and emails it to the user.
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Token sent to email!"
  }
  ```

---

### Reset Password
* **URL:** `/auth/reset-password/:token`
* **Method:** `PATCH`
* **Auth Required:** No
* **Params:** `token` (String, reset token from email link)
* **Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "password": "MyNewPassword123"
  }
  ```
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Password reset successful! You can now log in with your new password.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

---

## 👤 2. User APIs

### Get Logged-in User Profile
* **URL:** `/users/me`
* **Method:** `GET`
* **Auth Required:** Yes (`Authorization: Bearer <token>`)
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "60d0fe4f5311236168a109ca",
        "name": "John Doe",
        "email": "johndoe@example.com",
        "role": "user",
        "isVerified": true
      }
    }
  }
  ```

---

## 🛍️ 3. Product APIs

### Get All Products (With Search & Pagination)
* **URL:** `/products`
* **Method:** `GET`
* **Auth Required:** No
* **Query Parameters:**
  * `page` (Number, default: `1`): The page offset.
  * `limit` (Number, default: `12`): Number of products per page.
  * `category` (String): Filter products by category (e.g. `shoes`, `watch`, `clothing`). Use `'all'` or omit to retrieve all.
  * `search` (String): Case-insensitive keyword search for matching product titles.
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "total": 25,
    "page": 1,
    "limit": 12,
    "totalPages": 3,
    "products": [
      {
        "_id": "60d0fe4f5311236168a109cf",
        "productId": "SP-8Hx3kQ",
        "title": "Adidas Ultraboost 22",
        "description": "High-performance running shoe with maximum energy return.",
        "price": 150,
        "category": "shoes",
        "images": [
          {
            "url": "https://res.cloudinary.com/duekquzbp/image/upload/v12345/shoe.jpg",
            "publicId": "shopnpay/products/shoe"
          }
        ],
        "createdBy": {
          "_id": "60d0fe4f5311236168a109ca",
          "name": "Admin User"
        },
        "createdAt": "2026-06-11T12:00:00.000Z"
      }
    ]
  }
  ```

---

### Get Single Product Details
* **URL:** `/products/:productId`
* **Method:** `GET`
* **Auth Required:** No
* **Params:** `productId` (String, short ID format e.g. `SP-8Hx3kQ`)
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": {
      "_id": "60d0fe4f5311236168a109cf",
      "productId": "SP-8Hx3kQ",
      "title": "Adidas Ultraboost 22",
      "description": "High-performance running shoe with maximum energy return.",
      "price": 150,
      "category": "shoes",
      "images": [
        {
          "url": "https://res.cloudinary.com/duekquzbp/image/upload/v12345/shoe.jpg",
          "publicId": "shopnpay/products/shoe"
        }
      ],
      "createdBy": {
        "_id": "60d0fe4f5311236168a109ca",
        "name": "Admin User"
      }
    }
  }
  ```

---

## ✍️ 4. Review APIs

Review endpoints are nested resource routes under products.

### Create Product Review (Only Buyers)
* **URL:** `/products/:productId/reviews`
* **Method:** `POST`
* **Auth Required:** Yes (`role: 'user'`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
* **Params:** `productId` (String, e.g. `SP-8Hx3kQ`)
* **Request Body:**
  ```json
  {
    "rating": 5,
    "comment": "Absolutely incredible! The build quality exceeded my expectations."
  }
  ```
* **Validation Rules:**
  * `rating`: Required, integer between `1` and `5`.
  * `comment`: Required, maximum of **350 words**.
  * **Buyer Restriction:** The user must have a completed/paid Order in the database containing this product, otherwise returns a `403 Forbidden` error.
  * **One-time Limit:** Users can only review a product once. Subsequent attempts return a `400 Bad Request` error.
* **Success Response (`201 Created`):**
  ```json
  {
    "status": "success",
    "message": "Review submitted successfully",
    "data": {
      "_id": "60d0fe4f5311236168a109d9",
      "product": "60d0fe4f5311236168a109cf",
      "user": "60d0fe4f5311236168a109ca",
      "name": "John Doe",
      "rating": 5,
      "comment": "Absolutely incredible! The build quality exceeded my expectations.",
      "createdAt": "2026-06-12T07:25:00.000Z"
    }
  }
  ```

---

### Get Product Reviews
* **URL:** `/products/:productId/reviews`
* **Method:** `GET`
* **Auth Required:** No
* **Params:** `productId` (String, e.g. `SP-8Hx3kQ`)
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "results": 1,
    "data": [
      {
        "_id": "60d0fe4f5311236168a109d9",
        "product": "60d0fe4f5311236168a109cf",
        "user": "60d0fe4f5311236168a109ca",
        "name": "John Doe",
        "rating": 5,
        "comment": "Absolutely incredible! The build quality exceeded my expectations.",
        "createdAt": "2026-06-12T07:25:00.000Z"
      }
    ]
  }
  ```

---

## 🛒 5. Cart APIs

All Cart API endpoints are protected and only accessible to users with the role `user`.

### Get My Cart
* **URL:** `/cart`
* **Method:** `GET`
* **Auth Required:** Yes (`role: 'user'`)
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "product": {
          "_id": "60d0fe4f5311236168a109cf",
          "productId": "SP-8Hx3kQ",
          "title": "Adidas Ultraboost 22",
          "price": 150,
          "images": [
            {
              "url": "https://res.cloudinary.com/duekquzbp/image/upload/v12345/shoe.jpg",
              "publicId": "shopnpay/products/shoe"
            }
          ]
        },
        "quantity": 2,
        "_id": "60d0fe4f5311236168a109ca"
      }
    ]
  }
  ```

---

### Add Product to Cart
* **URL:** `/cart/:productId`
* **Method:** `POST`
* **Auth Required:** Yes (`role: 'user'`)
* **Params:** `productId` (String, e.g., `SP-8Hx3kQ`)
* **Validation:** If the item is already present in the cart, the server throws a `400 Bad Request` error ("Product is already in your cart"). Use the `PATCH` endpoint to adjust quantities.
* **Success Response (`200 OK`):**
  * Returns the full updated and populated cart array.

---

### Update Cart Quantity
* **URL:** `/cart/:productId`
* **Method:** `PATCH`
* **Auth Required:** Yes (`role: 'user'`)
* **Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "quantity": 3
  }
  ```
* **Validation Rules:**
  * `quantity`: Required, integer, minimum `1`, maximum **`5`**.
* **Success Response (`200 OK`):**
  * Returns the full updated and populated cart array.

---

### Remove Product from Cart
* **URL:** `/cart/:productId`
* **Method:** `DELETE`
* **Auth Required:** Yes (`role: 'user'`)
* **Params:** `productId` (String, e.g. `SP-8Hx3kQ`)
* **Success Response (`200 OK`):**
  * Returns the full updated and populated cart array.

---

## ❤️ 6. Wishlist APIs

All Wishlist API endpoints are protected and only accessible to users with the role `user`.

### Get My Wishlist
* **URL:** `/wishlist`
* **Method:** `GET`
* **Auth Required:** Yes (`role: 'user'`)
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "_id": "60d0fe4f5311236168a109cf",
        "productId": "SP-8Hx3kQ",
        "title": "Adidas Ultraboost 22",
        "price": 150,
        "images": [
          {
            "url": "https://res.cloudinary.com/duekquzbp/image/upload/v12345/shoe.jpg",
            "publicId": "shopnpay/products/shoe"
          }
        ]
      }
    ]
  }
  ```

---

### Add Product to Wishlist
* **URL:** `/wishlist/:productId`
* **Method:** `POST`
* **Auth Required:** Yes (`role: 'user'`)
* **Params:** `productId` (String, e.g. `SP-8Hx3kQ`)
* **Success Response (`200 OK`):**
  * Returns the full updated and populated wishlist array.

---

### Remove Product from Wishlist
* **URL:** `/wishlist/:productId`
* **Method:** `DELETE`
* **Auth Required:** Yes (`role: 'user'`)
* **Params:** `productId` (String, e.g. `SP-8Hx3kQ`)
* **Success Response (`200 OK`):**
  * Returns the full updated and populated wishlist array.

---

## 💳 7. Order & Payment APIs

Checkout handles computing product prices securely on the backend (using actual DB prices) based on the user's cart.

### Get Pakistan Cities List (For checkout shipping dropdown)
* **URL:** `/orders/cities`
* **Method:** `GET`
* **Auth Required:** No
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": ["Karachi", "Lahore", "Islamabad", "Rawalpindi", ...]
  }
  ```

---

### Step 1: Create Payment Intent
* **URL:** `/orders/create-payment-intent`
* **Method:** `POST`
* **Auth Required:** Yes (`role: 'user'`)
* **Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "fullAddress": "House 45, Street 2, DHA Phase 6",
    "city": "Lahore",
    "phone": "+923001234567"
  }
  ```
* **Validation Rules:**
  * `fullAddress`: Required string.
  * `city`: Required, must be a city included in the Pakistan Cities List.
  * `phone`: Required string.
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Payment intent created",
    "data": {
      "clientSecret": "pi_3MwashLkdIwHu7ix0aaaAAAA_secret_xxxxxx",
      "paymentIntentId": "pi_3MwashLkdIwHu7ix0aaaAAAA",
      "items": [
        {
          "product": "60d0fe4f5311236168a109cf",
          "title": "Adidas Ultraboost 22",
          "price": 150,
          "quantity": 2
        }
      ],
      "totalAmount": 300
    }
  }
  ```

---

### Step 2: Confirm Order
* **URL:** `/orders/confirm`
* **Method:** `POST`
* **Auth Required:** Yes (`role: 'user'`)
* **Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "paymentIntentId": "pi_3MwashLkdIwHu7ix0aaaAAAA",
    "fullAddress": "House 45, Street 2, DHA Phase 6",
    "city": "Lahore",
    "phone": "+923001234567"
  }
  ```
* **Description:** After Stripe's frontend element successfully charges the customer, the frontend submits the payment intent and shipping info to the backend. The backend queries Stripe to confirm the payment, generates the order in the database, and clears the user's cart.
* **Success Response (`201 Created`):**
  ```json
  {
    "status": "success",
    "message": "Your order has been placed! It is on the way 🎉",
    "data": {
      "_id": "60d0fe4f5311236168a109da",
      "orderId": "ORD-abcdefgh",
      "user": "60d0fe4f5311236168a109ca",
      "items": [
        {
          "product": "60d0fe4f5311236168a109cf",
          "title": "Adidas Ultraboost 22",
          "price": 150,
          "quantity": 2
        }
      ],
      "shippingInfo": {
        "fullAddress": "House 45, Street 2, DHA Phase 6",
        "city": "Lahore",
        "phone": "+923001234567"
      },
      "totalAmount": 300,
      "paymentIntentId": "pi_3MwashLkdIwHu7ix0aaaAAAA",
      "paymentStatus": "paid",
      "orderStatus": "processing",
      "createdAt": "2026-06-12T07:30:00.000Z"
    }
  }
  ```

---

### Get My Orders
* **URL:** `/orders/my-orders`
* **Method:** `GET`
* **Auth Required:** Yes (`role: 'user'`)
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "results": 1,
    "data": [
      {
        "_id": "60d0fe4f5311236168a109da",
        "orderId": "ORD-abcdefgh",
        "items": [
          {
            "product": {
              "productId": "SP-8Hx3kQ",
              "title": "Adidas Ultraboost 22",
              "images": [
                {
                  "url": "https://res.cloudinary.com/duekquzbp/image/upload/v12345/shoe.jpg"
                }
              ]
            },
            "title": "Adidas Ultraboost 22",
            "price": 150,
            "quantity": 2
          }
        ],
        "shippingInfo": {
          "fullAddress": "House 45, Street 2, DHA Phase 6",
          "city": "Lahore",
          "phone": "+923001234567"
        },
        "totalAmount": 300,
        "paymentStatus": "paid",
        "orderStatus": "processing",
        "createdAt": "2026-06-12T07:30:00.000Z"
      }
    ]
  }
  ```

---

## 🛠️ 8. Admin APIs

All admin APIs require a valid admin bearer token (`role: 'admin'`).

### Create Product (Multipart Image Upload)
* **URL:** `/products`
* **Method:** `POST`
* **Auth Required:** Yes (`role: 'admin'`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
* **Request Body (FormData):**
  * `title`: String
  * `description`: String (Maximum of **600 words**)
  * `price`: Number (Must be positive)
  * `category`: String (Must be one of: `shoes`, `watch`, `phone`, `headphones`, `laptops`, `cameras`, `gaming`, `accessories`, `clothing`)
  * `images`: Binary files (Send up to **5 images** using key name `images`)
* **Success Response (`201 Created`):**
  ```json
  {
    "status": "success",
    "data": {
      "_id": "60d0fe4f5311236168a109cf",
      "productId": "SP-8Hx3kQ",
      "title": "Adidas Ultraboost 22",
      "description": "High-performance running shoe with maximum energy return.",
      "price": 150,
      "category": "shoes",
      "images": [
        {
          "url": "https://res.cloudinary.com/duekquzbp/image/upload/v12345/shoe.jpg",
          "publicId": "shopnpay/products/shoe"
        }
      ],
      "createdBy": "60d0fe4f5311236168a109ca"
    }
  }
  ```

---

### Update Product
* **URL:** `/products/:productId`
* **Method:** `PATCH`
* **Auth Required:** Yes (`role: 'admin'`)
* **Params:** `productId` (String, e.g. `SP-8Hx3kQ`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data` or `application/json`
* **Request Body (FormData / JSON):**
  * Send fields to update (`title`, `price`, etc.). If uploading new files to `images`, the backend automatically replaces all previous images in Cloudinary.
* **Success Response (`200 OK`):**
  * Returns updated product details.

---

### Delete Product
* **URL:** `/products/:productId`
* **Method:** `DELETE`
* **Auth Required:** Yes (`role: 'admin'`)
* **Params:** `productId` (String, e.g. `SP-8Hx3kQ`)
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Product and associated images deleted successfully"
  }
  ```

---

### Get All Users
* **URL:** `/users`
* **Method:** `GET`
* **Auth Required:** Yes (`role: 'admin'`)
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "results": 2,
    "data": [
      {
        "id": "60d0fe4f5311236168a109ca",
        "name": "John Doe",
        "email": "johndoe@example.com",
        "role": "user"
      }
    ]
  }
  ```

---

### Update User Role
* **URL:** `/users/:id/role`
* **Method:** `PATCH`
* **Auth Required:** Yes (`role: 'admin'`)
* **Params:** `id` (String, MongoDB User Object ID)
* **Request Body:**
  ```json
  {
    "role": "admin"
  }
  ```
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "User role updated successfully",
    "data": {
      "user": {
        "id": "60d0fe4f5311236168a109ca",
        "role": "admin"
      }
    }
  }
  ```

---

### Delete User
* **URL:** `/users/:id`
* **Method:** `DELETE`
* **Auth Required:** Yes (`role: 'admin'`)
* **Params:** `id` (String, MongoDB User Object ID)
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "User deleted successfully"
  }
  ```

---

### Get All Orders
* **URL:** `/orders`
* **Method:** `GET`
* **Auth Required:** Yes (`role: 'admin'`)
* **Query Parameters:**
  * `page` (Number, default: `1`): Page offset.
  * `limit` (Number, default: `10`): Orders per page.
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "results": 1,
    "data": {
      "orders": [
        {
          "_id": "60d0fe4f5311236168a109da",
          "orderId": "ORD-abcdefgh",
          "user": {
            "name": "John Doe",
            "email": "johndoe@example.com"
          },
          "items": [...],
          "totalAmount": 300,
          "orderStatus": "processing"
        }
      ],
      "total": 1,
      "page": 1,
      "totalPages": 1
    }
  }
  ```

---

### Update Order Status
* **URL:** `/orders/:orderId/status`
* **Method:** `PATCH`
* **Auth Required:** Yes (`role: 'admin'`)
* **Params:** `orderId` (String, e.g. `ORD-abcdefgh`)
* **Request Body:**
  ```json
  {
    "status": "shipped"
  }
  ```
* **Validation Rules:**
  * `status`: Required. Must be one of: `processing`, `shipped`, `delivered`, `cancelled`.
* **Success Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Order status updated to shipped",
    "data": {
      "orderId": "ORD-abcdefgh",
      "orderStatus": "shipped"
    }
  }
  ```

---

## ⚡ 9. Frontend Integration Examples

Here are some standard snippets to facilitate integration with the frontend application.

### 💳 Complete Stripe Checkout Flow (React Example)

```jsx
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_...YOUR_PUBLISHABLE_KEY');

function CheckoutForm({ shippingInfo }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    try {
      // Step 1: Create Payment Intent on the backend
      const res = await fetch('http://localhost:5000/api/v1/orders/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(shippingInfo)
      });
      const { data } = await res.json();
      
      // Step 2: Confirm card payment using Stripe
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: shippingInfo.fullName,
            phone: shippingInfo.phone
          }
        }
      });

      if (result.error) {
        alert(result.error.message);
      } else if (result.paymentIntent.status === 'succeeded') {
        // Step 3: Confirm order with backend
        const confirmRes = await fetch('http://localhost:5000/api/v1/orders/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            paymentIntentId: result.paymentIntent.id,
            ...shippingInfo
          })
        });
        const orderData = await confirmRes.json();
        alert(orderData.message); // "Your order has been placed!..."
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'Processing...' : 'Place Order'}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const shippingInfo = {
    fullAddress: "House 45, Street 2, DHA Phase 6",
    city: "Lahore",
    phone: "+923001234567"
  };

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm shippingInfo={shippingInfo} />
    </Elements>
  );
}
```
