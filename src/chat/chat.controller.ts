import {
  Body,
  Headers,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { Routes, User } from '../utils/constants';
import { GetChatDto } from './dto';
// import { JwtGuard } from 'src/auth/guard';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/guard/jwt.guard';

@UseGuards(JwtGuard)
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) { }

  @Get(":id")
  getUser(@Param('id', ParseIntPipe) receiverId: number, @GetUser('id') userId: number) {
    if (userId)
      return this.chatService.getChat(receiverId, userId);
    return { statusCode: 400, message: "Error for load message" }
  }
}
