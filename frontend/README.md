# AI Interview Coach - Frontend

This is the Next.js frontend for the AI Interview Coach platform. It provides an intuitive, responsive user interface to upload resumes, interact with the mock interview AI, view real-time chat evaluations, and review final interview reports.

## Setup Instructions

1. Ensure you have Node.js 18+ installed.
2. Install the required dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables by copying `.env.example` to `.env.local` and filling in the necessary values (all required variables are listed in `.env.example`).
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

The application will be accessible at `http://localhost:3000`.

## Key Features

- **Dashboard:** Track mock interview scores, skill trends, and past sessions.
- **ATS Checker:** Upload your resume and match it against job descriptions to discover missing skills and weaknesses.
- **Mock Interviews:** Chat-based interface with an adaptive AI interviewer.
- **Resume Chat:** Context-aware Resume Chat powered by Retrieval-Augmented Generation (RAG).
- **Detailed Reports:** Visualizations (using Recharts) to analyze your technical and communication performance.

## Key Technologies

- **Next.js (App Router)**: The core React framework used for routing, server-side rendering, and UI building.
- **Tailwind CSS**: Utility-first CSS framework for rapid and responsive UI styling.
- **Framer Motion**: Used for fluid animations, transitions, and dynamic UI elements.
- **Recharts**: For creating interactive, responsive charts and data visualizations (e.g., radar charts and line graphs).
- **Lucide React**: For beautiful, modern iconography.
- **NextAuth.js**: Handling user authentication across the platform.
