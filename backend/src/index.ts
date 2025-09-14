import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

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
import { createTerminalSocketHandler } from './sockets/terminalSocket.js';

const app = express();
const httpServer = createServer(app);

// Main Socket.IO server for chat
const io = new Server(httpServer, {
    cors: {
        origin: env.CLIENT_URL,
        methods: ['GET', 'POST'],
    },
});

// Separate namespace for terminal
const terminalIo = io.of('/terminal');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

// Terminal app route
app.get('/terminal', (_req, res) => {
    res.sendFile(path.join(__dirname, '../public/terminal.html'));
});

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

const initializeTerminalSocket = createTerminalSocketHandler();
initializeTerminalSocket(terminalIo);

const PORT = env.PORT;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
