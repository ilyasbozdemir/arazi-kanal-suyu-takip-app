export const gorevliler = {
  name: 'gorevliler',
  columns: [
    { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
    { name: 'ad_soyad', type: 'TEXT', notNull: true },
    { name: 'gorev', type: 'TEXT' },
    { name: 'telefon', type: 'TEXT' },
    { name: 'eposta', type: 'TEXT' },
    { name: 'aktif', type: 'INTEGER', default: 1 }
  ]
}
