import {
  Body,
  Headers,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  HttpStatus,
  HttpCode,
  HttpException,
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

  @HttpCode(HttpStatus.OK)
  @Get(":id")
  getUser(@Param('id', ParseIntPipe) receiverId: number, @GetUser('id') userId: number) {
    if (userId)
      return this.chatService.getChat(receiverId, userId);
    else throw new HttpException('Unable to load chat', HttpStatus.BAD_REQUEST);
  }
}
