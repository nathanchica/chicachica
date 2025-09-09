import { Server, Socket } from 'socket.io';

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

export function initializeChatSocket(io: Server) {
    io.on('connection', (socket: Socket) => {
        console.log('User connected:', socket.id);

        socket.on('join_room', (data: JoinRoomData) => {
            socket.join(data.room);
            console.log(`User ${socket.id} joined room: ${data.room}`);
            socket.to(data.room).emit('user_joined', {
                userId: data.userId || socket.id,
                room: data.room,
            });
        });

        socket.on('send_message', (data: MessageData) => {
            console.log('Message received:', data);
            const messageToSend = {
                ...data,
                userId: data.userId || socket.id,
                timestamp: data.timestamp || Date.now(),
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
}
