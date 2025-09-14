import path from 'path';
import { fileURLToPath } from 'url';

import { spawn, IPty } from 'node-pty';
import { Namespace, Socket } from 'socket.io';

import { env } from '../config/env.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store terminal sessions
const terminalSessions = new Map<string, IPty>();

export function createTerminalSocketHandler() {
    return (terminalNamespace: Namespace) => {
        terminalNamespace.on('connection', (socket: Socket) => {
            let ptyProcess: IPty | null = null;

            socket.on('terminal-init', () => {
                try {
                    // Clean up any existing session
                    if (terminalSessions.has(socket.id)) {
                        const existingPty = terminalSessions.get(socket.id);
                        existingPty?.kill();
                        terminalSessions.delete(socket.id);
                    }

                    const isProduction = env.NODE_ENV === 'production';

                    // Different paths for production (Render) vs development
                    const terminalClientPath = isProduction
                        ? path.join(__dirname, '../../terminal-client') // In production: from dist/sockets to terminal-client (sibling of dist)
                        : path.join(__dirname, '../../../terminal-client'); // In development, we're in backend/src/sockets

                    // Use SERVER_URL from env config
                    const backendUrl = env.SERVER_URL || `http://localhost:${env.PORT}`;
                    const websocketUrl = backendUrl.replace(/^http/, 'ws');

                    // Log for debugging
                    console.log('Terminal client path:', terminalClientPath);
                    console.log('__dirname:', __dirname);
                    console.log('NODE_ENV:', env.NODE_ENV);

                    // Spawn the terminal process
                    if (isProduction) {
                        // In production, run the built version using full path
                        const cliPath = path.join(terminalClientPath, 'dist', 'cli.js');
                        console.log('CLI path:', cliPath);

                        ptyProcess = spawn('node', [cliPath], {
                            name: 'xterm-color',
                            cols: 80,
                            rows: 30,
                            env: {
                                ...process.env,
                                BACKEND_URL: backendUrl,
                                WEBSOCKET_URL: websocketUrl,
                            },
                        });
                    } else {
                        // In development, use tsx to run TypeScript directly
                        ptyProcess = spawn('npx', ['tsx', 'src/cli.tsx'], {
                            name: 'xterm-color',
                            cols: 80,
                            rows: 30,
                            cwd: terminalClientPath,
                            env: {
                                ...process.env,
                                BACKEND_URL: backendUrl,
                                WEBSOCKET_URL: websocketUrl,
                            },
                        });
                    }

                    // Store the session
                    terminalSessions.set(socket.id, ptyProcess);

                    // Handle data from the terminal
                    ptyProcess.onData((data: string) => {
                        socket.emit('terminal-output', data);
                    });

                    // Handle terminal exit
                    ptyProcess.onExit(({ exitCode, signal }) => {
                        console.log(`Terminal process exited: code=${exitCode}, signal=${signal}`);
                        socket.emit('terminal-exit', exitCode);
                        terminalSessions.delete(socket.id);
                    });

                    // Send initial success message
                    socket.emit('terminal-output', '\r\nChicaChica Terminal Client\r\n\r\n');
                } catch (error) {
                    console.error('Failed to spawn terminal:', error);
                    socket.emit('terminal-error', 'Failed to start terminal process');
                }
            });

            // Handle input from the client
            socket.on('terminal-input', (data: string) => {
                const pty = terminalSessions.get(socket.id);
                if (pty) {
                    pty.write(data);
                }
            });

            // Handle terminal resize
            socket.on('terminal-resize', ({ cols, rows }: { cols: number; rows: number }) => {
                const pty = terminalSessions.get(socket.id);
                if (pty && cols > 0 && rows > 0) {
                    pty.resize(cols, rows);
                }
            });

            // Clean up on disconnect
            socket.on('disconnect', () => {
                console.log(`Terminal socket disconnected: ${socket.id}`);
                const pty = terminalSessions.get(socket.id);
                if (pty) {
                    pty.kill();
                    terminalSessions.delete(socket.id);
                }
            });
        });
    };
}
