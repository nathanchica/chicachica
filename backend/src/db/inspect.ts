import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function inspectDatabase() {
    const sql = neon(process.env.DATABASE_URL!);

    console.log('\n📊 DATABASE TABLES:\n');

    // List all tables
    const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `;

    console.log('Tables:', tables.map((t) => t.table_name).join(', '));

    // Get row counts using individual queries
    console.log('\n📈 ROW COUNTS:\n');

    const counts = await Promise.all([
        sql`SELECT COUNT(*) as count, 'users' as table_name FROM users`,
        sql`SELECT COUNT(*) as count, 'conversations' as table_name FROM conversations`,
        sql`SELECT COUNT(*) as count, 'messages' as table_name FROM messages`,
        sql`SELECT COUNT(*) as count, 'conversation_participants' as table_name FROM conversation_participants`,
    ]);

    for (const result of counts) {
        console.log(`${result[0].table_name}: ${result[0].count} rows`);
    }

    // Show table structures
    console.log('\n🔧 TABLE STRUCTURES:\n');
    for (const table of tables) {
        console.log(`\n${table.table_name}:`);
        const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = ${table.table_name}
      ORDER BY ordinal_position
    `;
        columns.forEach((col) => {
            console.log(
                `  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`
            );
        });
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    inspectDatabase();
}

export { inspectDatabase };
