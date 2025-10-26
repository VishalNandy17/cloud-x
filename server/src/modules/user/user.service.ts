import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { CreateUserDto, UpdateUserDto, UserProfileDto } from './dto/user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      $or: [
        { walletAddress: createUserDto.walletAddress },
        { email: createUserDto.email },
        { username: createUserDto.username }
      ]
    });

    if (existingUser) {
      throw new ConflictException('User already exists with this wallet address, email, or username');
    }

    const user = new this.userModel({
      ...createUserDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return user.save();
  }

  async findAll(filters: any = {}): Promise<User[]> {
    return this.userModel.find(filters).exec();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByWalletAddress(walletAddress: string): Promise<User> {
    const user = await this.userModel.findOne({ walletAddress }).exec();
    if (!user) {
      throw new NotFoundException(`User with wallet address ${walletAddress} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { ...updateUserDto, updatedAt: new Date() }, { new: true })
      .exec();
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async updateProfile(id: string, profileDto: UserProfileDto): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        { 
          profile: profileDto,
          updatedAt: new Date()
        },
        { new: true }
      )
      .exec();
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async updateReputation(walletAddress: string, change: number): Promise<User> {
    const user = await this.userModel.findOne({ walletAddress }).exec();
    if (!user) {
      throw new NotFoundException(`User with wallet address ${walletAddress} not found`);
    }

    const newReputation = Math.max(0, Math.min(1000, user.reputation + change));
    user.reputation = newReputation;
    user.updatedAt = new Date();

    return user.save();
  }

  async recordTransaction(walletAddress: string, success: boolean): Promise<User> {
    const user = await this.userModel.findOne({ walletAddress }).exec();
    if (!user) {
      throw new NotFoundException(`User with wallet address ${walletAddress} not found`);
    }

    user.totalTransactions += 1;
    if (success) {
      user.successfulTransactions += 1;
    } else {
      user.failedTransactions += 1;
    }
    user.updatedAt = new Date();

    return user.save();
  }

  async updateLastLogin(walletAddress: string): Promise<User> {
    const user = await this.userModel.findOne({ walletAddress }).exec();
    if (!user) {
      throw new NotFoundException(`User with wallet address ${walletAddress} not found`);
    }

    user.lastLoginAt = new Date();
    user.updatedAt = new Date();

    return user.save();
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { isActive: false, updatedAt: new Date() }, { new: true })
      .exec();
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async activate(id: string): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { isActive: true, updatedAt: new Date() }, { new: true })
      .exec();
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async delete(id: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async getTopUsers(limit: number = 10): Promise<User[]> {
    return this.userModel
      .find({ isActive: true })
      .sort({ reputation: -1, successfulTransactions: -1 })
      .limit(limit)
      .exec();
  }

  async getUserStats(walletAddress: string): Promise<any> {
    const user = await this.userModel.findOne({ walletAddress }).exec();
    if (!user) {
      throw new NotFoundException(`User with wallet address ${walletAddress} not found`);
    }

    const successRate = user.totalTransactions > 0 
      ? (user.successfulTransactions / user.totalTransactions) * 100 
      : 0;

    return {
      walletAddress: user.walletAddress,
      username: user.username,
      reputation: user.reputation,
      totalTransactions: user.totalTransactions,
      successfulTransactions: user.successfulTransactions,
      failedTransactions: user.failedTransactions,
      successRate: Math.round(successRate * 100) / 100,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  }

  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    return this.userModel
      .find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
        ],
        isActive: true,
      })
      .limit(limit)
      .exec();
  }

  async getUsersByReputationRange(minRep: number, maxRep: number): Promise<User[]> {
    return this.userModel
      .find({
        reputation: { $gte: minRep, $lte: maxRep },
        isActive: true,
      })
      .sort({ reputation: -1 })
      .exec();
  }
}
