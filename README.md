
# Canvas AI Frontend

Canvas AI is a modern web application designed to enhance user interaction with artificial intelligence tools, providing a seamless experience for visual content generation and management.

## Table of Contents
- [Technologies](#technologies)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Integration](#api-integration)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Technologies
This project utilizes the following technologies:
- **React.js**: A JavaScript library for building user interfaces.
- **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
- **Vite**: A fast build tool and development server.
- **Tailwind CSS**: A utility-first CSS framework for styling.
- **React Router**: For routing and navigation within the application.
- **@mantine/core**: A React component library for faster UI development.

## Features
- User-friendly interface for AI-driven content generation.
- Integration with backend services for data management.

## Installation
To get started with the Canvas AI frontend application, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/karthikrk0180/canvas-ai-frontend.git
   cd canvas-ai-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## Usage
To run the application locally, use the following command:
```bash
npm run dev
```


## API Integration
Ensure your frontend is correctly configured to call the API endpoints from the backend. Update the API URLs in your React code to point to your backend URL.

## Environment Variables
Create a `.env.local` file in the root of the project to store sensitive information. Add your environment variables in the following format:
```
REACT_APP_API_URL=backend-API
```
Replace the API once backend is deployed

## Deployment
The application is deployed using Render. Ensure that your backend API is running and accessible.

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to your chosen platform following their specific deployment instructions.

## Contributing
Contributions are welcome! Please feel free to submit a pull request or create an issue for any bugs or enhancements.



Feel free to modify any sections or add more specific details relevant to your project!
