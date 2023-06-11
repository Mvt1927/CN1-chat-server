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
import { PrismaService } from 'src/prisma/prisma.service';
import { socketCallRequest, socketSendMessagePayload } from '../dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { type } from 'os';
import { IPeerSessionManager } from 'src/peer/peer.session';

@WebSocketGateway({
    // cors: true,
    pingInterval: 5000,
    pingTimeout: 5500,
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        @Inject(Services.GATEWAY_SESSION_MANAGER)
        readonly sessions: IGatewaySessionManager,
        @Inject(Services.PEER_SESSION_MANAGER)
        readonly peerSessions: IPeerSessionManager,
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
        const senderSocketId = this.sessions.getUserSocket(senderId)?.user.socketId;
        console.log(body);

        try {
            const message = await this.prisma.messages.create({
                data: {
                    value: msg || ''
                }
            })
            const chat = await this.prisma.chat.create({
                data: {
                    type: "text",
                    messageId: message.id,
                    userSendId: senderId,
                    userReceiveId: receiverId
                },
                include: {
                    messages: true,
                    calls: true,
                    image: true,
                    sticker: true,
                    userReceive: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true,
                            name:true
                        }
                    },
                    userSend: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true,
                            name:true
                        }
                    }
                }
            })

            this.server.to([String(senderSocketId), String(receiverSocketId)]).emit(Chat.RECEIVE_MESSAGE, {
                chat: chat
            });

        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code == 'P2002') {
                    throw new ForbiddenException('Credientials taken');
                }
            }
            throw error;
        }
    }

    @SubscribeMessage('call.request.send')
    async onCallRequest(
        @MessageBody() body: socketSendMessagePayload,
        @ConnectedSocket() socket: AuthenticatedSocket,
    ) {
        const senderId = Number(socket.user.id);
        const receiverId = Number(body.receiverId);

        const receiverSocketId = this.sessions.getUserSocket(receiverId)?.user.socketId;
        const senderSocketId = this.sessions.getUserSocket(senderId)?.user.socketId;
        try {
            const call = await this.prisma.calls.create({
                data: {
                    value: "Call" || '',
                    status: "pending"
                }
            })
            const chat = await this.prisma.chat.create({
                data: {
                    type: "call",
                    callId: call.id,
                    userSendId: senderId,
                    userReceiveId: receiverId
                },
                include: {
                    messages: true,
                    calls: true,
                    image: true,
                    sticker: true,
                    userReceive: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true,
                            name:true
                        }
                    },
                    userSend: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true,
                            name:true
                        }
                    }
                }
            })

            this.server.to([String(senderSocketId), String(receiverSocketId)]).emit(Chat.RECEIVE_MESSAGE, {
                chat: chat
            });

            if (receiverSocketId) {

                this.server.to([String(receiverSocketId)]).emit("call.receive", {
                    type: "request",
                    chat: chat
                    // receiverId: receiverId,
                });
                this.server.to([String(senderSocketId)]).emit("call.receive", {
                    type: "request.data",
                    chat: chat
                    // receiverId: receiverId,
                })
            } else
                this.server.to([String(senderSocketId)]).emit("call.answer.receive", {
                    type: "request.error",
                    chat: chat
                })
        } catch (error) {
            console.log(error);

            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code == 'P2002') {
                    throw new ForbiddenException('Credientials taken');
                }
            }
            throw error;
        }

    }

    @SubscribeMessage('call.request.accept')
    async onCallRequestAccept(
        @MessageBody() body: socketCallRequest,
        @ConnectedSocket() socket: AuthenticatedSocket,
    ) {
        const receiverId = Number(socket.user.id);

        const chatId = Number(body.chatId);
        const receiverSocketId = this.sessions.getUserSocket(receiverId)?.user.socketId;
        const receiverPeerId = body.peerId
        console.log("accept ", receiverPeerId);

        const chat = await this.prisma.chat.findFirst({
            where: {
                AND: [
                    {
                        id: chatId,
                    },
                    {
                        userReceiveId: receiverId
                    }
                ]
            }, include: {
                messages: true,
                calls: true,
                image: true,
                sticker: true,
                userReceive: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        name:true,
                    }
                },
                userSend: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        name:true
                    }
                }
            }
        })

        if (chat && chat.calls.status === "pending") {

            const senderSocketId = this.sessions.getUserSocket(chat.userSendId)?.user.socketId;
            const receiverSocketId = this.sessions.getUserSocket(chat.userReceiveId)?.user.socketId;

            if (receiverPeerId) {
                await this.prisma.calls.update({
                    where: {
                        id: chat.callId,
                    },
                    data: {
                        status: "accept",
                        value: "Call accept"
                    }
                })
                this.server.to([String(senderSocketId), String(receiverSocketId)]).emit("call.answer.receive", {
                    type: "request.accept",
                    chat: chat,
                    receiverPeerId: receiverPeerId,
                });
            } else {
                this.server.to([String(senderSocketId), String(receiverSocketId)]).emit("call.answer.receive", {
                    type: "request.error",
                });
            }
        }
    }

    @SubscribeMessage('call.request.refuse')
    async onCallRequestDeny(
        @MessageBody() body: socketCallRequest,
        @ConnectedSocket() socket: AuthenticatedSocket,

    ) {
        const chatId = Number(body.chatId);
        const senderId = Number(socket.user.id);
        const senderSocketId = this.sessions.getUserSocket(senderId)?.user.socketId;
        const chat = await this.prisma.chat.findFirst({
            where: {
                AND: [{
                    id: chatId,
                }, {
                    OR: [
                        { userSendId: senderId },

                        { userReceiveId: senderId }
                    ]
                }]
            }, include: {
                messages: true,
                calls: true,
                image: true,
                sticker: true,
                userReceive: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        name:true
                    }
                },
                userSend: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        name:true
                    }
                }
            }
        })

        if (chat && chat.calls.status === 'pending') {
            const receiverId = chat.userReceiveId
            const senderSocketId = this.sessions.getUserSocket(chat.userSendId)?.user.socketId;
            const receiverSocketId = this.sessions.getUserSocket(receiverId)?.user.socketId;

            await this.prisma.calls.update({
                where: {
                    id: chat.callId,
                },
                data: {
                    status: "refuse",
                    value: "Call refuse"
                }
            })
            console.log([String(senderSocketId), String(receiverSocketId)]);

            this.server.to([String(senderSocketId), String(receiverSocketId)]).emit("call.answer.receive", {
                type: "request.refuse",
                chat: chat
            });

        } else {
            this.server.to([String(senderSocketId)]).emit("call.answer", {
                type: "request.error",
            });
        }
    }

    @SubscribeMessage('call.close')
    async onCallClose(
        @MessageBody() body: socketCallRequest,
        @ConnectedSocket() socket: AuthenticatedSocket,
    ) {
        const chatId = Number(body.chatId);
        const senderId = Number(socket.user.id);
        if (chatId) {
            const chat = await this.prisma.chat.findFirst({
                where: {
                    AND: [{
                        id: chatId,
                    }, {
                        OR: [
                            { userSendId: senderId },

                            { userReceiveId: senderId }
                        ]
                    }]
                }, include: {
                    messages: true,
                    calls: true,
                    image: true,
                    sticker: true,
                    userReceive: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true,
                            name:true
                        }
                    },
                    userSend: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true,
                            name:true
                        }
                    }
                }
            })
            const senderSocketId = this.sessions.getUserSocket(senderId)?.user.socketId;

            if (chat) {
                const receiverId = chat.userReceiveId
                const receiverSocketId = this.sessions.getUserSocket(receiverId)?.user.socketId;
                const senderSocketId = this.sessions.getUserSocket(chat.userSendId)?.user.socketId;
                await this.prisma.calls.update({
                    where: {
                        id: chat.callId,
                    },
                    data: {
                        status: "close",
                        value: "Call close"
                    }
                })

                this.server.to([String(senderSocketId), String(receiverSocketId)]).emit("call.receive", {
                    type: "request.close",
                    chat: chat
                });

            } else {
                this.server.to([String(senderSocketId)]).emit("call.receive", {
                    type: "request.error",
                });
            }
        }
    }
    // @OnEvent('group.create')
    // handleGroupCreate(payload: Group | any) {
    //     payload?.Users.forEach((user: any) => {
    //         const socket = this.sessions.getUserSocket(user.user.id);
    //         socket && socket.emit('onGroupCreate', payload);
    //     });
    // }

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
