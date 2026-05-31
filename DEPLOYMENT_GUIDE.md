# AUISC EventSync - Production Deployment Guide

This guide details the steps to deploy the **AUISC EventSync** application to production. Because this application contains a persistent **Socket.io** server, a **cron job** engine, and a **Vite + React** single-page application, the best approach is to deploy the backend to a continuous hosting provider (like Render or Railway) and the frontend to Vercel.

---

## 🛠️ Step 1: Set Up MongoDB Atlas (Production Database)
Since the local MongoDB database in `db/` cannot be uploaded to production, you will need a hosted database.
1. Sign up/Log in to **[MongoDB Atlas](https://www.mongodb.com/atlas/database)**.
2. Create a free **M0 Sandbox Cluster**.
3. Under **Database Access**, create a user with read/write privileges and a strong password.
4. Under **Network Access**, add `0.0.0.0/0` (Allow access from anywhere) so that your Render server can connect to the database.
5. Click **Connect** -> Choose **Drivers** -> Copy the connection string. It will look like:
   `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/eventsync?retryWrites=true&w=majority`

---

## 💻 Step 2: Deploy the Backend Server (Render)
Because the backend server handles persistent real-time socket connections and cron schedules, it should be deployed as a **Web Service** on a platform supporting continuous runtime processes.

1. Create a free account on **[Render](https://render.com/)**.
2. Click **New +** -> **Web Service**.
3. Link your GitHub account and select your repository: `arjunj08/ausic-eventsync`.
4. Configure the following settings:
   - **Name**: `ausic-eventsync-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
5. Go to the **Environment** tab on Render and add the following **Environment Variables**:
   - `PORT`: `5000`
   - `MONGODB_URI`: *Your MongoDB Atlas connection string from Step 1*
   - `JWT_SECRET`: *A strong random string (e.g. `d7a5b3c4f923e1029c83a74b01e23...`)*
   - `CLIENT_URL`: *The URL of your frontend on Vercel (e.g. `https://ausic-eventsync.vercel.app` - you can update this once Vercel is set up)*
   - `AI_API_KEY`: *(Optional) Your Anthropic or OpenAI API Key for chatbot assistant*
   - `VITE_GOOGLE_CLIENT_ID`: *(Optional) Your Google OAuth Client ID*
   - `EMAIL_USER` / `EMAIL_PASS`: *(Optional) SMTP credentials for email alerts; if left empty, the server defaults to printing formatted HTML emails to the Render log console*
6. Click **Deploy Web Service**. Once built, copy the public URL of your backend (e.g. `https://ausic-eventsync-backend.onrender.com`).

---

## ⚡ Step 3: Deploy the Frontend Client (Vercel)
The Vite frontend client is a static Single Page Application (SPA), making Vercel the ideal hosting platform.

1. Log in to **[Vercel](https://vercel.com/)**.
2. Click **Add New** -> **Project**.
3. Import your GitHub repository `ausic-eventsync`.
4. In the Project Configuration settings, update the following:
   - **Framework Preset**: `Vite` (automatically detected)
   - **Root Directory**: Click Edit and select the `client` folder.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand the **Environment Variables** section and add:
   - `VITE_BACKEND_URL`: *The Render Backend URL from Step 2 (e.g. `https://ausic-eventsync-backend.onrender.com`)*
   - `VITE_GOOGLE_CLIENT_ID`: *(Optional) Your Google OAuth Client ID*
6. Click **Deploy**. Vercel will build and assign you a production URL (e.g., `https://ausic-eventsync.vercel.app`).

> [!IMPORTANT]
> Once your Vercel deployment completes, go back to your **Render Environment Variables** and update `CLIENT_URL` to match your Vercel production domain. This prevents CORS policy blockages.

---

## ⚙️ How Client-Side Routing is Configured
To prevent `404 Not Found` errors when users refresh routes other than the home page (like `/meetings` or `/settings`), a `vercel.json` file has been added to the `client/` folder:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
This forces all route navigation requests to fall back to the main client index, allowing React Router to handle page routing seamlessly.
