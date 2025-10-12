# KingChat - LINE Official Account Customer Service Management System

👑 A comprehensive customer service management system for LINE Official Account integration with real-time chat capabilities.

🌐 **Live Demo:** https://kingchat.up.railway.app  
🔑 **Login:** admin / admin123

## ✨ Features

### 🏢 LINE OA Management
- Account management page with connection status
- Add, edit, and delete LINE OA accounts
- Real-time connection monitoring
- Webhook management

### 👥 Customer Management
- Complete customer list with search functionality
- Real-time online/offline status
- New message notifications
- Customer details and profile management
- Editable customer information (phone, notes, etc.)

### 💬 Real-time Chat System
- Live chat interface with customers
- Support for text messages, stickers, and images
- Quick message templates
- Message timestamps and status indicators
- Typing indicators and read receipts

### ⚙️ System Settings
- Quick message management
- Notification preferences
- User permissions and roles
- System configuration

### 👨‍💼 Admin Management
- User account management
- Role-based access control
- System monitoring and analytics
- Security settings

## 🚀 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **LINE Bot SDK** - LINE integration

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling with custom variables
- **Vanilla JavaScript** - Client-side logic
- **Socket.io Client** - Real-time communication

### Security & Tools
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Express Rate Limit** - Rate limiting
- **ngrok** - Secure tunneling for development

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- ngrok account and auth token
- LINE Developer account (for LINE OA integration)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd KingChat3
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup**
   
   Create `.env` file in the `server` directory:
   ```env
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/kingchat
   JWT_SECRET=your_jwt_secret_key_here
   NGROK_AUTH_TOKEN=your_ngrok_auth_token_here
   LINE_CHANNEL_SECRET=your_line_channel_secret
   LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
   ```

5. **Create Admin User**
   ```bash
   cd server
   node createAdmin.js
   ```

## 🚀 Running the Application

### Development Mode

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start Backend Server**
   ```bash
   cd server
   npm start
   ```
   Backend will run on `http://localhost:5001`

3. **Start Frontend Server**
   ```bash
   cd client
   npm start
   ```
   Frontend will run on `http://localhost:3000`

4. **Access the Application**
   - Open your browser and go to `http://localhost:3000`
   - Login with admin credentials:
     - Username: `admin`
     - Password: `admin123`

### Production Mode

For production deployment, ensure you:

1. Set production environment variables
2. Use a production MongoDB instance
3. Configure proper SSL certificates
4. Set up reverse proxy (nginx recommended)
5. Use PM2 or similar for process management

## 📁 Project Structure

```
KingChat3/
├── server/                 # Backend application
│   ├── models/            # Database models
│   │   ├── User.js        # User model
│   │   ├── LineOA.js      # LINE OA model
│   │   ├── Customer.js    # Customer model
│   │   ├── Message.js     # Message model
│   │   └── Settings.js    # Settings model
│   ├── routes/            # API routes
│   │   ├── auth.js        # Authentication routes
│   │   ├── admin.js       # Admin routes
│   │   ├── lineoa.js      # LINE OA routes
│   │   ├── customers.js   # Customer routes
│   │   ├── messages.js    # Message routes
│   │   └── settings.js    # Settings routes
│   ├── middleware/        # Custom middleware
│   │   └── auth.js        # Authentication middleware
│   ├── server.js          # Main server file
│   ├── createAdmin.js     # Admin user creation script
│   └── package.json       # Backend dependencies
├── client/                # Frontend application
│   ├── css/              # Stylesheets
│   │   ├── style.css     # Main styles
│   │   ├── login.css     # Login page styles
│   │   └── dashboard.css # Dashboard styles
│   ├── js/               # JavaScript files
│   │   ├── api.js        # API client
│   │   ├── auth.js       # Authentication utilities
│   │   ├── login.js      # Login page logic
│   │   └── dashboard.js  # Dashboard logic
│   ├── login.html        # Login page
│   ├── dashboard.html    # Main dashboard
│   ├── frontend-server.js # Frontend server
│   └── package.json      # Frontend dependencies
└── .github/              # GitHub configuration
    └── copilot-instructions.md
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Admin Management
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

### LINE OA Management
- `GET /api/lineoa` - Get LINE OA accounts
- `POST /api/lineoa` - Create LINE OA account
- `PUT /api/lineoa/:id` - Update LINE OA account
- `DELETE /api/lineoa/:id` - Delete LINE OA account

### Customer Management
- `GET /api/customers` - Get customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Messages
- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message
- `PUT /api/messages/:id` - Update message
- `DELETE /api/messages/:id` - Delete message

### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Rate limiting protection
- CORS configuration
- Security headers with Helmet
- Input validation and sanitization
- Role-based access control

## 🌐 Real-time Features

The application uses Socket.io for real-time functionality:

- Live chat messaging
- Online/offline status updates
- Typing indicators
- New message notifications
- Connection status monitoring

## 📱 LINE Integration

To integrate with LINE Official Account:

1. Create a LINE Developer account
2. Create a new channel (Messaging API)
3. Get Channel Secret and Channel Access Token
4. Set up webhook URL (ngrok tunnel + `/webhook`)
5. Configure environment variables

## 🎨 UI/UX Features

- Responsive design for all screen sizes
- Modern CSS with custom properties
- Smooth animations and transitions
- Consistent color scheme and typography
- Mobile-friendly interface
- Accessibility considerations

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **ngrok Authentication Failed**
   - Verify ngrok auth token
   - Check ngrok account status
   - Ensure token has proper permissions

3. **LINE Webhook Issues**
   - Verify webhook URL is accessible
   - Check LINE channel configuration
   - Monitor server logs for errors

4. **CORS Errors**
   - Verify frontend and backend URLs
   - Check CORS configuration in server
   - Ensure proper environment setup

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=true
NODE_ENV=development
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

## 🚀 Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start server.js --name kingchat-backend
pm2 start frontend-server.js --name kingchat-frontend
```

### Using Docker (Optional)
```dockerfile
# Dockerfile example for backend
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

---

**KingChat** - Empowering customer service through intelligent LINE OA integration 👑
 
 