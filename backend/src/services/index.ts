import { ConversationService } from './conversationService.js';
import { MessageService } from './messageService.js';
import { UserService } from './userService.js';

// Single instances shared across the application
export const messageService = new MessageService();
export const conversationService = new ConversationService();
export const userService = new UserService();

// Export types as well for convenience
export { ConversationService, MessageService, UserService };
