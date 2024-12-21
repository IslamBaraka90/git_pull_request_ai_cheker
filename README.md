# Git Checker

A simple Git repository checker application that helps you analyze and monitor Git repositories.

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd git-checker
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```env
PORT=3000
GOOGLE_API_KEY=your_google_api_key_here
```

Replace `your_google_api_key_here` with your actual Google API key for the Generative AI service.

## Running the Application

### Development Mode
To run the application in development mode with auto-reload:
```bash
npm run dev
```

### Production Mode
To run the application in production mode:
```bash
npm start
```

The application will be available at `http://localhost:3000` (or the port you specified in the .env file).

## Project Structure

```
git-checker/
├── app.js              # Main application entry point
├── public/             # Static files
│   └── js/            # Client-side JavaScript files
├── src/               # Source code
│   ├── routes/        # Express routes
│   └── services/      # Business logic and services
├── .env               # Environment variables
└── package.json       # Project dependencies and scripts
```

## Dependencies

- express: Web application framework
- simple-git: Git operations
- socket.io: Real-time communication
- @google/generative-ai: Google's Generative AI integration
- dotenv: Environment variables management
- body-parser: Request body parsing middleware

## Development Dependencies

- nodemon: Development server with auto-reload
