const express = require('express');
const router = express.Router();
const { checkin, ping, getToken } = require('../controllers/queue.controller');

router.post('/checkin', checkin);
router.post('/ping', ping);
router.get('/token/:tokenId', getToken);

module.exports = router;
