const User = require('../models/User');

async function cleanupExpiredTokens() {
  try {
    const users = await User.find({ 'refreshTokens.0': { $exists: true } });
    
    let totalCleaned = 0;
    for (const user of users) {
      const originalLength = user.refreshTokens.length;
      await user.cleanExpiredTokens();
      totalCleaned += (originalLength - user.refreshTokens.length);
    }
    
    if (totalCleaned > 0) {
      console.log(`[Token Cleanup] Removed ${totalCleaned} expired refresh tokens`);
    }
  } catch (error) {
    console.error('[Token Cleanup] Error:', error.message);
  }
}

function startTokenCleanup(intervalMinutes = 60) {
  cleanupExpiredTokens();
  
  setInterval(cleanupExpiredTokens, intervalMinutes * 60 * 1000);
  
  console.log(`[Token Cleanup] Started with ${intervalMinutes} minute interval`);
}

module.exports = { startTokenCleanup, cleanupExpiredTokens };
