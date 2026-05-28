import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

// conexao unica, reutilizada em todo o app
export const socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

/**
 * Emite um evento e resolve com a resposta (ack) do servidor.
 * Padroniza o formato { ok, data, error } vindo do backend.
 */
export function emitAck(event, payload) {
  return new Promise((resolve, reject) => {
    socket.timeout(10000).emit(event, payload, (err, response) => {
      if (err) return reject(new Error('Sem resposta do servidor (timeout)'));
      if (!response?.ok) return reject(new Error(response?.error || 'Erro'));
      resolve(response.data);
    });
  });
}
