import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:tracker.db");
  }
  return db;
}

export async function query<T>(sql: string, bindValues?: unknown[]): Promise<T[]> {
  const database = await getDatabase();
  return database.select<T[]>(sql, bindValues);
}

export async function execute(sql: string, bindValues?: unknown[]) {
  const database = await getDatabase();
  return database.execute(sql, bindValues);
}
