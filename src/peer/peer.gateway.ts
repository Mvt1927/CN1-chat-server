import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthenticatedSocket } from 'src/utils/interfaces';

@WebSocketGateway({
    // cors: true,
    pingInterval: 5000,
    pingTimeout: 5500,
})
export class PeerGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        // @Inject(Services.GATEWAY_SESSION_MANAGER)
        // readonly sessions: IGatewaySessionManager,
        // private prisma: PrismaService
    ) { }

    @WebSocketServer()
    server: Server;

    handleConnection(socket: AuthenticatedSocket, ...args: any[]) {
        console.log(`${socket.user.username} Incoming Connection`);
        // this.sessions.setUserSocket(socket.user.id, socket);
    }

    handleDisconnect(socket: AuthenticatedSocket) {
        console.log(`${socket.user.username} disconnected.`);
        // this.sessions.removeUserSocket(socket.user.id);
    }

}