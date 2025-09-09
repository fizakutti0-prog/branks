const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database');
                this.initTables();
            }
        });
    }

    initTables() {
        // Users table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                telegram_id INTEGER UNIQUE NOT NULL,
                username TEXT,
                first_name TEXT,
                last_name TEXT,
                is_premium BOOLEAN DEFAULT 0,
                premium_expires INTEGER,
                daily_messages INTEGER DEFAULT 0,
                daily_images INTEGER DEFAULT 0,
                total_messages INTEGER DEFAULT 0,
                total_images INTEGER DEFAULT 0,
                invite_count INTEGER DEFAULT 0,
                invited_by INTEGER,
                last_reset INTEGER DEFAULT 0,
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                last_image_time INTEGER DEFAULT 0,
                is_banned BOOLEAN DEFAULT 0
            )
        `);

        // Messages table for tracking
        this.db.run(`
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                message_type TEXT,
                timestamp INTEGER DEFAULT (strftime('%s', 'now')),
                FOREIGN KEY (user_id) REFERENCES users (telegram_id)
            )
        `);

        // Images table for rotation
        this.db.run(`
            CREATE TABLE IF NOT EXISTS images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                used_count INTEGER DEFAULT 0,
                last_used INTEGER DEFAULT 0
            )
        `);

        // Conversations table for memory
        this.db.run(`
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                role TEXT NOT NULL,
                message TEXT NOT NULL,
                timestamp INTEGER DEFAULT (strftime('%s', 'now')),
                FOREIGN KEY (user_id) REFERENCES users (telegram_id)
            )
        `);

        console.log('Database tables initialized');
    }

    getUser(telegramId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE telegram_id = ?', [telegramId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    createUser(userData) {
        return new Promise((resolve, reject) => {
            const { telegram_id, username, first_name, last_name, invited_by } = userData;
            this.db.run(
                'INSERT INTO users (telegram_id, username, first_name, last_name, invited_by) VALUES (?, ?, ?, ?, ?)',
                [telegram_id, username, first_name, last_name, invited_by],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    updateUser(telegramId, updates) {
        return new Promise((resolve, reject) => {
            const keys = Object.keys(updates);
            const values = Object.values(updates);
            const setClause = keys.map(key => `${key} = ?`).join(', ');
            
            this.db.run(
                `UPDATE users SET ${setClause} WHERE telegram_id = ?`,
                [...values, telegramId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    incrementUsage(telegramId, type) {
        return new Promise((resolve, reject) => {
            const field = type === 'message' ? 'daily_messages' : 'daily_images';
            const totalField = type === 'message' ? 'total_messages' : 'total_images';
            
            this.db.run(
                `UPDATE users SET ${field} = ${field} + 1, ${totalField} = ${totalField} + 1 WHERE telegram_id = ?`,
                [telegramId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    resetDailyLimits() {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE users SET daily_messages = 0, daily_images = 0, last_reset = ?',
                [Math.floor(Date.now() / 1000)],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    getImages() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM images ORDER BY used_count ASC, last_used ASC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    updateImageUsage(filename) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE images SET used_count = used_count + 1, last_used = ? WHERE filename = ?',
                [Math.floor(Date.now() / 1000), filename],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    addImage(filename) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT OR IGNORE INTO images (filename) VALUES (?)',
                [filename],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    // Conversation memory methods
    saveConversation(telegramId, role, message) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO conversations (user_id, role, message) VALUES (?, ?, ?)',
                [telegramId, role, message],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    getRecentConversations(telegramId, limit = 10) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT role, message, timestamp FROM conversations WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
                [telegramId, limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.reverse()); // Reverse to get chronological order
                }
            );
        });
    }

    cleanOldConversations(telegramId, keepRecent = 50) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                DELETE FROM conversations 
                WHERE user_id = ? 
                AND id NOT IN (
                    SELECT id FROM conversations 
                    WHERE user_id = ? 
                    ORDER BY timestamp DESC 
                    LIMIT ?
                )`,
                [telegramId, telegramId, keepRecent],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    close() {
        this.db.close();
    }
}

module.exports = Database;