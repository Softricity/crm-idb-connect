import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OptionsService {
  constructor(private prisma: PrismaService) {}

  // Get a specific list (e.g., "lead_statuses")
  async getOptionList(key: string) {
    const record = await this.prisma.optionList.findUnique({
      where: { key },
    });
    // Return empty object if not found, to avoid null errors on frontend
    return record?.value || {}; 
  }

  // Update a specific key within the list (Add/Edit/Toggle)
  async updateOption(listKey: string, itemName: string, isActive: boolean) {
    // 1. Fetch current list
    const current = await this.getOptionList(listKey);
    
    // 2. Update the specific item in the JSON object
    // Casting to any to manipulate JSON object
    const updatedValue = { ...(current as object), [itemName]: isActive };

    // 3. Upsert to database
    return this.prisma.optionList.upsert({
      where: { key: listKey },
      update: { value: updatedValue },
      create: { key: listKey, value: updatedValue },
    });
  }

  // Delete an item (Hard delete from the JSON)
  async removeOption(listKey: string, itemName: string) {
    const current = await this.getOptionList(listKey);
    const updatedValue = { ...(current as object) };
    delete updatedValue[itemName];

    return this.prisma.optionList.update({
      where: { key: listKey },
      data: { value: updatedValue },
    });
  }
}