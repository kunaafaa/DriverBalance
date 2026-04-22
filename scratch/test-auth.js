const crypto = require('crypto');

async function verifyPassword(submitted, storedHash) {
  try {
    const hash = crypto.createHash('sha256').update(submitted).digest('hex');
    console.log('Submitted password hash:', hash);
    console.log('Stored hash:', storedHash);

    if (hash.length !== storedHash.length) return false;
    
    let result = 0;
    for (let i = 0; i < hash.length; i++) {
      result |= hash.charCodeAt(i) ^ storedHash.charCodeAt(i);
    }
    return result === 0;
  } catch (err) {
    console.error("[AUTH] Verification Error:", err);
    return false;
  }
}

const storedHash = "c496782d1cf15116ec0d9acb85868a98f9180da31b0877980dfa82a67eddb7c7";
const testPasswords = ["wrong", "admin123", "password"];

async function runTests() {
  for (const pw of testPasswords) {
    const isValid = await verifyPassword(pw, storedHash);
    console.log(`Password "${pw}" is valid: ${isValid}`);
  }
}

runTests();
