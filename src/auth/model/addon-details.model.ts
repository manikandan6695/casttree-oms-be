export class AddonDetailsDTO {
  has_access: boolean;
  count_utilized?: number;
  remaining_count?: number;
  total_count?: number;
  refresh_after?: Date;
  refresh_frequency?: any;
}
