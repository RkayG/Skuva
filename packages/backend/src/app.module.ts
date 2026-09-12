import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CloudinaryModule } from './cloudinary/cloudinary.module.js';
import { EmailModule } from './email/email.module.js';

@Module({
  imports: [CloudinaryModule, EmailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
