import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { WebsocketAdapter } from './gateway/gateway.adapter';

async function bootstrap() {
  const config: ConfigService = new ConfigService();
  // const httpsOptions = {
  //   key: fs.readFileSync(config.get("SSL_KEY")),
  //   cert: fs.readFileSync(config.get("SSL_CERT"))
  // }
  // console.log(httpsOptions)
  const PORT = config.get('PORT')
  const app = await NestFactory.create(AppModule/* ,{httpsOptions} */);
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
  try {
    await app.listen(PORT, () => {
      console.log(`Running on Port ${PORT}`);
    });
  } catch (err) {
    console.log(err);
  }
}
bootstrap();
