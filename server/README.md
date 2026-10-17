# ERP Management Server

This is the backend component of the ERP Management System, designed to provide a robust, scalable, and secure RESTful API.

## 🚀 Technologies

* **Runtime & Framework:** Node.js, Express.js
* **Language:** TypeScript
* **Database:** MongoDB (via Mongoose)
* **Caching & Queues:** Redis (ioredis), BullMQ
* **Authentication/Security:** JWT, Passport.js, Helmet, bcrypt, Rate Limiting
* **Media Handling:** Multer, Cloudinary, Sharp
* **API Documentation:** Swagger UI

## 📦 Installation & Setup

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   Using npm:
   ```bash
   npm install
   ```
   Or using yarn/pnpm:
   ```bash
   yarn install
   # or
   pnpm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the `server` directory by copying `.env.example` (or configure according to your needs).
   ```bash
   cp .env.example .env
   ```
   *Make sure you provide valid credentials for MongoDB, Redis, JWT Secrets, Cloudinary, and any Google/Apple OAuth keys.*

4. **Database Seeding (Optional):**
   To populate your database with initial data (such as default admin accounts or statuses):
   ```bash
   npm run seed
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The server will start and monitor file changes via `nodemon`. It usually listens on port `5000`. 
   *To view the interactive API Documentation, navigate to `http://localhost:5000/api-docs`.*

## 📜 Available Scripts

- `npm run dev`: Starts the server in development mode utilizing `nodemon` and `ts-node`.
- `npm run build`: Compiles the TypeScript source code to standard JavaScript in the `dist/` directory.
- `npm start`: Runs the production-compiled code (`node ./dist/server.js`).
- `npm run seed`: Executes the database seeder script.
- `npm run lint`: Lints the codebase matching internal rules via ESLint.
- `npm run prettier`: Formats files automatically.

## 🛡️ Security Features Overview

- **Helmet & CORS:** Enforced payload/header protection and safe origin definitions.
- **Express Rate Limit:** Protection against brute-force/DDoS attacks.
- **Cookie-Parser & JWT:** Safe extraction and propagation of standard credentials.
- **Cache Invalidation:** Middleware to purge specific redis scopes automatically upon data mutations.

---
*Maintained by the ERP Management Development Team.*
