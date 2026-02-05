# Money Manager Backend

RESTful API for Money Manager application built with Node.js, Express, and MongoDB.

## Features

- 💰 Transaction management (income/expense)
- 🏦 Account management
- 📊 Transaction filtering and summary
- 🔍 Advanced search capabilities
- ✏️ Edit/Delete restrictions (12-hour window)
- 📅 Date range queries
- 🏢 Division tracking (office/personal)

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Atlas)
- **ODM**: Mongoose
- **Validation**: express-validator
- **CORS**: cors

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd money-manager-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your MongoDB connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/money-manager?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
```

## MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account or sign in
3. Create a new cluster
4. Click "Connect" and choose "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Replace `myFirstDatabase` with `money-manager`
8. Paste the connection string in your `.env` file

## Running the Application

### Development Mode (with auto-restart)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/transactions | Get all transactions |
| GET | /api/transactions/:id | Get transaction by ID |
| POST | /api/transactions | Create new transaction |
| PUT | /api/transactions/:id | Update transaction (within 12 hours) |
| DELETE | /api/transactions/:id | Delete transaction (within 12 hours) |
| GET | /api/transactions/filter | Get filtered transactions |
| GET | /api/transactions/summary | Get transaction summary |
| GET | /api/transactions/date-range | Get transactions by date range |

### Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/accounts | Get all accounts |
| GET | /api/accounts/:id | Get account by ID |
| POST | /api/accounts | Create new account |
| PUT | /api/accounts/:id | Update account |
| DELETE | /api/accounts/:id | Delete account |
| POST | /api/accounts/transfer | Transfer money between accounts |

## API Usage Examples

### Create Transaction

```bash
POST /api/transactions
Content-Type: application/json

{
  "type": "expense",
  "amount": 500,
  "description": "Grocery shopping",
  "category": "food",
  "division": "personal",
  "date": "2024-02-02T10:30:00Z"
}
```

### Get Filtered Transactions

```bash
GET /api/transactions/filter?type=expense&division=office&startDate=2024-01-01&endDate=2024-02-02
```

### Get Summary

```bash
GET /api/transactions/summary?startDate=2024-01-01&endDate=2024-02-02
```

### Transfer Between Accounts

```bash
POST /api/accounts/transfer
Content-Type: application/json

{
  "fromAccountId": "507f1f77bcf86cd799439011",
  "toAccountId": "507f191e810c19729de860ea",
  "amount": 1000
}
```

## Data Models

### Transaction Schema

```javascript
{
  type: String,        // 'income' or 'expense'
  amount: Number,      // Transaction amount
  description: String, // Brief description
  category: String,    // Category (fuel, food, medical, etc.)
  division: String,    // 'personal' or 'office'
  date: Date,         // Transaction date and time
  createdAt: Date,    // Auto-generated
  updatedAt: Date     // Auto-generated
}
```

### Account Schema

```javascript
{
  name: String,        // Account name
  type: String,        // 'savings', 'checking', 'cash', 'credit', 'investment'
  balance: Number,     // Current balance
  currency: String,    // Currency code (default: 'INR')
  description: String, // Optional description
  createdAt: Date,    // Auto-generated
  updatedAt: Date     // Auto-generated
}
```

## Business Rules

1. **12-Hour Edit Window**: Transactions can only be edited or deleted within 12 hours of creation
2. **Validation**: All required fields must be provided and valid
3. **Categories**: Categories are stored in lowercase
4. **Date Handling**: All dates are stored in ISO 8601 format
5. **Balance Checking**: Account transfers check for sufficient balance

## Project Structure

```
money-manager-backend/
├── config/
│   └── db.js              # Database configuration
├── models/
│   ├── Transaction.js     # Transaction model
│   └── Account.js         # Account model
├── routes/
│   ├── transactions.js    # Transaction routes
│   └── accounts.js        # Account routes
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore file
├── package.json          # Dependencies and scripts
├── server.js             # Main application file
└── README.md             # This file
```

## Deployment

### Deploy to Heroku

1. Install Heroku CLI
2. Login to Heroku:
```bash
heroku login
```

3. Create new app:
```bash
heroku create your-app-name
```

4. Set environment variables:
```bash
heroku config:set MONGODB_URI="your-mongodb-uri"
heroku config:set NODE_ENV=production
```

5. Deploy:
```bash
git push heroku main
```

### Deploy to Railway

1. Install Railway CLI
2. Login to Railway:
```bash
railway login
```

3. Initialize project:
```bash
railway init
```

4. Add environment variables in Railway dashboard
5. Deploy:
```bash
railway up
```

### Deploy to Render

1. Go to [Render](https://render.com)
2. Connect your GitHub repository
3. Create a new Web Service
4. Add environment variables
5. Deploy

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| MONGODB_URI | MongoDB connection string | Required |
| PORT | Server port | 5000 |
| NODE_ENV | Environment (development/production) | development |

## Error Handling

The API returns standard HTTP status codes:

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **403**: Forbidden (edit/delete after 12 hours)
- **404**: Not Found
- **500**: Server Error

Error response format:
```json
{
  "message": "Error description",
  "errors": [...]  // Validation errors if applicable
}
```

## Testing

Test the API using:
- Postman
- Thunder Client (VS Code extension)
- curl commands
- Frontend application

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository.

## Roadmap

- [ ] Authentication & Authorization
- [ ] User management
- [ ] Budget planning features
- [ ] Recurring transactions
- [ ] Export to CSV/PDF
- [ ] Email notifications
- [ ] Multi-currency support
