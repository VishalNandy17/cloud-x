import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  UserProfileDto, 
  UserSearchDto,
  ReputationUpdateDto 
} from './dto/user.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(@Query() filters: any) {
    return this.userService.findAll(filters);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async searchUsers(@Query() searchDto: UserSearchDto) {
    return this.userService.searchUsers(searchDto.query, searchDto.limit);
  }

  @Get('top')
  @ApiOperation({ summary: 'Get top users by reputation' })
  @ApiResponse({ status: 200, description: 'Top users retrieved successfully' })
  async getTopUsers(@Query('limit') limit: number = 10) {
    return this.userService.getTopUsers(limit);
  }

  @Get('reputation-range')
  @ApiOperation({ summary: 'Get users by reputation range' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getUsersByReputationRange(
    @Query('minRep') minRep: number,
    @Query('maxRep') maxRep: number
  ) {
    return this.userService.getUsersByReputationRange(minRep, maxRep);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Get('wallet/:walletAddress')
  @ApiOperation({ summary: 'Get user by wallet address' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findByWalletAddress(@Param('walletAddress') walletAddress: string) {
    return this.userService.findByWalletAddress(walletAddress);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Get user by email' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findByEmail(@Param('email') email: string) {
    return this.userService.findByEmail(email);
  }

  @Get('username/:username')
  @ApiOperation({ summary: 'Get user by username' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findByUsername(@Param('username') username: string) {
    return this.userService.findByUsername(username);
  }

  @Get('stats/:walletAddress')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User stats retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserStats(@Param('walletAddress') walletAddress: string) {
    return this.userService.getUserStats(walletAddress);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Put(':id/profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateProfile(@Param('id') id: string, @Body() profileDto: UserProfileDto) {
    return this.userService.updateProfile(id, profileDto);
  }

  @Put('reputation')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user reputation' })
  @ApiResponse({ status: 200, description: 'Reputation updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateReputation(@Body() reputationDto: ReputationUpdateDto) {
    return this.userService.updateReputation(reputationDto.walletAddress, reputationDto.change);
  }

  @Put('transaction')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record user transaction' })
  @ApiResponse({ status: 200, description: 'Transaction recorded successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async recordTransaction(
    @Body('walletAddress') walletAddress: string,
    @Body('success') success: boolean
  ) {
    return this.userService.recordTransaction(walletAddress, success);
  }

  @Put('last-login/:walletAddress')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update last login time' })
  @ApiResponse({ status: 200, description: 'Last login updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateLastLogin(@Param('walletAddress') walletAddress: string) {
    return this.userService.updateLastLogin(walletAddress);
  }

  @Put(':id/deactivate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate user' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deactivate(@Param('id') id: string) {
    return this.userService.deactivate(id);
  }

  @Put(':id/activate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate user' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async activate(@Param('id') id: string) {
    return this.userService.activate(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(@Param('id') id: string) {
    await this.userService.delete(id);
  }
}
