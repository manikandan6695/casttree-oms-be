export class GetPageConfigQuery {
  constructor(
    public readonly pageKey: string,
    public readonly userId: string
  ) {}
}
