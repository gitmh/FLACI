#/bin/bash
cd "`dirname "$0"`"

electron-packager . --overwrite --platform=darwin --arch=x64 --icon=flaciLogo.icns --prune=true --out=../builds

electron-packager . --overwrite --platform=darwin --arch=arm64 --icon=flaciLogo.icns --prune=true --out=../builds

electron-packager . FLACI --overwrite --platform=win32 --arch=ia32 --icon=flaciLogo.ico --prune=true --out=../builds --version-string.CompanyName=CE --version-string.FileDescription=CE --version-string.ProductName="FLACI"

electron-packager . FLACI --overwrite --platform=win32 --arch=x64 --icon=flaciLogo.ico --prune=true --out=../builds --version-string.CompanyName=CE --version-string.FileDescription=CE --version-string.ProductName="FLACI"

electron-packager . FLACI --overwrite --platform=linux --arch=x64 --icon=flaciLogo.png --prune=true --out=../builds
