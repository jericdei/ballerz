import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  type AnyPgTable,
  integer,
} from "drizzle-orm/pg-core";

import { softDeleteTimestamp, timestamps } from "./columns";
import { users } from "./users";

type AuditUserRefColumns = {
  createdBy: AnyPgColumn;
  updatedBy: AnyPgColumn;
  deletedBy: AnyPgColumn;
};

export const auditUserRefs = {
  createdBy: integer("created_by").references(() => users.id),
  updatedBy: integer("updated_by").references(() => users.id),
  deletedBy: integer("deleted_by").references(() => users.id),
};

/** Spread onto any table that tracks who created/updated/deleted a row. */
export const auditColumns = {
  ...timestamps,
  ...auditUserRefs,
  ...softDeleteTimestamp,
};

/**
 * Adds creator, updater, and deleter relations for an audited table.
 * Pass an optional `extra` callback to add table-specific relations.
 *
 * @example
 * export const postsRelations = createAuditRelations(posts, "posts");
 *
 * @example
 * export const teamsRelations = createAuditRelations(teams, "teams", ({ one }) => ({
 *   league: one(leagues, {
 *     fields: [teams.leagueId],
 *     references: [leagues.id],
 *   }),
 * }));
 */
export function createAuditRelations<
  TTable extends AnyPgTable & AuditUserRefColumns,
>(table: TTable, tableKey: string): ReturnType<typeof relations>;
export function createAuditRelations<
  TTable extends AnyPgTable & AuditUserRefColumns,
  TExtra extends Record<string, unknown>,
>(
  table: TTable,
  tableKey: string,
  extra: (helpers: {
    one: Parameters<Parameters<typeof relations>[1]>[0]["one"];
    many: Parameters<Parameters<typeof relations>[1]>[0]["many"];
  }) => TExtra,
): ReturnType<typeof relations>;
export function createAuditRelations<
  TTable extends AnyPgTable & AuditUserRefColumns,
  TExtra extends Record<string, unknown>,
>(
  table: TTable,
  tableKey: string,
  extra?: (helpers: {
    one: Parameters<Parameters<typeof relations>[1]>[0]["one"];
    many: Parameters<Parameters<typeof relations>[1]>[0]["many"];
  }) => TExtra,
) {
  return relations(table, ({ one, many }) => ({
    creator: one(users, {
      fields: [table.createdBy],
      references: [users.id],
      relationName: `${tableKey}_creator`,
    }),
    updater: one(users, {
      fields: [table.updatedBy],
      references: [users.id],
      relationName: `${tableKey}_updater`,
    }),
    deleter: one(users, {
      fields: [table.deletedBy],
      references: [users.id],
      relationName: `${tableKey}_deleter`,
    }),
    ...(extra?.({ one, many }) ?? {}),
  }));
}

export type AuditedTable = AuditUserRefColumns;
