---
sidebar_position: 1
---

# @holu/cli

Цей пакет надає інтерфейс командного рядка (CLI) та інструменти розробки для застосунків Holu.

## Встановлення {#installation}

```bash
npm i -g @holu/cli
```

Або запустіть його безпосередньо без встановлення за допомогою `npx`:

```bash
npx @holu/cli <command>
```

_Примітка:_ Бінарні аліаси `holu` та `dm` доступні після встановлення пакета.

## Команди {#commands}

### `holu new` {#holu-new}

Створює новий застосунок Holu у цільовій директорії за допомогою офіційних шаблонів старту.

```bash
holu new my-app [options]
```

#### Параметри:

- `-t, --template <name>`: Стартовий шаблон для використання (`rest`, `rest-monorepo`, `trpc-monorepo`). По дефолту: `"rest"`.
- `-m, --package-manager <name>`: Менеджер пакетів (`npm`, `yarn`, `pnpm`). По дефолту: `"npm"`.
- `--skip-install`: Пропустити автоматичне встановлення пакетів.
- `--skip-git`: Пропустити ініціалізацію чистого репозиторію Git.

#### Приклади:

```bash
# Створення REST застосунку за допомогою Yarn
dm new my-rest-api -m yarn

# Створення tRPC монорепозиторію без встановлення пакетів
dm new my-trpc-app -t trpc-monorepo --skip-install
```

### `holu start` {#holu-start}

Запускає застосунок Holu у режимі розробки з інкрементною компіляцією TypeScript та плавним перезапуском процесів.

```bash
holu start [entryFile] [options]
```

#### Параметри:

- `-p, --project <path>`: Шлях до конфігураційного файлу TypeScript або каталогу проєкту. По дефолту: `"tsconfig.build.json"`.
- `-e, --exec <binary>`: Бінарний файл для виконання вхідного файлу. По дефолту: `"node"`.
- `-d, --debug [hostport]`: Запуск Node.js у режимі відлагодження із прапорцем `--inspect`.
- `--env-file <paths...>`: Файл(и) оточення для завантаження в `process.env`.
- `--entry-file <file>`: Відносний шлях до скомпільованого вхідного файлу JavaScript. По дефолту: `"dist/main.js"`.
- `--watch-assets <globs...>`: Глоби не-TypeScript ресурсів для відстеження та копіювання в `dist/`.
- `--preserve-watch-output`: Не очищати екран терміналу між циклами компіляції.

#### Приклади:

```bash
# Запуск застосунку з кастомним вхідним файлом та увімкненим режимом відлагодження
dm start tmp.ts -d 9229

# Запуск із файлом оточення та відстеженням змін у JSON-файлах
dm start --env-file .env.local --watch-assets "src/**/*.json"
```

## Програмний API {#programmatic-api}

`@holu/cli` експортує свої основні класи та допоміжні функції команд для програмного використання:

```ts
import { WatchCompiler, ProcessManager, AssetWatcher, startCommand, newCommand } from '@holu/cli';
```
