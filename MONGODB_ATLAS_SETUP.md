# 🍃 MongoDB Atlas Setup for Railway

Railway provides PostgreSQL by default, but KingChat uses MongoDB. Here's how to set up MongoDB Atlas (free tier available):

## Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas/database)
2. Sign up for free account
3. Create a new project (e.g., "KingChat")

## Step 2: Create Database Cluster
1. Click "Build a Database"
2. Choose **FREE** tier (M0 Sandbox)
3. Select region closest to Railway (US East recommended)
4. Name your cluster (e.g., "KingChat-Cluster")

## Step 3: Set Up Database Access
1. Go to "Database Access" in sidebar
2. Click "Add New Database User"
3. Create username/password (save these!)
4. Give "Read and write to any database" permissions

## Step 4: Configure Network Access
1. Go to "Network Access" in sidebar
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0)
   - This is needed for Railway to connect

## Step 5: Get Connection String
1. Go to "Database" in sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password

Example connection string:
```
mongodb+srv://username:password@kingchat-cluster.xxxxx.mongodb.net/kingchat?retryWrites=true&w=majority
```

## Step 6: Add to Railway Environment Variables
In your Railway project dashboard, add:
```
MONGODB_URI=mongodb+srv://username:password@kingchat-cluster.xxxxx.mongodb.net/kingchat?retryWrites=true&w=majority
```

## Step 7: Redeploy
Railway will automatically redeploy and connect to MongoDB Atlas!

## 💡 Tips:
- Free tier gives you 512MB storage (enough for development)
- You can upgrade later if needed
- Atlas has automatic backups and monitoring
- Connection string includes the database name (`kingchat`)

## 🔧 Environment Variables Summary for Railway:
```
NODE_ENV=production
JWT_SECRET=your-long-secret-key-at-least-32-characters
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kingchat
CORS_ORIGIN=https://kingchat.up.railway.app
FRONTEND_URL=https://kingchat.up.railway.app
RAILWAY_ENVIRONMENT=production
```