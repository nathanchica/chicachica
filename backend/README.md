# Backend API - Real-time Chat Application

## Architecture Overview

This backend follows a **layered architecture pattern** with clear separation of concerns:

```
┌─────────────────┐
│   HTTP Routes   │ ← Express Router
├─────────────────┤
│   Controllers   │ ← Request/Response handling
├─────────────────┤
│    Services     │ ← Business logic
├─────────────────┤
│    Database     │ ← PostgreSQL with raw SQL
└─────────────────┘

     Parallel:
┌─────────────────┐
│  WebSocket (io) │ ← Real-time events
└─────────────────┘
```

## Core Components

### Controllers (Function-based)

Controllers handle HTTP requests and responses. They validate input, call services, and format responses.

#### **UserController** (`/controllers/userController.ts`)

- `createUser` - Creates new user with validation
- `getUser` - Retrieves user by ID
- `getAllUsers` - Lists all users
- `updateUserStatus` - Updates user online/away/offline status

#### **ConversationController** (`/controllers/conversationController.ts`)

- `getConversationsForUser` - Lists user's conversations with metadata
- `getConversation` - Gets single conversation details
- `createConversation` - Creates new conversation with participants
- `addParticipant` - Adds user to conversation (admin only)
- `removeParticipant` - Removes user from conversation
- `updateConversation` - Updates conversation title
- `markAsRead` - Updates last read message for user

#### **MessageController** (`/controllers/messageController.ts`)

- `getConversationMessages` - Retrieves paginated messages
- `createMessage` - Posts new message to conversation
- `updateMessage` - Edits existing message (author only)
- `deleteMessage` - Soft deletes message (author only)

### Services (Class-based)

Services contain business logic and database operations. They're instantiated as singletons.

#### **UserService** (`/services/userService.ts`)

Manages user accounts and status:

- User CRUD operations
- Email-based lookups
- Status management (online/away/offline)
- Last seen tracking

#### **ConversationService** (`/services/conversationService.ts`)

Handles conversation logic:

- Conversation creation with participants
- Participant management (add/remove)
- Permission checking (admin/member)
- Read receipt tracking
- Unread count calculations
- Title management (custom or auto-generated)

#### **MessageService** (`/services/messageService.ts`)

Manages messages within conversations:

- Message creation/editing/deletion
- Pagination support
- Author information joining
- Last message retrieval for conversations
- Message count statistics

### WebSocket Handler

#### **ChatSocket** (`/sockets/chatSocket.ts`)

Real-time communication layer using Socket.io with dependency injection pattern:

**Architecture:**

- Uses factory function `createChatSocketHandler` for dependency injection
- Accepts services (MessageService, ConversationService, UserService) as dependencies
- Implements comprehensive TypeScript types for all events
- Validates conversation membership before all operations

**Events (Client → Server):**

- `join_conversation` - Subscribes to conversation room (validates membership)
- `send_message` - Broadcasts new message with formatted payload
- `typing` - Broadcasts typing indicator
- `message_read` - Updates read receipts and notifies participants
- `leave_conversation` - Unsubscribes from room
- `disconnect` - Handles cleanup and status updates

**Events (Server → Client):**

- `authenticated` - Confirms authentication with userId
- `conversation_history` - Sends recent messages and last read message
- `new_message` - Broadcasts incoming message with author details
- `conversation_meta_updated` - Updates conversation metadata (last message, unread count)
- `user_typing` - Shows typing indicators with user details
- `user_joined_conversation` - Notifies of new participant
- `user_left_conversation` - Notifies of departure
- `message_read_updated` - Confirms read receipt update
- `user_read_message` - Broadcasts read receipts to other users
- `error` - Error notifications with descriptive messages

**Room Management:**

- `user:{userId}` - Personal notifications and conversation metadata updates
- `conversation:{conversationId}` - Conversation participants for real-time messaging

**Type Safety:**

- Fully typed event payloads (SendMessageEventInput, JoinConversationEventInput, etc.)
- Consistent MessagePayload structure across all message-related events
- SocketWithUser type extending Socket with user authentication data

## Database Schema

### Tables

- **users** - User accounts with profile info
- **conversations** - Conversation metadata
- **conversation_participants** - Many-to-many relationship with permissions
- **messages** - Message content and metadata

### Error Handling

Custom error classes for database operations:

- `UniqueConstraintError` - Duplicate entries
- `ForeignKeyConstraintError` - Invalid references
- `DatabaseError` - General database failures

## API Routes

### User Routes (`/api`)

- `POST /users` - Create user
- `GET /users` - List all users
- `GET /users/:id` - Get user details
- `PATCH /users/:id/status` - Update status

### Conversation Routes (`/api`)

- `GET /conversations` - List user's conversations
- `GET /conversations/:id` - Get conversation details
- `POST /conversations` - Create conversation
- `PATCH /conversations/:id` - Update conversation
- `POST /conversations/:id/participants` - Add participant
- `DELETE /conversations/:id/participants/:userId` - Remove participant
- `PATCH /conversations/:id/read` - Mark messages read

### Message Routes (`/api`)

- `GET /conversations/:id/messages` - Get messages
- `POST /conversations/:id/messages` - Send message
- `PATCH /messages/:id` - Edit message
- `DELETE /messages/:id` - Delete message

## Validation

Using Zod schemas for input validation:

- **User validation** - Display name, email, status
- **Message validation** - Content requirements
- **Conversation validation** - Title, participant lists

## Middleware

- **Authentication** - Validates user sessions
- **Error handling** - Consistent error responses
- **CORS** - Cross-origin configuration
- **Body parsing** - JSON request handling

## Key Features

1. **Real-time messaging** via WebSocket
2. **Typing indicators** with live updates
3. **Read receipts** tracking per user
4. **Unread counts** for conversations
5. **User presence** (online/away/offline)
6. **Message history** with pagination
7. **Conversation titles** (custom or auto-generated)
8. **Admin permissions** for conversation management
9. **Soft delete** for messages
10. **Database transactions** for data consistency

## Environment Variables

Required configuration:

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## Architecture Decisions

1. **Function-based controllers** - Simpler, more testable, better tree-shaking
2. **Class-based services** - Encapsulation, potential for DI, stateful operations
3. **Raw SQL queries** - Full control, better performance, type safety with TypeScript
4. **WebSocket rooms** - Efficient broadcasting to conversation participants
5. **Layered architecture** - Clear separation of concerns, maintainable codebase
