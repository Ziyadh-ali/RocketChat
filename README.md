# React Chat App (Rocket.Chat Frontend)

A modern React-based chat application that connects to a Rocket.Chat server, providing a clean, responsive, and user-friendly chat interface. This frontend application is designed to integrate seamlessly with a Rocket.Chat backend.

## 🚀 Quick Start

### Prerequisites
- Rocket.Chat server running (refer to the Rocket.Chat documentation for setup)
- Node.js 20.19+ or 22.12+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Ziyadh-ali/RocketChat.git
cd RocketChat
```

2. Install dependencies:
```bash
npm install
# or
yarn
```

3. Configure environment:
```bash
# Copy example env (if provided)
cp .env.example .env
```
Open `.env` and set your Rocket.Chat server URL. Vite environment variables must be prefixed with `VITE_`:

```
VITE_ROCKETCHAT_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

Open your browser and navigate to `http://localhost:5173` (or the port displayed by Vite).

### Production
Build the app:
```bash
npm run build
# or
yarn build
```

Preview the production build locally:
```bash
npm run preview
# or
yarn preview
```

The `dist` folder contains the production-ready build for deployment.

🎯 Features
- 🔐 Authentication: Login using Rocket.Chat credentials.
- 💬 Real-time Messaging: Messages are polled/updated (default polling interval used by the app).
- 📱 Responsive Design: Optimized for desktop, tablet, and mobile.
- 🎨 Modern UI: Clean and intuitive interface with styled message bubbles.
- 📋 Channel Management: Browse and switch between chat rooms/channels.
- 🚀 Fast Development: Powered by Vite with HMR (hot module replacement).

🏗️ Project Structure
```
src/
├── assets/                 # Static assets (images, icons, etc.)
├── components/             # React components
│   └── (e.g.) Login.jsx, ChatLayout.jsx, RoomList.jsx, MessageList.jsx,
│       MessageInput.jsx, Message.jsx, plus component CSS files
├── contexts/               # React Contexts (e.g. AuthContext.jsx)
├── services/               # API integration (e.g. rocketchat.js)
├── App.jsx                 # Main app & routing
├── App.css                 # Global styles
├── index.css               # Additional global styles
└── main.jsx                # Application entry point
public/                     # Static public files
```

⚙️ Configuration

Environment variables
- All Vite environment variables must start with `VITE_`.
- Example:
  ```
  VITE_ROCKETCHAT_URL=http://localhost:3000
  ```

API configuration
- Base URL: `http(s)://<your-rocketchat-host>/api/v1`
- Authentication: Token-based (use `X-Auth-Token` and `X-User-Id` headers returned by login)
- Polling: Messages refresh periodically for near real-time updates (poll interval is configurable in the app)

🔧 Development

Available scripts
```bash
npm run dev      # Starts the development server (Vite)
npm run build    # Builds the app for production
npm run preview  # Previews the production build locally
npm run lint     # Runs ESLint for code quality checks
```

Hot Reload
- The app uses Vite's HMR to enable fast component updates without losing application state.

Browser Support
- Google Chrome (recommended)
- Mozilla Firefox
- Safari
- Microsoft Edge

🐛 Troubleshooting

Common issues and steps to check:

"Connection Error" or "Network Error":
- Verify Rocket.Chat server is running at the URL defined in `VITE_ROCKETCHAT_URL`.
- Ensure CORS is enabled in Rocket.Chat admin settings or that your server allows requests from the frontend origin.
- Check browser console / network tab for specific request errors.

"Login Failed":
- Confirm the username/password are correct.
- Ensure the user account exists and is active in Rocket.Chat.
- Verify the Rocket.Chat REST API is reachable and returning login tokens.

"No rooms available":
- Make sure the user is a member of channels in Rocket.Chat.
- Check room/channel permissions for the user.
- Confirm the authentication token is valid and being sent with requests.

Messages not loading:
- Inspect browser console for API-related errors.
- Ensure a room/channel is selected.
- Check network connectivity and API responses.

Styling issues:
- Clear the browser cache.
- Verify CSS files are loading correctly.
- Test across different screen sizes.

Debug Mode
- Use the browser developer console to view:
  - API requests and responses
  - Authentication status updates
  - Detailed error messages and stack traces

📚 API Reference (examples)

Authentication
```http
POST /api/v1/login
Content-Type: application/json

Body:
{ "user": "username", "password": "password" }

Response:
{ "data": { "authToken": "...", "userId": "...", "me": { ... } } }
```

Rooms
```http
GET /api/v1/rooms.get
Headers:
{ "X-Auth-Token": "...", "X-User-Id": "..." }
```

Messages
```http
GET /api/v1/channels.history?roomId=ROOM_ID
Headers:
{ "X-Auth-Token": "...", "X-User-Id": "..." }

POST /api/v1/chat.sendMessage
Headers:
{ "X-Auth-Token": "...", "X-User-Id": "..." }
Body:
{ "message": { "rid": "ROOM_ID", "msg": "text" } }
```

🤝 Contributing
- Fork the repository: https://github.com/Ziyadh-ali/RocketChat.git
- Create a feature branch: `git checkout -b feature-name`
- Make changes and test thoroughly
- Commit: `git commit -m "Add feature"`
- Push: `git push origin feature-name`
- Open a Pull Request

📄 License
MIT License - see the LICENSE file for details.

Built by Ziyadh Ali  
Happy Chatting! 💬
```
