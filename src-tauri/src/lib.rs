use tauri_plugin_sql::{Migration, MigrationKind};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;

#[derive(serde::Serialize)]
struct OAuthCallback {
    code: Option<String>,
    state: Option<String>,
    error: Option<String>,
}

#[tauri::command]
async fn wait_for_oauth_callback(port: u16, timeout_secs: u64) -> Result<OAuthCallback, String> {
    let addr = format!("127.0.0.1:{}", port);
    let listener = TcpListener::bind(&addr)
        .await
        .map_err(|e| format!("Failed to bind to {}: {}", addr, e))?;

    let result = tokio::time::timeout(
        std::time::Duration::from_secs(timeout_secs),
        async {
            let (mut stream, _) = listener.accept().await.map_err(|e| format!("Accept failed: {}", e))?;

            let mut buf = vec![0u8; 4096];
            let n = stream.read(&mut buf).await.map_err(|e| format!("Read failed: {}", e))?;
            let request = String::from_utf8_lossy(&buf[..n]).to_string();

            // Parse the GET request line to extract query params
            let first_line = request.lines().next().unwrap_or("");
            let path = first_line.split_whitespace().nth(1).unwrap_or("/");

            let mut code: Option<String> = None;
            let mut state: Option<String> = None;
            let mut error: Option<String> = None;

            if let Some(query) = path.split('?').nth(1) {
                for param in query.split('&') {
                    let mut kv = param.splitn(2, '=');
                    let key = kv.next().unwrap_or("");
                    let value = kv.next().unwrap_or("");
                    let decoded = urlencoding_decode(value);
                    match key {
                        "code" => code = Some(decoded),
                        "state" => state = Some(decoded),
                        "error" => error = Some(decoded),
                        _ => {}
                    }
                }
            }

            // Send response HTML
            let body = if code.is_some() {
                r#"<html><body style="background:#0a0a0f;color:white;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1>Connected!</h1><p>You can close this tab and return to Life Tracker.</p></div></body></html>"#
            } else {
                r#"<html><body style="background:#0a0a0f;color:white;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1>Error</h1><p>Bank connection failed. Please try again.</p></div></body></html>"#
            };

            let response = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                body.len(),
                body
            );
            let _ = stream.write_all(response.as_bytes()).await;
            let _ = stream.flush().await;

            Ok::<OAuthCallback, String>(OAuthCallback { code, state, error })
        }
    ).await;

    match result {
        Ok(Ok(callback)) => Ok(callback),
        Ok(Err(e)) => Err(e),
        Err(_) => Err("Timeout waiting for bank callback".to_string()),
    }
}

fn urlencoding_decode(s: &str) -> String {
    let mut result = String::new();
    let mut chars = s.bytes();
    while let Some(b) = chars.next() {
        if b == b'%' {
            let hi = chars.next().unwrap_or(b'0');
            let lo = chars.next().unwrap_or(b'0');
            let hex = format!("{}{}", hi as char, lo as char);
            if let Ok(val) = u8::from_str_radix(&hex, 16) {
                result.push(val as char);
            }
        } else if b == b'+' {
            result.push(' ');
        } else {
            result.push(b as char);
        }
    }
    result
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_debts_and_payments_tables",
            sql: "
                CREATE TABLE IF NOT EXISTS debts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL DEFAULT 'other',
                    original_balance REAL NOT NULL,
                    current_balance REAL NOT NULL,
                    interest_rate REAL NOT NULL DEFAULT 0.0,
                    minimum_payment REAL NOT NULL DEFAULT 0.0,
                    due_day INTEGER,
                    notes TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                CREATE TABLE IF NOT EXISTS payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    debt_id INTEGER NOT NULL,
                    amount REAL NOT NULL,
                    payment_date TEXT NOT NULL DEFAULT (date('now')),
                    notes TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
            ",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_bank_transactions_table",
            sql: "
                CREATE TABLE IF NOT EXISTS bank_accounts (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    account_type TEXT NOT NULL DEFAULT 'TRANSACTION',
                    currency TEXT NOT NULL DEFAULT 'GBP',
                    provider TEXT,
                    connected_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                CREATE TABLE IF NOT EXISTS transactions (
                    id TEXT PRIMARY KEY,
                    bank_account_id TEXT NOT NULL,
                    amount REAL NOT NULL,
                    currency TEXT NOT NULL DEFAULT 'GBP',
                    description TEXT NOT NULL,
                    merchant_name TEXT,
                    transaction_type TEXT NOT NULL DEFAULT 'DEBIT',
                    transaction_date TEXT NOT NULL,
                    budget_category TEXT NOT NULL DEFAULT 'uncategorised',
                    user_categorised INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
                CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(budget_category);
            ",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:tracker.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![wait_for_oauth_callback])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
