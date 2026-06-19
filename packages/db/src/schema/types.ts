import type {
  BuildQueryResult,
  DBQueryConfig,
  ExtractTablesWithRelations,
} from "drizzle-orm";

import type * as schema from "./index";

type Schema = typeof schema;
type SchemaWithRelations = ExtractTablesWithRelations<Schema>;

type QueryConfig<TableName extends keyof SchemaWithRelations> = DBQueryConfig<
  "one" | "many",
  boolean,
  SchemaWithRelations,
  SchemaWithRelations[TableName]
>;

/** Row type — table columns only, no relations. */
export type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Infers the result type for a relational query (`db.query.*.findFirst/Many`).
 * Pass the same `with` config you use in the query.
 *
 * @example
 * type LeagueWithAudit = InferQueryModel<
 *   "leagues",
 *   { with: { creator: true; updater: true; deleter: true } }
 * >;
 */
export type InferQueryModel<
  TableName extends keyof SchemaWithRelations,
  With extends QueryConfig<TableName> = Record<string, never>,
> = BuildQueryResult<SchemaWithRelations, SchemaWithRelations[TableName], With>;
