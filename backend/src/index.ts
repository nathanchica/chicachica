import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

interface MessageData {
  room: string;
  message: string;
  userId?: string;
  timestamp?: number;
}

interface JoinRoomData {
  room: string;
  userId?: string;
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.send('Chat server is running');
});

io.on('connection', (socket: Socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (data: JoinRoomData) => {
    socket.join(data.room);
    console.log(`User ${socket.id} joined room: ${data.room}`);
    socket.to(data.room).emit('user_joined', { 
      userId: data.userId || socket.id, 
      room: data.room 
    });
  });

  socket.on('send_message', (data: MessageData) => {
    console.log('Message received:', data);
    const messageToSend = {
      ...data,
      userId: data.userId || socket.id,
      timestamp: data.timestamp || Date.now()
    };
    socket.to(data.room).emit('receive_message', messageToSend);
  });

  socket.on('leave_room', (room: string) => {
    socket.leave(room);
    console.log(`User ${socket.id} left room: ${room}`);
    socket.to(room).emit('user_left', { userId: socket.id, room });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});