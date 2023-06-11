import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ChatModule } from './chat/chat.module';
import { GatewayModule } from './gateway/gateway.module';
// import { FriendsModule } from './friends/friends.module';
// import { FriendRequestModule } from './friend-request/friend-request.module';
// import { GroupModule } from './group/group.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { UserModule } from './user/user.module';
import { PeerModule } from './peer/peer.module';
import { Services } from './utils/constants';
import { PeerSessionManager } from './peer/peer.session';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    ChatModule,
    GatewayModule,
    PeerModule,

    // FriendsModule,
    // FriendRequestModule,
    // GroupModule,
    // UserModule,
  ],
  controllers: [AppController],
  providers: [
    // {
		// 	provide: Services.PEER_SESSION_MANAGER,
		// 	useClass: PeerSessionManager,
		// },
    AppService
  ],
})
export class AppModule { }
