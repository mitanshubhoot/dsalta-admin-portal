# 🚀 Admin Portal Deployment Guide - Render (Free)

## Prerequisites
1. **GitHub Account** - Your code needs to be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com) (free)

## 📂 Step 1: Push Code to GitHub

First, make sure your admin-activity-portal folder is in a GitHub repository:

```bash
# Navigate to your project
cd /Users/mitanshubhoot/Documents/Dsalta/Dev/dsalta-web-main

# Initialize git if not already done
git init
git add .
git commit -m "Add admin activity portal"

# Push to GitHub (create repo first on github.com)
git remote add origin https://github.com/YOUR_USERNAME/dsalta-admin-portal.git
git push -u origin main
```

## 🖥️ Step 2: Deploy Backend API on Render

1. **Login to Render Dashboard**
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Connect your GitHub account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing your admin portal

3. **Configure Backend Service**
   ```
   Name: admin-portal-api
   Region: Oregon (US West)
   Branch: main
   Root Directory: admin-activity-portal/server
   Environment: Node
   Build Command: npm ci && npm run build
   Start Command: npm start
   Instance Type: Free
   ```

4. **Add Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=postgresql://postgres:QBfttMrAZ3yeHvMcuWGTBTOV9yY4rPBpqGSiaD9IEpdRzuQgz9A7EXXgLPC2io0l@35.208.35.166:5433/postgres
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ADMIN_EMAIL=admin@dsalta.com
   ADMIN_PASSWORD=admin123456
   CORS_ORIGIN=https://admin-portal-web.onrender.com
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Note your API URL: `https://admin-portal-api.onrender.com`

## 🌐 Step 3: Deploy Frontend on Render

1. **Create New Static Site**
   - Click "New +" → "Static Site"
   - Select same GitHub repository

2. **Configure Frontend Service**
   ```
   Name: admin-portal-web
   Branch: main
   Root Directory: admin-activity-portal/web
   Build Command: npm ci && npm run build
   Publish Directory: dist
   ```

3. **Add Environment Variables**
   ```
   VITE_API_BASE_URL=https://admin-portal-api.onrender.com
   ```

4. **Deploy**
   - Click "Create Static Site"
   - Wait for deployment (3-5 minutes)
   - Note your frontend URL: `https://admin-portal-web.onrender.com`

## 🔧 Step 4: Update CORS Configuration

After frontend deployment, update the backend's CORS origin:

1. Go to your backend service on Render
2. Go to "Environment" tab
3. Update `CORS_ORIGIN` to your actual frontend URL
4. Save changes (triggers auto-redeploy)

## ✅ Step 5: Test Your Deployment

1. **Access your admin portal**: `https://admin-portal-web.onrender.com`
2. **Login with**: 
   - Email: `admin@dsalta.com`
   - Password: `admin123456`
3. **Test all features**:
   - Dashboard overview
   - Activities tab
   - User Journey Explorer
   - Vendor Management

## 📋 Important Notes

### 🆓 Free Tier Limitations
- **Backend**: 750 hours/month, sleeps after 15 min inactivity
- **Frontend**: Unlimited static sites
- **Cold starts**: First request after sleep takes ~30 seconds

### 🔐 Security Recommendations
- Change the `JWT_SECRET` to a strong random string
- Consider using Render's secret management for sensitive values
- Update admin credentials after deployment

### 🔄 Auto-Deployment
- Both services auto-deploy when you push to the main branch
- Backend and frontend deploy independently

### 📊 Monitoring
- Check Render dashboard for logs and metrics
- Services show deployment status and build logs

## 🆘 Troubleshooting

### Backend Issues
- Check build logs in Render dashboard
- Verify all environment variables are set
- Ensure database connection is working

### Frontend Issues
- Verify `VITE_API_BASE_URL` points to correct backend URL
- Check browser console for CORS errors
- Ensure backend is running and accessible

### Database Issues
- Verify DATABASE_URL is correct
- Check external database firewall settings
- Test connection from Render's environment

## 🚀 Alternative: One-Click Deploy

You can use the included `render.yaml` file for one-click deployment:

1. In Render dashboard, click "New +" → "Blueprint"
2. Connect your GitHub repository
3. Select the repository and branch
4. Render will read `render.yaml` and deploy both services automatically

This is the fastest way to deploy both frontend and backend together!
