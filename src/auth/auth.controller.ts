import { Body, Controller, HttpCode, HttpStatus, Post, Get, UseGuards, Put } from '@nestjs/common';
import { Request, Router } from 'express';
import { JwtGuard } from 'src/guard/jwt.guard';
import { Routes, TOKEN } from 'src/utils/constants';
import { AuthService } from './auth.service';
import { GetUser } from './decorator';
import { AuthSignIn, AuthSignUp, AuthSuccessReturn,AuthRefreshToken, AuthRenewToken, AuthSignOut } from './dto';

@Controller(Routes.AUTH)
export class AuthController {

    /**
     * AuthController constructor
     * 
     * @param authService - AuthService
     */
    constructor(
        private authService: AuthService
    ) {
        
     }

    /**
     * Xử lý đăng nhập 
     * 
     * @HttpCode `200`
     * 
     * @Post `signin`
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
    @HttpCode(HttpStatus.OK)
    @Post(Routes.SIGN_IN)
    signin(@Body() inputPayload: AuthSignIn): Promise<AuthSuccessReturn> {
        return this.authService.signin(inputPayload)
    }

    /**
     * Xử lý đăng ký 
     * 
     * @HttpCode `201`
     * 
     * @Post `signup`
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
    @HttpCode(HttpStatus.CREATED)
    @Post(Routes.SIGN_UP)
    signup(@Body() inputPayload: AuthSignUp): Promise<AuthSuccessReturn> {
        return this.authService.signup(inputPayload)
    }

    /**
     * Xử lý Đăng xuât
     * 
     * @HttpCode `201`
     * 
     * @Post `signup`
     * 
     * @param inputPayload- giá trị `JSON` nhận vào từ client chứa 1 phần tử :
     * - `access_token`: token đăng nhập.
     * 
     * @returns không trả về hoặc throw `HttpException`
     */
    @UseGuards(JwtGuard)
    @HttpCode(HttpStatus.OK)
    @Put(Routes.SIGN_OUT)
    signout(@Body() inputPayload: AuthSignOut) {
        return this.authService.signout(inputPayload) 
    }

    @UseGuards(JwtGuard)
    @HttpCode(HttpStatus.OK)
    @Get("users")
    getUser(@GetUser('id') userId: number) {
        return this.authService.getUser(userId)
    }

    // /**
    //  * check token test
    //  * 
    //  * @HttpCode `200`
    //  * 
    //  * @Post `token/check`
    //  * 
    //  * @param {AuthSignUp} inputPayload - Giá trị nhận vào từ client 
    //  * 
    //  * @returns {Promise<AuthSuccessReturn>} Trả về AuthSuccessReturn hoặc throw HttpException.
    //  * 
    //  * `HttpException` By default, the `JSON` response body contains two properties:
    //  * - `statusCode`: the Http Status Code.
    //  * - `message`: a short description of the HTTP error by default; override this
    //  */
    // @HttpCode(HttpStatus.OK)
    // @Post("token/check")
    // checkToken(@Body() inputPayload: { access_token: string }): Promise<{}> {
    //     return this.authService.testC(inputPayload)
    // }

    // /**
    //  * Làm tươi token, token cũ còn hạn vẫn sử dụng được.
    //  * 
    //  * @HttpCode `200`
    //  * 
    //  * @Post `token/refresh`
    //  * 
    //  * 
    //  * @param {AuthRefreshToken} inputPayload  - Giá trị nhận từ client là 1 `JSON` chứa 1 phần tử :
    //  * - `access_token`: token đăng nhập.
    //  * 
    //  * @returns {Promise<AuthSuccessReturn>} Trả về `AuthSuccessReturn` hoặc throw `HttpException`
    //  * 
    //  * `AuthSuccessReturn` By default, the `JSON` response body contains four properties:
    //  * - `statusCode`: the Http Status Code.
    //  * - `message`: a short description of the request.
    //  * - `username`: username của người dùng.
    //  * - `access_token`: token sử dụng để đăng nhập thay tài khoản và mật khẩu.
    //  * 
    //  * `HttpException` By default, the `JSON` response body contains two properties:
    //  * - `statusCode`: the Http Status Code.
    //  * - `message`: a short description of the HTTP error by default; override this
    //  */
    // @HttpCode(HttpStatus.OK)
    // @Post("token/refresh")
    // refreshToken(@Body() inputPayload: AuthRefreshToken): Promise<AuthSuccessReturn> {
    //     console.log(TOKEN.RENEW,typeof(TOKEN.RENEW));
    //     return this.authService.refreshToken(inputPayload)
    // }

    // /**
    //  * Làm mới token, token cũ không còn sử dụng được.
    //  * 
    //  * @HttpCode `200`
    //  * 
    //  * @Post `token/renew`
    //  * 
    //  * @param {AuthRefreshToken} inputPayload  - Giá trị nhận từ client là 1 `JSON` chứa 1 phần tử :
    //  * - `access_token`: token đăng nhập.
    //  * 
    //  * @returns {Promise<AuthSuccessReturn>} Trả về `AuthSuccessReturn` hoặc throw `HttpException`
    //  * 
    //  * `AuthSuccessReturn` By default, the `JSON` response body contains four properties:
    //  * - `statusCode`: the Http Status Code.
    //  * - `message`: a short description of the request.
    //  * - `username`: username của người dùng.
    //  * - `access_token`: token sử dụng để đăng nhập thay tài khoản và mật khẩu.
    //  * 
    //  * `HttpException` By default, the `JSON` response body contains two properties:
    //  * - `statusCode`: the Http Status Code.
    //  * - `message`: a short description of the HTTP error by default; override this
    //  */
    // @HttpCode(HttpStatus.OK)
    // @Post("token/renew")
    // renewToken(@Body() inputPayload: AuthRenewToken): Promise<AuthSuccessReturn> {
    //     return this.authService.renewToken(inputPayload)
    // }
}
