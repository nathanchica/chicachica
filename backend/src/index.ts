import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { env } from './config/env';
import userRoutes from './routes/userRoutes';
import healthRoutes from './routes/healthRoutes';
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
