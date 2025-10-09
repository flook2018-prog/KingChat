# 🚂 Railway Deployment Guide for KingChat

## Quick Deploy to Railway

1. **Fork this repository** to your GitHub account

2. **Create a new project on Railway**
   - Go to [Railway.app](https://railway.app)
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Select your forked repository

3. **Set up MongoDB Database**
   - Add MongoDB service to your Railway project
   - OR use MongoDB Atlas (recommended)

4. **Configure Environment Variables**
   Copy these variables to your Railway project:

   ```bash
   NODE_ENV=production
   PORT=5001
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kingchat
   CORS_ORIGIN=https://your-frontend-domain.com
   FRONTEND_URL=https://your-frontend-domain.com
   ```

5. **Deploy**
   - Railway will automatically build and deploy your app
   - Your backend will be available at: `https://your-app-name.up.railway.app`

## Frontend Deployment Options

### Option 1: Static Hosting (Vercel/Netlify)
- Deploy the `client` folder to Vercel or Netlify
- Update API URLs in frontend to point to your Railway backend

### Option 2: Serve Frontend from Backend
- Uncomment the static file serving code in server.js
- Build your frontend and serve it from the backend

## Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port (Railway sets this automatically) | `5001` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `CORS_ORIGIN` | Allowed frontend domains | `https://yourapp.com` |
| `FRONTEND_URL` | Your frontend URL | `https://yourapp.com` |

## Post-Deployment Checklist

- [ ] Test health endpoint: `GET /health`
- [ ] Test API endpoints: `GET /api/auth/me`
- [ ] Create initial admin user
- [ ] Update frontend API URLs
- [ ] Test login functionality
- [ ] Configure LINE webhook URL (if using)

## Troubleshooting

### Backend not starting?
- Check Railway logs for errors
- Verify environment variables are set
- Make sure MongoDB is accessible

### CORS errors?
- Update `CORS_ORIGIN` to match your frontend domain
- Check if frontend URL is correct

### Database connection issues?
- Verify MONGODB_URI is correct
- Check MongoDB Atlas IP whitelist (set to 0.0.0.0/0 for Railway)
- Test connection string locally first

## Commands for Local Development

```bash
# Start servers locally
./start-servers.bat

# Stop servers
./stop-servers.bat

# Or use npm
npm start
npm run stop
```

## Support

If you encounter issues, check:
1. Railway deployment logs
2. MongoDB Atlas logs
3. Browser developer console
4. Network tab for failed requests

Happy deploying! 🚀