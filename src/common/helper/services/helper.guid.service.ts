import { v4 } from "uuid";
export class Guid extends String {
  constructor() {
    super(v4());
  }
}
