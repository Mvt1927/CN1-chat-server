import { Module } from '@nestjs/common';
import { JwtModule as baseJwtModule} from '@nestjs/jwt';

@Module({
  imports: [
    baseJwtModule.register({
      global: true,
    }),
  ],
})
export class JwtModule {}