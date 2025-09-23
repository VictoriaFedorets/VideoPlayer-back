# VideoPlayer Backend API

This is the backend for the VideoPlayer project. It provides authentication, session management, password reset, and email confirmation endpoints.

---

## Setup

---

1. Clone the repository and install dependencies:

```bash
git clone <your_repo_url>
cd VideoPlayer-back
npm install
```

2. Create a .env file in the root directory:

```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:<your_password>@localhost:5432/VideoPlayer
PORT=3000
JWT_SECRET=supersecretkey666
```

3. Run the development server:

```bash
npm run dev
```

---

API Endpoints

---

### 1. User Registration

**POST** `/auth/register`

Request Body (JSON):

```json
{
  "name": "TestUser",
  "email": "testuser@example.com",
  "password": "12345678"
}
```

Example curl:

```bash
curl -X POST http://localhost:3000/auth/register \
-H "Content-Type: application/json" \
-d "{\"name\":\"TestUser\",\"email\":\"testuser@example.com\",\"password\":\"12345678\"}"
```

Response 201:

```json
{
  "accessToken": "<JWT_TOKEN>",
  "user": {
    "id": 1,
    "name": "TestUser",
    "email": "testuser@example.com",
    "createdAt": "2025-09-20T20:29:53.967Z"
  }
}
```

Errors:

- 409 — User already exists
- 500 — Server error

### 2. User Login

**POST** `/auth/login`

Request Body (JSON):

```json
{
  "email": "testuser@example.com",
  "password": "12345678"
}
```

Example curl:

```bash
curl -X POST http://localhost:3000/auth/login \
-H "Content-Type: application/json" \
-d "{\"email\":\"testuser@example.com\",\"password\":\"12345678\"}"
```

Response 200:

```json
{
  "accessToken": "<JWT_TOKEN>",
  "refreshToken": "<REFRESH_TOKEN>",
  "user": {
    "id": 1,
    "name": "TestUser",
    "email": "testuser@example.com",
    "createdAt": "2025-09-20T20:29:53.967Z"
  }
}
```

Errors:
-400 — Invalid credentials
-500 — Server error

### 3. Refresh Session

**POST** `/auth/refresh-session`

Headers:
Content-Type: application/json
Cookie: sessionId=<USER_ID>; refreshToken=<REFRESH_TOKEN>

Example curl:

```bash
curl -X POST http://localhost:3000/auth/refresh \
-H "Content-Type: application/json" \
-H "Cookie: sessionId=1; refreshToken=<REFRESH_TOKEN>"
```

Response 200:

```json
{
  "accessToken": "<NEW_JWT_TOKEN>"
}
```

Errors:

- 401 — Invalid session or token

### 4. Logout

**POST** `/auth/logout`

Headers:
Content-Type: application/json
Cookie: sessionId=<USER_ID>; refreshToken=<REFRESH_TOKEN>

Example curl:

```bash
curl -X POST http://localhost:3000/auth/logout \
-H "Content-Type: application/json" \
-H "Cookie: sessionId=1; refreshToken=<REFRESH_TOKEN>"
```

Response 204:

```json
"No content. Session is deleted."
```

### 5. Request Password Reset

**POST** `/auth/send-reset-email`

Request Body (JSON):

```json
{
  "email": "testuser@example.com"
}
```

Example curl:

```bash
curl -X POST http://localhost:3000/auth/send-reset-email \
-H "Content-Type: application/json" \
-d "{\"email\":\"testuser@example.com\"}"
```

Response 200:

```json
{
  "message": "Reset password email sent"
}
```

Note: Reset token is printed in server console for testing.

### 6. Reset Password

**POST** `/auth/reset-pwd`

Request Body (JSON):

```json
{
  "token": "<RESET_TOKEN>",
  "newPassword": "newpassword123"
}
```

Example curl:

```bash
curl -X POST http://localhost:3000/auth/reset-pwd \
-H "Content-Type: application/json" \
-d "{\"token\":\"<RESET_TOKEN>\",\"newPassword\":\"newpassword123\"}"
```

Response 200:

```json
{
  "message": "Password successfully reset"
}
```

Errors:

- 400 — Invalid or expired reset token
- 500 — Server error

### 7. Confirm Email

**POST** `/auth/confirm-email`

Request Body (JSON):

```json
{
  "token": "<EMAIL_CONFIRMATION_TOKEN>"
}
```

Example curl:

```bash
curl -X POST http://localhost:3000/auth/confirm-email \
-H "Content-Type: application/json" \
-d "{\"token\":\"<EMAIL_CONFIRMATION_TOKEN>\"}"
```

Response 200:

```json
{
  "message": "Email confirmed"
}
```

Errors:

- 400 — Invalid token
- 500 — Server error

### 8. Refresh Token

**POST** `/auth/refresh`

Request Body (JSON):

```json
{
  "Cookie: refreshToken=<REFRESH_TOKEN>"
}
```

Example curl:

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  --cookie "refreshToken=<REFRESH_TOKEN>"
```

Response 200:

```json
{
  "accessToken": "new.jwt.token",
  "refreshToken": "new-refresh-token"
}
```

Errors:

- 400 — Invalid refresh token
- 401 — Refresh token expired
- 500 — Server error

---

Notes
All tokens are JWT (access tokens) or randomly generated hex strings (refresh tokens).

Cookies are used for session management in refresh and logout endpoints.

Without Docker, the backend runs on any machine with Node.js and PostgreSQL installed.

You can test endpoints with curl or Postman.
