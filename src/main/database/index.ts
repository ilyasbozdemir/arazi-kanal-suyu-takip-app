import Database from 'better-sqlite3'
import { app } from 'electron'
import { ayarlar } from './tables/ayarlar'
import { gorevliler } from './tables/gorevliler'
import { tasinmazlar } from './tables/tasinmazlar'
import { sulamalar } from './tables/sulamalar'
import { CURRENT_SCHEMA_VERSION } from './migrate'

export const schema = {
  database: 'ARAZI_KANAL_SUYU_DB',
  app_title: 'Arazi Kanal Suyu Takip',
  developer: {
    name: 'İlyas BOZDEMİR',
    web: 'https://ilyasbozdemir.dev',
    github: 'https://github.com/ilyasbozdemir'
  },
  version: '1.0.0',
  tables: [
    ayarlar,
    gorevliler,
    tasinmazlar,
    sulamalar
  ]
}

export function initializeDatabase(db: Database.Database, institutionName: string): void {
  const currentAppVersion = app.getVersion()
  
  // Create ayarlar (settings) table first to store db info
  db.exec(`
    CREATE TABLE IF NOT EXISTS ayarlar (
      anahtar TEXT PRIMARY KEY,
      deger TEXT
    );
    INSERT OR IGNORE INTO ayarlar (anahtar, deger) VALUES ('kurum_adi', '${institutionName.replace(/'/g, "''")}');
    INSERT OR IGNORE INTO ayarlar (anahtar, deger) VALUES ('dbVersion', '${currentAppVersion}');
    INSERT OR IGNORE INTO ayarlar (anahtar, deger) VALUES ('dbSchemaVersion', '${CURRENT_SCHEMA_VERSION}');
  `)

  // Create all tables in order
  schema.tables.forEach((table: any) => {
    const columnsSql = table.columns
      .map((col: any) => {
        let colDef = '"' + col.name + '" ' + col.type
        if (col.primaryKey) colDef += ' PRIMARY KEY'
        if (col.autoIncrement) colDef += ' AUTOINCREMENT'
        if (col.unique) colDef += ' UNIQUE'
        if (col.notNull) colDef += ' NOT NULL'
        if (col.default !== undefined) {
          colDef += ' DEFAULT ' + (typeof col.default === 'string' ? col.default : col.default)
        }
        return colDef
      })
      .join(', ')

    const constraintsSql = table.constraints ? ', ' + table.constraints.join(', ') : ''
    db.exec('CREATE TABLE IF NOT EXISTS ' + table.name + ' (' + columnsSql + constraintsSql + ');')

    // Initial data if any
    if (table.initialData && table.initialData.length > 0) {
      table.initialData.forEach((row: any) => {
        const keys = Object.keys(row)
        const values = Object.values(row).map((v) =>
          typeof v === 'string' ? "'" + (v as string).replace(/'/g, "''") + "'" : v
        )
        db.exec(
          `INSERT OR IGNORE INTO ${table.name} (${keys.join(', ')}) VALUES (${values.join(', ')});`
        )
      })
    }
  })
}
