import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { WebsocketAdapter } from './gateway/gateway.adapter';
import { PeerServive } from './peer/peer.service';
import { PORT as ePORT } from './utils/constants';
import * as fs from 'fs'

async function bootstrap() {
  const config: ConfigService = new ConfigService();
  const httpsOptions = {
    key: fs.readFileSync(config.get("SSL_KEY")),
    cert: fs.readFileSync(config.get("SSL_CERT"))
  }
  console.log(httpsOptions)
  const PORT = config.get(ePORT.BASE)
  const app = await NestFactory.create(AppModule,{httpsOptions});
  const adapter = new WebsocketAdapter(app);
  const documentBuilder = new DocumentBuilder()
    .setTitle('chatapp api')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, documentBuilder);
  SwaggerModule.setup('api', app, document);


  app.useWebSocketAdapter(adapter)
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  const peerService = app.get(PeerServive)
  peerService.createServer()
  try {
    await app.listen(PORT, () => {
      console.log(`Running on Port ${PORT}`);
    });
  } catch (err) {
    console.log(err);
  }
}
bootstrap();
