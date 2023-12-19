# FLACI Electron-App package (for offline use)

To build the electron app you can use one of the following commands.

### MacOS Intel
electron-packager . --overwrite --platform=darwin --arch=x64 --icon=flaciLogo.icns --prune=true --out=../builds

### MacOS Silicon
electron-packager . --overwrite --platform=darwin --arch=arm64 --icon=flaciLogo.icns --prune=true --out=../builds

### Windows 32 Bit
electron-packager . FLACI --overwrite --platform=win32 --arch=ia32 --icon=flaciLogo.ico --prune=true --out=../builds --version-string.CompanyName=CE --version-string.FileDescription=CE --version-string.ProductName="FLACI"

### Windows 64 Bit
electron-packager . FLACI --overwrite --platform=win32 --arch=x64 --icon=flaciLogo.ico --prune=true --out=../builds --version-string.CompanyName=CE --version-string.FileDescription=CE --version-string.ProductName="FLACI"

### Linux 64 Bit
electron-packager . FLACI --overwrite --platform=linux --arch=x64 --icon=flaciLogo.png --prune=true --out=../builds

