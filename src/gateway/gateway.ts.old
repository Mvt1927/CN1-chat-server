import { ForbiddenException, Inject, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Services } from '../utils/constants';
import { AuthenticatedSocket } from '../utils/interfaces';
import { IGatewaySessionManager } from './gateway.session';
import { ConfigService } from '@nestjs/config';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { PrismaService } from 'src/prisma/prisma.service';
import { MessageCannotEmptyException } from './exceptions';
import { Group } from '@prisma/client';
import { CreateGroupMessageDto, GroupJoinDto } from './dtos';

@WebSocketGateway({
  cors: true,
  pingInterval: 10000,
  pingTimeout: 15000,
})
export class Gateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @Inject(Services.GATEWAY_SESSION_MANAGER)
    readonly sessions: IGatewaySessionManager,
    private prisma: PrismaService,
  ) {}

  @WebSocketServer()
  server: Server;

  handleConnection(socket: AuthenticatedSocket, ...args: any[]) {
    console.log(socket.user.userId + ` Connected`);
    this.sessions.setUserSocket(socket.user.userId, socket);
  }

  handleDisconnect(socket: AuthenticatedSocket) {
    console.log(`${socket.user.username} disconnected.`);
    this.sessions.removeUserSocket(socket.user.userId);
  }

  @SubscribeMessage(`onGroupJoin`)
  onGroupJoin(
    @MessageBody() data: GroupJoinDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    data.groupIds.map((groupId) => {
      client.join(`group-${groupId}`);
    });
  }

  @SubscribeMessage(`onGroupLeave`)
  onGroupLeave(
    @MessageBody() data: GroupJoinDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    data.groupIds.map((groupId) => {
      client.leave(`group-${groupId}`);
    });
  }

  @SubscribeMessage(`sendMessage`)
  async onSendMessage(
    @MessageBody() body: any,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    const receiverId = Number(body.to);
    const msg = body.msg;
    const receiverSocketId =
      this.sessions.getUserSocket(receiverId)?.user.socketId;

    try {
      if (msg == '') throw new MessageCannotEmptyException();
      const message = await this.prisma.chat.create({
        data: {
          from: socket.user.userId,
          to: receiverId,
          msg: msg,
        },
      });

      if (receiverSocketId) {
        console.log('send to ' + receiverSocketId);
        this.server.to(String(receiverSocketId)).emit('receiveMessage', {
          message,
        });
      }
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code == 'P2002') {
          throw new ForbiddenException('Credientials token');
        }
      }
      throw error;
    }
  }

  @OnEvent('group.create')
  handleGroupCreate(payload: Group | any) {
    payload?.Users.forEach((user: any) => {
      const socket = this.sessions.getUserSocket(user.user.id);
      socket && socket.emit('onGroupCreate', payload);
    });
  }

  @SubscribeMessage('group.message.create')
  async handleSendGroupMessage(
    @MessageBody() body: CreateGroupMessageDto,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    try {
      if (body.message == '') throw new MessageCannotEmptyException();
      const response = await this.prisma.groupMessage.create({
        data: {
          groupId: body.groupId,
          from: socket.user.userId,
          message: body.message,
        },
      });
      const update = await this.prisma.group.update({
        where: {
          id: body.groupId,
        },
        data: {
          lastMessageSent: body.message,
        },
      });
      this.server.to(`group-${body.groupId}`).emit('onGroupMessage', response);
      return;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code == 'P2002') {
          throw new ForbiddenException('Credientials token');
        }
      }
      throw error;
    }
  }

  @OnEvent('friend.request.create')
  async handleCreate({receiverId, response}) {
    const receiverSocketId =
    this.sessions.getUserSocket(receiverId)?.user.socketId;
    return this.server.to(String(receiverSocketId)).emit('notify.friend.request', {
      response
    })
  }

  @OnEvent('friend.request.accept')
  async handleAccept({receiverId, response}) {
    const receiverSocketId =
    this.sessions.getUserSocket(receiverId)?.user.socketId;
    return this.server.to(String(receiverSocketId)).emit('notify.friend.accept', {
      response
    })
  }
}
