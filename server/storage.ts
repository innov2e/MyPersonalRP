import {
  users,
  accounts,
  costCenters,
  payments,
  type User,
  type InsertUser,
  type Account,
  type InsertAccount,
  type CostCenter,
  type InsertCostCenter,
  type Payment,
  type InsertPayment,
  type PaymentWithRelations
} from "@shared/schema";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Account methods
  getAllAccounts(): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;

  // Cost Center methods
  getAllCostCenters(): Promise<CostCenter[]>;
  getCostCenter(id: number): Promise<CostCenter | undefined>;
  createCostCenter(costCenter: InsertCostCenter): Promise<CostCenter>;
  updateCostCenter(id: number, costCenter: Partial<InsertCostCenter>): Promise<CostCenter | undefined>;
  deleteCostCenter(id: number): Promise<boolean>;

  // Payment methods
  getAllPayments(): Promise<PaymentWithRelations[]>;
  getPayment(id: number): Promise<PaymentWithRelations | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment | undefined>;
  deletePayment(id: number): Promise<boolean>;
  
  // File methods
  saveFile(file: Express.Multer.File, type: 'receipt' | 'request'): Promise<string>;
  getFilePath(filename: string): string;
  deleteFile(filePath: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private accounts: Map<number, Account>;
  private costCenters: Map<number, CostCenter>;
  private payments: Map<number, Payment>;
  private currentUserId: number;
  private currentAccountId: number;
  private currentCostCenterId: number;
  private currentPaymentId: number;

  constructor() {
    this.users = new Map();
    this.accounts = new Map();
    this.costCenters = new Map();
    this.payments = new Map();
    
    this.currentUserId = 1;
    this.currentAccountId = 1;
    this.currentCostCenterId = 1;
    this.currentPaymentId = 1;

    // Initialize with some sample data
    this.initializeData();
  }

  private initializeData() {
    // Add sample accounts
    this.createAccount({ name: "PayPal Business", type: "PayPal" });
    this.createAccount({ name: "Carta Aziendale", type: "Carta di credito" });
    this.createAccount({ name: "Conto Corrente", type: "Conto corrente bancario" });

    // Add sample cost centers
    this.createCostCenter({ category: "IT", subcategory: "Software" });
    this.createCostCenter({ category: "IT", subcategory: "Infrastruttura" });
    this.createCostCenter({ category: "Marketing", subcategory: "Pubblicità" });
    this.createCostCenter({ category: "Marketing", subcategory: "Eventi" });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Account methods
  async getAllAccounts(): Promise<Account[]> {
    return Array.from(this.accounts.values());
  }

  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const id = this.currentAccountId++;
    const account: Account = { ...insertAccount, id };
    this.accounts.set(id, account);
    return account;
  }

  async updateAccount(id: number, accountUpdate: Partial<InsertAccount>): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (!account) return undefined;

    const updatedAccount = { ...account, ...accountUpdate };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async deleteAccount(id: number): Promise<boolean> {
    return this.accounts.delete(id);
  }

  // Cost Center methods
  async getAllCostCenters(): Promise<CostCenter[]> {
    return Array.from(this.costCenters.values());
  }

  async getCostCenter(id: number): Promise<CostCenter | undefined> {
    return this.costCenters.get(id);
  }

  async createCostCenter(insertCostCenter: InsertCostCenter): Promise<CostCenter> {
    const id = this.currentCostCenterId++;
    const costCenter: CostCenter = { ...insertCostCenter, id };
    this.costCenters.set(id, costCenter);
    return costCenter;
  }

  async updateCostCenter(id: number, costCenterUpdate: Partial<InsertCostCenter>): Promise<CostCenter | undefined> {
    const costCenter = this.costCenters.get(id);
    if (!costCenter) return undefined;

    const updatedCostCenter = { ...costCenter, ...costCenterUpdate };
    this.costCenters.set(id, updatedCostCenter);
    return updatedCostCenter;
  }

  async deleteCostCenter(id: number): Promise<boolean> {
    return this.costCenters.delete(id);
  }

  // Payment methods
  async getAllPayments(): Promise<PaymentWithRelations[]> {
    return Array.from(this.payments.values()).map(payment => {
      const account = this.accounts.get(payment.accountId);
      const costCenter = this.costCenters.get(payment.costCenterId);
      
      if (!account || !costCenter) {
        throw new Error(`Related entity not found for payment ${payment.id}`);
      }

      return {
        ...payment,
        account,
        costCenter
      };
    });
  }

  async getPayment(id: number): Promise<PaymentWithRelations | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;

    const account = this.accounts.get(payment.accountId);
    const costCenter = this.costCenters.get(payment.costCenterId);
    
    if (!account || !costCenter) {
      throw new Error(`Related entity not found for payment ${payment.id}`);
    }

    return {
      ...payment,
      account,
      costCenter
    };
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.currentPaymentId++;
    // Ensure receiptPath and requestPath are string | null, not undefined
    const payment: Payment = { 
      ...insertPayment, 
      id,
      receiptPath: insertPayment.receiptPath || null,
      requestPath: insertPayment.requestPath || null
    };
    this.payments.set(id, payment);
    return payment;
  }

  async updatePayment(id: number, paymentUpdate: Partial<InsertPayment>): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;

    // Handle the case where receiptPath or requestPath might be undefined
    const updatedData = { ...paymentUpdate };
    
    // If receiptPath is explicitly set to undefined, set it to null
    if ('receiptPath' in updatedData && updatedData.receiptPath === undefined) {
      updatedData.receiptPath = null;
    }
    
    // If requestPath is explicitly set to undefined, set it to null
    if ('requestPath' in updatedData && updatedData.requestPath === undefined) {
      updatedData.requestPath = null;
    }

    const updatedPayment = { ...payment, ...updatedData };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  async deletePayment(id: number): Promise<boolean> {
    const payment = this.payments.get(id);
    if (!payment) return false;
    
    // Delete associated files if they exist
    if (payment.receiptPath) {
      await this.deleteFile(payment.receiptPath);
    }
    if (payment.requestPath) {
      await this.deleteFile(payment.requestPath);
    }
    
    return this.payments.delete(id);
  }

  // File methods
  async saveFile(file: Express.Multer.File, type: 'receipt' | 'request'): Promise<string> {
    const timestamp = Date.now();
    const filename = `${type}-${timestamp}-${file.originalname}`;
    const filepath = path.join(uploadsDir, filename);
    
    // Create a readable stream from the buffer
    const buffer = file.buffer;
    fs.writeFileSync(filepath, buffer);
    
    return filename;
  }

  getFilePath(filename: string): string {
    return path.join(uploadsDir, filename);
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(uploadsDir, filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      return true;
    } catch (error) {
      console.error(`Error deleting file: ${error}`);
      return false;
    }
  }
}

export const storage = new MemStorage();
export async function withTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
