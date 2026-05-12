!macro customInstall
  CreateDirectory "$DOCUMENTS\Behring P-touch Templates"
  CopyFiles /SILENT "$INSTDIR\resources\ptouch-templates\*.lbx" "$DOCUMENTS\Behring P-touch Templates"
  CopyFiles /SILENT "$INSTDIR\resources\ptouch-templates\README.txt" "$DOCUMENTS\Behring P-touch Templates"
  CreateDirectory "$DOCUMENTS\Behring P-touch Templates\current"
  CopyFiles /SILENT "$INSTDIR\resources\ptouch-data\current\*.csv" "$DOCUMENTS\Behring P-touch Templates\current"
!macroend
