import { sqlize } from "../config/db.js";

export async function connectDB(opts?: { sync?: boolean }) {
  await sqlize.authenticate();
  if (opts?.sync) await sqlize.sync();
  return sqlize;
}

export async function closeDB() {
  await sqlize.close();
}
