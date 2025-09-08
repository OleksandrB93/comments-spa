import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    credentials: true,
  },
  namespace: '/comments',
})
export class CommentGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('CommentGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_post')
  handleJoinPost(
    @MessageBody() data: { postId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { postId } = data;
    client.join(`post_${postId}`);
    this.logger.log(`Client ${client.id} joined post ${postId}`);
    client.emit('joined_post', { postId });
  }

  @SubscribeMessage('leave_post')
  handleLeavePost(
    @MessageBody() data: { postId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { postId } = data;
    client.leave(`post_${postId}`);
    this.logger.log(`Client ${client.id} left post ${postId}`);
    client.emit('left_post', { postId });
  }

  // Метод для відправки нового коментаря всім клієнтам в конкретному пості
  broadcastNewComment(postId: string, comment: any) {
    this.server.to(`post_${postId}`).emit('new_comment', {
      type: 'NEW_COMMENT',
      data: comment,
    });
    this.logger.log(`Broadcasted new comment to post ${postId}`);
  }

  // Метод для відправки оновленого коментаря
  broadcastUpdatedComment(postId: string, comment: any) {
    this.server.to(`post_${postId}`).emit('updated_comment', {
      type: 'UPDATED_COMMENT',
      data: comment,
    });
    this.logger.log(`Broadcasted updated comment to post ${postId}`);
  }

  // Метод для відправки видаленого коментаря
  broadcastDeletedComment(postId: string, commentId: string) {
    this.server.to(`post_${postId}`).emit('deleted_comment', {
      type: 'DELETED_COMMENT',
      data: { id: commentId },
    });
    this.logger.log(`Broadcasted deleted comment to post ${postId}`);
  }
}
