import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertEmployeeSchema, 
  insertEventSchema, 
  insertTimeRecordSchema 
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import z from "zod";
import { setupAuth, isAuthenticated, isAdmin, isManagerOrAdmin, createInitialAdminUser } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar autenticação
  setupAuth(app);
  
  // Criar usuário admin inicial
  await createInitialAdminUser();
  // API routes
  
  // ------ Employee Routes ------
  
  // Get all employees with status
  app.get("/api/employees", async (req, res) => {
    try {
      const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
      const employees = await storage.getEmployeesWithStatus(eventId);
      res.json(employees);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });
  
  // Get employee by ID
  app.get("/api/employees/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const employee = await storage.getEmployee(id);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Get the status for this employee
      const status = await storage.getEmployeeStatus(id, employee.eventId);
      const timeRecords = await storage.getTimeRecords(id, employee.eventId);
      
      const checkInRecord = timeRecords.find(r => r.recordType === "check_in");
      const checkInTime = checkInRecord ? checkInRecord.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined;
      
      // Get the most recent activity
      const lastActivity = timeRecords.length > 0 ? timeRecords[0] : undefined;
      
      res.json({
        ...employee,
        status,
        checkInTime,
        lastActivity,
        timeRecords
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });
  
  // Create employee
  app.post("/api/employees", isManagerOrAdmin, async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const validationError = fromZodError(err);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create employee" });
    }
  });
  
  // Update employee
  app.patch("/api/employees/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const validatedData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(id, validatedData);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      res.json(employee);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const validationError = fromZodError(err);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update employee" });
    }
  });
  
  // Delete employee
  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteEmployee(id);
      
      if (!success) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });
  
  // ------ Event Routes ------
  
  // Get all events
  app.get("/api/events", async (_req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });
  
  // Get event by ID
  app.get("/api/events/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const event = await storage.getEvent(id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });
  
  // Create event
  app.post("/api/events", async (req, res) => {
    try {
      const validatedData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const validationError = fromZodError(err);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create event" });
    }
  });
  
  // Update event
  app.patch("/api/events/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const validatedData = insertEventSchema.partial().parse(req.body);
      const event = await storage.updateEvent(id, validatedData);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const validationError = fromZodError(err);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update event" });
    }
  });
  
  // Delete event
  app.delete("/api/events/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteEvent(id);
      
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });
  
  // ------ TimeRecord Routes ------
  
  // Get time records for an employee and/or event
  app.get("/api/time-records", async (req, res) => {
    try {
      const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;
      const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
      
      const records = await storage.getTimeRecords(employeeId, eventId);
      res.json(records);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch time records" });
    }
  });
  
  // Create time record (check-in, check-out, break-start, break-end)
  app.post("/api/time-records", async (req, res) => {
    try {
      const validatedData = insertTimeRecordSchema.parse(req.body);
      const record = await storage.createTimeRecord(validatedData);
      res.status(201).json(record);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const validationError = fromZodError(err);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create time record" });
    }
  });
  
  // ------ Dashboard Stats Routes ------
  
  // Get dashboard stats for an event
  app.get("/api/stats", async (req, res) => {
    try {
      const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
      
      // Get employees with their statuses
      const employees = await storage.getEmployeesWithStatus(eventId);
      
      // Count employees by status
      const activeCount = employees.filter(e => e.status === 'working').length;
      const onBreakCount = employees.filter(e => e.status === 'on_break').length;
      const checkedOutCount = employees.filter(e => e.status === 'checked_out').length;
      const absentCount = employees.filter(e => e.status === 'absent').length;
      
      const presentCount = activeCount + onBreakCount;
      const totalCount = employees.length;
      
      // Calculate percentages
      const attendanceRate = totalCount ? Math.round((presentCount / totalCount) * 100) : 0;
      const breakRate = presentCount ? Math.round((onBreakCount / presentCount) * 100) : 0;
      const absentRate = totalCount ? Math.round((absentCount / totalCount) * 100) : 0;
      
      res.json({
        totalEmployees: totalCount,
        activeEmployees: activeCount,
        onBreakEmployees: onBreakCount,
        checkedOutEmployees: checkedOutCount,
        absentEmployees: absentCount,
        attendanceRate,
        breakRate,
        absentRate
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });
  
  // ------ Recent Activity Route ------
  
  // Get recent activity for the dashboard
  app.get("/api/recent-activity", async (req, res) => {
    try {
      const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      
      // Get all time records for the event, or all if no eventId specified
      let timeRecords = await storage.getTimeRecords(undefined, eventId);
      
      // Limit the number of records
      timeRecords = timeRecords.slice(0, limit);
      
      // Fetch employee details for each record
      const activities = await Promise.all(
        timeRecords.map(async (record) => {
          const employee = await storage.getEmployee(record.employeeId);
          
          if (!employee) {
            return null;
          }
          
          const status = await storage.getEmployeeStatus(employee.id, record.eventId);
          
          return {
            id: record.id,
            employee: {
              id: employee.id,
              name: employee.name,
              role: employee.role,
              status
            },
            recordType: record.recordType,
            timestamp: record.timestamp,
            notes: record.notes
          };
        })
      );
      
      // Filter out nulls (in case some employees were deleted)
      res.json(activities.filter(Boolean));
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });
  
  // ------ User Management Routes ------
  
  // Get all users (admin only)
  app.get("/api/users", isAdmin, async (_req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: "Falha ao buscar usuários" });
    }
  });
  
  // Get user by ID (admin or self)
  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      // Verificar permissão: apenas admin ou o próprio usuário
      if (req.user.role !== 'admin' && req.user.id !== id) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: "Falha ao buscar usuário" });
    }
  });
  
  // Update user (admin or self)
  app.patch("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      // Verificar permissão: apenas admin ou o próprio usuário
      if (req.user.role !== 'admin' && req.user.id !== id) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      // Apenas admin pode alterar o papel (role) de um usuário
      if (req.body.role && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Você não tem permissão para alterar o papel do usuário" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Atualizar dados
      const updateData = { ...req.body };
      const updatedUser = await storage.updateUser(id, updateData);
      
      res.json(updatedUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const validationError = fromZodError(err);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Falha ao atualizar usuário" });
    }
  });
  
  // Delete user (admin only)
  app.delete("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteUser(id);
      
      if (!success) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Falha ao excluir usuário" });
    }
  });
  
  // ------ QR Code Scanning Route ------
  
  // Process a code scan
  app.post("/api/scan", async (req, res) => {
    try {
      // Expect a employeeId, eventId, and recordType in the request body
      const schema = z.object({
        employeeId: z.number(),
        eventId: z.number(),
        recordType: z.enum(["check_in", "check_out", "break_start", "break_end"]),
        notes: z.string().optional()
      });
      
      const { employeeId, eventId, recordType, notes } = schema.parse(req.body);
      
      // Verify employee exists
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Verify event exists
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Create time record
      const record = await storage.createTimeRecord({
        employeeId,
        eventId,
        recordType,
        timestamp: new Date(),
        notes: notes || null
      });
      
      // Get updated employee status
      const status = await storage.getEmployeeStatus(employeeId, eventId);
      
      res.status(201).json({
        record,
        employee: {
          ...employee,
          status
        }
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const validationError = fromZodError(err);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to process code scan" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
