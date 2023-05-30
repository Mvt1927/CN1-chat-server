export enum Routes {
    AUTH = 'auth',
    SIGN_IN = 'signin',
    SIGN_UP = 'signup',
    SIGN_OUT = 'signout',
    TOKEN = 'token',
}
export enum TOKEN{
    REFRESH = Routes.TOKEN+"/refresh",
    RENEW = Routes.TOKEN+"/renew",
}

export enum Chat {
    SEND_MESSAGE = "sendMessage",
    RECEIVE_MESSAGE = "receiveMessage"
}
export enum Services {
    GATEWAY_SESSION_MANAGER = 'GATEWAY_SESSION_MANAGER',
  }




  export enum User {
    ID = 'id',
    USERNAME = 'username',
    HASH = 'hash',
    EMAIL = 'email',
    FIRSTNAME = 'firstName',
    LASTNAME = 'lastName',
    CREATEAT = 'createAt',
    UPDATEAT = 'updateAt',
}
export enum Secret {
    JWT_SECRET = 'JWT_SECRET'
}