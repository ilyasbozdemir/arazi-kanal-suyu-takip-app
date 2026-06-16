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
  }
]
