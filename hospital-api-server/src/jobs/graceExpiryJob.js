const cron = require('node-cron');
const QueueToken = require('../models/QueueToken');
const env = require('../config/env');

const startGraceExpiryJob = (io) => {
  // Run every 30 seconds
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const gracePeriodMs = env.GRACE_PERIOD_MINUTES * 60000;
      const expiryThreshold = new Date(Date.now() - gracePeriodMs);

      const expiredTokens = await QueueToken.find({
        status: 'grace_period',
        geofenceExitAt: { $lte: expiryThreshold }
      });

      for (const token of expiredTokens) {
        token.status = 'cancelled';
        await token.save();
        
        if (io) {
          io.to('admin').emit('queue:token-cancelled', { tokenId: token._id });
          io.to(`patient:${token.registrationId}`).emit('token:cancelled', { reason: 'Grace period expired' });
        }
        console.log(`Token ${token.tokenNumber} cancelled due to grace period expiry`);
      }
    } catch (error) {
      console.error('Grace Expiry Job Error:', error);
    }
  });
};

module.exports = startGraceExpiryJob;
