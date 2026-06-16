export const tasinmazlar = {
  name: 'tasinmazlar',
  columns: [
    { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
    { name: 'tapu_sahibi', type: 'TEXT', notNull: true },
    { name: 'ada', type: 'TEXT' },
    { name: 'parsel', type: 'TEXT' },
    { name: 'alan_m2', type: 'REAL' },
    { name: 'mahalle_koy', type: 'TEXT' },
    { name: 'mevki', type: 'TEXT' },
    { name: 'su_hakki', type: 'TEXT' },
    { name: 'kanal_adi', type: 'TEXT' },
    { name: 'aciklama', type: 'TEXT' }
  ]
}
