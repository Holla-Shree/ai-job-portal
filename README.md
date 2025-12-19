# INTRODUCTION

## PROJECT DESCRIPTION

JobMatch AI is a full-stack, AI-powered job matching and career development platform designed to bridge the gap between job seekers and relevant employment opportunities. The system leverages AI-driven resume parsing to extract candidate skills and experience, automatically building structured user profiles.

The platform provides intelligent job recommendations based on profile relevance and enables candidates to prepare for interviews through AI-assisted mock interview features and feedback. Built with a focus on scalability, performance and secure data handling, JobMatch AI delivers a seamless and user-centric recruitment experience.

Key Highlights:

* AI-based resume parsing and profile generation

* Intelligent job matching and recommendations

* AI-driven mock interview preparation and feedback

* Secure authentication and real-time data workflows

* Scalable full-stack architecture with modern web technologies

---

## Getting Started: Running the Project Locally

Follow these instructions to set up and run the project on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following installed on your system:
- [Node.js](https://nodejs.org/) (v20.x or later recommended)
- npm (comes with Node.js) or another package manager like Yarn or pnpm
- [Git](https://git-scm.com/)

### 1. Clone the Repository

First, clone the repository from your GitHub account to your local machine using the following command in your terminal:

```bash
git clone https://github.com/your-username/your-repository-name.git
```
*Replace `your-username` and `your-repository-name` with your actual GitHub username and repository name.*

Then, navigate into the project directory:
```bash
cd your-repository-name
```

### 2. Install Dependencies

Once you are in the project's root directory, install all the necessary packages defined in `package.json`:

```bash
npm install
```
This command will download and install all the project's dependencies into a `node_modules` folder.

### 3. Set Up Environment Variables

The application requires API keys to function correctly. You need to create a local environment file to store these keys.

1.  Create a new file in the root of your project named `.env.local`.
2.  Copy the content below into your `.env.local` file and replace the placeholder values with your actual API keys.

```
# Firebase Genkit - For all AI features
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE

# Google Maps - For the interactive job map
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE

# Cloudinary - For image/avatar uploads
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=YOUR_CLOUDINARY_CLOUD_NAME_HERE
```

**Important:** The `.env.local` file is listed in `.gitignore` (by default in Next.js) and should never be committed to your repository. This keeps your secret keys safe.

### 4. Run the Development Server

Now you are ready to start the application. The project has two main parts that need to run concurrently: the Next.js web app and the Genkit AI flows.

**Terminal 1: Start the Next.js App**

Run the following command to start the main web application:
```bash
npm run dev
```
This will start the app on `http://localhost:9002`.

**Terminal 2: Start the Genkit AI Server**

In a separate terminal window, run this command to start the Genkit development server, which powers the AI features:
```bash
npm run genkit:dev
```
This server handles all the requests to the AI models.

### 5. Open the App

Open your web browser and navigate to **[http://localhost:9002](http://localhost:9002)**. You should now see the JobMatch AI application running locally!
