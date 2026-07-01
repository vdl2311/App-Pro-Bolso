import admin from 'firebase-admin';

// Inicializa Firebase Admin SE tiver a chave no env
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
if (serviceAccountJson && !admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin inicializado com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase Admin:', error);
  }
}

export default async function handler(req: any, res: any) {
  // Apenas permite requisições POST para o Webhook
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const hottok = req.headers['x-hotmart-hottok'] || req.query.hottok || req.body.hottok;
    
    // Verifica o Hottok configurado na Hotmart
    // Se a Vercel tiver a variavel HOTMART_HOTTOK injetada, ela validará
    if (process.env.HOTMART_HOTTOK && hottok !== process.env.HOTMART_HOTTOK) {
      console.warn("❌ Webhook recebido com hottok inválido:", hottok);
      return res.status(401).json({ error: "Unauthorized hottok" });
    }

    console.log("🔔 Webhook Hotmart Recebido:", req.body);

    const event = req.body.event || req.body.status; 
    let data = req.body.data || req.body; 
    let buyer = data.buyer || data; 
    let email = buyer.email;
    let name = buyer.name || buyer.first_name;
    let status = buyer.status || event;

    if (!email) {
      return res.status(400).json({ error: "Missing email in payload" });
    }

    // Se Firebase Admin estiver configurado e a compra aprovada
    if (admin.apps.length && (status === 'APPROVED' || status === 'COMPRA_APROVADA' || event === 'PURCHASE_APPROVED' || status === 'completed')) {
        const db = admin.firestore();
        const auth = admin.auth();
        
        let userId;
        try {
          const userRecord = await auth.getUserByEmail(email);
          userId = userRecord.uid;
          console.log(`✅ Usuário já existente encontrado: ${email} (UID: ${userId})`);
        } catch (e: any) {
          if (e.code === 'auth/user-not-found') {
            const newUser = await auth.createUser({
              email: email,
              emailVerified: true,
              displayName: name,
              password: Math.random().toString(36).slice(-8) + 'Aa1!' 
            });
            userId = newUser.uid;
            console.log(`✅ Novo usuário criado no Auth: ${email} (UID: ${userId})`);
          } else {
            throw e;
          }
        }

        await db.collection("users").doc(userId).set({
          email: email,
          isActive: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`✅ Acesso liberado no Firestore para ${email}!`);
    } else {
        console.log(`⚠️ Firebase Admin não configurado OU status não é APPROVED (Status: ${status}). Ignorando gravação.`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("❌ Erro ao processar webhook Hotmart:", error);
    res.status(500).json({ error: "Internal error processing webhook" });
  }
}
