use plist::Value;
use regex::Regex;

/// Decode the attributedBody blob (NSAttributedString in binary plist format)
/// Used for rich text messages in macOS Ventura+
pub fn decode_attributed_body(data: &[u8]) -> Option<String> {
    // Method 1: Try to extract using regex for simple cases
    if let Some(text) = extract_text_regex(data) {
        return Some(text);
    }

    // Method 2: Parse as binary plist
    if let Ok(plist) = plist::from_bytes::<Value>(data) {
        return extract_from_plist(&plist);
    }

    None
}

fn extract_text_regex(data: &[u8]) -> Option<String> {
    // The text is often stored after "NSString" marker
    let text = String::from_utf8_lossy(data);

    // Look for text between specific markers - the actual message content
    // is typically stored in a specific location in the binary plist
    let re = Regex::new(r"(?s)NSString.*?\x01(.+?)\x00").ok()?;

    if let Some(caps) = re.captures(&text) {
        let extracted = caps.get(1)?.as_str();
        // Filter out plist-related keywords
        let cleaned = extracted
            .lines()
            .filter(|l| {
                !l.contains("NSDictionary")
                    && !l.contains("NSAttributed")
                    && !l.contains("NSValue")
                    && !l.contains("NSNumber")
            })
            .collect::<Vec<_>>()
            .join("\n");

        if !cleaned.is_empty() && cleaned.len() > 1 {
            return Some(cleaned);
        }
    }

    // Try alternative pattern for newer macOS versions
    let alt_re = Regex::new(r"\+(.+?)\x00").ok()?;
    if let Some(caps) = alt_re.captures(&text) {
        let extracted = caps.get(1)?.as_str().trim();
        if extracted.len() > 1
            && !extracted.contains("bplist")
            && !extracted.contains("NSKeyedArchiver")
        {
            return Some(extracted.to_string());
        }
    }

    None
}

fn extract_from_plist(value: &Value) -> Option<String> {
    match value {
        Value::String(s) => {
            // Filter out metadata strings
            if !s.contains("NSAttributed")
                && !s.contains("NSDictionary")
                && !s.contains("NSKeyedArchiver")
                && s.len() > 1
            {
                Some(s.clone())
            } else {
                None
            }
        }
        Value::Dictionary(dict) => {
            // Look for NSString key or $objects array
            if let Some(Value::String(s)) = dict.get("NSString") {
                return Some(s.clone());
            }
            if let Some(Value::Array(objects)) = dict.get("$objects") {
                // In NSKeyedArchiver format, strings are in $objects array
                for obj in objects {
                    if let Value::String(s) = obj {
                        if s.len() > 1
                            && !s.starts_with("NS")
                            && !s.starts_with("$")
                            && !s.contains("bplist")
                        {
                            return Some(s.clone());
                        }
                    }
                }
            }
            // Recursively search
            for (_, v) in dict.iter() {
                if let Some(text) = extract_from_plist(v) {
                    return Some(text);
                }
            }
            None
        }
        Value::Array(arr) => {
            for item in arr {
                if let Some(text) = extract_from_plist(item) {
                    return Some(text);
                }
            }
            None
        }
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_decode_empty() {
        assert_eq!(decode_attributed_body(&[]), None);
    }
}
