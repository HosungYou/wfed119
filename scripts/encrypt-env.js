#!/usr/bin/env node

/**
 * Encrypt .env file for secure sharing
 * Usage: node scripts/encrypt-env.js [password]
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const algorithm = 'aes-256-cbc';

function encrypt(text, password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256');
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipher(algorithm, key);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    encrypted: encrypted
  };
}

function decrypt(encryptedData, password) {
  const salt = Buffer.from(encryptedData.salt, 'hex');
  const key = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256');

  const decipher = crypto.createDecipher(algorithm, key);

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

function main() {
  const action = process.argv[2];
  const password = process.argv[3] || 'wfed119-env-key';

  const envPath = path.join(process.cwd(), '.env');
  const encryptedPath = path.join(process.cwd(), '.env.encrypted.json');

  if (action === 'encrypt') {
    if (!fs.existsSync(envPath)) {
      console.error('❌ .env file not found');
      process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const encrypted = encrypt(envContent, password);

    fs.writeFileSync(encryptedPath, JSON.stringify(encrypted, null, 2));
    console.log('✅ Environment variables encrypted to .env.encrypted.json');
    console.log(`🔑 Password: ${password}`);

  } else if (action === 'decrypt') {
    if (!fs.existsSync(encryptedPath)) {
      console.error('❌ .env.encrypted.json not found');
      process.exit(1);
    }

    const encryptedData = JSON.parse(fs.readFileSync(encryptedPath, 'utf8'));

    try {
      const decrypted = decrypt(encryptedData, password);
      fs.writeFileSync(envPath, decrypted);
      console.log('✅ Environment variables decrypted to .env');
    } catch (error) {
      console.error('❌ Decryption failed - wrong password?');
      process.exit(1);
    }

  } else {
    console.log('Usage:');
    console.log('  Encrypt: node scripts/encrypt-env.js encrypt [password]');
    console.log('  Decrypt: node scripts/encrypt-env.js decrypt [password]');
  }
}

main();