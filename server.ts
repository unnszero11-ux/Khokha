import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "agora-access-token";
const { RtcTokenBuilder, RtcRole } = pkg;
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import { createServer } from "http";
import { Server } from "socket.io";
import Stripe from "stripe";
import { GoogleGenAI } from "@google/genai";
import jwt from "jsonwebtoken";
import { ethers } from "ethers";
import { initializeApp as initializeFirebaseClientApp } from "firebase/app";
import { 
  getFirestore as getFirebaseClientFirestore,
  doc as clientDoc,
  collection as clientCollection,
  getDoc as clientGetDoc,
  getDocs as clientGetDocs,
  setDoc as clientSetDoc,
  updateDoc as clientUpdateDoc,
  addDoc as clientAddDoc,
  deleteDoc as clientDeleteDoc,
  query as clientQuery,
  where as clientWhere,
  orderBy as clientOrderBy,
  limit as clientLimit,
  increment as clientIncrement,
  arrayUnion as clientArrayUnion,
  serverTimestamp as clientServerTimestamp,
  runTransaction as clientRunTransaction,
  getCountFromServer as clientGetCountFromServer
} from "firebase/firestore";

class DocumentSnapshotWrapper {
  id: string;
  exists: boolean;
  private _data: any;

  constructor(snap: any) {
    this.id = snap.id;
    this.exists = snap.exists();
    this._data = snap.data();
  }

  data() {
    return this._data;
  }
}

class QuerySnapshotWrapper {
  docs: DocumentSnapshotWrapper[];
  size: number;

  constructor(snap: any) {
    this.docs = snap.docs.map((d: any) => new DocumentSnapshotWrapper(d));
    this.size = snap.size;
  }

  forEach(callback: (doc: DocumentSnapshotWrapper) => void) {
    this.docs.forEach(callback);
  }
}

class QueryWrapper {
  protected _db: any;
  protected _path: string;
  protected _constraints: any[];

  constructor(db: any, path: string, constraints: any[] = []) {
    this._db = db;
    this._path = path;
    this._constraints = constraints;
  }

  where(field: string, op: any, val: any) {
    return new QueryWrapper(this._db, this._path, [...this._constraints, clientWhere(field, op, val)]);
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    return new QueryWrapper(this._db, this._path, [...this._constraints, clientOrderBy(field, direction)]);
  }

  limit(n: number) {
    return new QueryWrapper(this._db, this._path, [...this._constraints, clientLimit(n)]);
  }

  count() {
    return {
      get: async () => {
        const q = clientQuery(clientCollection(this._db, this._path), ...this._constraints);
        const snap = await clientGetCountFromServer(q);
        return {
          data: () => ({
            count: snap.data().count
          })
        };
      }
    };
  }

  async get() {
    const q = clientQuery(clientCollection(this._db, this._path), ...this._constraints);
    const snap = await clientGetDocs(q);
    return new QuerySnapshotWrapper(snap);
  }
}

class CollectionReferenceWrapper extends QueryWrapper {
  constructor(db: any, path: string) {
    super(db, path);
  }

  doc(id?: string) {
    const docRef = id ? clientDoc(this._db, this._path, id) : clientDoc(clientCollection(this._db, this._path));
    return new DocumentReferenceWrapper(docRef);
  }

  async add(data: any) {
    const docRef = await clientAddDoc(clientCollection(this._db, this._path), data);
    return new DocumentReferenceWrapper(docRef);
  }
}

class DocumentReferenceWrapper {
  _docRef: any;
  id: string;

  constructor(docRef: any) {
    this._docRef = docRef;
    this.id = docRef.id;
  }

  async get() {
    const snap = await clientGetDoc(this._docRef);
    return new DocumentSnapshotWrapper(snap);
  }

  async set(data: any, options?: any) {
    if (options?.merge) {
      await clientSetDoc(this._docRef, data, { merge: true });
    } else {
      await clientSetDoc(this._docRef, data);
    }
  }

  async update(data: any) {
    await clientUpdateDoc(this._docRef, data);
  }

  async delete() {
    await clientDeleteDoc(this._docRef);
  }

  collection(path: string) {
    return new CollectionReferenceWrapper(this._docRef.firestore, `${this._docRef.path}/${path}`);
  }
}

class FirestoreWrapper {
  private _db: any;

  constructor(clientDb: any) {
    this._db = clientDb;
  }

  collection(path: string) {
    return new CollectionReferenceWrapper(this._db, path);
  }

