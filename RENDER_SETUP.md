# How to Deploy on Render (Free Tier)

## Option 1: Easy Way — Blueprint (render.yaml)

1. **Go to** https://dashboard.render.com/blueprints
2. **Click "New Blueprint Instance"**
3. **Connect your GitHub repo**: `familyyouth2025-design/FollowApp`
4. **Select the repo** and click "Apply"
5. Render will read your `render.yaml` and create:
   - ✅ Free web service (`sayet-server`)
   - ✅ Free static site (`sayet-client`)
   - ✅ Free PostgreSQL database (`sayet-db`) — **90-day limit**
6. **Wait 2-5 minutes** for everything to build and deploy

## Option 2: Manual Way (if Blueprint fails)

### Step 1: Create PostgreSQL Database
1. Go to https://dashboard.render.com/new/database
2. Name: `sayet-db`
3. Plan: **Starter (Free)**
4. Click "Create Database"
5. Copy the **Internal Database URL** (you'll need it later)

### Step 2: Create Web Service (Backend)
1. Go to https://dashboard.render.com/new/web-service
2. Connect your GitHub repo
3. Settings:
   - **Name**: `sayet-server`
   - **Runtime**: Node
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Plan**: Free
4. Add Environment Variables:
   ```
   DATABASE_URL = <paste from Step 1>
   JWT_SECRET   = any-random-secret-key
   NODE_ENV     = production
   CLIENT_URL   = https://sayet-client.onrender.com
   ```
5. Click "Create Web Service"

### Step 3: Create Static Site (Frontend)
1. Go to https://dashboard.render.com/new/static
2. Connect your GitHub repo
3. Settings:
   - **Name**: `sayet-client`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/dist`
4. Add Environment Variable:
   ```
   VITE_API_URL = https://sayet-server.onrender.com
   ```
5. Click "Create Static Site"

## ⚠️ Important Notes

| Feature | Free Tier Limit |
|---------|-----------------|
| Web Service | Sleeps after 15 min inactivity |
| Database | 90 days only, then deleted |
| Storage | 1GB limit |
| Bandwidth | 100GB/month |

**To prevent database deletion after 90 days**, either:
- Upgrade to **Starter** ($7/month), or
- Export/backup your data before 90 days

## After Deploy

- **Backend URL**: https://sayet-server.onrender.com
- **Frontend URL**: https://sayet-client.onrender.com
- **Health Check**: https://sayet-server.onrender.com/api/health

## Troubleshooting

If the build fails, check these common issues:
1. Make sure `client/dist` exists after build (check `client/vite.config.js`)
2. Make sure server starts on `process.env.PORT || 3001`
3. Make sure `DATABASE_URL` is correctly set
4. Check Render dashboard logs for specific errors
