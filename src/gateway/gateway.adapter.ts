import { IoAdapter } from '@nestjs/platform-socket.io';
import { AuthenticatedSocket, IPayload} from '../utils/interfaces';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Secret } from 'src/utils/constants';

export class WebsocketAdapter extends IoAdapter {
	private readonly jwtService: JwtService = new JwtService();
	private config: ConfigService = new ConfigService();

	createIOServer(port: number, options?: any) {
		const server = super.createIOServer(port, options);
		server.use(async (socket: AuthenticatedSocket, next) => {
			const token = socket.handshake.headers?.access_token;
			// console.log(socket)
			if (!token) {
				console.log(`Client has no token`);
				return next(new Error('Not Authenticated. No token were sent'));
			}
			var payload: IPayload
			try {
				payload = this.jwtService.verify(String(token), {
					secret: this.config.get(Secret.JWT_SECRET),
				});
			} catch (error) {
				return next(new Error('Error signing token'));
			}
			if (!payload?.id) return next(new Error('Error signing token'));

			socket.user = {
				...payload,
				socketId: socket.id,
			};
			next();
		});
		return server;
	}
}
