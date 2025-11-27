# Workout Tracker

Personal workout tracking web app for progressive overload tracking.

## Features

- 🔐 Simple password authentication (10-year session)
- 💪 Track workouts with sets, reps, and weights
- 📊 Progressive overload charts and history
- ⚙️ Manage and customize workout plans
- 📱 Mobile-first responsive design

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Vercel Postgres
- shadcn/ui
- Tailwind CSS
- Recharts
- iron-session

## Local Development

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Generate a session secret: `openssl rand -base64 32`
   - Set your workout password
   - Add Vercel Postgres connection strings

4. Seed the database:
   ```bash
   npm run seed
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel Deployment

1. Push code to GitHub

2. Import project in Vercel dashboard

3. Add environment variables:
   - `WORKOUT_PASSWORD`: Your secure password
   - `SESSION_SECRET`: Random 32-char string (generate with `openssl rand -base64 32`)

4. Vercel will auto-provision Postgres database

5. After first deploy, run seed script:
   ```bash
   vercel env pull .env.local
   npm run seed
   ```

6. Configure custom domain: `w.nicolaeandrei.com`

## Usage

1. Log in with your password (stored in 1Password)
2. Navigate to **/workout** to track today's workout
3. Log sets with reps and weight
4. View history and charts in **/history**
5. Manage exercises in **/manage**

## Workout Schedule

- **Monday**: Upper 1
- **Tuesday**: Lower 1
- **Thursday**: Upper 2
- **Friday**: Lower 2

## License

Personal project - no license
