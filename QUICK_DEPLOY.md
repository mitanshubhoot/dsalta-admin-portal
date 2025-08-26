# 🚀 Quick Deploy to Render (Free) - 5 Minutes

## ⚡ Prerequisites
- GitHub account
- Render account (free at [render.com](https://render.com))

## 📤 Step 1: Push to GitHub (2 minutes)

```bash
# Navigate to the admin portal folder
cd /Users/mitanshubhoot/Documents/Dsalta/Dev/dsalta-web-main/admin-activity-portal

# Initialize git and push
git init
git add .
git commit -m "Deploy admin portal to Render"

# Create new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/dsalta-admin-portal.git
git push -u origin main
```

## 🚀 Step 2: One-Click Deploy (3 minutes)

1. **Login to Render**: [dashboard.render.com](https://dashboard.render.com)

2. **Click "New +" → "Blueprint"**

3. **Connect Repository**: 
   - Connect your GitHub account
   - Select your `dsalta-admin-portal` repository

4. **Deploy**:
   - Render reads the `render.yaml` file automatically
   - Both backend and frontend deploy together
   - Wait 5-10 minutes for completion

## ✅ Step 3: Access Your Portal

- **Frontend URL**: `https://admin-portal-web.onrender.com`
- **Backend API**: `https://admin-portal-api.onrender.com`

**Login with**:
- Email: `admin@dsalta.com`
- Password: `admin123456`

## 🎯 That's It!

Your admin portal is now live with:
- ✅ Complete activity tracking
- ✅ User journey explorer
- ✅ Vendor management
- ✅ Real-time dashboard
- ✅ Connected to production database

**Note**: Free tier services sleep after 15 minutes of inactivity. First request after sleep takes ~30 seconds.
