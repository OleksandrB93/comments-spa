# Comments SPA Application (Middle Level)

Web application for commenting using React, NestJS, GraphQL, MongoDB and other modern technologies.

## 🚀 Technologies

### Frontend

- **React 18** with TypeScript
- **Apollo Client** for GraphQL
- **Material-UI** for UI components
- **Formik + Yup** for form validation
- **React Router** for navigation

### Backend

- **NestJS** as main framework
- **GraphQL** (Apollo Server)
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Redis** for caching
- **Bull Queue** for queues
- **WebSocket** for real-time updates

### Additional Services

- **Elasticsearch** for search
- **RabbitMQ** as message broker
- **Docker** for containerization

## 📋 Functionality

### Core Features

- ✅ Adding comments with validation
- ✅ Cascading comment display (replies)
- ✅ Sorting by User Name, Email, date
- ✅ Pagination (25 comments per page)
- ✅ File uploads (images, text)
- ✅ CAPTCHA protection
- ✅ XSS and SQL injection protection

### Additional Features

- 🔐 JWT authentication
- 🔍 Search through Elasticsearch
- ⚡ Caching through Redis
- 📨 Queues for file processing
- 🔄 Real-time updates through WebSocket
- 📊 GraphQL API

## 🛠 Installation and Setup

### Requirements

- Docker and Docker Compose
- Node.js 20+ (for local development)
- Git

### Quick Start

1. **Clone repository**

```bash
git clone https://github.com/OleksandrB93/comments-spa.git
cd comments-spa
```

2. **Run with Docker**

```bash
docker-compose up -d
```

3. **Access the application**

- Frontend: http://localhost:3000
- Backend GraphQL: http://localhost:3001/graphql
- MongoDB: localhost:27017
- Redis: localhost:6379
- Elasticsearch: http://localhost:9200
- RabbitMQ Management: http://localhost:15672

### Local Development

1. **Backend**

```bash
cd backend
npm install
npm run start:dev
```

2. **Frontend**

```bash
cd frontend
npm install
npm start
```

## 📁 Project Structure

```
comments-spa/
├── frontend/              # React SPA
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Pages
│   │   ├── hooks/         # Custom hooks
│   │   ├── graphql/       # GraphQL queries/mutations
│   │   └── utils/         # Utilities
├── backend/               # NestJS API
│   ├── src/
│   │   ├── modules/       # Modules (comments, users, files)
│   │   ├── common/        # Shared components
│   │   └── config/        # Configuration
├── database-schema/       # MongoDB schemas
├── docker-compose.yml     # Docker configuration
└── README.md
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**

```env
NODE_ENV=development
MONGODB_URI=mongodb://admin:password123@localhost:27017/comments_db?authSource=admin
REDIS_URL=redis://:redis123@localhost:6379
ELASTICSEARCH_URL=http://localhost:9200
RABBITMQ_URL=amqp://admin:rabbit123@localhost:5672
JWT_SECRET=your-super-secret-jwt-key
```

**Frontend (.env)**

```env
REACT_APP_API_URL=http://localhost:3001/graphql
REACT_APP_WS_URL=ws://localhost:3001/graphql
```

## 📊 Database

### MongoDB Collections

- **users** - users
- **comments** - comments
- **files** - uploaded files

### Comment Schema

```javascript
{
  _id: ObjectId,
  text: String,
  userId: ObjectId,
  parentId: ObjectId, // for replies
  files: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Virtual Machine Deployment

For deploying on a virtual machine, see the quick start guide:

```bash
# Quick deployment on VM
./deploy.sh
./security-setup.sh
```

📖 **Detailed VM deployment guide**: [VM-DEPLOYMENT.md](VM-DEPLOYMENT.md)  
🚀 **Quick start for VM**: [QUICK-START-VM.md](QUICK-START-VM.md)

### Production Docker

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Cloud Deployment

- AWS ECS/EKS
- Google Cloud Run
- Azure Container Instances
- Yandex Cloud

## 📝 API Documentation

GraphQL Playground is available at: http://localhost:3001/graphql

### Main Queries

```graphql
query GetComments($page: Int, $limit: Int, $sortBy: String) {
  comments(page: $page, limit: $limit, sortBy: $sortBy) {
    id
    text
    user {
      username
      email
    }
    createdAt
    replies {
      id
      text
      user {
        username
      }
    }
  }
}
```

### Main Mutations

```graphql
mutation CreateComment($input: CreateCommentInput!) {
  createComment(input: $input) {
    id
    text
    user {
      username
    }
  }
}
```

## 🔒 Security

- ✅ XSS protection (sanitization)
- ✅ SQL injection protection (Mongoose ODM)
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Input validation

## 📈 Monitoring

- Logging through Winston
- Metrics through Prometheus (optional)
- Health checks for all services

## 🤝 Development

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Create a Pull Request

## 📄 License

MIT License

## 👥 Authors

- Developer Name - Initial work

---

**Note**: This project was created as a test task for a Middle level position using modern technology stack.
