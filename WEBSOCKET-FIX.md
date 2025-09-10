# WebSocket Fix Instructions

## Проблеми, які були виправлені:

### 1. **Кольорові коди в IP-адресі**

- **Проблема**: IP-адреса містила кольорові коди з логів скрипта
- **Рішення**: Додано очищення кольорових кодів в `deploy.sh`

### 2. **Неправильний WebSocket namespace**

- **Проблема**: WebSocket підключався без namespace `/comments`
- **Рішення**: Додано namespace `/comments` до WebSocket URL

## Оновлені файли:

### `deploy.sh`

- Додано очищення кольорових кодів з IP-адреси
- Оновлено WebSocket URL на `ws://IP:3001/comments`

### `frontend/src/hooks/useWebSocket.ts`

- Додано namespace `/comments` до WebSocket підключення
- Тепер підключається до `ws://IP:3001/comments`

### `docker-compose.prod.yml`

- Оновлено змінну `VITE_WS_URL` на `ws://localhost:3001/comments`

### `env.example`

- Оновлено приклад WebSocket URL

## Як перезапустити:

1. **Зупиніть поточні контейнери:**

   ```bash
   docker compose -f docker-compose.prod.yml down
   ```

2. **Перезапустіть розгортання:**

   ```bash
   sudo ./deploy.sh
   ```

3. **Перевірте WebSocket підключення:**
   - Відкрийте Developer Tools в браузері
   - Перевірте консоль на наявність: `WebSocket connected: [socket_id]`
   - WebSocket URL повинен бути: `ws://YOUR_IP:3001/comments`

## Очікуваний результат:

✅ WebSocket URL без кольорових кодів  
✅ Правильне підключення до namespace `/comments`  
✅ Успішне підключення без помилок timeout
