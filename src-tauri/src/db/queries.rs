use super::connection::ChatDb;
use super::models::*;
use super::parser::decode_attributed_body;
use crate::utils::mac_timestamp_to_datetime;
use rusqlite::{params, Row};

impl ChatDb {
    /// Get all conversations (chats) with their last message
    pub fn get_conversations(&self) -> Result<Vec<Conversation>, rusqlite::Error> {
        let sql = r#"
            SELECT
                c.ROWID, c.guid, c.display_name,
                CASE WHEN c.style = 43 THEN 1 ELSE 0 END as is_group,
                (SELECT COUNT(*) FROM chat_handle_join WHERE chat_id = c.ROWID) as participant_count
            FROM chat c
            ORDER BY c.ROWID DESC
        "#;

        let mut stmt = self.conn.prepare(sql)?;
        let chats = stmt
            .query_map([], |row| {
                Ok(Chat {
                    id: row.get(0)?,
                    guid: row.get(1)?,
                    display_name: row.get(2)?,
                    is_group: row.get::<_, i32>(3)? == 1,
                    participant_count: row.get(4)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        // Get participants and last message for each chat
        let mut conversations = Vec::new();
        for chat in chats {
            let participants = self.get_chat_participants(chat.id)?;
            let last_message = self.get_last_message_for_chat(chat.id)?;
            let message_count = self.get_message_count_for_chat(chat.id)?;

            conversations.push(Conversation {
                chat,
                participants,
                last_message,
                message_count,
            });
        }

        Ok(conversations)
    }

    /// Search messages by text content
    pub fn search_messages(&self, query: &str, limit: i64) -> Result<Vec<Message>, rusqlite::Error> {
        let sql = r#"
            SELECT
                m.ROWID, m.guid, m.text, m.attributedBody,
                m.handle_id, m.date, m.is_from_me, m.service,
                h.id as handle_identifier
            FROM message m
            LEFT JOIN handle h ON m.handle_id = h.ROWID
            WHERE m.text LIKE ?1
            ORDER BY m.date DESC
            LIMIT ?2
        "#;

        let search_pattern = format!("%{}%", query);
        let mut stmt = self.conn.prepare(sql)?;

        let results = stmt
            .query_map(params![&search_pattern, limit], |row| {
                Self::static_row_to_message(row)
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(results)
    }

    /// Get messages for a specific chat within a date range
    pub fn get_messages_for_chat(
        &self,
        chat_id: i64,
        limit: i64,
    ) -> Result<Vec<Message>, rusqlite::Error> {
        let sql = r#"
            SELECT
                m.ROWID, m.guid, m.text, m.attributedBody,
                m.handle_id, m.date, m.is_from_me, m.service,
                h.id as handle_identifier
            FROM message m
            INNER JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
            LEFT JOIN handle h ON m.handle_id = h.ROWID
            WHERE cmj.chat_id = ?1
            ORDER BY m.date DESC
            LIMIT ?2
        "#;

        let mut stmt = self.conn.prepare(sql)?;
        let results = stmt
            .query_map(params![chat_id, limit], |row| {
                Self::static_row_to_message(row)
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(results)
    }

    /// Execute a custom SQL query (for NL2SQL results)
    pub fn execute_search_query(&self, sql: &str) -> Result<Vec<Message>, String> {
        // Validate query is SELECT only
        let normalized = sql.trim().to_uppercase();
        if !normalized.starts_with("SELECT") {
            return Err("Only SELECT queries are allowed".to_string());
        }

        // Validate no dangerous operations
        let forbidden = [
            "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE",
        ];
        for keyword in forbidden {
            if normalized.contains(keyword) {
                return Err(format!("{} statements are not allowed", keyword));
            }
        }

        let mut stmt = self.conn.prepare(sql).map_err(|e| e.to_string())?;

        let results = stmt
            .query_map([], |row| Self::static_row_to_message(row))
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;
        Ok(results)
    }

    /// Get context messages before a given message
    pub fn get_context_before(
        &self,
        message_id: i64,
        count: i64,
    ) -> Result<Vec<Message>, rusqlite::Error> {
        let sql = r#"
            SELECT
                m.ROWID, m.guid, m.text, m.attributedBody,
                m.handle_id, m.date, m.is_from_me, m.service,
                h.id as handle_identifier
            FROM message m
            LEFT JOIN handle h ON m.handle_id = h.ROWID
            WHERE m.ROWID < ?1
            ORDER BY m.ROWID DESC
            LIMIT ?2
        "#;

        let mut stmt = self.conn.prepare(sql)?;
        let mut messages: Vec<Message> = stmt
            .query_map(params![message_id, count], |row| {
                Self::static_row_to_message(row)
            })?
            .collect::<Result<Vec<_>, _>>()?;

        messages.reverse(); // Return in chronological order
        Ok(messages)
    }

    /// Get context messages after a given message
    pub fn get_context_after(
        &self,
        message_id: i64,
        count: i64,
    ) -> Result<Vec<Message>, rusqlite::Error> {
        let sql = r#"
            SELECT
                m.ROWID, m.guid, m.text, m.attributedBody,
                m.handle_id, m.date, m.is_from_me, m.service,
                h.id as handle_identifier
            FROM message m
            LEFT JOIN handle h ON m.handle_id = h.ROWID
            WHERE m.ROWID > ?1
            ORDER BY m.ROWID ASC
            LIMIT ?2
        "#;

        let mut stmt = self.conn.prepare(sql)?;
        let results = stmt
            .query_map(params![message_id, count], |row| {
                Self::static_row_to_message(row)
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(results)
    }

    fn static_row_to_message(row: &Row) -> Result<Message, rusqlite::Error> {
        let text: Option<String> = row.get(2)?;
        let attributed_body: Option<Vec<u8>> = row.get(3)?;

        // Prefer text, fall back to decoded attributedBody
        let final_text =
            text.or_else(|| attributed_body.as_ref().and_then(|data| decode_attributed_body(data)));

        let date_raw: i64 = row.get(5)?;
        let is_from_me: i32 = row.get(6)?;

        Ok(Message {
            id: row.get(0)?,
            guid: row.get(1)?,
            text: final_text,
            handle_id: row.get(4)?,
            date: mac_timestamp_to_datetime(date_raw),
            is_from_me: is_from_me == 1,
            service: row.get::<_, Option<String>>(7)?.unwrap_or_default(),
            contact_name: None,
            contact_id: row.get(8)?,
        })
    }

    fn get_chat_participants(&self, chat_id: i64) -> Result<Vec<Handle>, rusqlite::Error> {
        let sql = r#"
            SELECT h.ROWID, h.id, h.service, h.uncanonicalized_id
            FROM handle h
            INNER JOIN chat_handle_join chj ON h.ROWID = chj.handle_id
            WHERE chj.chat_id = ?1
        "#;

        let mut stmt = self.conn.prepare(sql)?;
        let results = stmt
            .query_map(params![chat_id], |row| {
                Ok(Handle {
                    id: row.get(0)?,
                    identifier: row.get(1)?,
                    service: row.get::<_, Option<String>>(2)?.unwrap_or_default(),
                    uncanonicalized_id: row.get(3)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(results)
    }

    fn get_last_message_for_chat(&self, chat_id: i64) -> Result<Option<Message>, rusqlite::Error> {
        let messages = self.get_messages_for_chat(chat_id, 1)?;
        Ok(messages.into_iter().next())
    }

    fn get_message_count_for_chat(&self, chat_id: i64) -> Result<i64, rusqlite::Error> {
        let sql = "SELECT COUNT(*) FROM chat_message_join WHERE chat_id = ?1";
        self.conn.query_row(sql, params![chat_id], |row| row.get(0))
    }
}
