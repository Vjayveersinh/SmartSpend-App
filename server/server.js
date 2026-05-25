import bcrypt from "bcryptjs";
import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import pg from "pg";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "SmartSpendWeb");

const PORT = Number(process.env.PORT || 5177);
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-before-production";
const JWT_EXPIRES_IN = "30d";
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "data", "smartspend-db.json");

const categories = [
  "Groceries",
  "Eating Out",
  "Coffee",
  "Rent",
  "Car",
  "Gas",
  "Shopping",
  "Subscriptions",
  "Gym",
  "Family",
  "Medical",
  "Travel",
  "Other",
];

const paymentMethods = ["Credit Card", "Debit Card", "Cash", "Apple Pay", "Other"];
const expenseTypes = ["Need", "Want"];

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  console.warn("JWT_SECRET is not set. Add a strong secret in your hosting environment.");
}

const store = process.env.DATABASE_URL ? createPostgresStore() : createJsonStore();
await store.init();

const app = express();

app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(compression());
app.use(express.json({ limit: "32kb" }));

app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 40,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    storage: process.env.DATABASE_URL ? "postgres" : "json",
  });
});

app.post("/api/auth/signup", async (request, response, next) => {
  try {
    const name = normalizeName(request.body.name);
    const username = normalizeUsername(request.body.username);
    const password = String(request.body.password || "");

    if (name.length < 2) {
      return response.status(400).json({ message: "Enter your name." });
    }

    if (!isValidUsername(username)) {
      return response.status(400).json({ message: "Choose a username with at least 3 letters or numbers." });
    }

    if (password.length < 6) {
      return response.status(400).json({ message: "Choose a password with at least 6 characters." });
    }

    const existingUser = await store.findUserByUsername(username);
    if (existingUser) {
      return response.status(409).json({ message: "That username already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await store.createUser({
      id: createId(),
      name,
      username,
      passwordHash,
      createdAt: new Date().toISOString(),
    });

    response.status(201).json(createAuthPayload(user));
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (request, response, next) => {
  try {
    const username = normalizeUsername(request.body.username);
    const password = String(request.body.password || "");
    const user = await store.findUserByUsername(username);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return response.status(401).json({ message: "Username or password is incorrect." });
    }

    response.json(createAuthPayload(user));
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", requireAuth, async (request, response) => {
  response.json({ user: publicUser(request.user) });
});

app.get("/api/expenses", requireAuth, async (request, response, next) => {
  try {
    response.json({ expenses: await store.listExpenses(request.user.id) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/expenses", requireAuth, async (request, response, next) => {
  try {
    const payload = validateExpense(request.body);
    const expense = await store.createExpense({
      id: createId(),
      userId: request.user.id,
      ...payload,
      createdAt: new Date().toISOString(),
    });

    response.status(201).json({ expense });
  } catch (error) {
    next(error);
  }
});

app.put("/api/expenses/:id", requireAuth, async (request, response, next) => {
  try {
    const payload = validateExpense(request.body);
    const expense = await store.updateExpense(request.user.id, request.params.id, payload);

    if (!expense) {
      return response.status(404).json({ message: "Expense not found." });
    }

    response.json({ expense });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/expenses/:id", requireAuth, async (request, response, next) => {
  try {
    const deleted = await store.deleteExpense(request.user.id, request.params.id);

    if (!deleted) {
      return response.status(404).json({ message: "Expense not found." });
    }

    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use(
  express.static(publicDir, {
    setHeaders(response, filePath) {
      if (filePath.endsWith("index.html") || filePath.endsWith("service-worker.js")) {
        response.setHeader("Cache-Control", "no-store");
      }
    },
  })
);

app.get("*", (_request, response) => {
  response.sendFile(path.join(publicDir, "index.html"));
});

app.use((error, _request, response, _next) => {
  console.error(error);
  const status = error.statusCode || 500;
  response.status(status).json({ message: status === 500 ? "Something went wrong." : error.message });
});

app.listen(PORT, () => {
  console.log(`SmartSpend is running on http://localhost:${PORT}`);
});

function createAuthPayload(user) {
  return {
    token: jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }),
    user: publicUser(user),
  };
}

async function requireAuth(request, response, next) {
  try {
    const header = request.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token) {
      return response.status(401).json({ message: "Please log in again." });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await store.findUserById(payload.sub);

    if (!user) {
      return response.status(401).json({ message: "Please log in again." });
    }

    request.user = user;
    next();
  } catch {
    response.status(401).json({ message: "Please log in again." });
  }
}

function validateExpense(body) {
  const amount = Number(body.amount);
  const category = String(body.category || "");
  const paymentMethod = String(body.paymentMethod || "");
  const type = String(body.type || "");
  const note = String(body.note || "").trim().slice(0, 180);
  const date = new Date(body.date);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw badRequest("Enter an amount greater than 0.");
  }

  if (!categories.includes(category)) {
    throw badRequest("Choose a valid category.");
  }

  if (!paymentMethods.includes(paymentMethod)) {
    throw badRequest("Choose a valid payment method.");
  }

  if (!expenseTypes.includes(type)) {
    throw badRequest("Choose Need or Want.");
  }

  if (Number.isNaN(date.getTime())) {
    throw badRequest("Choose a valid date.");
  }

  return {
    amount: Math.round(amount * 100) / 100,
    category,
    note,
    paymentMethod,
    type,
    date: date.toISOString(),
  };
}

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    createdAt: user.createdAt,
  };
}

function normalizeName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidUsername(value) {
  return /^[a-z0-9._-]{3,32}$/.test(value);
}

function createId() {
  return crypto.randomUUID();
}

function createPostgresStore() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
  });

  return {
    async init() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL
        );

        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          amount NUMERIC(12, 2) NOT NULL,
          category TEXT NOT NULL,
          note TEXT NOT NULL DEFAULT '',
          payment_method TEXT NOT NULL,
          type TEXT NOT NULL,
          date TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL
        );

        CREATE INDEX IF NOT EXISTS expenses_user_date_idx ON expenses(user_id, date DESC);
      `);
    },
    async findUserByUsername(username) {
      const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
      return result.rows[0] ? mapUser(result.rows[0]) : null;
    },
    async findUserById(id) {
      const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
      return result.rows[0] ? mapUser(result.rows[0]) : null;
    },
    async createUser(user) {
      const result = await pool.query(
        "INSERT INTO users (id, name, username, password_hash, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [user.id, user.name, user.username, user.passwordHash, user.createdAt]
      );
      return mapUser(result.rows[0]);
    },
    async listExpenses(userId) {
      const result = await pool.query("SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC", [userId]);
      return result.rows.map(mapExpense);
    },
    async createExpense(expense) {
      const result = await pool.query(
        `INSERT INTO expenses (id, user_id, amount, category, note, payment_method, type, date, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          expense.id,
          expense.userId,
          expense.amount,
          expense.category,
          expense.note,
          expense.paymentMethod,
          expense.type,
          expense.date,
          expense.createdAt,
        ]
      );
      return mapExpense(result.rows[0]);
    },
    async updateExpense(userId, id, expense) {
      const result = await pool.query(
        `UPDATE expenses
         SET amount = $1, category = $2, note = $3, payment_method = $4, type = $5, date = $6
         WHERE id = $7 AND user_id = $8
         RETURNING *`,
        [expense.amount, expense.category, expense.note, expense.paymentMethod, expense.type, expense.date, id, userId]
      );
      return result.rows[0] ? mapExpense(result.rows[0]) : null;
    },
    async deleteExpense(userId, id) {
      const result = await pool.query("DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id", [id, userId]);
      return Boolean(result.rows[0]);
    },
  };
}

