import { Module } from '@nestjs/common';
import { PeerController } from './peer.controller';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PeerServive } from './peer.service';
import { PeerGateway } from './peer.gateway';
import { PeerSessionManager } from './peer.session';
import { Services } from 'src/utils/constants';

@Module({
  imports:[
    // PeerServive,
  ],
  providers: [
    JwtService,
    // PeerGateway,
    PeerServive,
    ConfigService,
    // PeerSessionManager,
    {
			provide: Services.PEER_SESSION_MANAGER,
			useClass: PeerSessionManager,
		},
  ],
  exports:[
    {
			provide: Services.PEER_SESSION_MANAGER,
			useClass: PeerSessionManager,
		},
  ],
  controllers: [PeerController]
})
export class PeerModule {}
