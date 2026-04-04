#!/usr/bin/env node

const crypto = require('crypto');

console.log('\n=== JWT Secret Generator ===\n');
console.log('Copy these to your .env file:\n');
console.log(`JWT_ACCESS_SECRET=${crypto.randomBytes(32).toString('hex')}`);
console.log(`JWT_REFRESH_SECRET=${crypto.randomBytes(32).toString('hex')}`);
console.log('\nMake sure to use DIFFERENT secrets for access and refresh tokens!\n');
