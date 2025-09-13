import { createServer } from 'http';

import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';

import { env } from './config/env.js';
import { authenticateUser } from './middleware/auth.js';
import conversationRoutes from './routes/conversationRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { conversationService, messageService, userService } from './services/index.js';
import { createChatSocketHandler } from './sockets/chatSocket.js';

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
app.use('/api', authenticateUser, conversationRoutes);
app.use('/api', authenticateUser, messageRoutes);

const initializeChatSocket = createChatSocketHandler({
    messageService,
    conversationService,
    userService,
});

initializeChatSocket(io);

const PORT = env.PORT;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
