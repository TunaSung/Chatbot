import { DataTypes, QueryTypes, type Sequelize } from "sequelize";
import { optimizeChatIndexes } from "./001_optimize_chat_indexes.js";

type Migration = {
  name: string;
  up: (
    queryInterface: ReturnType<Sequelize["getQueryInterface"]>,
    sequelize: Sequelize
  ) => Promise<void>;
};

const migrations: Migration[] = [
  {
    name: "001_optimize_chat_indexes",
    up: optimizeChatIndexes,
  },
];

export async function runMigrations(sequelize: Sequelize) {
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.createTable("app_migrations", {
    name: {
      type: DataTypes.STRING(191),
      allowNull: false,
      primaryKey: true,
    },
    executedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  const rows = await sequelize.query<{ name: string }>(
    "SELECT name FROM app_migrations",
    { type: QueryTypes.SELECT }
  );
  const completed = new Set(rows.map((row) => row.name));

  for (const migration of migrations) {
    if (completed.has(migration.name)) continue;

    await migration.up(queryInterface, sequelize);
    await sequelize.query(
      "INSERT INTO app_migrations (name, executedAt) VALUES (?, ?)",
      {
        replacements: [migration.name, new Date()],
      }
    );
    console.log(`Migration applied: ${migration.name}`);
  }
}
