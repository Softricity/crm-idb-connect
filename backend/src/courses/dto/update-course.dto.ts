export class UpdateCourseDto {
  // Basic Course Fields
  name?: string;
  description?: string;
  level?: string;
  category?: string;
  duration?: number;
  fee_type?: string;
  
  // Fee fields with currencies
  original_fee?: number;
  fee_currency?: string;
  fee?: number;
  course_currency?: string;
  application_fee?: number;
  application_currency?: string;
  
  // Intake and commission
  intake_month?: string;
  commission_type?: string;
  commission_value?: number;
  
  // Course details (array of points)
  details?: string[];
}
