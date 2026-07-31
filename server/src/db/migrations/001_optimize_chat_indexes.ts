import type { QueryInterface, Sequelize } from "sequelize";

const INDEXES = [
  {
    table: "conversations",
    name: "conversations_user_updated_at",
    fields: ["userId", "updatedAt"],
  },
  {
    table: "memories",
    name: "memories_user_importance_last_used",
    fields: ["userId", "importance", "lastUsedAt"],
  },
] as const;

async function addIndexUnlessPresent(
  queryInterface: QueryInterface,
  table: string,
  name: string,
  fields: readonly string[],
  unique = false
) {
  const indexes = (await queryInterface.showIndex(table)) as Array<{
    name: string;
  }>;
  if (indexes.some((index) => index.name === name)) return;

  await queryInterface.addIndex(table, [...fields], { name, unique });
}

export async function optimizeChatIndexes(
  queryInterface: QueryInterface,
  sequelize: Sequelize
) {
  for (const index of INDEXES) {
    await addIndexUnlessPresent(
      queryInterface,
      index.table,
      index.name,
      index.fields
    );
  }

  // hasOne 必須由資料庫保證一個 conversation 只會有一筆 summary。
  // 舊資料若有重複，保留更新時間較新（同時間則 id 較大）的那筆。
  await sequelize.query(`
    DELETE older
    FROM conversation_summaries AS older
    INNER JOIN conversation_summaries AS newer
      ON older.conversationId = newer.conversationId
      AND (
        older.updatedAt < newer.updatedAt
        OR (older.updatedAt = newer.updatedAt AND older.id < newer.id)
      )
  `);

  await addIndexUnlessPresent(
    queryInterface,
    "conversation_summaries",
    "conversation_summaries_conversation_unique",
    ["conversationId"],
    true
  );
}
