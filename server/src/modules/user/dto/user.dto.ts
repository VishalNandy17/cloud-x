import { IsString, IsEmail, IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Wallet address of the user' })
  @IsString()
  walletAddress: string;

  @ApiProperty({ description: 'Username of the user' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'Email address of the user' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'First name of the user' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name of the user' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Avatar URL of the user' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: 'Role of the user', default: 'user' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'Whether the user is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Whether the user is verified', default: false })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Username of the user' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: 'Email address of the user' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'First name of the user' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name of the user' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Avatar URL of the user' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: 'Role of the user' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'Whether the user is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Whether the user is verified' })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}

export class UserProfileDto {
  @ApiPropertyOptional({ description: 'Bio of the user' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Website URL of the user' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: 'Location of the user' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Timezone of the user' })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class UserPreferencesDto {
  @ApiPropertyOptional({ description: 'Whether to receive notifications', default: true })
  @IsOptional()
  @IsBoolean()
  notifications?: boolean;

  @ApiPropertyOptional({ description: 'Whether to receive email updates', default: true })
  @IsOptional()
  @IsBoolean()
  emailUpdates?: boolean;

  @ApiPropertyOptional({ description: 'Whether to use dark mode', default: false })
  @IsOptional()
  @IsBoolean()
  darkMode?: boolean;

  @ApiPropertyOptional({ description: 'Preferred language', default: 'en' })
  @IsOptional()
  @IsString()
  language?: string;
}

export class SocialLinkDto {
  @ApiProperty({ description: 'Social media platform' })
  @IsString()
  platform: string;

  @ApiProperty({ description: 'URL to the social media profile' })
  @IsString()
  url: string;
}

export class UserSearchDto {
  @ApiProperty({ description: 'Search query' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Maximum number of results', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class ReputationUpdateDto {
  @ApiProperty({ description: 'Wallet address of the user' })
  @IsString()
  walletAddress: string;

  @ApiProperty({ description: 'Reputation change amount' })
  @IsNumber()
  change: number;
}
