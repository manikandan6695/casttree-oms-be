export interface IItemRepository {
  findById(id: string): Promise<any>;
  findAll(query: any, skip: number, limit: number): Promise<any[]>;
  // Add more methods as needed
}
