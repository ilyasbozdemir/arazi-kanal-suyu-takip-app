export const sulamalar = {
  name: 'sulamalar',
  columns: [
    { name: 'id', type: 'INTEGER', primaryKey: true, autoIncrement: true },
    { name: 'tasinmaz_id', type: 'INTEGER' },
    { name: 'gorevli_id', type: 'INTEGER', notNull: true },
    { name: 'sulama_tarihi', type: 'TEXT', notNull: true },
    { name: 'sulama_suresi_saat', type: 'REAL', notNull: true },
    { name: 'ucret', type: 'REAL', notNull: true },
    { name: 'odeme_durumu', type: 'TEXT', default: "'Ödenmedi'" },
    { name: 'aciklama', type: 'TEXT' },
    { name: 'tapu_sahibi', type: 'TEXT' },
    { name: 'fis_no', type: 'TEXT' },
    { name: 'seri_no', type: 'TEXT' }
  ],
  constraints: [
    "FOREIGN KEY (tasinmaz_id) REFERENCES tasinmazlar(id) ON DELETE SET NULL",
    "FOREIGN KEY (gorevli_id) REFERENCES gorevliler(id) ON DELETE RESTRICT",
    "CHECK(odeme_durumu IN ('Ödendi', 'Ödenmedi'))"
  ]
}
