import { User } from '@prisma/client';
import { Socket } from 'socket.io';

export interface IPayload {
	username: String,
	id: number,
	iat: number,
	exp: number
}

export interface IUser extends IPayload {
	socketId: String
}

export interface AuthenticatedSocket extends Socket {
	// user?: User;
	user?: IUser
	// token?: String;
	// decode_token?: IUser;
}
