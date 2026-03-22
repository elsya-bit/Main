import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ──────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["Sales", "MD"]);
export const leadStatusEnum = pgEnum("lead_status", [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Won",
  "Lost",
]);
export const activityTypeEnum = pgEnum("activity_type", ["Call", "Email"]);

// ── Users ──────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authId: uuid("auth_id").unique().notNull(),
    name: text("name").notNull(),
    email: text("email").unique().notNull(),
    role: userRoleEnum("role").notNull().default("Sales"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_users_auth_id").on(table.authId),
    index("idx_users_role").on(table.role),
  ],
);

// ── Leads ──────────────────────────────────────────────────

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyName: text("company_name").notNull(),
    contactPerson: text("contact_person").notNull(),
    status: leadStatusEnum("status").notNull().default("New"),
    assignedToUserId: uuid("assigned_to_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_leads_assigned").on(table.assignedToUserId),
    index("idx_leads_status").on(table.status),
  ],
);

// ── Activities ─────────────────────────────────────────────

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    type: activityTypeEnum("type").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_activities_lead").on(table.leadId)],
);

// ── Relations ──────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  leads: many(leads),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  assignedTo: one(users, {
    fields: [leads.assignedToUserId],
    references: [users.id],
  }),
  activities: many(activities),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  lead: one(leads, {
    fields: [activities.leadId],
    references: [leads.id],
  }),
}));
