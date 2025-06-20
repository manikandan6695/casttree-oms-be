export class GetItemsQuery {
  constructor(
    public readonly query: any,
    public readonly skip: number,
    public readonly limit: number
  ) {}
}
