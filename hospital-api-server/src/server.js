const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [env.CORS_ORIGIN_PATIENT, env.CORS_ORIGIN_ADMIN],
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join:admin', () => {
    socket.join('admin');
    console.log(`Socket ${socket.id} joined admin room`);
  });

  socket.on('join:patient', ({ registrationId }) => {
    if (registrationId) {
      socket.join(`patient:${registrationId}`);
      console.log(`Socket ${socket.id} joined patient:${registrationId} room`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const startGraceExpiryJob = require('./jobs/graceExpiryJob');

const startServer = async () => {
  await connectDB();
  
  startGraceExpiryJob(io);

  server.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

startServer();
