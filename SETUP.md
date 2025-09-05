# Інструкція по налаштуванню проекту

## Передумови

### Обов'язкові інструменти:

1. **Docker** та **Docker Compose**

   - Windows: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Linux: `sudo apt install docker.io docker-compose`
   - macOS: `brew install docker docker-compose`

2. **Git**

   - Windows: [Git for Windows](https://git-scm.com/download/win)
   - Linux: `sudo apt install git`
   - macOS: `brew install git`

3. **Node.js 18+** (для локальної розробки)
   - [Офіційний сайт](https://nodejs.org/)

## Швидкий старт

### 1. Клонування репозиторію

```bash
git clone <repository-url>
cd comments-spa
```

### 2. Налаштування змінних середовища

```bash
# Backend
cp backend/env.example backend/.env

# Frontend
cp frontend/env.example frontend/.env
```

### 3. Запуск через Docker (рекомендовано)

```bash
# Запуск всіх сервісів
make start
# або
docker-compose up -d

# Перевірка статусу
make status
# або
docker-compose ps
```

### 4. Доступ до додатку

- **Frontend**: http://localhost:3000
- **Backend GraphQL**: http://localhost:3001/graphql
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379
- **Elasticsearch**: http://localhost:9200
- **RabbitMQ Management**: http://localhost:15672

## Локальна розробка

### Backend (NestJS)

```bash
cd backend
npm install
npm run start:dev
```

### Frontend (React)

```bash
cd frontend
npm install
npm start
```

## Корисні команди

### Docker команди

```bash
# Запуск
make start

# Зупинка
make stop

# Перезапуск
make restart

# Очищення
make clean

# Логи
make logs

# Статус
make status
```

### База даних

```bash
# Скидання бази даних
make db-reset

# Підключення до MongoDB
docker-compose exec mongodb mongosh
```

### Тестування

```bash
# Всі тести
make test

# Тільки backend
cd backend && npm test

# Тільки frontend
cd frontend && npm test
```

## Структура проекту

```
comments-spa/
├── frontend/              # React SPA
│   ├── src/
│   │   ├── components/    # React компоненти
│   │   ├── pages/         # Сторінки
│   │   ├── hooks/         # Custom hooks
│   │   ├── graphql/       # GraphQL queries/mutations
│   │   └── utils/         # Утиліти
│   ├── public/            # Статичні файли
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── backend/               # NestJS API
│   ├── src/
│   │   ├── modules/       # Модулі (comments, users, files)
│   │   ├── common/        # Спільні компоненти
│   │   └── config/        # Конфігурація
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
├── database-schema/       # MongoDB схеми
│   └── init-mongo.js
├── docker-compose.yml     # Docker конфігурація
├── Makefile              # Команди для зручності
├── README.md
└── SETUP.md
```

## Налаштування змінних середовища

### Backend (.env)

```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://admin:password123@localhost:27017/comments_db?authSource=admin
REDIS_URL=redis://:redis123@localhost:6379
ELASTICSEARCH_URL=http://localhost:9200
RABBITMQ_URL=amqp://admin:rabbit123@localhost:5672
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:3001/graphql
REACT_APP_WS_URL=ws://localhost:3001/graphql
REACT_APP_NODE_ENV=development
REACT_APP_MAX_FILE_SIZE=10485760
REACT_APP_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/gif
REACT_APP_ALLOWED_TEXT_TYPES=text/plain
REACT_APP_COMMENTS_PER_PAGE=25
REACT_APP_MAX_IMAGE_WIDTH=320
REACT_APP_MAX_IMAGE_HEIGHT=240
```

## Вирішення проблем

### Порт вже використовується

```bash
# Перевірити які процеси використовують порти
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

# Зупинити сервіси
make stop
```

### Проблеми з Docker

```bash
# Перезапуск Docker
sudo systemctl restart docker

# Очищення Docker
docker system prune -a
```

### Проблеми з базою даних

```bash
# Скидання бази даних
make db-reset

# Перевірка підключення
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

## Розробка

### Додавання нових залежностей

```bash
# Backend
cd backend
npm install <package-name>

# Frontend
cd frontend
npm install <package-name>
```

### Створення нових модулів (Backend)

```bash
cd backend
npm run generate module <module-name>
npm run generate service <service-name>
npm run generate controller <controller-name>
```

## Деплой

### Production

```bash
# Створення production збірки
make build

# Запуск production
make prod
```

### Cloud Deployment

- AWS ECS/EKS
- Google Cloud Run
- Azure Container Instances
- Yandex Cloud

## Підтримка

При виникненні проблем:

1. Перевірте логи: `make logs`
2. Перевірте статус: `make status`
3. Перезапустіть сервіси: `make restart`
4. Очистіть систему: `make clean`
