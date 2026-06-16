!macro customInstall
  ; --- 1. Uzantı -> ProgID Bağlantısı (HKCU ile güvenli, UAC'ye takılmaz) ---
  WriteRegStr HKCU "Software\Classes\.asut" "" "AraziKanalSuyu.Document"
  WriteRegStr HKCU "Software\Classes\.asut" "Content Type" "application/x-asut"

  ; --- 2. Sağ Tık -> Yeni Menüsü ---
  WriteRegStr HKCU "Software\Classes\.asut\ShellNew" "NullFile" ""
  WriteRegStr HKCU "Software\Classes\.asut\ShellNew" "ItemName" "Arazi Kanal Suyu Takip Dosyası"
  WriteRegStr HKCU "Software\Classes\.asut\ShellNew" "IconPath" '"$INSTDIR\kanal-suyu-takibi-basic-app.exe",0'

  ; --- 3. ProgID Tanımı ve Açma Komutu ---
  WriteRegStr HKCU "Software\Classes\AraziKanalSuyu.Document" "" "Arazi Kanal Suyu Takip Veri Dosyası"
  WriteRegStr HKCU "Software\Classes\AraziKanalSuyu.Document\DefaultIcon" "" '"$INSTDIR\kanal-suyu-takibi-basic-app.exe",0'
  WriteRegStr HKCU "Software\Classes\AraziKanalSuyu.Document\shell\open\command" "" '"$INSTDIR\kanal-suyu-takibi-basic-app.exe" "%1"'

  ; --- Windows Explorer'ı yenile (hemen görünsün) ---
  System::Call 'Shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'
!macroend

!macro customUnInstall
  DeleteRegKey HKCU "Software\Classes\.asut"
  DeleteRegKey HKCU "Software\Classes\AraziKanalSuyu.Document"
  System::Call 'Shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'
!macroend
