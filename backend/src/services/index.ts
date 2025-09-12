import { ConversationService } from './conversationService';
import { MessageService } from './messageService';
import { UserService } from './userService';

// Single instances shared across the application
export const messageService = new MessageService();
export const conversationService = new ConversationService();
export const userService = new UserService();

// Export types as well for convenience
export { ConversationService, MessageService, UserService };
