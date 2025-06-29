
# Unique Places App

> Discover and share unique, offbeat, and hidden-gem places near any location. Powered by Next.js, Prisma, PostgreSQL, and the Google Places API.

## Features

- 🌍 Search for unique places near any city, address, or landmark
- 🎲 Random place generator for global discovery
- 📝 User submissions (moderated by admin)
- 👍 Upvote/downvote system with local and database tracking
- 🔒 Admin UI for approving/rejecting submissions (Google login, email-restricted)
- 🗂 Pagination, clean UI, and mobile-friendly design

## Getting Started

1. **Clone the repo:**
   ```bash
   git clone https://github.com/coleobri/uniqueplacesapp.git
   cd uniqueplacesapp
   ```
2. **Install dependencies:**
   ```bash
   npm install
   # or yarn or pnpm
   ```
3. **Set up your environment:**
   - Copy `.env.example` to `.env.local` and fill in your Google Places API key, NextAuth secrets, and database URL.
4. **Run database migrations:**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```
5. **Start the dev server:**
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

Deploy on [Vercel](https://vercel.com/) or your preferred platform. Be sure to set all required environment variables in your production environment.

## Contributing

Pull requests and suggestions are welcome! Please open an issue or PR for feedback, ideas, or bug reports.

## License

MIT
