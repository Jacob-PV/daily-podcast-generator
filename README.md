# Daily Podcast Generator

Generate a personalized 5-minute daily podcast based on topics you care about. Powered by OpenAI GPT-4 for content generation and Text-to-Speech for natural audio.

## Features

- **Topic Selection**: Choose from 12 different topics including Technology, AI, Business, Science, Health, and more
- **AI-Powered Script**: GPT-4 generates engaging, conversational podcast scripts
- **Natural Voice**: OpenAI TTS creates natural-sounding audio
- **Full Player Controls**: Play, pause, seek, volume control, playback speed adjustment
- **Download Option**: Save your podcast as MP3 for offline listening
- **Script View**: Read along with the generated script
- **Beautiful Dark UI**: Immersive audio-focused design

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- OpenAI API (GPT-4 & TTS)
- Lucide React Icons
- Vercel (Deployment)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- OpenAI API key with access to GPT-4 and TTS

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd daily-podcast-generator
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key_here
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Usage

1. **Select Topics**: Choose 1-6 topics you want to hear about
2. **Generate**: Click "Generate My Podcast" button
3. **Wait**: The AI will research, write, and record your podcast (~30-60 seconds)
4. **Listen**: Use the player controls to enjoy your personalized podcast
5. **Download**: Save the MP3 for later listening

## Project Structure

```
daily-podcast-generator/
├── app/
│   ├── api/
│   │   └── generate-podcast/
│   │       └── route.ts        # Podcast generation API
│   ├── globals.css             # Global styles & design system
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main application page
├── components/
│   ├── GenerateButton.tsx      # Generate podcast button
│   ├── PodcastPlayer.tsx       # Audio player with controls
│   ├── ProgressIndicator.tsx   # Generation progress UI
│   └── TopicSelector.tsx       # Topic selection grid
├── lib/
│   ├── openai.ts               # OpenAI API integration
│   └── topics.ts               # Available topics configuration
├── types/
│   └── index.ts                # TypeScript interfaces
├── public/
├── package.json
├── tailwind.config.ts
└── README.md
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| OPENAI_API_KEY | Your OpenAI API key | Yes |

## API Costs

This application uses OpenAI's paid APIs:
- **GPT-4**: ~$0.03 per podcast script generation
- **TTS-1**: ~$0.015 per minute of audio (5 minutes = ~$0.075)
- **Total**: ~$0.10 per podcast generated

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add the `OPENAI_API_KEY` environment variable in Vercel dashboard
4. Deploy

The application is optimized for Vercel's serverless functions with a 60-second timeout for podcast generation.

## Available Topics

- Technology
- AI & Machine Learning
- Science
- Business & Finance
- Startups
- Crypto & Web3
- Health & Wellness
- Sports
- Entertainment
- Gaming
- World News
- Politics

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.
