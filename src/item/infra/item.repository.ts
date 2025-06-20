import { IItemRepository } from "./interface/iitem.repository";

export class ItemRepository implements IItemRepository {
  async findById(id: string): Promise<any> {
    // Implement find by id logic
    return null;
  }
  async findAll(query: any, skip: number, limit: number): Promise<any[]> {
    // Implement find all logic
    return [];
  }
}
