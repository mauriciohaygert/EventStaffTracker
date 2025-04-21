import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Employee table
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  document: text("document").notNull(),
  role: text("role").notNull(),
  eventId: integer("event_id").notNull(),
  defaultStartTime: text("default_start_time"),
  defaultEndTime: text("default_end_time"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Event table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// TimeRecord table - for tracking check-ins, check-outs, and breaks
export const timeRecords = pgTable("time_records", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  eventId: integer("event_id").notNull(),
  recordType: text("record_type").notNull(), // "check_in", "check_out", "break_start", "break_end"
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  notes: text("notes"),
});

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

// Types
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type TimeRecord = typeof timeRecords.$inferSelect;
export type InsertTimeRecord = z.infer<typeof insertTimeRecordSchema>;

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
