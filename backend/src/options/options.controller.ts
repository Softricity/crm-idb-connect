import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { OptionsService } from './options.service';

@Controller('options')
export class OptionsController {
  constructor(private readonly optionsService: OptionsService) {}

  @Get(':key')
  get(@Param('key') key: string) {
    return this.optionsService.getOptionList(key);
  }

  @Patch(':key')
  update(
    @Param('key') key: string,
    @Body() body: { name: string; isActive: boolean },
  ) {
    return this.optionsService.updateOption(key, body.name, body.isActive);
  }

  @Delete(':key/:name')
  remove(@Param('key') key: string, @Param('name') name: string) {
    return this.optionsService.removeOption(key, name);
  }
}