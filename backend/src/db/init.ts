import readline from 'readline';

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function promptUser(question: string): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

async function initializeDatabase(skipPrompt = false) {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is not set in environment variables');
        process.exit(1);
    }

    const sql = neon(process.env.DATABASE_URL);

    // Check if tables exist
    const existingTables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('users', 'conversations', 'messages', 'conversation_participants')
  `;

    // Prompt for confirmation if tables exist and not skipping prompt
    if (!skipPrompt && existingTables.length > 0) {
        console.log('\n⚠️  WARNING: This will DELETE all existing data!');
        console.log(
            `   Found ${existingTables.length} existing tables: ${existingTables.map((t) => t.table_name).join(', ')}`
        );

        const confirmed = await promptUser('\n   Are you sure you want to continue? (y/N): ');

        if (!confirmed) {
            console.log('❌ Database initialization cancelled');
            process.exit(0);
        }
    }

    try {
        console.log('\nInitializing database schema...');

        // Drop existing tables
        console.log('Dropping existing tables...');
        await sql`DROP TABLE IF EXISTS conversation_participants CASCADE`;
        await sql`DROP TABLE IF EXISTS messages CASCADE`;
        await sql`DROP TABLE IF EXISTS conversations CASCADE`;
        await sql`DROP TABLE IF EXISTS users CASCADE`;
        await sql`DROP TYPE IF EXISTS user_status CASCADE`;

        // Create enum
        console.log('Creating user_status enum...');
        await sql`CREATE TYPE user_status AS ENUM ('online', 'away', 'offline')`;

        // Create users table
        console.log('Creating users table...');
        await sql`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        display_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        status user_status DEFAULT 'offline',
        last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

        // Create conversations table
        console.log('Creating conversations table...');
        await sql`
      CREATE TABLE conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL
      )
    `;

        // Create messages table
        console.log('Creating messages table...');
        await sql`
      CREATE TABLE messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        edited_at TIMESTAMP WITH TIME ZONE,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

        // Create conversation_participants table
        console.log('Creating conversation_participants table...');
        await sql`
      CREATE TABLE conversation_participants (
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_read_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (conversation_id, user_id)
      )
    `;

        // Create indexes
        console.log('Creating indexes...');
        await sql`CREATE INDEX idx_messages_conversation_id ON messages(conversation_id)`;
        await sql`CREATE INDEX idx_messages_author_id ON messages(author_id)`;
        await sql`CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC)`;
        await sql`CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id)`;
        await sql`CREATE INDEX idx_users_status ON users(status)`;
        await sql`CREATE INDEX idx_users_email ON users(email)`;

        console.log('✅ Database schema initialized successfully');

        // Verify tables were created
        const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

        console.log(`Created ${tables.length} tables:`, tables.map((t) => t.table_name).join(', '));
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    // Check for --force flag to skip prompt
    const forceFlag = process.argv.includes('--force');
    initializeDatabase(forceFlag);
}

export { initializeDatabase };
