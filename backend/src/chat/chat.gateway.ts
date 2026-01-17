import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'https://idbconnect.global', 'https://student.idbconnect.global', 'https://inquiry.idbconnect.global', 'https://b2b.idbconnect.global'], // Allow frontend origins
    credentials: true,
  },
  namespace: '/chat', // Separate namespace to avoid conflicts
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  // 1. Authenticate on Connection
  async handleConnection(client: Socket) {
    try {
      // Client must send token in handshake auth: { token: "..." } or headers
      const token = client.handshake.auth.token || client.handshake.headers.authorization;
      
      if (!token) throw new Error('No token');

      // Remove 'Bearer ' if present
      const cleanToken = token.replace('Bearer ', '');
      const payload = this.jwtService.verify(cleanToken, { secret: process.env.JWT_SECRET });

      // Attach user info to the socket instance
      client.data.user = payload; 
      
      // If user is a Student (Lead), auto-join their own room
      // Use 'role' or 'type' from payload to detect
      if (payload.role === 'lead' || !payload.role) { // Assuming leads might not have 'role' property or it's 'student'
         // For safety, let's assume 'sub' is the ID.
         const roomId = payload.sub; 
         await client.join(roomId);
         console.log(`Student ${payload.name} joined room ${roomId}`);
      }
      
      console.log(`Client connected: ${client.id} (${payload.email})`);
    } catch (e) {
      console.log('Socket Auth Failed:', e.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // 2. Event: Join Room (Used by Counsellors/Admins)
  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { lead_id: string },
  ) {
    // Security: Only Partners/Agents should be able to join arbitrary rooms
    // Students should only be in their own room (handled in connection)
    if (client.data.user.type === 'lead') return; 

    await client.join(data.lead_id);
    console.log(`Staff ${client.data.user.name} joined room ${data.lead_id}`);
    
    return { event: 'joined', room: data.lead_id };
  }

  // 3. Event: Send Message
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() createMessageDto: CreateMessageDto,
  ) {
    const user = client.data.user;
    
    // Determine Sender Type based on Token Payload
    let senderType: 'PARTNER' | 'LEAD' | 'AGENT' = 'LEAD';
    if (user.type === 'agent' || user.role === 'agent') senderType = 'AGENT';
    else if (user.role && user.role !== 'student') senderType = 'PARTNER';

    // Save to DB
    const savedMsg = await this.chatService.saveMessage(user.sub, senderType, createMessageDto);

    // Broadcast to the Room (Lead ID)
    this.server.to(createMessageDto.lead_id).emit('receive_message', savedMsg);

    return savedMsg;
  }

  // 4. Event: Typing Indicator
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { lead_id: string, isTyping: boolean },
  ) {
    client.to(data.lead_id).emit('user_typing', { 
      user: client.data.user.name, 
      isTyping: data.isTyping 
    });
  }

  // 5. Event: Mark as Read
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { lead_id: string },
  ) {
    // Determine who is reading
    const readerType = client.data.user.role === 'lead' ? 'LEAD' : 'PARTNER';
    
    // Update DB
    await this.chatService.markAsRead(data.lead_id, readerType);
    
    // Optional: Notify the other person in the room that messages were read
    // client.to(data.lead_id).emit('messages_read_receipt');
  }
}