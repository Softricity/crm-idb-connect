export class CourseFilterDto {
  search?: string;
  country?: string[];    // Array of country names
  level?: string[];      // Array of levels (Masters, Bachelors)
  university?: string[]; // Array of university names
  universityId?: string; // Filter by specific university ID
  intake?: string[];     // Array of months
}