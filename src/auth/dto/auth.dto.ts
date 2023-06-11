import { Images } from "@prisma/client";
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
    name: string

}

export class AuthSignOut {
    @IsNotEmpty()
    @IsString()
    access_token: string
}
export class AuthRefreshToken extends AuthSignOut {
}
export class AuthRenewToken extends AuthSignOut {
}

export class AuthSuccessReturn {
    statusCode: number
    message: string | string[]
    user: {
        id: number
        username: string
        name: string
        avatar: Images | null
    }
    access_token: string
}

export class UserPayload {
    id: number
    username: string
    name: string
    avatar: Images | null
}

export class AuthTokenPayload {
    id: number
    username: string
    name: string
}
export class AuthCheckToken {
    id: number
    username: string
    token: string
    name: string
}