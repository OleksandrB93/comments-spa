import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommentModule } from './comment/comment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI ||
        'mongodb://admin:password123@localhost:27017/comments_db?authSource=admin',
    ),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      introspection: true,
      validationRules: [],
      plugins: [],
      context: ({ req }) => ({ req }),
      formatError: (error) => {
        console.log('GraphQL Error:', JSON.stringify(error, null, 2));
        return {
          message:
            error.extensions?.['originalError']?.['message']?.join(', ') ??
            error.message,
          path: error.path,
          locations: error.locations,
          extensions: {
            code: error.extensions?.['code'],
          },
        };
      },
    }),
    CommentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Disable global ValidationPipe - use custom pipe in resolver
    // {
    //   provide: APP_PIPE,
    //   useValue: new ValidationPipe({
    //     transform: true,
    //     whitelist: true,
    //     forbidNonWhitelisted: true,
    //   }),
    // },
  ],
})
export class AppModule {}
