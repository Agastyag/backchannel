use rusqlite::{Connection, OpenFlags};
use std::path::PathBuf;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum DbError {
    #[error("Database not found at {0}")]
    NotFound(PathBuf),
    #[error("Permission denied - Full Disk Access required")]
    PermissionDenied,
    #[error("Database error: {0}")]
    SqliteError(#[from] rusqlite::Error),
}

impl serde::Serialize for DbError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

pub struct ChatDb {
    pub conn: Connection,
}

impl ChatDb {
    pub fn new() -> Result<Self, DbError> {
        let home = std::env::var("HOME").expect("HOME not set");
        let db_path = PathBuf::from(home).join("Library/Messages/chat.db");

        if !db_path.exists() {
            return Err(DbError::NotFound(db_path));
        }

        // Open in read-only mode to avoid conflicts with Messages.app
        let conn = Connection::open_with_flags(
            &db_path,
            OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_NO_MUTEX,
        )
        .map_err(|e| {
            if e.to_string().contains("unable to open") {
                DbError::PermissionDenied
            } else {
                DbError::SqliteError(e)
            }
        })?;

        Ok(Self { conn })
    }

    pub fn db_path() -> PathBuf {
        let home = std::env::var("HOME").expect("HOME not set");
        PathBuf::from(home).join("Library/Messages/chat.db")
    }
}
