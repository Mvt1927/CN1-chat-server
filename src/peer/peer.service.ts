import { INestApplication, Injectable, HttpStatus, Inject } from '@nestjs/common';
import { ExpressPeerServer, PeerServer, PeerServerEvents, } from 'peer'
import { Express } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WebsocketAdapter } from 'src/gateway/gateway.adapter';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PORT, Secret, Services } from 'src/utils/constants';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestFactory } from '@nestjs/core';
import { PeerModule } from './peer.module';
import { IPeerSessionManager, PeerSessionManager } from './peer.session';
import * as fs from 'fs'

@Injectable()
export class PeerServive {

    constructor(
        @Inject(Services.PEER_SESSION_MANAGER)
        private readonly sessions: IPeerSessionManager
    ) {
        console.log(this.sessions);

        this.peerServer = PeerServer({
            port: this.config.get(PORT.PEER),
            ssl:{
                key: String(fs.readFileSync(this.config.get("SSL_KEY"))),
                cert: String(fs.readFileSync(this.config.get("SSL_CERT")))
            }
            // allow_discovery: true,
            // proxied: true,
            // path:"/server"
        })
    }
    private readonly config: ConfigService = new ConfigService()
    private jwt: JwtService = new JwtService()

    private peerServer: Express & PeerServerEvents;
    createServer() {
        this.peerServer.on('connection', client => {
            try {
                const decodedToken = this.jwt.verify(client.getToken(), {
                    secret: this.config.get(Secret.JWT_SECRET)
                })
                if (!decodedToken)
                    client.getSocket()?.close(401, "error")
                this.sessions.setUserClient(client.getId(), decodedToken.id, client)
                console.log(client.getId(),"connect peer"); 

            } catch (error) {
                client.getSocket()?.close()     
            }
        })
        this.peerServer.on('disconnect', client => {
            console.log(client.getId(),"disconnect peer");
            
            this.sessions.removeUserClient(client.getId())
        })
    }

}
