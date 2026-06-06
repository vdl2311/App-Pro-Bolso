import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as admin from 'firebase-admin';

// Inicializa Firebase Admin SE tiver a chave no env
// Se a chave não estiver no env (ex: ambiente dev inicial), ele ignora para não quebrar o app
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY && !admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin inicializado com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase Admin:', error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware para parsear JSON do Hotmart
  app.use(express.json());
  // O Hotmart também pode mandar form-urlencoded em algumas versões de webhook
  app.use(express.urlencoded({ extended: true }));

  // API route - Health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API route - Hotmart Webhook
  app.post("/api/hotmart-webhook", async (req, res) => {
    try {
      const hottok = req.headers['x-hotmart-hottok'] || req.query.hottok || req.body.hottok;
      
      // Verifica o Hottok configurado na Hotmart
      if (process.env.HOTMART_HOTTOK && hottok !== process.env.HOTMART_HOTTOK) {
        console.warn("❌ Webhook recebido com hottok inválido:", hottok);
        return res.status(401).json({ error: "Unauthorized hottok" });
      }

      console.log("🔔 Webhook Hotmart Recebido:", req.body);

      // Eventos comuns: PURCHASE_APPROVED, COMPRA_APROVADA
      const event = req.body.event || req.body.status; 
      
      // Hotmart Webhook Header/Body v1 vs v2 structure
      let data = req.body.data || req.body; 
      let buyer = data.buyer || data; 
      let email = buyer.email;
      let name = buyer.name;
      let status = buyer.status || event;

      if (!email) {
        return res.status(400).json({ error: "Missing email in payload" });
      }

      // Se Firebase Admin estiver configurado e a compra aprovada
      if (admin.apps.length && (status === 'APPROVED' || status === 'COMPRA_APROVADA' || event === 'PURCHASE_APPROVED')) {
          const db = admin.firestore();
          const auth = admin.auth();
          
          let userId;
          try {
            // Tenta achar o usuario no Auth pelo email
            const userRecord = await auth.getUserByEmail(email);
            userId = userRecord.uid;
            console.log(`✅ Usuário já existente encontrado: ${email} (UID: ${userId})`);
          } catch (e: any) {
            if (e.code === 'auth/user-not-found') {
              // Cria o usuario no auth
              const newUser = await auth.createUser({
                email: email,
                emailVerified: true,
                displayName: name,
                // Uma senha aleatória se não enviarmos magic link
                password: Math.random().toString(36).slice(-8) + 'Aa1!' 
              });
              userId = newUser.uid;
              console.log(`✅ Novo usuário criado no Auth: ${email} (UID: ${userId})`);
            } else {
              throw e;
            }
          }

          // Atualiza o Firestore ativando a conta
          await db.collection("users").doc(userId).set({
            email: email,
            isActive: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          console.log(`✅ Acesso liberado no Firestore para ${email}!`);
      } else {
          console.log(`⚠️ Firebase Admin não configurado OU status não é APPROVED (Status: ${status}). Ignorando gravação.`);
      }

      // Sempre responda 200 pra Hotmart saber que você processou
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("❌ Erro ao processar webhook Hotmart:", error);
      res.status(500).json({ error: "Internal error processing webhook" });
    }
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
