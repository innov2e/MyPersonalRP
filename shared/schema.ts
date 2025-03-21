import { pgTable, text, serial, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Accounts Table
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
});

export const insertAccountSchema = createInsertSchema(accounts).pick({
  name: true,
  type: true,
});

export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

// Cost Centers Table
export const costCenters = pgTable("cost_centers", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  subcategory: text("subcategory").notNull(),
});

export const insertCostCenterSchema = createInsertSchema(costCenters).pick({
  category: true,
  subcategory: true,
});

export type InsertCostCenter = z.infer<typeof insertCostCenterSchema>;
export type CostCenter = typeof costCenters.$inferSelect;

// Payments Table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  amount: numeric("amount").notNull(),
  description: text("description").notNull(),
  accountId: integer("account_id").notNull(),
  costCenterId: integer("cost_center_id").notNull(),
  receiptPath: text("receipt_path"),
  requestPath: text("request_path"),
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  date: true,
  amount: true,
  description: true,
  accountId: true,
  costCenterId: true,
  receiptPath: true,
  requestPath: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Extended Payment type including related entities
export type PaymentWithRelations = Payment & {
  account: Account;
  costCenter: CostCenter;
};

// User schema (keeping this as it was in the original file)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
