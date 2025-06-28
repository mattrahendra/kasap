const bcryptjs = require('bcryptjs'); // Ganti dari bcrypt ke bcryptjs
const saltRounds = 10;
const password = 'password';

// Menggunakan bcryptjs (versi sync)
try {
    const hash = bcryptjs.hashSync(password, saltRounds);
    console.log('✅ Hashed password berhasil dibuat:');
    console.log('Password:', password);
    console.log('Hash:', hash);
    
    // Test verify
    const isValid = bcryptjs.compareSync(password, hash);
    console.log('🔐 Verifikasi hash:', isValid ? '✅ VALID' : '❌ INVALID');
    
} catch (error) {
    console.error('❌ Error generating hash:', error.message);
}

// Atau menggunakan versi async
bcryptjs.hash(password, saltRounds)
    .then(hash => {
        console.log('\n📝 Hash (async method):');
        console.log('Password:', password);
        console.log('Hash:', hash);
        
        // Test verify async
        return bcryptjs.compare(password, hash);
    })
    .then(isValid => {
        console.log('🔐 Verifikasi hash (async):', isValid ? '✅ VALID' : '❌ INVALID');
    })
    .catch(error => {
        console.error('❌ Error:', error.message);
    });