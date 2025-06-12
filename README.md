# 🍳 CookBook - Your Personal Recipe Management System

<div align="center">
  <img src="client/public/logo192.png" alt="CookBook Logo" width="200"/>
  
  [![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-16.x-green)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-4.4+-green)](https://www.mongodb.com/)
  [![Express](https://img.shields.io/badge/Express-4.x-lightgrey)](https://expressjs.com/)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
</div>

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## 🌟 Overview
CookBook is a full-stack web application that revolutionizes how users create, share, and discover recipes. Built with modern web technologies, it provides a seamless and intuitive experience for food enthusiasts to manage their culinary journey. The platform combines powerful features with an elegant user interface to make recipe management enjoyable and efficient.

## ✨ Features

### Core Features
- 🔍 **Advanced Recipe Search**: Powerful search functionality with filters and sorting options
- 📝 **Rich Recipe Editor**: Create and edit recipes with a user-friendly interface
- 👤 **User Profiles**: Customizable profiles with avatars and personal information
- ⭐ **Rating System**: Rate and review recipes with a 5-star system
- 💬 **Comment System**: Engage with other users through comments
- 📱 **Responsive Design**: Seamless experience across all devices

### User Experience
- 🌓 **Theme Support**: Toggle between light and dark themes
- 🔖 **Favorites**: Save and organize favorite recipes
- 📸 **Image Management**: Upload and crop recipe images
- 🔐 **Secure Authentication**: JWT-based authentication system
- 🌐 **OAuth Integration**: Sign in with Google

## 🛠 Tech Stack

### Frontend
- **Framework**: React.js 18.x
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Styling**: CSS Modules
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form
- **Icons**: React Icons
- **Data Fetching**: React Query

### Backend
- **Runtime**: Node.js 16.x
- **Framework**: Express.js 4.x
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, Google OAuth
- **File Upload**: Multer
- **Security**: Bcrypt, Express Validator
- **CORS**: Cross-Origin Resource Sharing

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm (v8 or higher) or yarn (v1.22 or higher)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/faizanamer123/CookBook.git
cd CookBook
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. **Environment Setup**

Create a `.env` file in the server directory:
```env
# Server Configuration
PORT=5000

# MongoDB Configuration
MONGODB_URI_PROD=your_production_mongodb_uri

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d

# Google OAuth Configuration
API_URL=your_ApiSide_url
CLIENT_URL=your_ClientSide_url
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=your_authorized_url
```

4. **Start the application**
```bash
# Development mode (from root directory)
npm run dev

# Production mode
npm run build
npm start
```

## 📁 Project Structure
```
CookBook/
├── client/                     # Frontend React application
│   ├── public/                # Static files
│   │   ├── index.html        # Main HTML file
│   │   ├── favicon.ico       # Favicon
│   │   ├── manifest.json     # Web app manifest
│   │   └── robots.txt        # Robots file
│   └── src/                  # Source files
│       ├── components/       # Reusable components
│       │   ├── Button/      # Button component
│       │   ├── ImageCropper/# Image cropping component
│       │   ├── Navbar/      # Navigation component
│       │   ├── RecipeCard/  # Recipe card component
│       │   └── RecipeSearch/# Search component
│       ├── context/         # React context
│       │   ├── AuthContext.jsx    # Authentication context
│       │   └── ThemeContext.jsx   # Theme context
│       ├── models/          # Data models
│       │   └── Recipe.js    # Recipe model
│       ├── pages/           # Page components
│       │   ├── Browse/      # Browse recipes page
│       │   ├── CreateRecipe/# Create recipe page
│       │   ├── Home/        # Home page
│       │   ├── Landing/     # Landing page
│       │   ├── Login/       # Login page
│       │   ├── Profile/     # Profile page
│       │   ├── RecipeDetails/# Recipe details page
│       │   ├── Register/    # Registration page
│       │   └── UserDashboard/# User dashboard page
│       ├── store/           # Redux store
│       │   └── recipesSlice.js  # Recipes slice
│       ├── styles/          # Global styles
│       ├── App.js           # Main App component
│       ├── App.css          # App styles
│       ├── index.js         # Entry point
│       └── config.js        # Configuration
├── server/                   # Backend Express application
│   ├── middleware/          # Custom middleware
│   ├── models/              # Database models
│   │   ├── Recipe.js       # Recipe model
│   │   └── User.js         # User model
│   ├── routes/             # API routes
│   ├── index.js            # Server entry point
│   └── package.json        # Server dependencies
├── .gitignore              # Git ignore file
├── package.json            # Root package.json
├── README.md               # Project documentation
└── start.bat              # Startup script
```

## 📚 API Documentation

### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/profile` | Get user profile |
| GET | `/api/auth/google` | Google OAuth login |
| POST | `/api/auth/logout` | Logout user |

### Recipe Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recipes` | Get all recipes (with pagination) |
| GET | `/api/recipes/:id` | Get single recipe |
| POST | `/api/recipes` | Create new recipe |
| PUT | `/api/recipes/:id` | Update recipe |
| DELETE | `/api/recipes/:id` | Delete recipe |
| GET | `/api/recipes/search` | Search recipes |
| GET | `/api/recipes/user/:userId` | Get user's recipes |

### Comment Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recipes/:id/comments` | Get recipe comments |
| POST | `/api/recipes/:id/comments` | Add comment |
| PUT | `/api/comments/:id` | Update comment |
| DELETE | `/api/comments/:id` | Delete comment |

### User Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/:id` | Update user profile |
| GET | `/api/users/:id/favorites` | Get user's favorite recipes |
| POST | `/api/users/:id/favorites` | Add recipe to favorites |
| DELETE | `/api/users/:id/favorites/:recipeId` | Remove recipe from favorites |

## 🤝 Contributing

We welcome contributions to CookBook! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and formatting
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation for new features
- Write tests for new functionality
- Ensure all tests pass before submitting PR

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Contact
Faizan Amer - [@faizanamer123](https://github.com/faizanamer123)

Project Link: [https://github.com/faizanamer123/CookBook](https://github.com/faizanamer123/CookBook)

## 🙏 Acknowledgments
- [React Icons](https://react-icons.github.io/react-icons/)
- [MongoDB](https://www.mongodb.com/)
- [Express.js](https://expressjs.com/)
- [React.js](https://reactjs.org/)
