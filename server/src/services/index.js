/**
 * Facade de dados: exporta users/rooms/messages/storage/reads conforme
 * o modo (supabase ou memory). Usa import dinamico para NAO carregar o
 * cliente Supabase quando estiver em modo demo (em memoria).
 */
import { env } from '../config/env.js';

let users, rooms, messages, storage, reads;

if (env.dataMode === 'memory') {
  const m = await import('./memoryServices.js');
  ({ users, rooms, messages, storage, reads } = m);
} else {
  users = await import('./userService.js');
  rooms = await import('./roomService.js');
  messages = await import('./messageService.js');
  storage = await import('./storageService.js');
  reads = await import('./readService.js');
}

export { users, rooms, messages, storage, reads };
