import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateUserDto } from './dto/index.js';
import { UserService } from './user.service.js';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'List users', description: 'Returns all users, newest first' })
  @ApiResponse({ status: 200, description: 'List of users' })
  list() {
    return this.userService.list();
  }

  @Post()
  @ApiOperation({ summary: 'Create a user' })
  @ApiResponse({ status: 201, description: 'The created user' })
  @ApiResponse({ status: 409, description: 'A user with this email already exists' })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
}
