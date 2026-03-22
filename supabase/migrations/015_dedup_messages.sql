-- Remove duplicate user messages (same conversation, role, content, within 5 seconds of each other)
DELETE FROM messages a
USING messages b
WHERE a.id > b.id
  AND a.conversation_id = b.conversation_id
  AND a.role = b.role
  AND a.content = b.content
  AND a.role = 'user'
  AND ABS(EXTRACT(EPOCH FROM (a.created_at - b.created_at))) < 5;
