import { 
  employees, 
  events, 
  timeRecords, 
  type Employee, 
  type InsertEmployee, 
  type Event, 
  type InsertEvent, 
  type TimeRecord, 
  type InsertTimeRecord,
  EmployeeStatus,
  type EmployeeWithStatus
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize default event if doesn't exist
    this.initializeDefaultEvent();
  }

  private async initializeDefaultEvent() {
    const existingEvents = await db.select().from(events);
    if (existingEvents.length === 0) {
      await db.insert(events).values({
        name: "Festival de Verão 2023",
        location: "Beach Park",
        startDate: new Date("2023-12-15T08:00:00"),
        endDate: new Date("2023-12-17T20:00:00")
      });
    }
  }
  
  // Employee methods
  async getEmployees(): Promise<Employee[]> {
    return db.select().from(employees);
  }
  
  async getEmployee(id: number): Promise<Employee | undefined> {
    const result = await db.select().from(employees).where(eq(employees.id, id));
    return result.length ? result[0] : undefined;
  }
  
  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    const result = await db.select().from(employees).where(eq(employees.email, email));
    return result.length ? result[0] : undefined;
  }
  
  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }
  
  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [updatedEmployee] = await db
      .update(employees)
      .set(employee)
      .where(eq(employees.id, id))
      .returning();
    
    return updatedEmployee;
  }
  
  async deleteEmployee(id: number): Promise<boolean> {
    const result = await db.delete(employees).where(eq(employees.id, id));
    return !!result;
  }
  
  // Event methods
  async getEvents(): Promise<Event[]> {
    return db.select().from(events);
  }
  
  async getEvent(id: number): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id));
    return result.length ? result[0] : undefined;
  }
  
  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }
  
  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updatedEvent] = await db
      .update(events)
      .set(event)
      .where(eq(events.id, id))
      .returning();
    
    return updatedEvent;
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return !!result;
  }
  
  // TimeRecord methods
  async getTimeRecords(employeeId?: number, eventId?: number): Promise<TimeRecord[]> {
    let query = db.select().from(timeRecords);
    
    if (employeeId && eventId) {
      return db.select()
        .from(timeRecords)
        .where(
          and(
            eq(timeRecords.employeeId, employeeId),
            eq(timeRecords.eventId, eventId)
          )
        )
        .orderBy(desc(timeRecords.timestamp));
    } else if (employeeId) {
      return db.select()
        .from(timeRecords)
        .where(eq(timeRecords.employeeId, employeeId))
        .orderBy(desc(timeRecords.timestamp));
    } else if (eventId) {
      return db.select()
        .from(timeRecords)
        .where(eq(timeRecords.eventId, eventId))
        .orderBy(desc(timeRecords.timestamp));
    }
    
    return query.orderBy(desc(timeRecords.timestamp));
  }
  
  async getTimeRecord(id: number): Promise<TimeRecord | undefined> {
    const result = await db.select().from(timeRecords).where(eq(timeRecords.id, id));
    return result.length ? result[0] : undefined;
  }
  
  async createTimeRecord(timeRecord: InsertTimeRecord): Promise<TimeRecord> {
    const [newTimeRecord] = await db.insert(timeRecords).values(timeRecord).returning();
    return newTimeRecord;
  }
  
  // Business logic methods
  async getEmployeeStatus(employeeId: number, eventId: number): Promise<EmployeeStatus> {
    const records = await this.getTimeRecords(employeeId, eventId);
    
    if (records.length === 0) {
      return EmployeeStatus.ABSENT;
    }
    
    // Get the most recent record (already sorted by the getTimeRecords method)
    const latestRecord = records[0];
    
    switch (latestRecord.recordType) {
      case "check_in":
      case "break_end":
        return EmployeeStatus.WORKING;
      case "break_start":
        return EmployeeStatus.ON_BREAK;
      case "check_out":
        return EmployeeStatus.CHECKED_OUT;
      default:
        return EmployeeStatus.ABSENT;
    }
  }
  
  async getEmployeesWithStatus(eventId?: number): Promise<EmployeeWithStatus[]> {
    const allEmployees = eventId 
      ? await db.select().from(employees).where(eq(employees.eventId, eventId))
      : await db.select().from(employees);
    
    const result: EmployeeWithStatus[] = [];
    
    for (const employee of allEmployees) {
      const status = await this.getEmployeeStatus(employee.id, employee.eventId);
      
      // Get check-in time
      const records = await this.getTimeRecords(employee.id, employee.eventId);
      const checkInRecord = records.find(r => r.recordType === "check_in");
      const checkInTime = checkInRecord 
        ? new Date(checkInRecord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : undefined;
      
      // Get latest activity (already sorted by getTimeRecords)
      const lastActivity = records.length > 0 ? records[0] : undefined;
      
      result.push({
        ...employee,
        status,
        checkInTime,
        lastActivity
      });
    }
    
    return result;
  }
}