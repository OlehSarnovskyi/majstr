import { IsArray, IsUUID, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class SetMasterCategoriesDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Vyberte aspoň 1 kategóriu' })
  @ArrayMaxSize(3, { message: 'Môžete vybrať najviac 3 kategórie' })
  @IsUUID('all', { each: true })
  categoryIds!: string[];
}
