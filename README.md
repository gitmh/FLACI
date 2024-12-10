# FLACI

FLACI ist in erster Linie ein didaktisches Werkzeug zur aktiven Aneignung von Grundkenntnissen aus der theoretischen Informatik, wie sie im Informatikstudium und in entsprechenden Kursen der gymnasialen Oberstufe vermittelt werden.

FLACI stellt Werkzeuge bereit, mit denen formale Sprachen entworfen und evaluiert werden können. Entsprechende Modellierungs- und Beschreibungsmittel ermöglichen es, Compiler für die bestimmte Sprachklassen automatisiert zu generieren. 

FLACI verbindet die Bereiche: Formale Sprachen, Abstrakte Automaten und Compilerbau. Entwickelte Compiler lassen sich unmittelbar in beliebige Webprojekte einbinden, wodurch FLACI nicht nur auf den Einsatz in Aus- und Weiterbildung beschränkt bleibt.

# Codebase

- AngularJS Projekt 
- FLACI besteht aus mehreren Modulen (Komponenten) die theoretisch auch unabhängig funktionieren würden


# FLACI Electron-App package (for offline use)

To build the electron app you should first run 

```
npm install
```

To build the electron app you can use one of the following commands. 

### MacOS Intel
```
electron-packager . --overwrite --platform=darwin --arch=x64 --icon=flaciLogo.icns --prune=true --out=../builds
```

### MacOS Silicon
```
electron-packager . --overwrite --platform=darwin --arch=arm64 --icon=flaciLogo.icns --prune=true --out=../builds
```

### Windows 32 Bit
```
electron-packager . FLACI --overwrite --platform=win32 --arch=ia32 --icon=flaciLogo.ico --prune=true --out=../builds --version-string.CompanyName=CE --version-string.FileDescription=CE --version-string.ProductName="FLACI"
```

### Windows 64 Bit
```
electron-packager . FLACI --overwrite --platform=win32 --arch=x64 --icon=flaciLogo.ico --prune=true --out=../builds --version-string.CompanyName=CE --version-string.FileDescription=CE --version-string.ProductName="FLACI"
```

### Linux 64 Bit
```
electron-packager . FLACI --overwrite --platform=linux --arch=x64 --icon=flaciLogo.png --prune=true --out=../builds
```

