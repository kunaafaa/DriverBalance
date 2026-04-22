async function verifyPassword(submitted, storedHash) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(submitted);
    // Use globalThis.crypto for broad compatibility
    const crypto = globalThis.crypto;
    if (!crypto || !crypto.subtle) {
        console.error("Web Crypto API not available");
        return false;
    }
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const submittedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Submitted password hash:', submittedHash);
    console.log('Stored hash:', storedHash);

    if (submittedHash.length !== storedHash.length) return false;
    
    let result = 0;
    for (let i = 0; i < submittedHash.length; i++) {
      result |= submittedHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
    }
    return result === 0;
  } catch (err) {
    console.error("[AUTH] Verification Error:", err);
    return false;
  }
}

const storedHash = "c496782d1cf15116ec0d9acb85868a98f9180da31b0877980dfa82a67eddb7c7";
const testPasswords = ["wrong", "admin123"];

async function runTests() {
  for (const pw of testPasswords) {
    const isValid = await verifyPassword(pw, storedHash);
    console.log(`Password "${pw}" is valid: ${isValid}`);
  }
}

runTests();
