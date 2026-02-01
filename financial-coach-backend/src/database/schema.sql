CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  keywords TEXT, -- JSON array of keywords
  icon VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  merchant VARCHAR(255),
  transaction_type VARCHAR(20),
  account_name VARCHAR(100),
  is_recurring BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(category) REFERENCES categories(name)
);

CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  deadline DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  merchant VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  frequency VARCHAR(20), -- 'monthly', 'yearly'
  last_charge_date DATE,
  next_charge_date DATE,
  detection_confidence DECIMAL(3,2),
  is_active BOOLEAN DEFAULT 1
);

-- Seed basic categories
INSERT OR IGNORE INTO categories (name, keywords, icon) VALUES 
('Food & Dining', '["restaurant", "cafe", "coffee", "burger", "pizza", "starbucks", "mcdonalds"]', 'utensils'),
('Housing', '["rent", "mortgage", "utilities", "electric", "water", "gas", "internet"]', 'home'),
('Transportation', '["uber", "lyft", "gas", "shell", "chevron", "parking", "train", "bus"]', 'car'),
('Shopping', '["amazon", "target", "walmart", "clothing", "shoes", "electronics"]', 'shopping-bag'),
('Entertainment', '["netflix", "spotify", "hulu", "notes", "cinema", "game"]', 'film'),
('Health & Fitness', '["gym", "pharmacy", "doctor", "dentist", "fitness"]', 'activity'),
('Income', '["salary", "deposit", "transfer", "refund"]', 'dollar-sign'),
('Other', '[]', 'circle');
