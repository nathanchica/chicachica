import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    DATABASE_URL: z.url('Invalid DATABASE_URL format'),
    PORT: z.string().default('3001').transform(Number),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    CLIENT_URL: z.url('Invalid CLIENT_URL format').default('http://localhost:5173'),
});

const envResult = envSchema.safeParse(process.env);

if (!envResult.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(envResult.error.issues, null, 2));
    process.exit(1);
}

export type Env = z.infer<typeof envSchema>;
export const env: Env = envResult.data;
