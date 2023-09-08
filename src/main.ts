import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import './firebase';


const PORT = process.env.PORT || 5000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(PORT, () => console.log(`server was started on ${PORT} port`));
}
bootstrap();
