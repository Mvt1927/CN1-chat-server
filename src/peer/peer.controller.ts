import { All, Controller, Get, Next, Req, Res , Headers} from '@nestjs/common';
import { UseGuards } from '@nestjs/common/decorators';
import { NextFunction, Request, Response } from 'express';
import { JwtGuard } from 'src/guard/jwt.guard';
// import { PeerAdapter } from './peer.adapter';

@Controller('/peer')
export class PeerController {
    constructor() { }

    @UseGuards(JwtGuard)
    @All('*')
    getServer(
        @Req() request: Request,
        @Res() response: Response,
        @Next() next: NextFunction,
    ) {
        const entryPointPath = '/peer/';
        request.url = request.url.replace(entryPointPath, '/');
        // this.peerService.peerServer(request, response, next);
    }
}
