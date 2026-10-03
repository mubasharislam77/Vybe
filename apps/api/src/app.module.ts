import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './products/products.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ProductsModule,
    NewsletterModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
