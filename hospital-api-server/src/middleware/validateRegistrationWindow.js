const { DateTime } = require('luxon');
const env = require('../config/env');

const validateRegistrationWindow = (req, res, next) => {
  const now = DateTime.now().setZone(env.TIMEZONE);
  
  // Registration window is from Saturday 06:00 to Sunday 06:00
  const dayOfWeek = now.weekday; // 1 = Monday ... 6 = Saturday, 7 = Sunday
  const hour = now.hour;

  const isWindowOpen = (dayOfWeek === 6 && hour >= 6) || (dayOfWeek === 7 && hour < 6);

  if (!isWindowOpen) {
    return res.status(403).json({
      error: 'Registration is currently closed. Registration opens on Saturday 06:00 and closes Sunday 06:00.'
    });
  }

  // Derive registrationWindowId (the date of the Saturday of this window)
  let windowStart;
  if (dayOfWeek === 6) {
    windowStart = now;
  } else if (dayOfWeek === 7) {
    windowStart = now.minus({ days: 1 });
  }

  req.registrationWindowId = windowStart.toFormat('yyyy-MM-dd');
  next();
};

const getRegistrationWindowId = () => {
    const now = DateTime.now().setZone(env.TIMEZONE);
    let windowStart = now;
    if (now.weekday === 7 && now.hour < 6) {
        windowStart = now.minus({ days: 1 });
    } else if (now.weekday !== 6) {
        // Just find the most recent saturday for general usage or current window
        windowStart = now.set({ weekday: 6 }).minus({ weeks: now.weekday < 6 ? 1 : 0});
    }
    return windowStart.toFormat('yyyy-MM-dd');
};

module.exports = { validateRegistrationWindow, getRegistrationWindowId };
