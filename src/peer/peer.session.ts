import { Injectable } from '@nestjs/common';
import { IClient } from 'peer';
import { AuthenticatedSocket } from '../utils/interfaces';

export interface IPeerSessionManager {
    getUserPeerId(id: number): string;
    getUserClient(id: string): IClient;
    setUserClient(id: string, userId: number, client: IClient): void;
    removeUserClient(id: string): void;
    getClients(): Map<string, IClient>;
    getIds(): Map<number, string>;
    getKey(value: any, map: Map<any, any>): any;
}

@Injectable()
export class PeerSessionManager implements IPeerSessionManager {
    private readonly peerIdSessions: Map<number, string> = new Map();
    private readonly peerClientSessions: Map<string, IClient> = new Map();


    getUserPeerId(id: number) {
        return this.peerIdSessions.get(id)
    }


    getUserClient(id: string) {
        return this.peerClientSessions.get(id)
    }

    setUserClient(id: string, userId: number, client: IClient) {

        if (this.peerIdSessions.has(userId) && this.peerClientSessions.has(this.peerIdSessions.get(userId))) {
            this.peerClientSessions.get(this.peerIdSessions.get(userId)).getSocket()?.close()
            this.peerClientSessions.delete(this.peerIdSessions.get(userId));
        }
        console.log("PeerJS ID: %s, userId: %d", id, userId);

        this.peerIdSessions.set(userId, id)
        this.peerClientSessions.set(id, client);
    }
    removeUserClient(id: string) {
        if (this.peerClientSessions.has(id)) {
            this.peerClientSessions.get(id)?.getSocket()?.close
        }

        const userId = this.getKey(id, this.peerIdSessions);
        this.peerClientSessions.delete(userId);
        this.peerIdSessions.delete(userId);
    }
    getClients(): Map<string, IClient> {
        return this.peerClientSessions;
    }
    getIds(): Map<number, string> {
        return this.peerIdSessions
    }
    getKey(value: any, map: Map<any, any>) {
        const lk = [...map].find(([key, val]) => val == value)
        return lk ? lk.at(0) : undefined
    }
}
