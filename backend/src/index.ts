import { createServer } from 'http';

import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';

import { env } from './config/env';
import { authenticateUser } from './middleware/auth';
import conversationRoutes from './routes/conversationRoutes';
import healthRoutes from './routes/healthRoutes';
import messageRoutes from './routes/messageRoutes';
import userRoutes from './routes/userRoutes';
import { conversationService, messageService, userService } from './services';
import { createChatSocketHandler } from './sockets/chatSocket';

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
