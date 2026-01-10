use chrono::{DateTime, TimeZone, Utc};

/// macOS uses its own epoch starting from 2001-01-01 00:00:00 UTC
/// The chat.db stores timestamps in nanoseconds since this epoch
const MAC_EPOCH_OFFSET: i64 = 978_307_200; // Seconds from Unix epoch to Mac epoch

pub fn mac_timestamp_to_datetime(timestamp: i64) -> DateTime<Utc> {
    // Convert from nanoseconds to seconds and add the epoch offset
    let unix_seconds = (timestamp / 1_000_000_000) + MAC_EPOCH_OFFSET;
    Utc.timestamp_opt(unix_seconds, 0)
        .single()
        .unwrap_or_else(|| Utc.timestamp_opt(0, 0).single().unwrap())
}

pub fn datetime_to_mac_timestamp(dt: DateTime<Utc>) -> i64 {
    let unix_seconds = dt.timestamp();
    (unix_seconds - MAC_EPOCH_OFFSET) * 1_000_000_000
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mac_timestamp_conversion() {
        // Test round-trip conversion
        let now = Utc::now();
        let mac_ts = datetime_to_mac_timestamp(now);
        let converted = mac_timestamp_to_datetime(mac_ts);

        // Should be within a second due to nanosecond precision loss
        assert!((now.timestamp() - converted.timestamp()).abs() <= 1);
    }
}
