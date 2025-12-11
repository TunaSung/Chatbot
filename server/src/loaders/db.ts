import { sqlize } from "../config/db.js";

type ConnectOpts = {
  sync?: boolean; // 是否要同步
  retries?: number; // 自訂重試次數
  delayMs?: number; // 自訂每次等待時間
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function connectDB(opts: ConnectOpts = {}) {
  const retries = opts.retries ?? 10;
  const delayMs = opts.delayMs ?? 2000;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // 連線測試，連到就往下
      await sqlize.authenticate();

      // dev 才 sync
      if (opts.sync) await sqlize.sync();

      console.log('DB connected')
      return sqlize; // 連上放行給 server listen
    } catch (err) {
      console.warn(`DB connect failed (${attempt}/${retries})`, err);

      /**
       * 用 docker compose 時有 server 啟動後要連 MySQL ，但 MySQL 還沒開好的狀況
       * 最後一次還失敗直接 throw 讓 server.ts catch 到並 process.exit(1)
       */
      if (attempt === retries) {
        console.error("DB still down after retries");
        throw err;
      }

      // MySQL 還在啟動時就等一下再試
      await sleep(delayMs);
    }
  }

  // 理論不會走到這，但 TS 需要 return
  return sqlize;
}

export async function closeDB() {
  await sqlize.close();
}
