import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthCheckToken, AuthRefreshToken, AuthSignIn, AuthSignOut, AuthSignUp, AuthSuccessReturn, AuthTokenPayload } from './dto';
import * as argon from 'argon2'

@Injectable()
export class AuthService {

    /**
     * AuthService constructor
     * 
     * @param prisma - use to get data from database by use prisma.
     * @param jwt - use jsonwebtoken để tạo token đăng nhập.
     * @param config - dùng để lấy dữ liệu từ file .env
     */
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService
    ) { }

    /**
     * Xử lý đăng nhập 
     * 
     * @param {AuthSignIn} inputPayload - Giá trị nhận từ client là 1 `JSON` chứa 2 phần tử:
     * - `username` : tên tk người dùng.
     * - `password` : mật khẩu.
     * 
     * @returns {Promise<AuthSuccessReturn>} Trả về `AuthSuccessReturn` hoặc throw `HttpException`
     * 
     * `AuthSuccessReturn` By default, the `JSON` response body contains four properties:
     * - `statusCode`: the Http Status Code.
     * - `message`: a short description of the request.
     * - `username`: username của người dùng.
     * - `access_token`: token sử dụng để đăng nhập thay tài khoản và mật khẩu.
     * 
     * `HttpException` By default, the `JSON` response body contains two properties:
     * - `statusCode`: the Http Status Code.
     * - `message`: a short description of the HTTP error by default; override this
     */
    async signin(inputPayload: AuthSignIn): Promise<AuthSuccessReturn> {
        const user = await this.prisma.user.findUnique({
            where: {
                username: inputPayload.username,
            }
        });
        if (user) {
            const isPasswordMatching = await argon.verify(user.hash, inputPayload.password).catch(e => {
                console.log(e)
                return false
            })
            if (isPasswordMatching) {
                return await this.createTokenAndThrowException(user.id, user.username, HttpStatus.OK)
            }
        }
        throw new HttpException('Incorrect Username or Password', HttpStatus.UNAUTHORIZED);
    }

    /**
     * Xử lý đăng ký 
     * 
     * @param {AuthSignUp} inputPayload  - Giá trị nhận từ client là 1 `JSON` chứa 6 phần tử :
     * - `username` : tên tk người dùng.
     * - `password` : mật khẩu.
     * - `repassword`: mật khẩu được nhập lại.
     * - `email`: email.
     * - `firstName`: Tên.
     * - `lastName`: Họ.
     * @returns {Promise<AuthSuccessReturn>} Trả về `AuthSuccessReturn` hoặc throw `HttpException`
     * 
     * `AuthSuccessReturn` By default, the `JSON` response body contains four properties:
     * - `statusCode`: the Http Status Code.
     * - `message`: a short description of the request.
     * - `username`: username của người dùng.
     * - `access_token`: token sử dụng để đăng nhập thay tài khoản và mật khẩu.
     * 
     * `HttpException` By default, the `JSON` response body contains two properties:
     * - `statusCode`: the Http Status Code.
     * - `message`: a short description of the HTTP error by default; override this
     */
    async signup(inputPayload: AuthSignUp): Promise<AuthSuccessReturn> {
        if (inputPayload.password === inputPayload.repassword) {
            const isHasUser = await this.prisma.user.findMany({
                where: {
                    OR: {
                        username: inputPayload.username,
                        email: inputPayload.email
                    }
                },
                select: {
                    id: true
                }
            }).then((value) => {
                console.log(value.length);

                return Boolean(value.length)
            }).catch(_ => {
                return true
            })
            if (!isHasUser) {
                const hash = await argon.hash(inputPayload.password);
                try {
                    const user = await this.prisma.user.create({
                        data: {
                            username: inputPayload.username,
                            hash: hash,
                            email: inputPayload.email,
                            firstName: inputPayload.firstName,
                            lastName: inputPayload.lastName,
                        }

                    })
                    return await this.createTokenAndThrowException(user.id, user.username, HttpStatus.CREATED)
                } catch (error) {
                    throw new HttpException('Credientials taken - AuthService.109', HttpStatus.INTERNAL_SERVER_ERROR);
                }
            } else throw new HttpException("User already exist", HttpStatus.BAD_REQUEST)

        } else throw new HttpException("Password and Repassword not match", HttpStatus.BAD_REQUEST)
    }

    /**
     * Xử lý Đăng xuât
     * 
     * @param inputPayload - giá trị `JSON` nhận vào từ client chứa 1 phần tử :
     * - `access_token`: token đăng nhập.
     * 
     * @returns không trả về hoặc throw `HttpException`
     * 
     * `HttpException` By default, the `JSON` response body contains two properties:
     * - `statusCode`: the Http Status Code.
     * - `message`: a short description of the HTTP error by default; override this
     */
    async signout(inputPayload: AuthSignOut) {
        const checkToken = await this.checkToken(inputPayload.access_token)
        // if (checkToken) {
        //     const token = crypto.randomUUID()
        //     await this.prisma.user.update({
        //         where: {
        //             id: checkToken.userId
        //         },
        //         data: {
        //             // token: token
        //         }
        //     }).catch(_=>{
        //         throw new HttpException('Credientials taken - AuthService.109', HttpStatus.INTERNAL_SERVER_ERROR);
        //     });
        //     return
        // }else throw new HttpException("Token Error", HttpStatus.BAD_REQUEST)
    }

    /**
     * Làm tươi token, token cũ còn hạn vẫn sử dụng được.
     * 
     * @param {AuthRefreshToken} inputPayload  - Giá trị nhận từ client là 1 `JSON` chứa 1 phần tử :
     * - `access_token`: token đăng nhập.
     * 
     * @returns {Promise<AuthSuccessReturn>} Trả về `AuthSuccessReturn` hoặc throw `HttpException`
     * 
     * `AuthSuccessReturn` By default, the `JSON` response body contains four properties:
     * - `statusCode`: the Http Status Code.
     * - `message`: a short description of the request.
     * - `username`: username của người dùng.
     * - `access_token`: token sử dụng để đăng nhập thay tài khoản và mật khẩu.
     * 
     * `HttpException` By default, the `JSON` response body contains two properties:
     * - `statusCode`: the Http Status Code.
     * - `message`: a short description of the HTTP error by default; override this
     */
    async refreshToken(inputPayload: AuthRefreshToken): Promise<AuthSuccessReturn> {
        const checkToken = await this.checkToken(inputPayload.access_token)
        if (checkToken) {
            return this.createTokenAndThrowException(checkToken.userId, checkToken.username, HttpStatus.OK, checkToken.token)
        } else throw new HttpException("Token Error", HttpStatus.BAD_REQUEST)
    }

    /**
     * Làm mới token, token cũ không còn sử dụng được.
     * 
     * @param {AuthRefreshToken} inputPayload  - Giá trị nhận từ client là 1 `JSON` chứa 1 phần tử :
     * - `access_token`: token đăng nhập.
     * 
     * @returns {Promise<AuthSuccessReturn>} Trả về `AuthSuccessReturn` hoặc throw `HttpException`
     * 
     * `AuthSuccessReturn` By default, the `JSON` response body contains four properties:
     * - `statusCode`: the Http Status Code.
     * - `message`: a short description of the request.
     * - `username`: username của người dùng.
     * - `access_token`: token sử dụng để đăng nhập thay tài khoản và mật khẩu.
     * 
     * `HttpException` By default, the `JSON` response body contains two properties:
     * - `statusCode`: the Http Status Code.
     * - `message`: a short description of the HTTP error by default; override this
     */
    async renewToken(inputPayload: AuthRefreshToken): Promise<AuthSuccessReturn> {
        const checkToken = await this.checkToken(inputPayload.access_token)
        if (checkToken) {
            return this.createTokenAndThrowException(checkToken.userId, checkToken.username, HttpStatus.OK)
        } else throw new HttpException("Token Error", HttpStatus.BAD_REQUEST)
    }

    async testC(input: { access_token: string }) {
        return this.checkToken(input.access_token)
    }

    /**
     * Check Token
     * 
     * @param access_token - token dùng để đăng nhập.
     * 
     * @returns {Promise<AuthCheckToken>} - Trả về `AuthCheckToken` hoặc throw `HttpException`.
     * 
     * `AuthCheckToken` : 1 `JSON` Chứa 3 phần tử:
     * - `userId`: id user.
     * - `username`: username người dùng.
     * - `token`: token để tạo access_token.
     * 
     */

    async checkToken(access_token: string): Promise<AuthCheckToken> {

        const tokenPayload = this.jwt.decode(access_token)

        const username = tokenPayload['username']
        const userId = tokenPayload['userId']


        if (userId && username) {
            const user = await this.prisma.user.findUnique({
                where: {
                    username: username
                },
                select: {
                    id: true,
                    token: true,
                    username: true
                }
            }).catch(_ => {
                throw new HttpException("Token Error", HttpStatus.BAD_REQUEST)
            })
            if (userId == user.id) {
                const secret = this.config.get("JWT_SECRET") + user.token;
                const checkTokenPayload = await this.jwt.verifyAsync(access_token, { secret }).then(_ => {
                    return {
                        userId: user.id,
                        username: user.username,
                        token: user.token
                    }
                }).catch(_ => {
                    throw new HttpException("Token Error", HttpStatus.BAD_REQUEST)
                })
                return checkTokenPayload
            }
        }
        throw new HttpException("Token Error", HttpStatus.BAD_REQUEST)
    }
    /**
     * Xử lý tạo token 
     * 
     * 
     * @param {number} userId - ID của user.
     * @param {string} username - Username của user.
     * @param {number} HttpStatusCode - Status code trả về.
     * @param {string} current_token - token dùng để tạo access_token, default `none`.
     * 
     * @returns {Promise<AuthSuccessReturn>} Trả về `AuthSuccessReturn` hoặc throw `HttpException`.
     * 
     * `AuthSuccessReturn` By default, the `JSON` response body contains four properties:
     * - `statusCode`: the Http Status Code.
     * - `message`: a short description of the request.
     * - `username`: username của người dùng.
     * - `access_token`: token sử dụng để đăng nhập thay tài khoản và mật khẩu.
     * 
     * `HttpException` By default, the `JSON` response body contains two properties:
     * - `statusCode`: the Http Status Code.
     * - `message`: a short description of the HTTP error by default; override this
     */
    private async createTokenAndThrowException(userId: number, username: string, HttpStatusCode: number, current_token?: string): Promise<AuthSuccessReturn> {
        const payload: AuthTokenPayload = {
            id: userId,
            username: username
        }

        // const token = current_token||crypto.randomUUID()

        const secret = this.config.get("JWT_SECRET");

        const access_token = await this.jwt.signAsync(payload, {
            expiresIn: '10h',
            secret,
        });
        if (access_token) {
            try {
                // await this.prisma.user.update({
                //     where: {
                //         id: userId
                //     },
                //     data: {
                //         token: token
                //     }
                // });
                return {
                    statusCode: HttpStatusCode,
                    message: "Authentication accepted",
                    username: username,
                    access_token: access_token,
                }
            } catch (error) {
                console.log(error)
            }
        }
        throw new HttpException('Credientials taken - AuthService.createTokenAndThrowException', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    async getUser(userId: number) {
        if (!userId)
            throw new HttpException('Credientials taken - AuthService.createTokenAndThrowException', HttpStatus.INTERNAL_SERVER_ERROR);
        const users = await this.prisma.user.findMany({
            orderBy: {
                chatSend: {
                    _count: 'desc'
                }
            },
            where: {
                NOT: {
                    id: userId
                }
            },
            select: {
                id: true,
                username: true,
                chatSend: {
                    take: 1,
                    orderBy: [
                        { id: 'desc' }
                    ],
                    where: {
                        OR: [
                            { userSendId: userId },
                            { userReceiveId: userId }
                        ]
                    }
                },
                chatReceive: {
                    take: 1,
                    orderBy: [
                        { id: 'desc' }
                    ],
                    where: {
                        OR: [
                            { userSendId: userId },
                            { userReceiveId: userId }
                        ]
                    }
                }
            }
        });

        users.map((user) => {

            if (user.chatSend[0] && user.chatReceive[0]) {
                user['chat'] = user.chatSend[0].createdAt >= user.chatReceive[0].createdAt ? user.chatSend : user.chatReceive
            }

            if (!user.chatReceive[0]) {
                if (user.chatSend[0]) {
                    user['chat'] = user.chatSend[0]
                } else user['chat'] = {}
            }else if (!user.chatSend[0]) {
                user['chat'] = user.chatReceive[0]
            }


            delete user.chatReceive
            delete user.chatSend
        })

        return { users: users }
    }
}