import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Chat } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { IChatReturn } from './dto';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async getChat(receiverId:number, userId: number) : Promise<IChatReturn|any> {
        try {
            const chats = (await this.prisma.chat.findMany({
                orderBy:{
                    id: 'asc'
                },
                where: {
                    OR: [
                        {
                            AND: [
                                { userSendId: userId },
                                { userReceiveId: receiverId }
                            ]
                        },
                        {
                            AND: [
                                { userSendId: receiverId },
                                { userReceiveId: userId }
                            ]
                        }
                    ]
                },
                include:{
                    messages:true,
                    calls:true,
                    image:true,
                    sticker:true,
                    userReceive: {
                        select:{
                            id:true,
                            username:true,
                            name:true
                        }
                    },
                    userSend: {
                        select:{
                            id:true,
                            username:true,
                            name:true
                        }
                    }
                }
            }))
            // .sort((a, b) => compareFn(a, b));
            function compareFn(a: Chat, b: Chat) {
                if (a['id'] > b['id']) return 1;
                if (a['id'] < b['id']) return -1;
                return 0;
            }
            return {statusCode: 200, chat: chats}
        } catch (error) {
            throw new HttpException('Unable to load message', HttpStatus.BAD_REQUEST);
        }
    } 
}