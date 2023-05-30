import { IsEmail, IsNotEmpty, IsString } from "class-validator"

export class AuthSignIn {

    @IsNotEmpty()
    @IsString()
    username: string;

    @IsNotEmpty()
    @IsString()
    password: string;

}
export class AuthSignUp extends AuthSignIn {
    @IsNotEmpty()
    @IsString()
    repassword: string

    @IsNotEmpty()
    @IsEmail()
    email: string

    @IsNotEmpty()
    @IsString()
    firstName: string
    
    @IsNotEmpty()
    @IsString()
    lastName: string
}

export class AuthSignOut {
    @IsNotEmpty()
    @IsString()
    access_token:string
}
export class AuthRefreshToken extends AuthSignOut{
}
export class AuthRenewToken extends AuthSignOut{
}

export class AuthSuccessReturn {
    statusCode: number
    message: string
    username: string | string[]
    access_token: string
}

export class AuthTokenPayload {
    id: number
    username: string
}
export class AuthCheckToken{
    userId: number
    username: string
    token:string
}