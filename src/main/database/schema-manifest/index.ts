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
  }
]
