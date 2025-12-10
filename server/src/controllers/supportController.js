import db from "../db.js";

const DEFAULT_USER_ID = Number(process.env.DEFAULT_USER_ID || 1);
const DEFAULT_AGENT_ID = Number(
  process.env.SUPPORT_USER_ID || process.env.DEFAULT_AGENT_ID || DEFAULT_USER_ID + 1 || 2
);

function pickUserId(rawId) {
  const asNumber = Number(rawId);
  if (Number.isFinite(asNumber) && asNumber > 0) return asNumber;
  return DEFAULT_USER_ID;
}

function pickAgentId(rawId) {
  const asNumber = Number(rawId);
  if (Number.isFinite(asNumber) && asNumber > 0) return asNumber;
  return DEFAULT_AGENT_ID;
}

function ensureUser({ user_id, email, name }, callback) {
  const numericId = Number(user_id);
  if (Number.isFinite(numericId) && numericId > 0) {
    return callback(null, numericId);
  }

  const safeEmail =
    email && String(email).includes("@")
      ? String(email)
      : `guest-${Math.random().toString(16).slice(2)}@chat.local`;
  const displayName =
    name && String(name).trim().length > 0 ? String(name).trim() : "Guest";

  const findSql = "SELECT user_id FROM users WHERE email = ?";
  db.query(findSql, [safeEmail], (findErr, rows) => {
    if (findErr) {
      console.error("User lookup failed:", findErr);
      return callback(findErr);
    }
    if (rows.length > 0) {
      return callback(null, rows[0].user_id);
    }

    const insertSql = `
      INSERT INTO users (full_name, email, password_hash)
      VALUES (?, ?, 'support-auto')
    `;
    db.query(insertSql, [displayName, safeEmail], (insErr, result) => {
      if (insErr) {
        console.error("User create failed:", insErr);
        return callback(insErr);
      }
      callback(null, result.insertId);
    });
  });
}

function ensureConversation(userId, orderId, callback) {
  const findSql = `
    SELECT conversation_id, status
    FROM support_conversations
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `;

  db.query(findSql, [userId], (err, rows) => {
    if (err) {
      console.error("Support conversation lookup failed:", err);
      return callback(err);
    }

    if (rows.length > 0) {
      const { conversation_id } = rows[0];
      return callback(null, conversation_id);
    }

    const insertSql = `
      INSERT INTO support_conversations (user_id, order_id, status, created_at)
      VALUES (?, ?, 'open', NOW())
    `;
    db.query(insertSql, [userId, orderId || null], (insertErr, result) => {
      if (insertErr) {
        console.error("Support conversation could not be created:", insertErr);
        return callback(insertErr);
      }
      callback(null, result.insertId);
    });
  });
}

function mapMessages(rows, userId) {
  return rows.map((row) => ({
    id: row.message_id,
    text: row.message_text,
    sender_id: row.sender_id,
    from: row.sender_id === userId ? "customer" : "support",
    timestamp: row.created_at,
  }));
}

export function getConversation(req, res) {
  const orderId = req.query.order_id ? Number(req.query.order_id) : null;
  const incomingUserId = req.query.user_id;
  const { email, name } = req.query;

  ensureUser({ user_id: incomingUserId, email, name }, (userErr, userId) => {
    if (userErr) {
      return res.status(500).json({ error: "Kullanıcı oluşturulamadı" });
    }

    ensureConversation(userId, orderId, (convErr, conversationId) => {
      if (convErr) {
        return res.status(500).json({ error: "Destek kaydı açılamadı" });
      }

      const messagesSql = `
        SELECT message_id, sender_id, message_text, created_at
        FROM support_messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
      `;

      db.query(messagesSql, [conversationId], (msgErr, rows) => {
        if (msgErr) {
          console.error("Support messages fetch failed:", msgErr);
          return res.status(500).json({ error: "Mesajlar alınamadı" });
        }

        res.json({
          conversation_id: conversationId,
          user_id: userId,
          order_id: orderId,
          messages: mapMessages(rows, userId),
        });
      });
    });
  });
}

export function postCustomerMessage(req, res) {
  const orderId = req.body.order_id ? Number(req.body.order_id) : null;
  const { text, email, name } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Mesaj metni boş olamaz" });
  }

  ensureUser({ user_id: req.body.user_id, email, name }, (userErr, userId) => {
    if (userErr) {
      return res.status(500).json({ error: "Kullanıcı oluşturulamadı" });
    }

    ensureConversation(userId, orderId, (convErr, conversationId) => {
      if (convErr) {
        return res.status(500).json({ error: "Destek kaydı açılamadı" });
      }

      const insertSql = `
        INSERT INTO support_messages (conversation_id, sender_id, message_text, created_at)
        VALUES (?, ?, ?, NOW())
      `;

      db.query(insertSql, [conversationId, userId, text.trim()], (msgErr, result) => {
        if (msgErr) {
          console.error("Support message insert failed:", msgErr);
          return res.status(500).json({ error: "Mesaj kaydedilemedi" });
        }

        res.json({
          conversation_id: conversationId,
          message: {
            id: result.insertId,
            text: text.trim(),
            sender_id: userId,
            from: "customer",
            timestamp: new Date().toISOString(),
          },
          user_id: userId,
        });
      });
    });
  });
}

