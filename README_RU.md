# CLauncherGo — Windows desktop project

Это исходный проект Electron, не готовый `.exe`. В текущей среде сборка Windows невозможна: среда Linux, Wine отсутствует, а npm-зависимости не предустановлены.

## Сборка Windows

1. Установите Node.js 20 или новее на Windows.
2. Распакуйте архив.
3. Откройте PowerShell в папке проекта.
4. Выполните:

```powershell
npm install
npm run dist:win
```

Инсталлятор и portable-сборка появятся в папке `release`.

Для запуска в режиме разработки:

```powershell
npm start
```

## Что реализовано в этой заготовке

- Desktop-окно Electron с изолированным preload и IPC.
- Интерфейс CLauncherGo в тёмно-синей стилистике.
- Получение списка версий из официального Mojang version manifest.
- Выбор версии, локальный offline-профиль и сохранение базовых настроек.
- Проверка доступности системной Java.
- Интеграция с `minecraft-launcher-core` для подготовки/запуска клиента.
- Конфигурация electron-builder для NSIS installer и portable EXE.

## Важные ограничения

- Offline-профиль не является Microsoft-аккаунтом и не даёт доступа к официальным multiplayer-серверам с online-mode.
- Microsoft OAuth/Xbox/XSTS/Minecraft Services авторизация здесь ещё не реализована. Для неё требуется зарегистрировать собственное приложение в Microsoft Entra и корректно пройти официальный OAuth + Xbox Live + Minecraft Services flow. Не вставляйте секреты в renderer.
- Автоматическая установка Java runtime, полноценные Forge/Fabric/NeoForge/Quilt установщики, менеджеры модов/шейдеров/ресурс-паков, проверка всех файлов по SHA-1, пауза/возобновление загрузки и полноценные тесты ещё требуют реализации.
- Убедитесь, что используете лицензионную копию Minecraft и соблюдаете условия Mojang/Microsoft.

## Ассеты

`assets/cl_launcher-reference.png` — предоставленный пользователем референс интерфейса. Он включён в архив как исходный визуальный ассет.
