import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import { users, InsertUser, User } from "@shared/schema";
import { eq } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Adiciona tipo de usuário ao Express
declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);
const PostgresStore = connectPg(session);

/**
 * Gera um hash seguro para a senha
 */
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Compara a senha fornecida com a senha armazenada
 */
export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

/**
 * Configura autenticação com Passport.js
 */
export function setupAuth(app: Express) {
  // Configuração da sessão
  const sessionConfig: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "temporary-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 semana
    },
    store: new PostgresStore({
      pool,
      createTableIfMissing: true,
    }),
  };

  app.use(session(sessionConfig));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configurar a estratégia de autenticação local
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Usuário ou senha incorretos" });
        }

        // Atualiza último login
        await db
          .update(users)
          .set({ lastLogin: new Date() })
          .where(eq(users.id, user.id));

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  // Serialização do usuário para a sessão
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Desserialização do usuário da sessão
  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      
      done(null, user || false);
    } catch (err) {
      done(err);
    }
  });

  // Rotas de autenticação
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Verifica se já existe usuário com mesmo nome ou email
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, req.body.username))
        .limit(1);

      if (existingUser) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }

      const [existingEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, req.body.email))
        .limit(1);

      if (existingEmail) {
        return res.status(400).json({ message: "Email já está em uso" });
      }

      // Criptografa a senha
      const hashedPassword = await hashPassword(req.body.password);

      // Cria o usuário no banco de dados
      const userData: Omit<InsertUser, "confirmPassword"> = {
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
        firstName: req.body.firstName || null,
        lastName: req.body.lastName || null,
        role: req.body.role || "user",
        employeeId: req.body.employeeId || null,
        active: true,
      };

      const [newUser] = await db.insert(users).values(userData).returning();

      // Login automático após o registro
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Erro ao fazer login após registro" });
        }
        return res.status(201).json({
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        });
      });
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      res.status(500).json({ message: "Erro ao registrar usuário" });
    }
  });

  // Login
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: Error, user: User, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message || "Falha na autenticação" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        });
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.status(200).json({ message: "Logout realizado com sucesso" });
    });
  });

  // Obter usuário atual
  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    const user = req.user;
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      employeeId: user.employeeId,
    });
  });
}

/**
 * Middleware para verificar se o usuário está autenticado
 */
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Não autorizado" });
}

/**
 * Middleware para verificar se o usuário tem determinados papéis
 */
export function hasRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    
    if (roles.includes(req.user.role)) {
      return next();
    }
    
    res.status(403).json({ message: "Acesso negado" });
  };
}

/**
 * Middleware para verificar se o usuário é administrador
 */
export const isAdmin = hasRole(["admin"]);

/**
 * Middleware para verificar se o usuário é gerente ou administrador
 */
export const isManagerOrAdmin = hasRole(["manager", "admin"]);

/**
 * Cria um usuário admin inicial se não existir nenhum
 */
export async function createInitialAdminUser() {
  try {
    // Verifica se já existe algum usuário admin
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);

    if (existingAdmin) {
      console.log("Usuário admin já existe");
      return;
    }

    // Cria o usuário admin inicial
    const adminUser: InsertUser = {
      username: "admin",
      email: "admin@example.com",
      password: await hashPassword("admin123"),
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      active: true,
    };

    const [newAdmin] = await db.insert(users).values(adminUser).returning();
    console.log("Usuário admin inicial criado com sucesso:", newAdmin.username);
  } catch (error) {
    console.error("Erro ao criar usuário admin inicial:", error);
  }
}