#!/usr/bin/env node

/**
 * Simple environment variable encryption/decryption
 * Usage:
 *   node scripts/simple-encrypt-env.js encrypt 36639685
 *   node scripts/simple-encrypt-env.js decrypt 36639685
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function simpleEncrypt(text, password) {
  // Create a simple cipher using the password
  const key = crypto.createHash('sha256').update(password).digest();
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    iv: iv.toString('hex'),
    encrypted: encrypted
  };
}

function simpleDecrypt(encryptedData, password) {
  const key = crypto.createHash('sha256').update(password).digest();
  const iv = Buffer.from(encryptedData.iv, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

function main() {
  const action = process.argv[2];
  const password = process.argv[3];

  if (!password) {
    console.error('❌ Password required');
    console.log('Usage:');
    console.log('  Encrypt: node scripts/simple-encrypt-env.js encrypt PASSWORD');
    console.log('  Decrypt: node scripts/simple-encrypt-env.js decrypt PASSWORD');
    process.exit(1);
  }

  const envPath = path.join(process.cwd(), '.env');
  const encryptedPath = path.join(process.cwd(), '.env.encrypted.json');

  if (action === 'encrypt') {
    if (!fs.existsSync(envPath)) {
      console.error('❌ .env file not found');
      process.exit(1);
    }

    console.log('🔐 Encrypting .env file...');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const encrypted = simpleEncrypt(envContent, password);

    const dataToSave = {
      encrypted: encrypted,
      created: new Date().toISOString(),
      note: 'Encrypted .env file for WFED119 project'
    };

    fs.writeFileSync(encryptedPath, JSON.stringify(dataToSave, null, 2));
    console.log('✅ Environment variables encrypted!');
    console.log(`📁 File saved: ${encryptedPath}`);
    console.log(`🔑 Password: ${password}`);
    console.log('');
    console.log('📤 To share with collaborators:');
    console.log('1. Send the .env.encrypted.json file');
    console.log('2. Share the password through a secure channel');

  } else if (action === 'decrypt') {
    if (!fs.existsSync(encryptedPath)) {
      console.error('❌ .env.encrypted.json not found');
      process.exit(1);
    }

    console.log('🔓 Decrypting environment variables...');

    try {
      const encryptedFile = JSON.parse(fs.readFileSync(encryptedPath, 'utf8'));
      const decrypted = simpleDecrypt(encryptedFile.encrypted, password);

      fs.writeFileSync(envPath, decrypted);
      console.log('✅ Environment variables decrypted!');
      console.log(`📁 File created: ${envPath}`);
      console.log('');
      console.log('🚀 Next steps:');
      console.log('1. npm install');
      console.log('2. npm run dev');

    } catch (error) {
      console.error('❌ Decryption failed - wrong password or corrupted file');
      console.error(error.message);
      process.exit(1);
    }

  } else {
    console.log('Usage:');
    console.log('  Encrypt: node scripts/simple-encrypt-env.js encrypt PASSWORD');
    console.log('  Decrypt: node scripts/simple-encrypt-env.js decrypt PASSWORD');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/simple-encrypt-env.js encrypt 36639685');
    console.log('  node scripts/simple-encrypt-env.js decrypt 36639685');
  }
}

main();