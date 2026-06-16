import Database from 'better-sqlite3'

let db: Database.Database | null = null

export function connectDatabase(dbPath: string): void {
  if (db) {
    try {
      db.close()
    } catch (e) {
      console.error('Error closing database:', e)
    }
  }

  db = new Database(dbPath)
  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  // Run migrations to create tables automatically
  db.exec(`
    CREATE TABLE IF NOT EXISTS gorevliler (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ad_soyad TEXT NOT NULL,
      gorev TEXT,
      telefon TEXT,
      eposta TEXT,
      aktif INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS tasinmazlar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tapu_sahibi TEXT NOT NULL,
      ada TEXT,
      parsel TEXT,
      alan_m2 REAL,
      mahalle_koy TEXT,
      kanal_adi TEXT,
      aciklama TEXT
    );

    CREATE TABLE IF NOT EXISTS sulamalar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tasinmaz_id INTEGER NOT NULL,
      gorevli_id INTEGER NOT NULL,
      sulama_tarihi TEXT NOT NULL,
      sulama_suresi_saat REAL NOT NULL,
      ucret REAL NOT NULL,
      odeme_durumu TEXT CHECK(odeme_durumu IN ('Ödendi', 'Ödenmedi')) DEFAULT 'Ödenmedi',
      aciklama TEXT,
      FOREIGN KEY (tasinmaz_id) REFERENCES tasinmazlar(id) ON DELETE CASCADE,
      FOREIGN KEY (gorevli_id) REFERENCES gorevliler(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS ayarlar (
      anahtar TEXT PRIMARY KEY,
      deger TEXT
    );
  `)
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

export function isConnected(): boolean {
  return db !== null
}

export function query(sql: string, params: any[] = []): any[] {
  if (!db) throw new Error('Veritabanı bağlı değil')
  const stmt = db.prepare(sql)
  return stmt.all(...params)
}

export function run(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  if (!db) throw new Error('Veritabanı bağlı değil')
  const stmt = db.prepare(sql)
  const result = stmt.run(...params)
  return {
    lastInsertRowid: Number(result.lastInsertRowid),
    changes: result.changes
  }
}
