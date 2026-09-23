# MediaVault

### Private Media Storage & Sharing Platform

MediaVault is a full-stack web application for securely uploading, managing, and sharing personal images and videos.

It provides authenticated media storage, Cloudinary-based file handling, secure share links with expiration and download limits, search/filtering, pagination, rate limiting, and protected API routes.

---

##  Tech Stack

### Frontend

* React.js
* React Router
* CSS
* Vite

### Backend

* Node.js
* Express.js
* JWT
* bcryptjs
* Multer
* express-rate-limit

### Database

* MongoDB Atlas
* Mongoose

### Cloud Storage

* Cloudinary

### Deployment

* Vercel — Frontend
* Render — Backend
* MongoDB Atlas — Database
* Cloudinary — Media storage
---
##  How It Works

### 1. Authentication

Users register with their name, email, and password.

Passwords are hashed before being stored in MongoDB.

After login, the server generates a JWT:

```text
User → Login → Express API → JWT → React Client
```

The JWT is then sent with protected API requests:

```http
Authorization: Bearer <token>
```

---

### 2. Media Upload

When a user uploads an image or video:

```text
React
  ↓
Express API
  ↓
Multer
  ↓
Cloudinary
  ↓
MongoDB
```

Cloudinary stores the actual media file while MongoDB stores metadata such as:

* Original filename
* Cloudinary URL
* Cloudinary public ID
* Resource type
* Format
* File size
* Owner
* Creation timestamp

---

### 3. Secure Sharing

A user can generate a share link for their media.

The server generates a cryptographically random token and stores:

```text
media
owner
token
expiresAt
maxDownloads
downloadCount
```

The resulting URL looks like:

```text
/share/<secure-token>
```

The public user can access the media without logging in.

---

### 4. Download Limit

Downloads are handled separately from viewing the shared media.

The download endpoint uses an atomic MongoDB update:

```text
downloadCount < maxDownloads
        ↓
      $inc
        ↓
downloadCount + 1
```

This prevents multiple concurrent requests from bypassing the configured download limit.

---

### 5. Automatic Expiration

Share links use MongoDB's TTL index:

```js
expiresAt: {
  type: Date,
  required: true,
  expires: 0
}
```

MongoDB automatically removes expired share-link documents.

---

## DEMO
<img width="1220" height="875" alt="Screenshot 2026-09-23 181317" src="https://github.com/user-attachments/assets/dd029d35-56ad-4bda-b61e-b6a79701b6a3" />

---

<img width="798" height="892" alt="Screenshot 2026-09-23 180501" src="https://github.com/user-attachments/assets/006e47d2-97dd-4d8f-b4f3-c75ee8640716" />

---

##  API Overview

### Authentication

| Method | Endpoint             | Description     |
| ------ | -------------------- | --------------- |
| POST   | `/api/auth/register` | Register a user |
| POST   | `/api/auth/login`    | Login           |

### Media

| Method | Endpoint            | Authentication |
| ------ | ------------------- | -------------- |
| POST   | `/api/media/upload` | Required       |
| GET    | `/api/media`        | Required       |
| DELETE | `/api/media/:id`    | Required       |

### Share Links

| Method | Endpoint                     | Authentication |
| ------ | ---------------------------- | -------------- |
| POST   | `/api/share`                 | Required       |
| GET    | `/api/share`                 | Required       |
| GET    | `/api/share/:token`          | Public         |
| POST   | `/api/share/:token/download` | Public         |
| DELETE | `/api/share/:id`             | Required       |

---





### Ownership-based authorization

Users can only access or delete media belonging to their own account.

For example:

```js
Media.findOne({
  _id: mediaId,
  owner: req.user
});
```

This prevents users from manipulating another user's media simply by changing an ID.

### Database indexing

Media queries use indexes such as:

```js
mediaSchema.index({
  owner: 1,
  createdAt: -1
});
```

and:

```js
mediaSchema.index({
  owner: 1,
  resourceType: 1,
  createdAt: -1
});
```

These support common dashboard queries involving ownership, filtering, and sorting.

### Rate limiting

The API uses rate limiting to reduce abuse.

Different limits are applied to:

* General API requests
* Authentication attempts
* Download requests

### Atomic operations

Download limits are enforced using MongoDB's atomic `$inc` operation rather than a simple read-then-write flow.

This helps prevent race conditions when multiple download requests happen at the same time.

---
## License
This project is licensed under the MIT License.
