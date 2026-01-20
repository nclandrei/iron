# Iron

A workout tracking app built for progressive overload training using [Lyle McDonald's Generic Bulking Routine (GBR)](https://bodyrecomposition.com/muscle-gain/popular-hypertrophy-programs).

## Features

- 💪 Track workouts with sets, reps, and weights
- 📊 Progressive overload charts and history
- ⚙️ Manage and customize exercises
- 📱 Mobile-first responsive design
- 🔐 Simple password authentication

## Training Program

This app is designed around the **Generic Bulking Routine (GBR)** by [Lyle McDonald](https://bodyrecomposition.com/), an Upper/Lower split done 4 days per week:

| Day       | Workout |
|-----------|---------|
| Monday    | Upper 1 |
| Tuesday   | Lower 1 |
| Thursday  | Upper 2 |
| Friday    | Lower 2 |

The GBR focuses on moderate volume (6-8 sets per muscle group per session) with a mix of heavy compound movements (6-8 reps) and higher-rep accessory work (10-12 reps). For full program details, see [Lyle's article on hypertrophy programs](https://bodyrecomposition.com/muscle-gain/popular-hypertrophy-programs).

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Vercel Postgres
- shadcn/ui + Tailwind CSS
- Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- Vercel account (for Postgres database)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/nclandrei/iron.git
   cd iron
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following:
   - `WORKOUT_PASSWORD`: Your login password
   - `SESSION_SECRET`: Generate with `openssl rand -base64 32`
   - Vercel Postgres connection strings

4. Seed the database:
   ```bash
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Deployment

Deploy to Vercel:

1. Push to GitHub
2. Import project in Vercel dashboard
3. Add environment variables (`WORKOUT_PASSWORD`, `SESSION_SECRET`)
4. Vercel auto-provisions the Postgres database
5. Run `vercel env pull .env.local && npm run seed` after first deploy

## License

MIT
