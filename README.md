# React Chat App

A modern React-based chat application that connects to a Rocket.Chat server, providing a clean, responsive, and user-friendly chat interface. This frontend application is designed to integrate seamlessly with a Rocket.Chat backend for real-time messaging.

## 🚀 Quick Start

### Prerequisites
- Rocket.Chat server running (refer to the Rocket.Chat documentation for setup)
- Node.js 20.19+ or 22.12+
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Ziyadh-ali/RocketChat.git
   cd RocketChat


Install dependencies:
bashnpm install


Configure environment:
bash# Create a .env file or modify the existing .env
# Set the Rocket.Chat server URL (default: http://localhost:3000)
cp .env.example .env
Update .env if your Rocket.Chat server is running on a different URL:
envVITE_ROCKETCHAT_URL=http://localhost:3000


Start the development server:
bashnpm run dev


Open your browser and navigate to http://localhost:5173 (or the port displayed in the terminal).


🎯 Features

🔐 Authentication: Secure login using Rocket.Chat credentials.
💬 Real-time Messaging: Send and receive messages with a 3-second polling interval.
📱 Responsive Design: Optimized for desktop, tablet, and mobile devices.
🎨 Modern UI: Clean and intuitive interface with styled message bubbles.
🔄 Auto-refresh: Messages update automatically in real-time.
📋 Channel Management: Browse and switch between different chat rooms/channels.
🚀 Fast Development: Powered by Vite with hot module replacement for rapid development.

🏗️ Project Structure
textsrc/
├── assets/                 # Static assets (images, etc.)
├── components/             # React components
│   ├── Login.jsx          # Login form with input validation
│   ├── ChatLayout.jsx     # Main chat interface layout
│   ├── RoomList.jsx       # Sidebar for listing rooms/channels
│   ├── MessageList.jsx    # Scrollable message display
│   ├── MessageInput.jsx   # Input field for sending messages
│   ├── Message.jsx        # Individual message component
│   └── *.css              # Component-specific styles
├── contexts/
│   └── AuthContext.jsx    # Manages authentication state
├── services/
│   └── rocketchat.js      # Rocket.Chat API integration logic
├── App.jsx                # Main application component with routing
├── App.css                # Global styles
└── main.jsx               # Application entry point
⚙️ Configuration
Environment Variables
envVITE_ROCKETCHAT_URL=http://localhost:3000
Note: All environment variables for Vite must be prefixed with VITE_.
API Configuration
The app connects to Rocket.Chat's REST API v1:

Base URL: http://localhost:3000/api/v1
Authentication: Token-based (uses X-Auth-Token and X-User-Id headers)
Polling: Messages refresh every 3 seconds for real-time updates

🔧 Development
Available Scripts
bashnpm run dev          # Starts the development server
npm run build        # Builds the app for production
npm run preview      # Previews the production build locally
npm run lint         # Runs ESLint for code quality checks
Hot Reload
The app uses Vite's hot module replacement, enabling real-time updates to components without losing application state during development.
Browser Support

Google Chrome (recommended)
Mozilla Firefox
Safari
Microsoft Edge

🐛 Troubleshooting
Common Issues

"Connection Error" or "Network Error":

Verify that the Rocket.Chat server is running at http://localhost:3000.
Ensure CORS is enabled in the Rocket.Chat admin settings.
Check the VITE_ROCKETCHAT_URL in the .env file.


"Login Failed":

Confirm the credentials in the Rocket.Chat admin panel.
Ensure the user account exists and is active.
Verify that the user has the necessary permissions.


"No rooms available":

Ensure the user is added to channels in Rocket.Chat.
Check room access permissions for the user.
Validate the authentication token.


Messages not loading:

Inspect the browser console for API-related errors.
Ensure a room/channel is selected.
Confirm network connectivity.


Styling issues:

Clear the browser cache.
Verify that CSS files are loading correctly.
Test the responsive design across different screen sizes.



Debug Mode
Enable debug logging by opening the browser's developer console to view:

API request and response logs
Authentication status updates
Detailed error messages with stack traces

🚀 Building for Production

Build the app:
bashnpm run build

Preview the build:
bashnpm run preview

Deploy: The dist folder contains the production-ready build.

📱 Responsive Design
The application is fully responsive and supports:

Desktop (1200px+)
Tablet (768px - 1199px)
Mobile (320px - 767px)

🎨 Customization
Styling

Component-specific styles are located in src/components/*.css.
Global styles are defined in src/App.css.
Uses CSS custom properties for easy theming.
Built with modern CSS techniques (flexbox and grid).

Adding Features

Add new components in src/components/.
Extend API functionality in src/services/rocketchat.js.
Manage global state using the React Context API in src/contexts/.

📚 API Reference
Authentication
javascript// Login
POST /api/v1/login
Body: { user: "username", password: "password" }

// Response
{ data: { authToken: "...", userId: "...", me: {...} } }
Rooms
javascript// Get rooms
GET /api/v1/rooms.get
Headers: { "X-Auth-Token": "...", "X-User-Id": "..." }
Messages
javascript// Get messages
GET /api/v1/channels.history?roomId=ROOM_ID
Headers: { "X-Auth-Token": "...", "X-User-Id": "..." }

// Send message
POST /api/v1/chat.sendMessage
Body: { message: { rid: "ROOM_ID", msg: "text" } }
🤝 Contributing

Fork the repository: https://github.com/Ziyadh-ali/RocketChat.git
Create a feature branch: git checkout -b feature-name
Make your changes and test thoroughly.
Commit changes: git commit -m "Add feature"
Push to the branch: git push origin feature-name
Submit a pull request.

📄 License
MIT License - see LICENSE file for details.

Built by Ziyadh Ali
Happy Chatting! 💬