function createJsonStore() {
  let writeQueue = Promise.resolve();

  async function readDb() {
    try {
      const content = await fs.readFile(DATA_FILE, "utf8");
      const db = JSON.parse(content);
      return {
        users: Array.isArray(db.users) ? db.users : [],
        expenses: Array.isArray(db.expenses) ? db.expenses : [],
      };
    } catch (error) {
      if (error.code === "ENOENT") {
        return { users: [], expenses: [] };
      }

      throw error;
    }
  }

  async function writeDb(db) {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    const tempFile = `${DATA_FILE}.${process.pid}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(db, null, 2));
    await fs.rename(tempFile, DATA_FILE);
  }

  function updateDb(mutator) {
    writeQueue = writeQueue.then(async () => {
      const db = await readDb();
      const result = await mutator(db);
      await writeDb(db);
      return result;
    });
    return writeQueue;
  }

  return {
    async init() {
      await writeDb(await readDb());
    },
    async findUserByUsername(username) {
      const db = await readDb();
      return db.users.find((user) => user.username === username) || null;
    },
    async findUserById(id) {
      const db = await readDb();
      return db.users.find((user) => user.id === id) || null;
    },
    async createUser(user) {
      return updateDb((db) => {
        db.users.push(user);
        return user;
      });
    },
    async listExpenses(userId) {
      const db = await readDb();
      return db.expenses.filter((expense) => expense.userId === userId).sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    async createExpense(expense) {
      return updateDb((db) => {
        db.expenses.push(expense);
        return expense;
      });
    },
    async updateExpense(userId, id, expense) {
      return updateDb((db) => {
        const index = db.expenses.findIndex((item) => item.id === id && item.userId === userId);
        if (index === -1) return null;
        db.expenses[index] = { ...db.expenses[index], ...expense };
        return db.expenses[index];
      });
    },
    async deleteExpense(userId, id) {
      return updateDb((db) => {
        const before = db.expenses.length;
        db.expenses = db.expenses.filter((expense) => expense.id !== id || expense.userId !== userId);
        return db.expenses.length < before;
      });
    },
  };
}

function mapUser(row) {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    passwordHash: row.password_hash,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function mapExpense(row) {
  return {
    id: row.id,
    amount: Number(row.amount),
    category: row.category,
    note: row.note || "",
    paymentMethod: row.payment_method,
    type: row.type,
    date: new Date(row.date).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
  };
}
