const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function setupUsers() {
    const saltRounds = 10;
    
    const users = [
        { username: 'admin', password: 'admin123', role: 'bendahara' },
        { username: 'pengawas1', password: 'pengawas123', role: 'pengawas' },
        { username: 'bendahara1', password: 'bendahara123', role: 'bendahara' }
    ];

    try {
        console.log('🔄 Setting up database and users...');
        
        // Test database connection first
        await pool.query('SELECT 1');
        console.log('✅ Database connection successful');

        // Create users table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('bendahara', 'pengawas') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Users table created/verified');

        // Clear existing users (optional - remove if you want to keep existing data)
        // await pool.query('DELETE FROM users');
        // console.log('🧹 Cleared existing users');

        // Insert test users
        for (const user of users) {
            try {
                const hashedPassword = await bcrypt.hash(user.password, saltRounds);
                await pool.query(
                    'INSERT INTO users (username, password, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password = ?, role = ?',
                    [user.username, hashedPassword, user.role, hashedPassword, user.role]
                );
                console.log(`✅ User created/updated: ${user.username} (${user.role})`);
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    console.log(`⚠️ User ${user.username} already exists, updated instead`);
                } else {
                    console.error(`❌ Error creating user ${user.username}:`, error.message);
                }
            }
        }

        // Verify users created
        const [result] = await pool.query('SELECT id, username, role, created_at FROM users');
        console.log('\n📋 Current users in database:');
        result.forEach(user => {
            console.log(`  - ID: ${user.id}, Username: ${user.username}, Role: ${user.role}`);
        });

        console.log('\n🔑 Test credentials for login:');
        users.forEach(user => {
            console.log(`  - ${user.username} / ${user.password} (${user.role})`);
        });

        console.log('\n🎉 Setup completed successfully!');

    } catch (error) {
        console.error('❌ Setup failed:', error);
        console.error('Error details:', error.message);
        if (error.code) {
            console.error('Error code:', error.code);
        }
    } finally {
        await pool.end();
        process.exit(0);
    }
}

// Run setup
setupUsers().catch(console.error);