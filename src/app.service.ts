import { Injectable, Inject } from '@nestjs/common';
import { PeerSessionManager } from './peer/peer.session';
import { Services } from './utils/constants';

@Injectable()
export class AppService {

  constructor(
    @Inject(Services.PEER_SESSION_MANAGER)
    private peerSession: PeerSessionManager,
  ) { }

  getStatus(): string {
    return 'oke!';
  }

  test(): any {

    const ids = this.peerSession.getIds()
    console.log(this.peerSession.getIds().keys());
    

    return Array.from(ids.keys())
  }

}
