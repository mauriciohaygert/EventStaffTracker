import { pgTable, text, serial, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enum para o nível de acesso do usuário
export const userRoleEnum = pgEnum('user_role', ['user', 'employee', 'manager', 'admin']);

// Event table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Employee table
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  document: text("document").notNull(),
  role: text("role").notNull(),
  eventId: integer("event_id").notNull().references(() => events.id),
  defaultStartTime: text("default_start_time"),
  defaultEndTime: text("default_end_time"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// TimeRecord table - for tracking check-ins, check-outs, and breaks
export const timeRecords = pgTable("time_records", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  eventId: integer("event_id").notNull().references(() => events.id),
  recordType: text("record_type").notNull(), // "check_in", "check_out", "break_start", "break_end"
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  notes: text("notes"),
});

// Define relations for events
export const eventsRelations = relations(events, ({ many }) => ({
  employees: many(employees),
  timeRecords: many(timeRecords),
}));

// Define relations for employees
export const employeesRelations = relations(employees, ({ one, many }) => ({
  event: one(events, {
    fields: [employees.eventId],
    references: [events.id],
  }),
  timeRecords: many(timeRecords),
}));

// User table para autenticação
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  employeeId: integer("employee_id").references(() => employees.id),
  firstName: text("first_name"),
  lastName: text("last_name"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

// Define relations for timeRecords
export const timeRecordsRelations = relations(timeRecords, ({ one }) => ({
  employee: one(employees, {
    fields: [timeRecords.employeeId],
    references: [employees.id],
  }),
  event: one(events, {
    fields: [timeRecords.eventId],
    references: [events.id],
  }),
}));

// Define relations for users
export const usersRelations = relations(users, ({ one }) => ({
  employee: one(employees, {
    fields: [users.employeeId],
    references: [employees.id],
  }),
}));

// Schemas for inserts
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export const insertTimeRecordSchema = createInsertSchema(timeRecords).omit({
  id: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

export const registerUserSchema = insertUserSchema.pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
}).extend({
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Types
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type TimeRecord = typeof timeRecords.$inferSelect;
export type InsertTimeRecord = z.infer<typeof insertTimeRecordSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;

// Employee status enum
export enum EmployeeStatus {
  WORKING = "working",
  ON_BREAK = "on_break",
  CHECKED_OUT = "checked_out",
  ABSENT = "absent",
}

// Custom types used in the application
export type EmployeeWithStatus = Employee & {
  status: EmployeeStatus;
  checkInTime?: string;
  lastActivity?: TimeRecord;
};
