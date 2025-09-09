import { createServer } from 'http';

import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';

import { env } from './config/env';
import healthRoutes from './routes/healthRoutes';
import userRoutes from './routes/userRoutes';
import { initializeChatSocket } from './sockets/chatSocket';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: env.CLIENT_URL,
        methods: ['GET', 'POST'],
    },
});

app.use(cors());
app.use(express.json());

app.use('/', healthRoutes);
app.use('/api', userRoutes);

initializeChatSocket(io);

const PORT = env.PORT;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
