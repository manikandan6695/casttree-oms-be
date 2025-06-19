import { InternalServerErrorException } from "@nestjs/common";
import { AsyncLocalStorage } from "async_hooks";
import { v4 as uuid } from "uuid";

class Storage {
  constructor(
    readonly requestId = new uuid(),
    readonly transactionDepth = 0,
  ) {}
}

interface RequestStorage {
  reset: () => void;
}

class RequestStorageImplement implements RequestStorage {
  private readonly storage = new AsyncLocalStorage<Storage>();

  reset(): void {
    this.storage.enterWith(new Storage());
  }

  setRequestId(requestId: string): void {
    const storage = this.getStorage();
    this.storage.enterWith({ ...storage, requestId });
  }

  getStorage(): Storage {
    const storage = this.storage.getStore();
    if (!storage)
      throw new InternalServerErrorException("RequestStorage is not found");
    return storage;
  }
}

export const RequestStorage = new RequestStorageImplement();
