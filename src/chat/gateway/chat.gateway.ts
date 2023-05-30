import { ForbiddenException, Inject } from '@nestjs/common';
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    OnGatewayConnection,
    ConnectedSocket,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Chat, Services } from 'src/utils/constants';
import { AuthenticatedSocket } from 'src/utils/interfaces';
import { IGatewaySessionManager } from 'src/gateway/gateway.session';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { PrismaService } from 'src/prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';
import { Group } from '@prisma/client';
import { CreateGroupMessageDto } from 'src/gateway/dtos';
import { MessageCannotEmptyException } from 'src/gateway/exceptions';
import { socketSendMessagePayload } from '../dto';

@WebSocketGateway({
    cors: true,
    pingInterval: 5000,
    pingTimeout: 5500,
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        @Inject(Services.GATEWAY_SESSION_MANAGER)
        readonly sessions: IGatewaySessionManager,
        private prisma: PrismaService
    ) { }

    @WebSocketServer()
    server: Server;

    handleConnection(socket: AuthenticatedSocket, ...args: any[]) {
        console.log(`${socket.user.username} Incoming Connection`);
        this.sessions.setUserSocket(socket.user.id, socket);
    }

    handleDisconnect(socket: AuthenticatedSocket) {
        console.log(`${socket.user.username} disconnected.`);
        this.sessions.removeUserSocket(socket.user.id);
    }


    @SubscribeMessage(Chat.SEND_MESSAGE)
    async onSendMessage(
        @MessageBody() body: socketSendMessagePayload,
        @ConnectedSocket() socket: AuthenticatedSocket,
    ) {
        console.log(body);
        const senderId = Number(socket.user.id);
        const receiverId = Number(body.receiverId);
        const type = String(body.type)
        const msg = body.message;
        const receiverSocketId = this.sessions.getUserSocket(receiverId)?.user.socketId;
        try {
            const message = await this.prisma.messages.create({
                data: {
                    value: msg || ''
                }
            })
            const chat = await this.prisma.chat.create({
                data:{
                    type:"text",
                    messageId:message.id,
                    userSendId:senderId,
                    userReceiveId:receiverId
                },
                include:{
                    messages:true,
                    userReceive: {
                        select:{
                            id:true,
                            username:true,
                        }
                    },
                    userSend: {
                        select:{
                            id:true,
                            username:true,
                        }
                    }
                }
            })
            if (receiverSocketId) {
                this.server.to(String(receiverSocketId)).emit(Chat.RECEIVE_MESSAGE, {
                    chat: chat
                });
            }
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code == 'P2002') {
                    throw new ForbiddenException('Credientials taken');
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

    // @SubscribeMessage('group.message.create')
    // async handleSendGroupMessage(
    //     @MessageBody() body: CreateGroupMessageDto,
    //     @ConnectedSocket() socket: AuthenticatedSocket,
    // ) {
    //     try {
    //         if (body.message == '') throw new MessageCannotEmptyException();
    //         const response = await this.prisma.groupMessage.create({
    //             data: {
    //                 groupId: body.groupId,
    //                 from: socket.user.id,
    //                 message: body.message,
    //             },
    //         });
    //         this.server.to(`group-${body.groupId}`).emit('onGroupMessage', response);
    //         return;
    //     } catch (error) {
    //         if (error instanceof PrismaClientKnownRequestError) {
    //             if (error.code == 'P2002') {
    //                 throw new ForbiddenException('Credientials token');
    //             }
    //         }
    //         throw error;
    //     }
    // }
}
