# HH-Hunter

Chrome-расширение для генерации персонализированных сопроводительных писем к вакансиям HeadHunter с помощью DeepSeek.

## Быстрый старт

```bash
cp .env.example .env
# Укажите WXT_DEEPSEEK_API_KEY в .env

make install
make dev
```

Откройте `chrome://extensions`, включите режим разработчика и загрузите unpacked из `.output/chrome-mv3`.

## Конфигурация

Перед сборкой или запуском скопируйте [`.env.example`](.env.example) в `.env` и задайте `WXT_DEEPSEEK_API_KEY`. Файл `.env` не коммитится в git. Ключ используется только в background service worker при запросах к DeepSeek.

## Makefile

| Команда | Описание |
| :--- | :--- |
| `make install` | Установка зависимостей |
| `make dev` | Dev-сервер WXT |
| `make build` | Production-сборка |
| `make zip` | ZIP для Chrome Web Store |
| `make typecheck` | Проверка TypeScript |
| `make lint` | ESLint |
| `make test` | Vitest |
| `make check` | Полный пайплайн: typecheck + lint + test + build |
| `make clean` | Очистка `.output` и кэша |

Без `make` используйте npm-скрипты из `package.json` (`npm run build`, `npm test` и т.д.).

## Релиз

```bash
make check
make zip
```

Артефакт: `.output/hh-hunter-*-chrome.zip`

Перед публикацией пройдите чек-лист в [ACCEPTANCE.md](ACCEPTANCE.md).

## Документация

- [PRIVACY.md](PRIVACY.md) — политика конфиденциальности
- [STORE_LISTING.md](STORE_LISTING.md) — тексты для Chrome Web Store
- [hh-hunter.tech-spec.md](hh-hunter.tech-spec.md) — техническое задание
