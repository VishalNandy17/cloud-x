import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResourceController } from './resource.controller';
import { ResourceService } from './resource.service';
import { Resource, ResourceSchema } from './resource.schema';
import { BlockchainService } from '../blockchain/blockchain.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Resource.name, schema: ResourceSchema },
    ]),
  ],
  controllers: [ResourceController],
  providers: [ResourceService, BlockchainService],
  exports: [ResourceService],
})
export class ResourceModule {}