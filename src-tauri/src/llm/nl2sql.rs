use super::client::LlmClient;
use super::prompts::nl2sql_prompt;
use regex::Regex;

pub struct Nl2SqlEngine {
    llm: LlmClient,
}

impl Nl2SqlEngine {
    pub fn new(llm: LlmClient) -> Self {
        Self { llm }
    }

    /// Convert natural language query to SQL
    pub async fn generate_sql(&self, query: &str) -> Result<String, String> {
        // Generate SQL from natural language
        let prompt = nl2sql_prompt(query);
        let sql_response = self.llm.complete(&prompt, None).await?;

        // Extract SQL from response (might be wrapped in code blocks)
        self.extract_sql(&sql_response)
    }

    fn extract_sql(&self, response: &str) -> Result<String, String> {
        let response = response.trim();

        // Try to extract from markdown code block
        let code_block_re =
            Regex::new(r"```(?:sql)?\s*(SELECT[\s\S]+?)```").map_err(|e| e.to_string())?;

        if let Some(caps) = code_block_re.captures(response) {
            return Ok(caps.get(1).unwrap().as_str().trim().to_string());
        }

        // If response starts with SELECT, use it directly
        if response.to_uppercase().starts_with("SELECT") {
            // Remove trailing semicolon if present
            let sql = response.trim_end_matches(';').trim();
            return Ok(sql.to_string());
        }

        // Try to find SELECT statement in the response
        let select_re = Regex::new(r"(SELECT[\s\S]+?)(?:;|$)").map_err(|e| e.to_string())?;

        if let Some(caps) = select_re.captures(response) {
            return Ok(caps.get(1).unwrap().as_str().trim().to_string());
        }

        Err(format!(
            "Could not extract SQL query from LLM response: {}",
            response
        ))
    }
}
