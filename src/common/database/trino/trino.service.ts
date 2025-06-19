import { Injectable, Inject } from "@nestjs/common";
import { BasicAuth, QueryResult, Trino } from "trino-client";

@Injectable()
export class TrinoService {
  private readonly trino: Trino;

  constructor(
    @Inject("TRINO_CREDENTIALS") private readonly credentials: any
  ) {
    this.trino = Trino.create({
      server: this.credentials.server,
      catalog: this.credentials.catalog,
      auth: new BasicAuth(
        this.credentials.auth.user,
        this.credentials.auth.password
      ),
    });
  }

  async executeQuery(query: string): Promise<any[]> {
    try {
      const iter: AsyncIterable<QueryResult> = await this.trino.query(query);
      const results: any[] = [];
      for await (const { data, columns } of iter) {
        if (data && columns) {
          results.push(
            ...data.map((row: any[]) =>
              columns.reduce(
                (acc: any, col: { name: string }, index: number) => {
                  acc[col.name] = row[index];
                  return acc;
                },
                {}
              )
            )
          );
        }
      }
      return results;
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    }
  }

  async checkConnection(): Promise<void> {
    try {
      const result = await this.executeQuery(
        `SELECT * FROM lz_nk.device_user_details LIMIT 2`
      );
      console.log("Connection successful:", result);
    } catch (error) {
      console.error("Connection failed:", error);
    }
  }
}
