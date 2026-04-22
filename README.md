# DumpaReview

Collect more Google Reviews effortlessly with smart QR codes.

## Project info

This platform helps businesses grow by making it easy for customers to leave 5-star reviews. It generates smart QR codes that rotate through pre-written messages, ensuring a diverse range of feedback.

## Tech Stack

- **Framework**: Vite + React
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Firebase Auth
- **Database**: Supabase
- **State Management**: TanStack Query (React Query)

## Setup

1. **Clone the repository**:
   ```sh
   git clone <your-repo-url>
   cd dumpareview
   ```

2. **Install dependencies**:
   ```sh
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root directory and add your Supabase and Firebase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
   
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development server**:
   ```sh
   npm run dev
   ```

## Key Features

- **Smart QR Codes**: Pre-filled review links with rotating messages.
- **Analytics**: Track scans and review success rates.
- **Dashboard**: Manage your QR codes and messages in one place.
- **Easy Sign-in**: Secure Google Authentication via Firebase.
