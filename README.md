# React Chat App

A modern React chat application that connects to a Rocket.Chat server. This is the frontend application that provides a clean, responsive chat interface.

## 🚀 Quick Start

### Prerequisites
- Rocket.Chat server running (see main README for setup)
- Node.js 20.19+ or 22.12+
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   # The .env file is already configured for localhost:3000
   # Edit .env if your Rocket.Chat server is running on a different URL
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and go to `http://localhost:5173` (or the port shown in terminal)

## 🎯 Features

- 🔐 **Authentication**: Login with Rocket.Chat credentials
- 💬 **Real-time Chat**: Send and receive messages with 3-second polling
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎨 **Modern UI**: Clean, intuitive interface with message bubbles
- 🔄 **Auto-refresh**: Messages update automatically
- 📋 **Room Management**: Browse and select different channels/rooms
- 🚀 **Fast Development**: Hot module replacement with Vite

## 🏗️ Project Structure

```
src/
├── components/              # React components
│   ├── Login.jsx           # Login form with validation
│   ├── ChatLayout.jsx      # Main chat container layout
│   ├── RoomList.jsx        # Sidebar with room/channel list
│   ├── MessageList.jsx     # Scrollable message display area
│   ├── MessageInput.jsx    # Message input with send button
│   ├── Message.jsx         # Individual message component
│   └── *.css               # Component-specific styles
├── contexts/
│   └── AuthContext.jsx     # Authentication state management
├── services/
│   └── rocketchat.js       # Rocket.Chat API integration
├── App.jsx                 # Main app component with routing
├── App.css                 # Global styles
└── main.jsx               # Application entry point
```

## ⚙️ Configuration

### Environment Variables

```env
VITE_ROCKETCHAT_URL=http://localhost:3000
```

**Note**: All Vite environment variables must be prefixed with `VITE_`

### API Configuration

The app connects to Rocket.Chat's REST API v1:
- Base URL: `http://localhost:3000/api/v1`
- Authentication: Token-based (X-Auth-Token, X-User-Id headers)
- Polling: Messages refresh every 3 seconds

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Hot Reload

The app supports hot module replacement, so changes to components will update automatically without losing state.

### Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🐛 Troubleshooting

### Common Issues

1. **"Connection Error" or "Network Error"**:
   - Ensure Rocket.Chat is running on `http://localhost:3000`
   - Check if CORS is enabled in Rocket.Chat admin settings
   - Verify the VITE_ROCKETCHAT_URL in .env file

2. **"Login Failed"**:
   - Verify credentials in Rocket.Chat admin panel
   - Check if user account exists and is active
   - Ensure user has proper permissions

3. **"No rooms available"**:
   - Make sure user is added to channels in Rocket.Chat
   - Check if user has proper room access permissions
   - Verify authentication token is valid

4. **Messages not loading**:
   - Check browser console for API errors
   - Ensure you've selected a room/channel
   - Verify network connectivity

5. **Styling issues**:
   - Clear browser cache
   - Check if CSS files are loading properly
   - Verify responsive design on different screen sizes

### Debug Mode

Enable debug logging by opening browser console and looking for:
- API request/response logs
- Authentication status
- Error messages with stack traces

## 🚀 Building for Production

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Preview the build**:
   ```bash
   npm run preview
   ```

3. **Deploy**: The `dist` folder contains the production build

## 📱 Responsive Design

The app is fully responsive and works on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🎨 Customization

### Styling
- Each component has its own CSS file
- Global styles are in `App.css`
- Uses CSS custom properties for theming
- Modern CSS with flexbox and grid

### Adding Features
- New components go in `src/components/`
- API functions go in `src/services/rocketchat.js`
- State management uses React Context API

## 📚 API Reference

### Authentication
```javascript
// Login
POST /api/v1/login
Body: { user: "username", password: "password" }

// Response
{ data: { authToken: "...", userId: "...", me: {...} } }
```

### Rooms
```javascript
// Get rooms
GET /api/v1/rooms.get
Headers: { "X-Auth-Token": "...", "X-User-Id": "..." }
```

### Messages
```javascript
// Get messages
GET /api/v1/channels.history?roomId=ROOM_ID
Headers: { "X-Auth-Token": "...", "X-User-Id": "..." }

// Send message
POST /api/v1/chat.sendMessage
Body: { message: { rid: "ROOM_ID", msg: "text" } }
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m "Add feature"`
6. Push: `git push origin feature-name`
7. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Happy Chatting! 💬**