export function listConversations(req, res) {
  const sql = `
    SELECT 
      sc.conversation_id,
      sc.user_id,
      sc.order_id,
      sc.status,
      sc.created_at,
      u.full_name AS customer_name,
      (
        SELECT message_text FROM support_messages sm 
        WHERE sm.conversation_id = sc.conversation_id
        ORDER BY sm.created_at DESC
        LIMIT 1
      ) AS last_message,
      (
        SELECT created_at FROM support_messages sm 
        WHERE sm.conversation_id = sc.conversation_id
        ORDER BY sm.created_at DESC
        LIMIT 1
      ) AS last_message_at
    FROM support_conversations sc
    LEFT JOIN users u ON u.user_id = sc.user_id
    ORDER BY last_message_at DESC, sc.created_at DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Support conversations fetch failed:", err);
      return res.status(500).json({ error: "Konuşmalar alınamadı" });
    }

    res.json(
      rows.map((row) => ({
        id: row.conversation_id,
        user_id: row.user_id,
        order_id: row.order_id,
        status: row.status,
        created_at: row.created_at,
        customer_name: row.customer_name || `User #${row.user_id}`,
        last_message: row.last_message || "No message yet",
        last_message_at: row.last_message_at || row.created_at,
      }))
    );
  });
}

export function getConversationMessages(req, res) {
  const conversationId = Number(req.params.conversation_id);
  if (!conversationId) {
    return res.status(400).json({ error: "conversation_id zorunlu" });
  }

  const sqlMeta = `
    SELECT conversation_id, user_id, order_id
    FROM support_conversations
    WHERE conversation_id = ?
  `;

  db.query(sqlMeta, [conversationId], (metaErr, metaRows) => {
    if (metaErr) {
      console.error("Support conversation meta fetch failed:", metaErr);
      return res.status(500).json({ error: "Konuşma okunamadı" });
    }
    if (metaRows.length === 0) {
      return res.status(404).json({ error: "Konuşma bulunamadı" });
    }

    const conversation = metaRows[0];

    const sqlMessages = `
      SELECT message_id, sender_id, message_text, created_at
      FROM support_messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `;

    db.query(sqlMessages, [conversationId], (err, rows) => {
      if (err) {
        console.error("Support messages fetch failed:", err);
        return res.status(500).json({ error: "Mesajlar okunamadı" });
      }

      res.json({
        conversation_id: conversationId,
        user_id: conversation.user_id,
        order_id: conversation.order_id,
        messages: mapMessages(rows, conversation.user_id),
      });
    });
  });
}

export function postSupportReply(req, res) {
  const conversationId = Number(req.params.conversation_id);
  const agentId = pickAgentId(req.body.agent_id);
  const { text } = req.body;

  if (!conversationId) {
    return res.status(400).json({ error: "conversation_id zorunlu" });
  }
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Mesaj metni boş olamaz" });
  }

  const convoSql = `
    SELECT conversation_id, user_id
    FROM support_conversations
    WHERE conversation_id = ?
  `;

  db.query(convoSql, [conversationId], (metaErr, rows) => {
    if (metaErr) {
      console.error("Support conversation lookup failed:", metaErr);
      return res.status(500).json({ error: "Konuşma okunamadı" });
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: "Konuşma bulunamadı" });
    }

    const conversation = rows[0];
    const fallbackSender = conversation.user_id;
    const sender = Number.isFinite(agentId) ? agentId : fallbackSender;

    const insertSql = `
      INSERT INTO support_messages (conversation_id, sender_id, message_text, created_at)
      VALUES (?, ?, ?, NOW())
    `;

    const doInsert = (senderId, attemptFallback) => {
      db.query(insertSql, [conversationId, senderId, text.trim()], (err, result) => {
        if (err) {
          // If agent user_id is missing, retry with conversation owner id to satisfy FK.
          if (attemptFallback && senderId !== fallbackSender) {
            console.warn("Agent user missing, falling back to conversation user:", senderId, err?.code);
            return doInsert(fallbackSender, false);
          }
          console.error("Support reply insert failed:", err);
          return res.status(500).json({ error: "Mesaj kaydedilemedi" });
        }

        res.json({
          conversation_id: conversationId,
          message: {
            id: result.insertId,
            sender_id: senderId,
            from: "support",
            text: text.trim(),
            timestamp: new Date().toISOString(),
          },
        });
      });
    };

    doInsert(sender, true);
  });
}
