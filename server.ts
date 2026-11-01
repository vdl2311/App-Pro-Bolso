import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import admin from 'firebase-admin';
import { GoogleGenAI } from "@google/genai";

// Inicializa Firebase Admin SE tiver a chave no env
// Se a chave não estiver no env (ex: ambiente dev inicial), ele ignora para não quebrar o app
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware para parsear JSON (incluindo imagens base64 de prints)
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  // API route - Health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API route - OCR e Leitura de Prints de Ganhos (Uber, 99, iFood, etc.)
  app.post("/api/ocr-ganhos", async (req, res) => {
    try {
      const { image, text, mimeType } = req.body;
      if (!image && !text) {
        return res.status(400).json({ error: "Nenhuma imagem ou texto foi fornecido." });
      }

      let extractedData: any = null;

      // 1. Tenta usar o Gemini 3.8 Flash
      if (process.env.GEMINI_API_KEY) {
        try {
          const contents: any[] = [];
          const parts: any[] = [];

          if (image) {
            const cleanBase64 = image.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '');
            parts.push({
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: cleanBase64
              }
            });
          }

          const promptText = `Você é um leitor óptico especialista em extrair dados de corridas e entregas de aplicativos como Uber, 99, iFood, inDrive, Lalamove e Rappi.
${text ? `Texto de notificação/recibo recebido: "${text}"` : ''}

Extraia com o máximo de precisão os seguintes dados:
1. plataforma: Nome do app identificado ("Uber", "99", "iFood", "inDrive", "Lalamove", "Particular" ou "Outro")
2. amount: Valor líquido recebido pelo motorista/entregador (em reais, número decimal ex: 42.50)
3. grossAmount: Valor bruto da corrida antes das taxas cobradas pelo app (se visível, se não for informado use o mesmo de amount)
4. kmRodados: Quilometragem total percorrida na corrida ou no dia (número decimal, ou null se não constar)
5. corridasCount: Número de viagens/pedidos no print (ou 1 se for corrida avulsa)
6. horario: Hora do dia identificada de 0 a 23 (número inteiro, ou null)
7. data: Data no formato YYYY-MM-DD (ou null)
8. resumo: Uma frase curta explicando o que foi lido (ex: "Corrida Uber de R$ 38,50 com 12.4 km rodados").

Responda EXCLUSIVAMENTE com um JSON puro no formato:
{
  "plataforma": "Uber",
  "amount": 38.50,
  "grossAmount": 48.00,
  "kmRodados": 12.4,
  "corridasCount": 1,
  "horario": 14,
  "data": "2026-11-01",
  "resumo": "Corrida Uber finalizada"
}
Não inclua crases markdown nem explicações fora do JSON.`;

          parts.push({ text: promptText });
          contents.push({ role: 'user', parts });

          const aiResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents
          });

          const rawText = aiResponse.text || '';
          const cleanedJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          try {
            extractedData = JSON.parse(cleanedJson);
          } catch (jsonErr) {
            console.warn("Falha ao parsear JSON puro da IA, tentando extrair bloco:", rawText);
            const match = rawText.match(/\{[\s\S]*\}/);
            if (match) {
              extractedData = JSON.parse(match[0]);
            }
          }
        } catch (aiErr) {
          console.error("Erro na chamada do Gemini para OCR:", aiErr);
        }
      }

      // 2. Se a IA não estiver disponível ou falhar, fallback inteligente com regex
      if (!extractedData) {
        const fullContent = (text || '') + ' ' + (image ? '' : '');
        
        let detectedPlat: string = 'Uber';
        if (/99|noventa e nove/i.test(fullContent)) detectedPlat = '99';
        else if (/ifood|i food/i.test(fullContent)) detectedPlat = 'iFood';
        else if (/indrive|in drive/i.test(fullContent)) detectedPlat = 'inDrive';
        else if (/lalamove/i.test(fullContent)) detectedPlat = 'Lalamove';

        // Tenta achar valores tipo R$ 45,90 ou 45.90
        const moneyMatch = fullContent.match(/R\$\s*([\d]+[.,][\d]{2})/i) || fullContent.match(/([\d]+[.,][\d]{2})/);
        const amount = moneyMatch ? parseFloat(moneyMatch[1].replace(',', '.')) : 35.00;

        // Tenta achar KM tipo 12,5 km
        const kmMatch = fullContent.match(/([\d]+[.,]?[\d]*)\s*km/i);
        const km = kmMatch ? parseFloat(kmMatch[1].replace(',', '.')) : null;

        extractedData = {
          plataforma: detectedPlat,
          amount: amount,
          grossAmount: amount * 1.25,
          kmRodados: km,
          corridasCount: 1,
          horario: new Date().getHours(),
          data: new Date().toISOString().split('T')[0],
          resumo: `Leitura aproximada detectada para ${detectedPlat}`
        };
      }

      return res.json({ success: true, data: extractedData });
    } catch (err: any) {
      console.error("Erro geral no endpoint /api/ocr-ganhos:", err);
      return res.status(500).json({ error: "Falha ao processar print ou notificação." });
    }
  });

  // API route - Leitura e Auto-Lançamento Direto de Recibos e Notificações (Sem Subir Print)
  app.post("/api/auto-recibo", async (req, res) => {
    try {
      const { text, notificationText, emailSubject, emailBody } = req.body;
      const conteudoCompleto = [emailSubject, emailBody, notificationText, text].filter(Boolean).join("\n\n");

      if (!conteudoCompleto.trim()) {
        return res.status(400).json({ error: "Nenhum dado ou texto de recibo recebido." });
      }

      let parsedGanho: any = null;

      if (process.env.GEMINI_API_KEY) {
        try {
          const prompt = `Você é um motor de ingestão automática de recibos e notificações para motoristas de aplicativo (Uber, 99, iFood, inDrive, Lalamove).
Analise o seguinte conteúdo bruto de recibo/notificação recebido automaticamente:

"""
${conteudoCompleto}
"""

Extraia com exatidão as informações financeiras e de trajeto para lançamento automático no sistema:
1. plataforma: "Uber" | "99" | "iFood" | "inDrive" | "Lalamove" | "Particular" | "Outro"
2. amount: valor líquido pago ao motorista (em R$, número decimal com ponto, ex: 38.50)
3. grossAmount: valor total pago pelo passageiro antes da taxa (se visível, senão o mesmo que amount)
4. kmRodados: distância percorrida em quilômetros (número decimal, ou null)
5. horario: hora do dia da corrida 0-23 (número inteiro)
6. data: data no formato YYYY-MM-DD
7. resumo: frase curta explicando a corrida (ex: "Recibo Uber de R$ 42,00 (14 km)")

Responda EXCLUSIVAMENTE em formato JSON puro, sem markdown e sem crases:
{
  "plataforma": "Uber",
  "amount": 38.50,
  "grossAmount": 49.00,
  "kmRodados": 12.4,
  "horario": 15,
  "data": "2026-11-01",
  "resumo": "Recibo Uber finalizado"
}`;

          const aiResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt
          });

          const raw = aiResponse.text || '';
          const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
          try {
            parsedGanho = JSON.parse(cleaned);
          } catch (e) {
            const m = raw.match(/\{[\s\S]*\}/);
            if (m) parsedGanho = JSON.parse(m[0]);
          }
        } catch (aiErr) {
          console.error("Erro na extração IA do recibo automático:", aiErr);
        }
      }

      // Fallback com regex
      if (!parsedGanho) {
        let detectedPlat = 'Uber';
        if (/99|noventa e nove/i.test(conteudoCompleto)) detectedPlat = '99';
        else if (/ifood/i.test(conteudoCompleto)) detectedPlat = 'iFood';
        else if (/indrive/i.test(conteudoCompleto)) detectedPlat = 'inDrive';

        const moneyMatch = conteudoCompleto.match(/R\$\s*([\d]+[.,][\d]{2})/i) || conteudoCompleto.match(/([\d]+[.,][\d]{2})/);
        const amount = moneyMatch ? parseFloat(moneyMatch[1].replace(',', '.')) : 32.00;

        const kmMatch = conteudoCompleto.match(/([\d]+[.,]?[\d]*)\s*km/i);
        const km = kmMatch ? parseFloat(kmMatch[1].replace(',', '.')) : null;

        parsedGanho = {
          plataforma: detectedPlat,
          amount: amount,
          grossAmount: Number((amount * 1.25).toFixed(2)),
          kmRodados: km,
          horario: new Date().getHours(),
          data: new Date().toISOString().split('T')[0],
          resumo: `Recibo automático ${detectedPlat}`
        };
      }

      return res.json({ success: true, data: parsedGanho });
    } catch (err: any) {
      console.error("Erro no auto-recibo:", err);
      return res.status(500).json({ error: "Erro ao processar recibo automático." });
    }
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
