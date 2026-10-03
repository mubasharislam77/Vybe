import { config } from 'dotenv';

// Scripts run outside Next.js, which normally loads .env.local for you.
config({ path: '.env.local' });
config();
