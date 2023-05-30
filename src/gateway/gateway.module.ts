import { Module } from '@nestjs/common';
import { Services } from '../utils/constants';
import { ChatGateway } from 'src/chat/gateway/chat.gateway';
import { WebsocketAdapter } from './gateway.adapter';
import { GatewaySessionManager } from './gateway.session';
import { JwtService } from '@nestjs/jwt';

@Module({
	imports: [WebsocketAdapter],
	providers: [
		ChatGateway,
		JwtService,
		{
			provide: Services.GATEWAY_SESSION_MANAGER,
			useClass: GatewaySessionManager,
		},
	],
	exports: [
		ChatGateway,
		{
			provide: Services.GATEWAY_SESSION_MANAGER,
			useClass: GatewaySessionManager,
		},
	],

})
export class GatewayModule { }