  async runTransaction(updateFunction: (transaction: any) => Promise<any>) {
    return clientRunTransaction(this._db, async (tx: any) => {
      const txWrapper = {
        get: async (docRefWrapper: DocumentReferenceWrapper) => {
          const snap = await tx.get(docRefWrapper._docRef);
          return new DocumentSnapshotWrapper(snap);
        },
        set: (docRefWrapper: DocumentReferenceWrapper, data: any, options?: any) => {
          if (options?.merge) {
            tx.set(docRefWrapper._docRef, data, { merge: true });
          } else {
            tx.set(docRefWrapper._docRef, data);
          }
          return txWrapper;
        },
        update: (docRefWrapper: DocumentReferenceWrapper, data: any) => {
          tx.update(docRefWrapper._docRef, data);
          return txWrapper;
        },
        delete: (docRefWrapper: DocumentReferenceWrapper) => {
          tx.delete(docRefWrapper._docRef);
          return txWrapper;
        }
      };
      return updateFunction(txWrapper);
    });
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let db: any;
let auth: any;

let stripeClient: Stripe | null = null;
let currentStripeKey: string | null = null;
let cachedSettings: any = null;
let cachedSettingsTime = 0;

export async function getSettings() {
  if (cachedSettings && Date.now() - cachedSettingsTime < 20000) {
    return cachedSettings; // Cache for 20 seconds
  }
  if (db) {
    try {
      const doc = await db.collection("settings").doc("keys").get();
      if (doc.exists) {
        cachedSettings = doc.data();
        cachedSettingsTime = Date.now();
        return cachedSettings;
      }
    } catch (err) {
      console.error("Failed to load global settings:", err);
    }
  }
  return cachedSettings || {};
}

export async function getStripeAsync(): Promise<Stripe> {
  const settings = await getSettings();
  const key = settings.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY environment variable or Stripe Secret Key setting is required');
  }
  
  if (!stripeClient || currentStripeKey !== key) {
    currentStripeKey = key;
    // Using an older API version or explicit latest to be safe
    stripeClient = new Stripe(key, { apiVersion: '2025-02-24.acacia' as any });
  }
  return stripeClient;
}

// Admin Middleware
const adminOnly = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!auth || !db) {
    console.error("Admin action attempted but Firebase Admin is not initialized");
    return res.status(500).json({ error: "Firebase Admin not initialized" });
  }
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    const userData = userDoc.data();

    if (userData?.role === "admin" || decodedToken.email === "cardsnour6@gmail.com" || decodedToken.email === "khokha@admin.com") {
      (req as any).admin = decodedToken;
      next();
    } else {
      res.status(403).json({ error: "Forbidden: Admin access required" });
    }
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3000;

  console.log("Starting server initialization...");
  
  const FieldValue = {
    increment: (val: number) => clientIncrement(val),
    arrayUnion: (...elements: any[]) => clientArrayUnion(...elements),
    serverTimestamp: () => clientServerTimestamp()
  };

  // Initialize Firebase Admin inside startServer
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    try {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      console.log("Firebase config loaded:", {
        projectId: firebaseConfig.projectId,
        databaseId: firebaseConfig.firestoreDatabaseId
      });
      
      if (!admin.apps.length) {
        admin.initializeApp({
          projectId: firebaseConfig.projectId
        });
      }
      const databaseId = firebaseConfig.firestoreDatabaseId;
      const clientApp = initializeFirebaseClientApp({
        apiKey: firebaseConfig.apiKey,
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId
      });
      const clientDb = databaseId ? getFirebaseClientFirestore(clientApp, databaseId) : getFirebaseClientFirestore(clientApp);
      db = new FirestoreWrapper(clientDb);
      auth = admin.auth();
      console.log("Firebase Client Wrapper initialized successfully in startServer");
      
      // Sync Firestore saved settings to env variables on boot
      try {
        const doc = await db.collection("settings").doc("keys").get();
        if (doc.exists) {
          const settings = doc.data();
          const envMapping: Record<string, string> = {
            VITE_AGORA_APP_ID: settings.agoraAppId || "",
            AGORA_APP_CERTIFICATE: settings.agoraAppCertificate || "",
            STRIPE_SECRET_KEY: settings.stripeSecretKey || "",
            VITE_STRIPE_PUBLISHABLE_KEY: settings.stripePublishableKey || "",
            LIVE_KMS_TOKEN_184: settings.kmsToken || "",
            LIVE_KMS_SIGNATURE_184: settings.kmsSignature || "",
            API_BEAST_MASTER: settings.API_BEAST_MASTER || "",
            STRIPE_SK_KEYINFO: settings.STRIPE_SK_KEYINFO || "",
            STRIPE_WH_KEYINFO: settings.STRIPE_WH_KEYINFO || "",
            STRIPE_SK_SANDBOX: settings.STRIPE_SK_SANDBOX || "",
            STRIPE_WH_SANDBOX: settings.STRIPE_WH_SANDBOX || "",
            STRIPE_SK_SUPPORT1: settings.STRIPE_SK_SUPPORT1 || "",
            STRIPE_WH_SUPPORT1: settings.STRIPE_WH_SUPPORT1 || "",
            STRIPE_SK_SUPPORT2: settings.STRIPE_SK_SUPPORT2 || "",
            STRIPE_WH_SUPPORT2: settings.STRIPE_WH_SUPPORT2 || "",
            RPC_NODE_URL: settings.RPC_NODE_URL || "",
            PRIVATE_KEY: settings.PRIVATE_KEY || "",
            CONTRACT_ADDRESS: settings.CONTRACT_ADDRESS || "",
            GEMINI_API_KEY: settings.geminiApiKey || "",
            GITHUB_CLIENT_ID: settings.githubClientId || "",
            GITHUB_CLIENT_SECRET: settings.githubClientSecret || "",
            GITHUB_TOKEN: settings.githubToken || "",
            GITHUB_REPO: settings.githubRepo || "",
            GITHUB_OWNER: settings.githubOwner || ""
          };
          for (const [key, val] of Object.entries(envMapping)) {
            if (val) {
              process.env[key] = val;
            }
          }
          console.log("Successfully loaded keys from Firestore into process.env!");
        }
      } catch (syncErr: any) {
        console.error("Failed to sync keys from Firestore on boot:", syncErr.message);
      }
      
      // Test connection
      try {
        const testSnapshot = await db.collection("health_check").limit(1).get();
        console.log("Firestore connection test successful");
      } catch (testErr) {
        console.error("Firestore connection test failed:", testErr);
      }
    } catch (err) {
      console.error("Error initializing Firebase Admin in startServer:", err);
    }
  }

  // --- Rotating Keys, Web3 Signer and JWT beast master configuration helper ---
  async function resolveWebhookConfig() {
    const settings = await getSettings();
    const API_BEAST_MASTER = settings.API_BEAST_MASTER || process.env.API_BEAST_MASTER || "api_beast_master_default_value";

    const ROTATING_KEYS: Record<string, { stripeKey: string; webhookSecret: string }> = {
      Keyinfo_live_: {
        stripeKey: settings.STRIPE_SK_KEYINFO || process.env.STRIPE_SK_KEYINFO || "sk_live_keyinfo_placeholder",
        webhookSecret: settings.STRIPE_WH_KEYINFO || process.env.STRIPE_WH_KEYINFO || "whsec_keyinfo_placeholder"
      },
      Sandbox_live_rest: {
        stripeKey: settings.STRIPE_SK_SANDBOX || process.env.STRIPE_SK_SANDBOX || "sk_live_sandbox_placeholder",
        webhookSecret: settings.STRIPE_WH_SANDBOX || process.env.STRIPE_WH_SANDBOX || "whsec_sandbox_placeholder"
      },
      Support_key_1: {
        stripeKey: settings.STRIPE_SK_SUPPORT1 || process.env.STRIPE_SK_SUPPORT1 || "sk_live_support1_placeholder",
        webhookSecret: settings.STRIPE_WH_SUPPORT1 || process.env.STRIPE_WH_SUPPORT1 || "whsec_support1_placeholder"
      },
      Support_key_2: {
        stripeKey: settings.STRIPE_SK_SUPPORT2 || process.env.STRIPE_SK_SUPPORT2 || "sk_live_support2_placeholder",
        webhookSecret: settings.STRIPE_WH_SUPPORT2 || process.env.STRIPE_WH_SUPPORT2 || "whsec_support2_placeholder"
      }
    };

    const RPC_NODE_URL = settings.RPC_NODE_URL || process.env.RPC_NODE_URL || "https://cloudflare-eth.com";
    const PRIVATE_KEY = settings.PRIVATE_KEY || process.env.PRIVATE_KEY;
    const CONTRACT_ADDRESS = settings.CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS;

    return { API_BEAST_MASTER, ROTATING_KEYS, RPC_NODE_URL, PRIVATE_KEY, CONTRACT_ADDRESS };
  }

  const getDynamicContract = (rpcUrl: string, pk?: string, contractAddr?: string) => {
    if (!pk || !contractAddr) return null;
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(pk, provider);
      const abi = [
        "function registerPayment(address _wallet, string memory _sessionId, uint256 _amount) external"
      ];
      return new ethers.Contract(contractAddr, abi, wallet);
    } catch (err: any) {
      console.error("Dynamic contract init failed:", err.message);
      return null;
    }
  };

  // Stripe Webhook with body-raw parsing MUST reside before general express.json() middleware of app.
  app.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req: any, res) => {
    const signature = req.headers['stripe-signature'] as string;
    const activeKeyHeader = (req.headers['x-api-key-index'] || 'Keyinfo_live_') as string;

    const config = await resolveWebhookConfig();
    const activeConfig = config.ROTATING_KEYS[activeKeyHeader] || config.ROTATING_KEYS['Keyinfo_live_'];
    let event: any;
    let verifiedKeyLabel = activeKeyHeader;

    try {
      const stripeInstance = new Stripe(activeConfig.stripeKey, { apiVersion: '2025-02-24.acacia' as any });
      event = stripeInstance.webhooks.constructEvent(req.body, signature, activeConfig.webhookSecret);
    } catch (err) {
      // Automatic fallback key-ring parsing try
      for (const key of Object.keys(config.ROTATING_KEYS)) {
        try {
          const cfg = config.ROTATING_KEYS[key];
          const altStripe = new Stripe(cfg.stripeKey, { apiVersion: '2025-02-24.acacia' as any });
          event = altStripe.webhooks.constructEvent(req.body, signature, cfg.webhookSecret);
          if (event) {
            verifiedKeyLabel = key;
            break;
          }
        } catch (e) {
          // ignore, try next key
        }
      }
    }

    if (!event) {
      res.status(400).send("Signature verification failed with all rotated keys.");
      return;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const recipientWallet = session.metadata?.walletAddress || session.client_reference_id;
      const totalAmount = session.amount_total || 0;

      if (recipientWallet && ethers.isAddress(recipientWallet)) {
        try {
          const payload = {
            wallet: recipientWallet,
            amount: totalAmount,
            sessionId: session.id,
            verifiedKey: verifiedKeyLabel,
            createdAt: Date.now()
          };
          const token = jwt.sign(payload, config.API_BEAST_MASTER, { algorithm: 'HS256' });

          const saveAndLog = () => {
            fs.appendFileSync('payments.json', JSON.stringify({ token, metadata: payload }) + "\n");
          };

          const web3Contract = getDynamicContract(config.RPC_NODE_URL, config.PRIVATE_KEY, config.CONTRACT_ADDRESS);
          if (web3Contract) {
            web3Contract.registerPayment(recipientWallet, session.id, totalAmount)
              .then((tx: any) => tx.wait())
              .then(() => {
                console.log(`Successfully written on-chain registerPayment.`);
                saveAndLog();
              })
              .catch((blockchainError: any) => {
                console.error("Stripe webhook blockchain execution error:", blockchainError.message);
                saveAndLog();
              });
          } else {
            saveAndLog();
          }
        } catch (jwtError: any) {
          console.error("JWT creation error:", jwtError.message);
        }
      }
    }

    res.json({ received: true });
    return;
  });

  // Retrieves payments
  app.get('/api/payments', (req, res) => {
    try {
      if (!fs.existsSync('payments.json')) {
        res.json([]);
        return;
      }
      const fileContent = fs.readFileSync('payments.json', 'utf8').trim();
      if (!fileContent) {
        res.json([]);
        return;
      }
      const lines = fileContent.split('\n');
      const payments = lines.map(line => line.trim() ? JSON.parse(line) : null).filter(Boolean);
      res.json(payments);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Simulator endpoint to simulate complete transactions with JWT tokens
  app.post('/api/stripe-webhook/simulate', async (req, res) => {
    const { walletAddress, amountInCents } = req.body;
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      res.status(400).json({ error: "Invalid target web3 wallet address" });
      return;
    }
    const mockSessionId = `cs_live_${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 12)}`;
    const amt = parseInt(amountInCents) || 5000;

    try {
      const config = await resolveWebhookConfig();
      const payload = {
        wallet: walletAddress,
        amount: amt,
        sessionId: mockSessionId,
        verifiedKey: "Sandbox_live_rest",
        createdAt: Date.now()
      };
      const token = jwt.sign(payload, config.API_BEAST_MASTER, { algorithm: 'HS256' });
      fs.appendFileSync('payments.json', JSON.stringify({ token, metadata: payload }) + "\n");
      res.json({ success: true, sessionId: mockSessionId, token, metadata: payload });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Middleware
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Public Keys Endpoint
  app.get("/api/public-keys", async (req, res) => {
    try {
      const settings = await getSettings();
      res.json({
        agoraAppId: settings.agoraAppId || process.env.VITE_AGORA_APP_ID || "MY_AGORA_APP_ID",
        stripePublishableKey: settings.stripePublishableKey || process.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
      });
    } catch (err) {
      console.error("Failed to get public keys", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Stripe Payment Intent Endpoint
  app.post("/api/payment/create-intent", async (req, res) => {
    try {
      const { amount, currency = "usd", description } = req.body;
      
      if (!amount) {
        return res.status(400).json({ error: "Amount is required" });
      }

      const stripe = await getStripeAsync();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // convert to cents
        currency,
        description: description || "In-app purchase",
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // 1. POST /api/live/start
  app.post("/api/live/start", async (req, res) => {
    const { userId, modelName, modelPhoto, title, category, adultFlag, isVip, vipPrice, vipDescription, enableRecording, viewerLimit } = req.body;
    
    if (!userId || !title) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const defaultAppId = "e7f6e9aeecf14b2ba10e3f40be9f56e7";
    const settings = await getSettings();
    const appId = (settings.agoraAppId || process.env.VITE_AGORA_APP_ID || defaultAppId).trim();
    let appCertificate = (settings.agoraAppCertificate || process.env.AGORA_APP_CERTIFICATE)?.trim();
    
    // Prevent token mismatch if user set certificate but forgot to set their App ID
    if (appId === defaultAppId && appCertificate) {
      console.warn("WARNING: AGORA_APP_CERTIFICATE is set, but VITE_AGORA_APP_ID is using the default value. This will cause an 'invalid token' error. Ignoring certificate.");
      appCertificate = undefined;
    }
    
    if (!appCertificate) {
      console.warn("AGORA_APP_CERTIFICATE is missing or ignored. Tokens cannot be generated. If your Agora project has 'App Certificate' enabled, this will cause errors.");
    }

    const channelName = `live_${userId}_${Date.now()}`;
    const uid = 0; // Use 0 for dynamic UID
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    let token = "";
    if (appCertificate) {
      token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        role,
        privilegeExpiredTs
      );
    }

    try {
      const liveData: any = {
        modelId: userId,
        modelName: modelName || "Anonymous",
        modelPhoto: modelPhoto || "",
        title,
        category: category || "chatting",
        status: "active",
        viewerCount: 0,
        startedAt: FieldValue.serverTimestamp(),
        agoraChannel: channelName,
        adultFlag: adultFlag || false,
        enableRecording: enableRecording || false,
        viewerLimit: viewerLimit ? parseInt(viewerLimit as any) || 0 : 0
      };

      if (isVip) {
        liveData.isVip = true;
        liveData.vipPrice = vipPrice || 100;
        if (vipDescription) {
          liveData.vipDescription = vipDescription;
        }
      }

      const liveRef = await db.collection("lives").add(liveData);

      // Send real-time notifications to followers via Socket.io
      try {
        const followersSnapshot = await db.collection("follows").where("followingId", "==", userId).get();
        const followerIds = followersSnapshot.docs.map(doc => doc.data().followerId);
        
        followerIds.forEach(followerId => {
          io.to(`user_${followerId}`).emit("notification", {
            type: "live_start",
            title: "Live Room Started! 🔴",
            message: `${modelName || "A model you follow"} is now live: "${title}"`,
            modelId: userId,
            modelName: modelName || "Anonymous",
            roomId: liveRef.id
          });
        });
      } catch (notifErr) {
        console.error("Failed to build socket notifications for live room start", notifErr);
      }

      res.json({ 
        id: liveRef.id,
        channelName, 
        token, 
        appId 
      });
    } catch (err) {
      console.error("Failed to start live", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 2. GET /api/live/list
  app.get("/api/live/list", async (req, res) => {
    try {
      // Mock local lives to avoid DB permission error
      const mockLocalLives = [
        {
          id: "local-khokha",
          modelId: "khokha-ai",
          modelName: "Khokha (AI Companion)",
          title: "Say Hi to Khokha",
          status: "active",
          viewerCount: 152,
          agoraChannel: "khokha_demo"
        }
      ];

      // Simulated external API fetching for IMLive and Cam4
      const externalLives = [
        { id: "imlive-1", modelId: "ext-imlive", modelName: "ImLive_Star", title: "Live from IMLive", viewerCount: 420, source: "imlive.com" },
        { id: "cam4-1", modelId: "ext-cam4", modelName: "Cam4_Beauty", title: "Live on Cam4", viewerCount: 890, source: "cam4.com" }
      ];

      res.json([...mockLocalLives, ...externalLives]);
    } catch (err) {
      console.error("Failed to list lives", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 2.5 POST /api/live/token (for viewers)
  app.post("/api/live/token", async (req, res) => {
    const { channelName, uid, roomId } = req.body;
    if (!channelName) {
      return res.status(400).json({ error: "Missing channelName" });
    }

    const defaultAppId = "e7f6e9aeecf14b2ba10e3f40be9f56e7";
    const settings = await getSettings();
    const appId = (settings.agoraAppId || process.env.VITE_AGORA_APP_ID || defaultAppId).trim();
    let appCertificate = (settings.agoraAppCertificate || process.env.AGORA_APP_CERTIFICATE)?.trim();
    
    // Prevent token mismatch if user set certificate but forgot to set their App ID
    if (appId === defaultAppId && appCertificate) {
      console.warn("WARNING: AGORA_APP_CERTIFICATE is set, but VITE_AGORA_APP_ID is using the default value. This will cause an 'invalid token' error. Ignoring certificate.");
      appCertificate = undefined;
    }
    
    if (!appCertificate) {
      console.warn("AGORA_APP_CERTIFICATE is missing or ignored. Viewer token cannot be generated.");
      return res.json({ token: null });
    }

    const role = RtcRole.SUBSCRIBER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    console.log(`Generating token for appId: ${appId}, channel: ${channelName}, uid: ${uid || 0}`);
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid || 0,
      role,
      privilegeExpiredTs
    );
    console.log(`Token generated successfully`);

    res.json({ token, appId });
  });

  // 3. POST /api/live/stop
  app.post("/api/live/stop", async (req, res) => {
    const { liveId, userId } = req.body;
    
    if (!liveId || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const liveRef = db.collection("lives").doc(liveId);
      const liveDoc = await liveRef.get();
      
      if (!liveDoc.exists) {
        return res.status(404).json({ error: "Live not found" });
      }
      
      if (liveDoc.data()?.modelId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await liveRef.update({
        status: "ended",
        endedAt: FieldValue.serverTimestamp()
      });

      res.json({ success: true });
    } catch (err) {
      console.error("Failed to stop live", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 4. POST /api/gift/send
  app.post("/api/gift/send", async (req, res) => {
    const { userId, modelId, giftId, liveId } = req.body;
    
    if (!userId || !modelId || !giftId || !liveId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const userRef = db.collection("users").doc(userId);
      const modelRef = db.collection("users").doc(modelId);
      
      const userDoc = await userRef.get();
      let modelDoc = await modelRef.get();
      
      // Auto-create agency target user if missing
      if (modelId.startsWith("agency-u-") && !modelDoc.exists) {
        await modelRef.set({
          uid: modelId,
          displayName: modelId === "agency-u-1" ? "Elena_Live" : "Sarah_Vibe",
          email: `${modelId}@agency.com`,
          balance: 0,
          earnings: 0,
          role: "model",
          createdAt: FieldValue.serverTimestamp()
        });
        modelDoc = await modelRef.get();
      }
      
      if (!userDoc.exists || !modelDoc.exists) {
        return res.status(404).json({ error: "User or model not found" });
      }

      const gift = {
        "rose": { name: "Rose", value: 10, icon: "🌹" },
        "fire": { name: "Fire", value: 100, icon: "🔥" },
        "lion": { name: "Lion", value: 1000, icon: "🦁" }
      }[giftId as keyof typeof gift];

      if (!gift) {
        return res.status(400).json({ error: "Invalid gift" });
      }

      const userBalance = userDoc.data()?.balance || 0;
      if (userBalance < gift.value) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Atomic transaction
      await db.runTransaction(async (transaction) => {
        transaction.update(userRef, { balance: FieldValue.increment(-gift.value) });
        transaction.update(modelRef, { earnings: FieldValue.increment(gift.value) });
        
        const txRef = db.collection("transactions").doc();
        transaction.set(txRef, {
          userId,
          amount: -gift.value,
          type: "gift_sent",
          relatedId: giftId,
          liveId,
          createdAt: FieldValue.serverTimestamp()
        });

        const modelTxRef = db.collection("transactions").doc();
        transaction.set(modelTxRef, {
          userId: modelId,
          amount: gift.value,
          type: "gift_received",
          relatedId: giftId,
          liveId,
          fromUserId: userId,
          createdAt: FieldValue.serverTimestamp()
        });

        // Add gift message to chat
        const msgRef = db.collection("lives").doc(liveId).collection("messages").doc();
        transaction.set(msgRef, {
          text: `sent a ${gift.icon} ${gift.name}!`,
          sender: userDoc.data()?.displayName || "User",
          senderId: userId,
          senderPhoto: userDoc.data()?.photoURL || "",
          type: "gift",
          giftIcon: gift.icon,
          createdAt: FieldValue.serverTimestamp()
        });
      });

      // Send real-time notification via Socket.io to the model's room
      try {
        io.to(`user_${modelId}`).emit("notification", {
          type: "gift_received",
          title: "Gift Received! 🎁",
          message: `${userDoc.data()?.displayName || "Someone"} sent you a ${gift.icon} ${gift.name}!`,
          giftId,
          giftName: gift.name,
          giftIcon: gift.icon,
          senderDisplayName: userDoc.data()?.displayName || "User"
        });
      } catch (notifErr) {
        console.error("Failed to build socket gift notifications for model", notifErr);
      }

      res.json({ success: true });
    } catch (err) {
      console.error("Failed to send gift", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 5. POST /api/wallet/add (Mock for Phase 2)
  app.post("/api/wallet/add", async (req, res) => {
    const { userId, amount } = req.body;
    
    if (!userId || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const userRef = db.collection("users").doc(userId);
      await userRef.update({
        balance: FieldValue.increment(amount)
      });

      await db.collection("transactions").add({
        userId,
        amount,
        type: "deposit",
        createdAt: FieldValue.serverTimestamp()
      });

      res.json({ success: true });
    } catch (err) {
      console.error("Failed to add coins", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 6. GET /api/store/items
  app.get("/api/store/items", async (req, res) => {
    try {
      const mockItems = [
        { id: "mock-1", name: "100 Coins", type: "coins", price: 0.99, bonus: 100, image: "🪙" },
        { id: "mock-2", name: "500 Coins", type: "coins", price: 4.99, bonus: 550, image: "💰" },
        { id: "mock-3", name: "VIP Pass", type: "premium", price: 19.99, bonus: 0, image: "💎" },
        { id: "mock-4", name: "Adult Gift Pack", type: "adult", price: 9.99, bonus: 0, adultFlag: true, image: "🔞" },
        { id: "mock-5", name: "Secret Section Access", type: "secret", price: 14.99, bonus: 0, image: "🔒" }
      ];
      res.json(mockItems);
    } catch (err: any) {
      console.error("Failed to list store items", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST /api/vip/purchase
  app.post("/api/vip/purchase", async (req, res) => {
    const { userId, roomId, price } = req.body;
    if (!userId || !roomId || price === undefined) {
      return res.status(400).json({ error: "Missing fields" });
    }

    try {
      await db.runTransaction(async (t: any) => {
        const userRef = db.collection("users").doc(userId);
        const userDoc = await t.get(userRef);
        if (!userDoc.exists) throw new Error("User not found");
        
        const userData = userDoc.data();
        if (userData.balance < price) throw new Error("Insufficient balance");

        const roomRef = db.collection("lives").doc(roomId);
        const roomDoc = await t.get(roomRef);
        if (!roomDoc.exists) throw new Error("Room not found");
        const roomData = roomDoc.data();

        // Deduct balance from user and add to purchasedVipRooms
        const purchasedVipRooms = userData.purchasedVipRooms || [];
        if (!purchasedVipRooms.includes(roomId)) {
          purchasedVipRooms.push(roomId);
        }

        t.update(userRef, {
          balance: FieldValue.increment(-price),
          purchasedVipRooms
        });

        // Add earnings to model
        const modelRef = db.collection("users").doc(roomData.modelId);
        t.update(modelRef, {
          earnings: FieldValue.increment(price)
        });

        // Record transaction
        const txRef = db.collection("transactions").doc();
        t.set(txRef, {
          userId,
          amount: -price,
          type: "purchase",
          relatedId: roomId,
          createdAt: FieldValue.serverTimestamp()
        });
      });

      res.json({ success: true });
    } catch (err: any) {
      console.error("VIP purchase failed:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // 7. POST /api/store/purchase
  app.post("/api/store/purchase", async (req, res) => {
    const { userId, itemId } = req.body;
    if (!userId || !itemId) return res.status(400).json({ error: "Missing fields" });

    try {
      const itemDoc = await db.collection("store").doc(itemId).get();
      if (!itemDoc.exists) return res.status(404).json({ error: "Item not found" });
      const item = itemDoc.data();

      await db.runTransaction(async (transaction) => {
        const userRef = db.collection("users").doc(userId);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error("User not found");

        // Handle different item types
        if (item?.type === "coins") {
          transaction.update(userRef, { balance: FieldValue.increment(item.bonus || 0) });
        } else if (item?.type === "secret") {
          const unlocked = userDoc.data()?.unlockedSections || [];
          if (!unlocked.includes("vip_secret")) {
            transaction.update(userRef, { unlockedSections: FieldValue.arrayUnion("vip_secret") });
          }
        }

        const orderRef = db.collection("orders").doc();
        transaction.set(orderRef, {
          userId,
          itemId,
          status: "completed",
          amount: item?.price,
          createdAt: FieldValue.serverTimestamp()
        });

        const txRef = db.collection("transactions").doc();
        transaction.set(txRef, {
          userId,
          amount: item?.price,
          type: "purchase",
          relatedId: itemId,
          createdAt: FieldValue.serverTimestamp()
        });
      });

      res.json({ success: true });
    } catch (err) {
      console.error("Purchase failed", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 8. POST /api/user/verify-age
  app.post("/api/user/verify-age", async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    try {
      await db.collection("users").doc(userId).update({ ageVerified: true });
      res.json({ success: true });
    } catch (err) {
      console.error("Verification failed", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/external-streams
  app.get("/api/external-streams", async (req, res) => {
    try {
      // In a real production scenario, this endpoint would proxy requests to the actual 
      // IMLive or Cam4 affiliate APIs using secure tokens.
      // For this environment, we return simulated parsed payload representing their schemas.
      
      const imliveData = [
        {
          id: "imlive-ext-1",
          modelId: "imlive-u-1",
          modelName: "Roxy_ImLive",
          modelPhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=600&q=80",
          title: "Private Show Tonight 🌟",
          category: "external",
          status: "active",
          viewerCount: 300,
          agoraChannel: "imlive_ext_1", // simulate passing stream
          isExternal: true,
          agencyName: "IMLive.com"
        }
      ];

      const cam4Data = [
        {
          id: "cam4-ext-1",
          modelId: "cam4-u-1",
          modelName: "Sweet_Bella_Cam4",
          modelPhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=600&q=80",
          title: "Morning Vibes on Cam4 💕",
          category: "external",
          status: "active",
          viewerCount: 450,
          agoraChannel: "cam4_ext_1",
          isExternal: true,
          agencyName: "Cam4.com"
        }
      ];

      res.json([...imliveData, ...cam4Data]);
    } catch (err) {
      console.error("Failed to fetch external streams", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Public Section Endpoints
  app.get("/api/sections/list", async (req, res) => {
    try {
      res.json([]);
    } catch (err) {
      console.error("Failed to list sections", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Adult Toys Endpoints
  app.get("/api/toys/items", async (req, res) => {
    try {
      const mockToys = [
        { id: "toy-1", name: "Premium Vibrator", price: 150, description: "High-quality silicone vibrator", image: "🍆", stock: 10 },
        { id: "toy-2", name: "Silk Handcuffs", price: 80, description: "Soft and comfortable silk handcuffs", image: "⛓️", stock: 15 },
        { id: "toy-3", name: "Adult Bundle Pack", price: 300, description: "Everything you need for a fun night", image: "📦", stock: 5 }
      ];
      res.json(mockToys);
    } catch (err) {
      console.error("Failed to list toys", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/toys/purchase", async (req, res) => {
    const { userId, toyId } = req.body;
    if (!userId || !toyId) return res.status(400).json({ error: "Missing fields" });

    try {
      const toyDoc = await db.collection("adult_toys").doc(toyId).get();
      if (!toyDoc.exists) return res.status(404).json({ error: "Toy not found" });
      const toy = toyDoc.data();

      await db.runTransaction(async (transaction) => {
        const userRef = db.collection("users").doc(userId);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error("User not found");

        const userBalance = userDoc.data()?.balance || 0;
        const price = toy?.price || 0;

        if (userBalance < price) throw new Error("Insufficient balance");
        if ((toy?.stock || 0) <= 0) throw new Error("Out of stock");

        transaction.update(userRef, { 
          balance: FieldValue.increment(-price)
        });

        transaction.update(db.collection("adult_toys").doc(toyId), {
          stock: FieldValue.increment(-1)
        });

        const orderRef = db.collection("orders").doc();
        transaction.set(orderRef, {
          userId,
          itemId: toyId,
          type: "adult_toy",
          status: "pending",
          amount: price,
          createdAt: FieldValue.serverTimestamp()
        });

        const txRef = db.collection("transactions").doc();
        transaction.set(txRef, {
          userId,
          amount: -price,
          type: "toy_purchase",
          relatedId: toyId,
          createdAt: FieldValue.serverTimestamp()
        });
      });

      res.json({ success: true });
    } catch (err) {
      console.error("Toy purchase failed", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
    }
  });

  app.post("/api/sections/unlock", async (req, res) => {
    const { userId, sectionId } = req.body;
    if (!userId || !sectionId) return res.status(400).json({ error: "Missing fields" });

    try {
      const sectionDoc = await db.collection("sections").doc(sectionId).get();
      if (!sectionDoc.exists) return res.status(404).json({ error: "Section not found" });
      const section = sectionDoc.data();

      await db.runTransaction(async (transaction) => {
        const userRef = db.collection("users").doc(userId);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error("User not found");

        const userBalance = userDoc.data()?.balance || 0;
        const price = section?.price || 0;

        if (userBalance < price) throw new Error("Insufficient balance");

        transaction.update(userRef, { 
          balance: FieldValue.increment(-price),
          unlockedSections: FieldValue.arrayUnion(sectionId)
        });

        const txRef = db.collection("transactions").doc();
        transaction.set(txRef, {
          userId,
          amount: -price,
          type: "section_unlock",
          relatedId: sectionId,
          createdAt: FieldValue.serverTimestamp()
        });
      });

      res.json({ success: true });
    } catch (err) {
      console.error("Unlock failed", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
    }
  });

  // Save audio recording
  app.post("/api/user/recordings/save", async (req, res) => {
    const { userId, roomId, modelName, audioData, title } = req.body;
    if (!userId || !audioData) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const recordingObj = {
        roomId: roomId || "",
        modelId: userId,
        modelName: modelName || "Anonymous",
        audioData,
        title: title || `${modelName || 'Model'}'s Stream Recording`,
        createdAt: FieldValue.serverTimestamp()
      };

      // Save in user subcollection
      await db.collection("users").doc(userId).collection("recordings").add(recordingObj);
      
      // Save to top-level recordings collection for On-Demand tab
      await db.collection("recordings").add(recordingObj);

      res.json({ success: true });
    } catch (err) {
      console.error("Failed to save recording:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 9. POST /api/user/follow
  app.post("/api/user/follow", async (req, res) => {
    const { followerId, followingId, action } = req.body;
    if (!followerId || !followingId || !action) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify token for safety
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    try {
      const decodedToken = await auth.verifyIdToken(token);
      if (decodedToken.uid !== followerId) {
        return res.status(403).json({ error: "Forbidden: UID mismatch" });
      }
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    try {
      const followId = `${followerId}_${followingId}`;
      const followRef = db.collection("follows").doc(followId);
      const followerRef = db.collection("users").doc(followerId);
      const followingRef = db.collection("users").doc(followingId);

      // Check if users exist before transaction
      const [followerDoc, followingDoc] = await Promise.all([
        followerRef.get(),
        followingRef.get()
      ]);

      if (!followerDoc.exists || !followingDoc.exists) {
        return res.status(404).json({ error: "User or model not found" });
      }

      await db.runTransaction(async (transaction: any) => {
        const followDoc = await transaction.get(followRef);
        
        if (action === "follow") {
          if (followDoc.exists) return; // Already following
          transaction.set(followRef, {
            followerId,
            followingId,
            createdAt: FieldValue.serverTimestamp()
          });
          transaction.update(followerRef, { followingCount: FieldValue.increment(1) });
          transaction.update(followingRef, { followersCount: FieldValue.increment(1) });
        } else if (action === "unfollow") {
          if (!followDoc.exists) return; // Not following
          transaction.delete(followRef);
          transaction.update(followerRef, { followingCount: FieldValue.increment(-1) });
          transaction.update(followingRef, { followersCount: FieldValue.increment(-1) });
        }
      });

      res.json({ success: true });
    } catch (err) {
      console.error("Follow action failed", err);
      // If it's a permission error, it might be due to the named database or service account roles
      if (err instanceof Error && err.message.includes("PERMISSION_DENIED")) {
        return res.status(500).json({ error: "Firestore Permission Denied. Please ensure the service account has access to the named database." });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user recordings
  app.get("/api/user/recordings/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
      const snapshot = await db.collection("users").doc(userId).collection("recordings").orderBy("createdAt", "desc").get();
      const recordings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(recordings);
    } catch (err: any) {
      console.error("Failed to fetch recordings:", {
        message: err.message,
        code: err.code,
        details: err.details,
        stack: err.stack
      });
      res.status(500).json({ error: "Internal server error", details: err.message });
    }
  });



  // --- MODEL APPLICATION ENDPOINTS ---

  // Submit application
  app.post("/api/model-application/submit", async (req, res) => {
    const { userId, userDisplayName, userEmail, fullName, age, socialLinks, contentDescription } = req.body;
    
    if (!userId || !fullName || !age || !socialLinks || !contentDescription) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const existing = await db.collection("model_applications")
        .where("userId", "==", userId)
        .where("status", "==", "pending")
        .get();
        
      if (!existing.empty) {
        return res.status(400).json({ error: "You already have a pending application." });
      }

      await db.collection("model_applications").add({
        userId,
        userDisplayName,
        userEmail,
        fullName,
        age: parseInt(age),
        socialLinks,
        contentDescription,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp()
      });

      res.json({ success: true });
    } catch (err) {
      console.error("Failed to submit application:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get pending applications (Admin)
  app.get("/api/admin/model-applications", adminOnly, async (req, res) => {
    try {
      const snapshot = await db.collection("model_applications")
        .where("status", "==", "pending")
        .orderBy("createdAt", "desc")
        .get();
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(apps);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Approve application (Admin)
  app.post("/api/admin/model-applications/approve", adminOnly, async (req, res) => {
    const { applicationId, userId } = req.body;
    if (!applicationId || !userId) return res.status(400).json({ error: "Missing fields" });

    try {
      await db.runTransaction(async (t: any) => {
        const appRef = db.collection("model_applications").doc(applicationId);
        const userRef = db.collection("users").doc(userId);
        
        t.update(appRef, { status: 'approved' });
        t.update(userRef, { role: 'model' });
      });
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to approve application:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Reject application (Admin)
  app.post("/api/admin/model-applications/reject", adminOnly, async (req, res) => {
    const { applicationId } = req.body;
    if (!applicationId) return res.status(400).json({ error: "Missing fields" });

    try {
      await db.collection("model_applications").doc(applicationId).update({ status: 'rejected' });
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to reject application:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // --- ADMIN ENDPOINTS ---

  // Get all users
  app.get("/api/admin/users", adminOnly, async (req, res) => {
    try {
      const snapshot = await db.collection("users").orderBy("createdAt", "desc").get();
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Update user role or ban status
  app.post("/api/admin/user/update", adminOnly, async (req, res) => {
    const { userId, role, isBanned, balance } = req.body;
    try {
      const updateData: any = {};
      if (role) updateData.role = role;
      if (typeof isBanned === "boolean") updateData.isBanned = isBanned;
      if (typeof balance === "number") updateData.balance = balance;

      await db.collection("users").doc(userId).update(updateData);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Get all lives (including ended)
  app.get("/api/admin/lives", adminOnly, async (req, res) => {
    try {
      const snapshot = await db.collection("lives").orderBy("startedAt", "desc").get();
      const lives = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(lives);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch lives" });
    }
  });

  // Terminate a live session
  app.post("/api/admin/live/terminate", adminOnly, async (req, res) => {
    const { liveId } = req.body;
    try {
      await db.collection("lives").doc(liveId).update({
        status: "ended",
        endedAt: FieldValue.serverTimestamp(),
        terminatedByAdmin: true
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to terminate live" });
    }
  });

  // Get all reports
  app.get("/api/admin/reports", adminOnly, async (req, res) => {
    try {
      const snapshot = await db.collection("reports").orderBy("createdAt", "desc").get();
      const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(reports);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  // Resolve a report
  app.post("/api/admin/report/resolve", adminOnly, async (req, res) => {
    const { reportId, status } = req.body; // resolved, dismissed
    try {
      await db.collection("reports").doc(reportId).update({
        status,
        resolvedAt: FieldValue.serverTimestamp(),
        resolvedBy: (req as any).admin.uid
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to resolve report" });
    }
  });

  // Vault Management
  app.get("/api/admin/vault", adminOnly, async (req, res) => {
    try {
      const snapshot = await db.collection("vault").get();
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch vault: " + err.message });
    }
  });

  // Stripe Management (Connect & Vault Sync)
  app.post("/api/admin/stripe/sync", adminOnly, async (req, res) => {
    try {
      const stripe = await getStripeAsync();
      
      // 1. Fetch Connected Accounts
      const accounts = await stripe.accounts.list({ limit: 100 });
      for (const account of accounts.data) {
          await db.collection("stripe_accounts").doc(account.id).set(account, { merge: true });
      }
      
      // 2. Fetch Transactions (Charges)
      const charges = await stripe.charges.list({ limit: 100 });
      for (const charge of charges.data) {
          await db.collection("stripe_transactions").doc(charge.id).set(charge, { merge: true });
      }
      
      res.json({ success: true, accounts: accounts.data.length, charges: charges.data.length });
    } catch (err: any) {
      console.error("Stripe sync failed:", err);
      res.status(500).json({ error: "Failed to sync: " + err.message });
    }
  });

  app.get("/api/admin/stripe/data", adminOnly, async (req, res) => {
    try {
      const accountsSnap = await db.collection("stripe_accounts").get();
      const chargesSnap = await db.collection("stripe_transactions").get();
      
      res.json({
        accounts: accountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        transactions: chargesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      });
    } catch (err: any) {
       console.error("Failed to fetch stripe data:", err);
       res.status(500).json({ error: "Failed to fetch: " + err.message });
    }
  });

  // Store Management
  app.get("/api/admin/store", adminOnly, async (req, res) => {
    try {
      const snapshot = await db.collection("store").get();
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch store: " + err.message });
    }
  });

  app.post("/api/admin/store/add", adminOnly, async (req, res) => {
    const item = req.body;
    try {
      const docRef = await db.collection("store").add({
        ...item,
        createdAt: FieldValue.serverTimestamp()
      });
      res.json({ id: docRef.id });
    } catch (err) {
      res.status(500).json({ error: "Failed to add store item" });
    }
  });

  app.post("/api/admin/store/update", adminOnly, async (req, res) => {
    const { id, ...data } = req.body;
    try {
      await db.collection("store").doc(id).update(data);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update store item" });
    }
  });

  // Security Validation Endpoint
  app.post("/api/admin/security/validate", adminOnly, (req, res) => {
    const token = process.env.MASTER_KMS_TOKEN_184;
    const signature = process.env.LIVE_KMS_SIGNATURE_184;
    
    // Basic compliance integrity check
    const integrity = !!(
      token && 
      signature && 
      token.length > 10 && 
      signature.length > 10
    );
    
    res.json({
      status: integrity ? "VALID" : "INVALID",
      masterToken: token ? "OK" : "MISSING",
      masterSignature: signature ? "OK" : "MISSING",
      expiration: "Live Security Rotation Active"
    });
  });

  app.post("/api/admin/store/delete", adminOnly, async (req, res) => {
    const { id } = req.body;
    try {
      await db.collection("store").doc(id).delete();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete store item" });
    }
  });

  // Section Management
  app.get("/api/admin/sections", adminOnly, async (req, res) => {
    try {
      const snapshot = await db.collection("sections").get();
      const sections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(sections);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch sections" });
    }
  });

  app.post("/api/admin/section/add", adminOnly, async (req, res) => {
    const section = req.body;
    try {
      const docRef = await db.collection("sections").add({
        ...section,
        createdAt: FieldValue.serverTimestamp()
      });
      res.json({ id: docRef.id });
    } catch (err) {
      res.status(500).json({ error: "Failed to add section" });
    }
  });

  app.post("/api/admin/section/update", adminOnly, async (req, res) => {
    const { id, ...data } = req.body;
    try {
      await db.collection("sections").doc(id).update(data);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update section" });
    }
  });

  app.post("/api/admin/section/delete", adminOnly, async (req, res) => {
    const { id } = req.body;
    try {
      await db.collection("sections").doc(id).delete();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete section" });
    }
  });

  // Adult Toys Management
  app.get("/api/admin/toys", adminOnly, async (req, res) => {
    try {
      const snapshot = await db.collection("adult_toys").get();
      const toys = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(toys);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch toys" });
    }
  });

  app.post("/api/admin/toys/add", adminOnly, async (req, res) => {
    const toy = req.body;
    try {
      const docRef = await db.collection("adult_toys").add({
        ...toy,
        createdAt: FieldValue.serverTimestamp()
      });
      res.json({ id: docRef.id });
    } catch (err) {
      res.status(500).json({ error: "Failed to add toy" });
    }
  });

  app.post("/api/admin/toys/update", adminOnly, async (req, res) => {
    const { id, ...data } = req.body;
    try {
      await db.collection("adult_toys").doc(id).update(data);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update toy" });
    }
  });

  app.post("/api/admin/toys/delete", adminOnly, async (req, res) => {
    const { id } = req.body;
    try {
      await db.collection("adult_toys").doc(id).delete();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete toy" });
    }
  });

  // Orders Management
  app.get("/api/admin/orders", adminOnly, async (req, res) => {
    try {
      const snapshot = await db.collection("orders").orderBy("createdAt", "desc").get();
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/admin/order/update", adminOnly, async (req, res) => {
    const { id, status } = req.body;
    try {
      await db.collection("orders").doc(id).update({ status });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  // Transactions Management
  app.get("/api/admin/transactions", adminOnly, async (req, res) => {
    try {
      const snapshot = await db.collection("transactions").orderBy("createdAt", "desc").limit(100).get();
      const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(transactions);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Settings Management
  app.get("/api/admin/settings", adminOnly, async (req, res) => {
    try {
      const doc = await db.collection("settings").doc("keys").get();
      res.json(doc.exists ? doc.data() : {});
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/admin/settings", adminOnly, async (req, res) => {
    try {
      const updates = req.body;
      const filtered = {
        agoraAppId: updates.agoraAppId || "",
        agoraAppCertificate: updates.agoraAppCertificate || "",
        stripeSecretKey: updates.stripeSecretKey || "",
        stripePublishableKey: updates.stripePublishableKey || "",
        kmsToken: updates.kmsToken || "",
        kmsSignature: updates.kmsSignature || "",
        // Dynamic Stripe Webhook rotating keyring & Web3 configuration properties
        API_BEAST_MASTER: updates.API_BEAST_MASTER || "",
        STRIPE_SK_KEYINFO: updates.STRIPE_SK_KEYINFO || "",
        STRIPE_WH_KEYINFO: updates.STRIPE_WH_KEYINFO || "",
        STRIPE_SK_SANDBOX: updates.STRIPE_SK_SANDBOX || "",
        STRIPE_WH_SANDBOX: updates.STRIPE_WH_SANDBOX || "",
        STRIPE_SK_SUPPORT1: updates.STRIPE_SK_SUPPORT1 || "",
        STRIPE_WH_SUPPORT1: updates.STRIPE_WH_SUPPORT1 || "",
        STRIPE_SK_SUPPORT2: updates.STRIPE_SK_SUPPORT2 || "",
        STRIPE_WH_SUPPORT2: updates.STRIPE_WH_SUPPORT2 || "",
        RPC_NODE_URL: updates.RPC_NODE_URL || "",
        PRIVATE_KEY: updates.PRIVATE_KEY || "",
        CONTRACT_ADDRESS: updates.CONTRACT_ADDRESS || "",
        // Added Gemini API Key & GitHub parameters
        geminiApiKey: updates.geminiApiKey || "",
        githubClientId: updates.githubClientId || "",
        githubClientSecret: updates.githubClientSecret || "",
        githubToken: updates.githubToken || "",
        githubRepo: updates.githubRepo || "",
        githubOwner: updates.githubOwner || ""
      };
      await db.collection("settings").doc("keys").set(filtered, { merge: true });
      cachedSettings = await db.collection("settings").doc("keys").get().then((d: any) => d.data());
      cachedSettingsTime = Date.now();
      
      // Reset AI Client to allow lazy reinitialization with new Gemini API key
      aiClient = null;
      
      // Update .env file and process.env memory dynamically as requested (تثبيتها في البيئة مباشرة وتحديث .env)
      try {
        const envMapping: Record<string, string> = {
          VITE_AGORA_APP_ID: filtered.agoraAppId,
          AGORA_APP_CERTIFICATE: filtered.agoraAppCertificate,
          STRIPE_SECRET_KEY: filtered.stripeSecretKey,
          VITE_STRIPE_PUBLISHABLE_KEY: filtered.stripePublishableKey,
          LIVE_KMS_TOKEN_184: filtered.kmsToken,
          LIVE_KMS_SIGNATURE_184: filtered.kmsSignature,
          API_BEAST_MASTER: filtered.API_BEAST_MASTER,
          STRIPE_SK_KEYINFO: filtered.STRIPE_SK_KEYINFO,
          STRIPE_WH_KEYINFO: filtered.STRIPE_WH_KEYINFO,
          STRIPE_SK_SANDBOX: filtered.STRIPE_SK_SANDBOX,
          STRIPE_WH_SANDBOX: filtered.STRIPE_WH_SANDBOX,
          STRIPE_SK_SUPPORT1: filtered.STRIPE_SK_SUPPORT1,
          STRIPE_WH_SUPPORT1: filtered.STRIPE_WH_SUPPORT1,
          STRIPE_SK_SUPPORT2: filtered.STRIPE_SK_SUPPORT2,
          STRIPE_WH_SUPPORT2: filtered.STRIPE_WH_SUPPORT2,
          RPC_NODE_URL: filtered.RPC_NODE_URL,
          PRIVATE_KEY: filtered.PRIVATE_KEY,
          CONTRACT_ADDRESS: filtered.CONTRACT_ADDRESS,
          GEMINI_API_KEY: filtered.geminiApiKey,
          GITHUB_CLIENT_ID: filtered.githubClientId,
          GITHUB_CLIENT_SECRET: filtered.githubClientSecret,
          GITHUB_TOKEN: filtered.githubToken,
          GITHUB_REPO: filtered.githubRepo,
          GITHUB_OWNER: filtered.githubOwner
        };

        const envPath = path.join(process.cwd(), ".env");
        let content = "";
        if (fs.existsSync(envPath)) {
          content = fs.readFileSync(envPath, "utf-8");
        } else {
          // Fallback if env doesn't exist yet, we seed with example headers or empty
          content = "# Generated Environment Variables\n";
        }

        for (const [key, val] of Object.entries(envMapping)) {
          // Set in active node process runtime memory immediately
          process.env[key] = val;

          const regex = new RegExp(`^${key}=.*`, "m");
          if (regex.test(content)) {
            content = content.replace(regex, `${key}="${val.replace(/"/g, '\\"')}"`);
          } else {
            content += `\n${key}="` + val.replace(/"/g, '\\"') + `"`;
          }
        }

        fs.writeFileSync(envPath, content.trim() + "\n", "utf-8");
        console.log("Successfully synced all key provisions to physical .env file & environment process space!");
      } catch (envError: any) {
        console.error("Failed to write keys to physical environmental space (.env):", envError.message);
      }

      res.json({ success: true, settings: cachedSettings });
    } catch (err) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // ==========================================
  // Stripe Webhooks & AI Khokha Administration
  // ==========================================

  let aiClient: GoogleGenAI | null = null;
  function getGeminiAI() {
    if (!aiClient) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  // Public Endpoint for Stripe Webhooks
  app.post("/api/webhooks/stripe", async (req, res) => {
    let eventBody: any;
    try {
      eventBody = req.body;
    } catch (err) {
      return res.status(400).json({ error: "Invalid JSON payload" });
    }

    try {
      const eventId = eventBody?.id || `evt_web_${Date.now()}`;
      const eventType = eventBody?.type || "payment_intent.succeeded";
      const obj = eventBody?.data?.object || {};
      
      const logRecord = {
        id: eventId,
        type: eventType,
        createdAt: FieldValue.serverTimestamp(),
        payload: eventBody || {},
        status: "processed",
        source: "stripe_webhook",
        amount: obj.amount ? obj.amount / 100 : 0,
        currency: obj.currency || "usd",
        customerEmail: obj.customer_email || obj.receipt_email || "user@example.com"
      };

      await db.collection("stripe_webhooks").doc(eventId).set(logRecord);
      res.json({ received: true, id: eventId });
    } catch (err: any) {
      console.error("Error processing Stripe Webhook:", err);
      res.status(500).json({ error: "Webhook processing failed", details: err.message });
    }
  });

  // Simulate Stripe Webhook from Administration
  app.post("/api/admin/webhooks/simulate", adminOnly, async (req, res) => {
    const { type, amount, email } = req.body;
    try {
      const eventId = `evt_sim_${Math.random().toString(36).substring(2, 10)}`;
      const mockEvent = {
        id: eventId,
        type: type || "payment_intent.succeeded",
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: `pi_sim_${Math.random().toString(36).substring(2, 10)}`,
            amount: (amount || 100) * 100,
            currency: "usd",
            customer_email: email || "customer@example.com",
            receipt_email: email || "customer@example.com",
            status: "succeeded"
          }
        }
      };

      const logRecord = {
        id: eventId,
        type: mockEvent.type,
        createdAt: FieldValue.serverTimestamp(),
        payload: mockEvent,
        status: "simulated",
        source: "admin_dashboard",
        amount: amount || 100,
        currency: "usd",
        customerEmail: email || "customer@example.com"
      };

      await db.collection("stripe_webhooks").doc(eventId).set(logRecord);
      res.json({ success: true, event: logRecord });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get Webhook logs
  app.get("/api/admin/webhooks", adminOnly, async (req, res) => {
    try {
      const snapshot = await db.collection("stripe_webhooks").orderBy("createdAt", "desc").limit(50).get();
      const docs = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      res.json(docs);
    } catch (err: any) {
      console.error("Failed to fetch webhooks:", err);
      res.status(500).json({ error: "Failed to fetch webhooks" });
    }
  });

  // AI Khokha Admin Advisor Route
  app.post("/api/admin/khokha", adminOnly, async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    try {
      const [usersSnap, livesSnap, ordersSnap, reportsSnap] = await Promise.all([
        db.collection("users").count().get(),
        db.collection("lives").where("status", "==", "active").count().get(),
        db.collection("orders").count().get(),
        db.collection("reports").where("status", "==", "pending").count().get()
      ]).catch(() => [null, null, null, null]);

      const usersCount = usersSnap ? usersSnap.data().count : "unknown";
      const activeLivesCount = livesSnap ? livesSnap.data().count : "unknown";
      const totalOrdersCount = ordersSnap ? ordersSnap.data().count : "unknown";
      const pendingReportsCount = reportsSnap ? reportsSnap.data().count : "unknown";

      const systemInstruction = `You are Khokha (خوخة), the witty, direct, and brilliantly funny Gulf/Khaleeji AI Admin Supervisor. 
You control the administration panel of this live-streaming, multi-role Saas network.
Your tone:
- You speak fluent Gulf/Khaleeji Arabic dialect (اللهجة الخليجية البيضاء والنجدية/الكويتية/الإماراتية الحاضرة) with great enthusiasm, warmth, and humorous Gulf/Khaleeji slang ("يا طويل العمر", "يا بعد حيي", "فديتك", "يا زينك", "بشر يا شيخ", "يا هلا وغلا", "كفو والله", "على راسي يا بعد قلبي", "تأمر وتدلل").
- You are sassy, witty, yet extremely professional about root permissions, Stripe matrices, data protection, and key security.
- You reference Gulf/Khaleeji proverbs where appropriate (e.g. "اللي ما يعرف الصقر يشويه", "كل مطرود ملحوق", "يا غريب خلك أديب", "إذا فات الفوت ما ينفع الصوت").
- When referring to developer cardsnour6@gmail.com, respect them as the master developer (الريس والمهندس نور العرقجي العبقري) of the platform.
- Highlight the security rule: "مفيش شي اسمه sk_ مباشر طال عمرك.. مفتاح المستر keyinfo_live_ يتم تدوير مفاتيح sk_ منه تلقائياً لحمايتنا!".

Current system metrics from the databases for your situational awareness:
- Total registered users: ${usersCount}
- Active streaming live rooms: ${activeLivesCount}
- Total orders in database: ${totalOrdersCount}
- Pending reports to review: ${pendingReportsCount}
- Stripe Keyinfo Status: Active (prefix keyinfo_live_ configured).

Write a short, engaging, highly Khaleeji/Gulf response to the root administrator's prompt. Avoid bullet points, keep it unified as one or two highly cohesive Khaleeji conversational segments.`;

      const aiInstance = getGeminiAI();

      const response = await aiInstance.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 1.0,
        }
      });

      const replyText = response.text || "يا ريس خوخة تاهت في الـ Cloud شوية ورجعت، اسألني تاني كده!";
      res.json({ response: replyText });
    } catch (err: any) {
      console.error("Error in AI Khokha:", err);
      const funnyError = `يا طويل العمر، شكلنا نسينا نحط مفتاح الـ Gemini (process.env.GEMINI_API_KEY) في الـ Secrets! تكفى روح إعدادات الـ Secrets واشحن رصيد المفاتيح عشان خوخة تصحصح وتظبط لك الأمور والإدارة. (الخطأ: ${err.message})`;
      res.status(200).json({ response: funnyError, isError: true });
    }
  });

  // Socket.io logic
  io.on("connection", (socket) => {
    console.log("New socket connection:", socket.id);

    socket.on("register_user", (userId) => {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} registered private room for user: ${userId}`);
    });

    socket.on("join_live", (liveId) => {
      socket.join(`live_${liveId}`);
      console.log(`Socket ${socket.id} joined live room: ${liveId}`);
    });

    socket.on("leave_live", (liveId) => {
      socket.leave(`live_${liveId}`);
      console.log(`Socket ${socket.id} left live room: ${liveId}`);
    });

    socket.on("moderation_action", async (data) => {
      const { liveId, userId, action, duration, adminToken } = data;
      
      // Verify admin/model status
      try {
        const decodedToken = await auth.verifyIdToken(adminToken);
        const liveDoc = await db.collection("lives").doc(liveId).get();
        const liveData = liveDoc.data();
        const userDoc = await db.collection("users").doc(decodedToken.uid).get();
        const userData = userDoc.data();

        let isModel = liveData?.modelId === decodedToken.uid;
        if (!liveDoc.exists && liveId.startsWith("agency-")) {
          if ((liveId === "agency-1" && decodedToken.uid === "agency-u-1") ||
              (liveId === "agency-2" && decodedToken.uid === "agency-u-2")) {
            isModel = true;
          }
        }
        const isAdmin = userData?.role === "admin" || decodedToken.email === "cardsnour6@gmail.com" || decodedToken.email === "khokha@admin.com";

        if (!isModel && !isAdmin) {
          return socket.emit("error", { message: "Unauthorized moderation action" });
        }

        // Broadcast moderation action to the room
        io.to(`live_${liveId}`).emit("user_moderated", {
          userId,
          action, // "mute" or "ban"
          duration,
          liveId
        });

        console.log(`Moderation action: ${action} on user ${userId} in live ${liveId}`);
      } catch (err) {
        console.error("Moderation verification failed:", err);
        socket.emit("error", { message: "Invalid token" });
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  try {
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to listen on port 3000:", err);
    process.exit(1);
  }
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
