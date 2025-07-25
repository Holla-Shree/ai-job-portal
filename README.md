# JobMatch AI Project

This is the main repository for the JobMatch AI application.
Developed using Next.js, Firebase, and Genkit, this platform provides AI-powered tools for both job seekers and recruiters.

## Getting Started

Follow these instructions to set up and run the project on your local machine for development and testing purposes.

### Prerequisites

*   **Node.js**: Make sure you have Node.js version 20.0 or higher installed.
*   **npm**: This project uses npm for package management. It is included with Node.js.

### 1. Install Dependencies

Navigate to the project's root directory in your terminal and run the following command to install all the required packages:

```bash
npm install
```

### 2. Configure Environment Variables

This project requires API keys for various services.

1.  Create a file named `.env` in the root of the project directory.
2.  Copy the following content into the `.env` file and replace the placeholder values with your actual keys.

    ```env
    # For the interactive job map feature, get an API key from the Google Cloud Console.
    # You must enable the "Maps JavaScript API" for your project.
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY

    # For the AI-powered features, get an API key from Google AI Studio.
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    
    # For image hosting with Cloudinary. Get your cloud name from your Cloudinary dashboard.
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=YOUR_CLOUDINARY_CLOUD_NAME
    ```

### 3. Run the Development Server

Once the dependencies are installed and the environment variables are configured, you can start the Next.js development server by running:

```bash
npm run dev
```

The application will be available at `http://localhost:9002`. The server supports hot-reloading, so any changes you make to the code will be reflected in the browser automatically.

## Features

*   **AI Resume Analysis**: Extracts skills, experience, and education from resumes to create anonymized profiles.
*   **Semantic Job Recommendations**: Matches candidates to jobs based on deep analysis of skills and experience.
*   **AI Interview Coach**: An interactive chatbot that helps users practice interview questions and provides instant feedback.
*   **Recruiter Portal**: Tools for recruiters to post jobs, screen candidates with AI, and manage their talent pipeline.
*   **Interactive Job Map**: Visualizes job opportunities on a map for easy exploration.
*   **Real-time Messaging**: Direct messaging between candidates and recruiters.

## Technologies Used

*   Next.js (with App Router)
*   React & TypeScript
*   Firebase (Firestore for the database)
*   Cloudinary (for image hosting)
*   Genkit & Google AI (for generative AI features)
*   Tailwind CSS (for styling)
*   Shadcn/ui (for UI components)
*   Google Maps Platform

## Contribution

[Add info about contributing if applicable]
