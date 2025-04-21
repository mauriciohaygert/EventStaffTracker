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

export interface IStorage {
  // Employee operations
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByEmail(email: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;
  
  // Event operations
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  
  // TimeRecord operations
  getTimeRecords(employeeId?: number, eventId?: number): Promise<TimeRecord[]>;
  getTimeRecord(id: number): Promise<TimeRecord | undefined>;
  createTimeRecord(timeRecord: InsertTimeRecord): Promise<TimeRecord>;
  
  // Business logic operations
  getEmployeeStatus(employeeId: number, eventId: number): Promise<EmployeeStatus>;
  getEmployeesWithStatus(eventId?: number): Promise<EmployeeWithStatus[]>;
}

export class MemStorage implements IStorage {
  private employeesStore: Map<number, Employee>;
  private eventsStore: Map<number, Event>;
  private timeRecordsStore: Map<number, TimeRecord>;
  
  private employeeIdCounter: number;
  private eventIdCounter: number;
  private timeRecordIdCounter: number;
  
  constructor() {
    this.employeesStore = new Map();
    this.eventsStore = new Map();
    this.timeRecordsStore = new Map();
    
    this.employeeIdCounter = 1;
    this.eventIdCounter = 1;
    this.timeRecordIdCounter = 1;
    
    // Create a default event
    this.createEvent({
      name: "Festival de Verão 2023",
      location: "Beach Park",
      startDate: new Date("2023-12-15T08:00:00"),
      endDate: new Date("2023-12-17T20:00:00")
    });
  }
  
  // Employee methods
  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employeesStore.values());
  }
  
  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employeesStore.get(id);
  }
  
  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    return Array.from(this.employeesStore.values()).find(emp => emp.email === email);
  }
  
  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const id = this.employeeIdCounter++;
    const now = new Date();
    const newEmployee: Employee = { ...employee, id, createdAt: now };
    this.employeesStore.set(id, newEmployee);
    return newEmployee;
  }
  
  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const existingEmployee = this.employeesStore.get(id);
    if (!existingEmployee) return undefined;
    
    const updatedEmployee = { ...existingEmployee, ...employee };
    this.employeesStore.set(id, updatedEmployee);
    return updatedEmployee;
  }
  
  async deleteEmployee(id: number): Promise<boolean> {
    return this.employeesStore.delete(id);
  }
  
  // Event methods
  async getEvents(): Promise<Event[]> {
    return Array.from(this.eventsStore.values());
  }
  
  async getEvent(id: number): Promise<Event | undefined> {
    return this.eventsStore.get(id);
  }
  
  async createEvent(event: InsertEvent): Promise<Event> {
    const id = this.eventIdCounter++;
    const now = new Date();
    const newEvent: Event = { ...event, id, createdAt: now };
    this.eventsStore.set(id, newEvent);
    return newEvent;
  }
  
  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const existingEvent = this.eventsStore.get(id);
    if (!existingEvent) return undefined;
    
    const updatedEvent = { ...existingEvent, ...event };
    this.eventsStore.set(id, updatedEvent);
    return updatedEvent;
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    return this.eventsStore.delete(id);
  }
  
  // TimeRecord methods
  async getTimeRecords(employeeId?: number, eventId?: number): Promise<TimeRecord[]> {
    let records = Array.from(this.timeRecordsStore.values());
    
    if (employeeId) {
      records = records.filter(record => record.employeeId === employeeId);
    }
    
    if (eventId) {
      records = records.filter(record => record.eventId === eventId);
    }
    
    // Sort by timestamp in descending order (newest first)
    return records.sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }
  
  async getTimeRecord(id: number): Promise<TimeRecord | undefined> {
    return this.timeRecordsStore.get(id);
  }
  
  async createTimeRecord(timeRecord: InsertTimeRecord): Promise<TimeRecord> {
    const id = this.timeRecordIdCounter++;
    const newTimeRecord: TimeRecord = { ...timeRecord, id };
    this.timeRecordsStore.set(id, newTimeRecord);
    return newTimeRecord;
  }
  
  // Business logic methods
  async getEmployeeStatus(employeeId: number, eventId: number): Promise<EmployeeStatus> {
    const records = await this.getTimeRecords(employeeId, eventId);
    
    if (records.length === 0) {
      return EmployeeStatus.ABSENT;
    }
    
    // Get the most recent record
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
    const employees = await this.getEmployees();
    const result: EmployeeWithStatus[] = [];
    
    for (const employee of employees) {
      // Skip employees not in this event if eventId is provided
      if (eventId && employee.eventId !== eventId) continue;
      
      const status = await this.getEmployeeStatus(employee.id, employee.eventId);
      const records = await this.getTimeRecords(employee.id, employee.eventId);
      
      // Find the check-in time
      const checkInRecord = records.find(r => r.recordType === "check_in");
      const checkInTime = checkInRecord ? checkInRecord.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined;
      
      // Get the most recent activity
      const lastActivity = records.length > 0 ? records[0] : undefined;
      
      result.push({
        ...employee,
        status,
        checkInTime,
        lastActivity,
      });
    }
    
    return result;
  }
}

// Use DatabaseStorage instead of MemStorage
import { DatabaseStorage } from "./db-storage";
export const storage = new DatabaseStorage();
