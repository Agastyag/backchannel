pub const SCHEMA_CONTEXT: &str = r#"
You are a SQL query generator for an iMessage database on macOS. The database schema is:

Tables:
- message: ROWID, guid, text, attributedBody, handle_id, date (nanoseconds since 2001-01-01), is_from_me (0 or 1), service
- handle: ROWID, id (phone number or email), service, uncanonicalized_id
- chat: ROWID, guid, display_name, style (43=group chat)
- chat_message_join: chat_id, message_id
- chat_handle_join: chat_id, handle_id
- attachment: ROWID, guid, filename, mime_type, total_bytes

Key relationships:
- message.handle_id -> handle.ROWID
- chat_message_join links chats to messages
- chat_handle_join links chats to participants

Date handling: Timestamps are in nanoseconds since 2001-01-01 (Mac epoch).
To convert from a date like "2024-01-15", you need to calculate nanoseconds from 2001-01-01.

Important: Only generate SELECT queries. Never modify data.
"#;

pub fn nl2sql_prompt(user_query: &str) -> String {
    format!(
        r#"{}

Convert this natural language query to SQL:
"{}"

Rules:
1. Always SELECT these columns from message: m.ROWID, m.guid, m.text, m.attributedBody, m.handle_id, m.date, m.is_from_me, m.service
2. Always LEFT JOIN with handle h ON m.handle_id = h.ROWID to get h.id as handle_identifier
3. Use LIKE with wildcards for text searches (e.g., WHERE m.text LIKE '%keyword%')
4. Order by m.date DESC for most recent first
5. Always LIMIT results (default to 50 if not specified)
6. For searching by contact, use WHERE h.id LIKE '%contact%'
7. For group chats, join with chat_message_join and chat tables

Return ONLY the SQL query, no explanation or markdown formatting."#,
        SCHEMA_CONTEXT, user_query
    )
}

pub fn summarize_prompt(messages_json: &str, contact_name: &str) -> String {
    format!(
        r#"Summarize this conversation with {}. Focus on:
1. Main topics discussed
2. Key decisions or plans made
3. Action items or follow-ups
4. Overall sentiment/tone

Messages (JSON format, ordered chronologically):
{}

Provide a concise summary in 2-3 paragraphs. Be specific about what was discussed."#,
        contact_name, messages_json
    )
}

pub fn analyze_prompt(messages_json: &str) -> String {
    format!(
        r#"Analyze this conversation and provide insights:

Messages (JSON format):
{}

Provide:
1. **Conversation Summary** (2-3 sentences)
2. **Key Topics/Themes** (bullet points)
3. **Communication Patterns** (who initiates, response times if apparent, tone)
4. **Notable Dates/Events Mentioned**
5. **Suggested Follow-ups or Action Items**

Format the response with clear markdown headers."#,
        messages_json
    )
}

pub fn answer_question_prompt(question: &str, messages_json: &str) -> String {
    format!(
        r#"You are a helpful assistant that answers questions based on the user's iMessage history.

The user asked: "{}"

Here are relevant messages from their iMessage history (JSON format):
{}

Instructions:
1. Answer the user's question directly and concisely based on the messages provided
2. If the messages contain the answer, provide specific details (dates, times, names, places)
3. If the messages don't contain relevant information to answer the question, say "I couldn't find any messages about this in your chat history"
4. Do NOT list out individual messages - synthesize the information into a natural response
5. If you cite information, mention who said it naturally (e.g., "John mentioned that...")
6. Keep your response brief - 1-3 sentences for simple questions, a short paragraph for complex ones

Respond naturally as if you're a helpful assistant who has access to the user's messages."#,
        question, messages_json
    )
}
