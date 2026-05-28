import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import { registerHandlers } from './socket/handlers.js';

const app = express();
app.use(cors({ origin: env.clientOrigins, credentials: true }));
app.use(express.json());

// healthcheck (Render usa para saber se o servico esta vivo)
app.get('/', (_req, res) => {
  res.json({ service: 'conecta-pan', status: 'ok', time: new Date().toISOString() });
});
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: env.clientOrigins, credentials: true },
  maxHttpBufferSize: 8e6, // 8MB: permite enviar imagens em base64
});

io.on('connection', (socket) => {
  registerHandlers(io, socket);
});

server.listen(env.port, () => {
  console.log(`[conecta-pan] servidor on em :${env.port}`);
  console.log(`[conecta-pan] origens permitidas: ${env.clientOrigins.join(', ')}`);
});
