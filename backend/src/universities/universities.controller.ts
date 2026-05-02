import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UniversitiesService } from './universities.service';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { GetUser } from 'src/auth/get-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('universities')
export class UniversitiesController {
  constructor(private readonly universitiesService: UniversitiesService) {}

  @Post()
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor('logo'))
  create(
    @Body() createUniversityDto: CreateUniversityDto,
    @UploadedFile() logo?: Express.Multer.File,
    @Req() req?: any,
  ) {
    return this.universitiesService.create(createUniversityDto, logo, req);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@GetUser() user: any, @Query('country_id') countryId?: string) {
    return this.universitiesService.findAll(user, countryId);
  }

  @Get('all-with-access')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.Agent)
  findAllWithAccess(@GetUser() user: any) {
    return this.universitiesService.findAllWithAccess(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.universitiesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor('logo'))
  update(
    @Param('id') id: string,
    @Body() updateUniversityDto: UpdateUniversityDto,
    @UploadedFile() logo?: Express.Multer.File,
    @Req() req?: any,
  ) {
    return this.universitiesService.update(id, updateUniversityDto, logo, req);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id') id: string) {
    return this.universitiesService.remove(id);
  }
}
