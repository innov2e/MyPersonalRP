import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';
import fs from "fs";
import { z } from "zod";
import { 
  insertAccountSchema, 
  insertCostCenterSchema, 
  insertPaymentSchema 
} from "@shared/schema";

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup uploads folder
  const uploadsDir = path.join(__dirname, "..", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve uploads
  app.use("/api/uploads", (req, res, next) => {
    // Decode the URL-encoded filename
    const fileName = decodeURIComponent(req.path.slice(1));
    const filePath = path.join(uploadsDir, fileName);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      console.error(`File not found: ${filePath}`);
      res.status(404).json({ message: "File not found" });
    }
  });

  // Error handler for Zod validation
  const validateRequest = (schema: z.ZodType<any, any>, data: any) => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        throw { status: 400, message: validationError.message };
      }
      throw error;
    }
  };

  // ACCOUNTS API
  app.get("/api/accounts", async (req: Request, res: Response) => {
    try {
      const accounts = await storage.getAllAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.get("/api/accounts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const account = await storage.getAccount(id);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.json(account);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch account" });
    }
  });

  app.post("/api/accounts", async (req: Request, res: Response) => {
    try {
      const validatedData = validateRequest(insertAccountSchema, req.body);
      const account = await storage.createAccount(validatedData);
      res.status(201).json(account);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || "Failed to create account";
      res.status(status).json({ message });
    }
  });

  app.put("/api/accounts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = validateRequest(insertAccountSchema.partial(), req.body);
      
      const updatedAccount = await storage.updateAccount(id, validatedData);
      
      if (!updatedAccount) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.json(updatedAccount);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || "Failed to update account";
      res.status(status).json({ message });
    }
  });

  app.delete("/api/accounts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAccount(id);
      
      if (!success) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // COST CENTERS API
  app.get("/api/cost-centers", async (req: Request, res: Response) => {
    try {
      const costCenters = await storage.getAllCostCenters();
      res.json(costCenters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cost centers" });
    }
  });

  app.get("/api/cost-centers/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const costCenter = await storage.getCostCenter(id);
      
      if (!costCenter) {
        return res.status(404).json({ message: "Cost center not found" });
      }
      
      res.json(costCenter);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cost center" });
    }
  });

  app.post("/api/cost-centers", async (req: Request, res: Response) => {
    try {
      const validatedData = validateRequest(insertCostCenterSchema, req.body);
      const costCenter = await storage.createCostCenter(validatedData);
      res.status(201).json(costCenter);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || "Failed to create cost center";
      res.status(status).json({ message });
    }
  });

  app.put("/api/cost-centers/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = validateRequest(insertCostCenterSchema.partial(), req.body);
      
      const updatedCostCenter = await storage.updateCostCenter(id, validatedData);
      
      if (!updatedCostCenter) {
        return res.status(404).json({ message: "Cost center not found" });
      }
      
      res.json(updatedCostCenter);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || "Failed to update cost center";
      res.status(status).json({ message });
    }
  });

  app.delete("/api/cost-centers/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCostCenter(id);
      
      if (!success) {
        return res.status(404).json({ message: "Cost center not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete cost center" });
    }
  });

  // PAYMENTS API
  app.get("/api/payments", async (req: Request, res: Response) => {
    try {
      const payments = await storage.getAllPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get("/api/payments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const payment = await storage.getPayment(id);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment" });
    }
  });

  // Handle file uploads for payments
  app.post("/api/payments", upload.fields([
    { name: 'receipt', maxCount: 1 },
    { name: 'request', maxCount: 1 }
  ]), async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Process payment data
      const paymentData = JSON.parse(req.body.data);
      
      // Create a custom schema for the payment data from the frontend
      const customPaymentSchema = z.object({
        date: z.string().transform(val => new Date(val)),
        amount: z.number(),
        description: z.string(),
        accountId: z.number(),
        costCenterId: z.number(),
        receiptPath: z.string().optional().nullable(),
        requestPath: z.string().optional().nullable()
      });
      
      // Validate payment data
      const validatedData = validateRequest(customPaymentSchema, {
        ...paymentData,
        receiptPath: undefined,
        requestPath: undefined
      });
      
      // Save files if they exist
      let receiptPath: string | undefined;
      let requestPath: string | undefined;
      
      if (files.receipt && files.receipt.length > 0) {
        receiptPath = await storage.saveFile(files.receipt[0], 'receipt');
      }
      
      if (files.request && files.request.length > 0) {
        requestPath = await storage.saveFile(files.request[0], 'request');
      }
      
      // Create payment with file paths
      const payment = await storage.createPayment({
        ...validatedData,
        receiptPath,
        requestPath
      });
      
      res.status(201).json(payment);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || "Failed to create payment";
      res.status(status).json({ message });
    }
  });

  app.put("/api/payments/:id", upload.fields([
    { name: 'receipt', maxCount: 1 },
    { name: 'request', maxCount: 1 }
  ]), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Get the existing payment
      const existingPayment = await storage.getPayment(id);
      if (!existingPayment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      // Process payment data
      const paymentData = JSON.parse(req.body.data);
      
      // Create a custom schema for the payment data from the frontend
      const customPaymentSchema = z.object({
        date: z.string().transform(val => new Date(val)).optional(),
        amount: z.number().optional(),
        description: z.string().optional(),
        accountId: z.number().optional(),
        costCenterId: z.number().optional(),
        receiptPath: z.string().optional().nullable(),
        requestPath: z.string().optional().nullable(),
        removeReceipt: z.boolean().optional(),
        removeRequest: z.boolean().optional()
      });
      
      // Validate payment data
      const validatedData = validateRequest(customPaymentSchema, {
        ...paymentData,
        receiptPath: undefined,
        requestPath: undefined
      });
      
      // Handle receipt file
      let receiptPath = existingPayment.receiptPath;
      if (files.receipt && files.receipt.length > 0) {
        // Delete old receipt if exists
        if (existingPayment.receiptPath) {
          await storage.deleteFile(existingPayment.receiptPath);
        }
        receiptPath = await storage.saveFile(files.receipt[0], 'receipt');
      } else if (paymentData.removeReceipt) {
        // If user wants to remove receipt
        if (existingPayment.receiptPath) {
          await storage.deleteFile(existingPayment.receiptPath);
        }
        receiptPath = null;
      }
      
      // Handle request file
      let requestPath = existingPayment.requestPath;
      if (files.request && files.request.length > 0) {
        // Delete old request if exists
        if (existingPayment.requestPath) {
          await storage.deleteFile(existingPayment.requestPath);
        }
        requestPath = await storage.saveFile(files.request[0], 'request');
      } else if (paymentData.removeRequest) {
        // If user wants to remove request
        if (existingPayment.requestPath) {
          await storage.deleteFile(existingPayment.requestPath);
        }
        requestPath = null;
      }
      
      // Update payment
      const updatedPayment = await storage.updatePayment(id, {
        ...validatedData,
        receiptPath,
        requestPath
      });
      
      if (!updatedPayment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      res.json(updatedPayment);
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || "Failed to update payment";
      res.status(status).json({ message });
    }
  });

  app.delete("/api/payments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePayment(id);
      
      if (!success) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete payment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
