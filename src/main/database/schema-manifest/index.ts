import { AppVersionManifest } from '../migrate'

export const manifests: AppVersionManifest[] = [
  {
    app: '1.0.0-beta.1',
    schema_min: 0,
    schema_max: 1,
    release_date: '2026-06-16',
    changes: [
      {
        schema: 1,
        type: 'initial',
        description: 'İlk Veritabanı Kurulumu',
        tables_added: ['ayarlar', 'gorevliler', 'tasinmazlar', 'sulamalar']
      }
    ]
  },
  {
    app: '1.0.0-beta.2',
    schema_min: 1,
    schema_max: 1,
    release_date: '2026-06-16',
    changes: []
  },
  {
    app: '1.0.0-beta.3',
    schema_min: 1,
    schema_max: 1,
    release_date: '2026-06-16',
    changes: []
  },
  {
    app: '1.0.0-beta.6',
    schema_min: 1,
    schema_max: 2,
    release_date: '2026-06-16',
    changes: [
      {
        schema: 2,
        type: 'update',
        description: 'Taşınmazlara mevki ve su_hakki alanları ekleme',
        columns_added: [
          { table: 'tasinmazlar', column: 'mevki' },
          { table: 'tasinmazlar', column: 'su_hakki' }
        ]
      }
    ]
  },
  {
    app: '1.0.0-beta.13',
    schema_min: 2,
    schema_max: 3,
    release_date: '2026-06-17',
    changes: [
      {
        schema: 3,
        type: 'update',
        description: 'Sulamalar tablosuna tapu_sahibi, fis_no ve seri_no ekleme',
        columns_added: [
          { table: 'sulamalar', column: 'tapu_sahibi' },
          { table: 'sulamalar', column: 'fis_no' },
          { table: 'sulamalar', column: 'seri_no' }
        ]
      }
    ]
  },
  {
    app: '1.0.0-beta.15',
    schema_min: 3,
    schema_max: 4,
    release_date: '2026-06-17',
    changes: [
      {
        schema: 4,
        type: 'update',
        description: 'Sulamalar tablosuna yazdirildi ve yazdirilma_tarihi ekleme',
        columns_added: [
          { table: 'sulamalar', column: 'yazdirildi' },
          { table: 'sulamalar', column: 'yazdirilma_tarihi' }
        ]
      }
    ]
  },
  {
    app: '1.0.0-beta.16',
    schema_min: 4,
    schema_max: 5,
    release_date: '2026-06-17',
    changes: [
      {
        schema: 5,
        type: 'update',
        description: 'Sulamalar tablosundaki tasinmaz_id NOT NULL kisitlamasini kaldirma',
        raw_sql: [
          'PRAGMA foreign_keys=OFF;',
          'ALTER TABLE sulamalar RENAME TO sulamalar_old;',
          'CREATE TABLE sulamalar (id INTEGER PRIMARY KEY AUTOINCREMENT, tasinmaz_id INTEGER, gorevli_id INTEGER NOT NULL, sulama_tarihi TEXT NOT NULL, sulama_suresi_saat REAL NOT NULL, ucret REAL NOT NULL, odeme_durumu TEXT DEFAULT \'Ödenmedi\', aciklama TEXT, tapu_sahibi TEXT, fis_no TEXT, seri_no TEXT, yazdirildi INTEGER DEFAULT 0, yazdirilma_tarihi TEXT, FOREIGN KEY (tasinmaz_id) REFERENCES tasinmazlar(id) ON DELETE SET NULL, FOREIGN KEY (gorevli_id) REFERENCES gorevliler(id) ON DELETE RESTRICT, CHECK(odeme_durumu IN (\'Ödendi\', \'Ödenmedi\')));',
          'INSERT INTO sulamalar (id, tasinmaz_id, gorevli_id, sulama_tarihi, sulama_suresi_saat, ucret, odeme_durumu, aciklama, tapu_sahibi, fis_no, seri_no, yazdirildi, yazdirilma_tarihi) SELECT id, tasinmaz_id, gorevli_id, sulama_tarihi, sulama_suresi_saat, ucret, odeme_durumu, aciklama, tapu_sahibi, fis_no, seri_no, yazdirildi, yazdirilma_tarihi FROM sulamalar_old;',
          'DROP TABLE sulamalar_old;',
          'PRAGMA foreign_keys=ON;'
        ]
      }
    ]
  }
]
