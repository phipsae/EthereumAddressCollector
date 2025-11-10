# Ethereum Address Collector

A modern web application for collecting Ethereum addresses via QR code scanning with Web3 wallet integration.

## Features

- 🔍 **QR Code Generation** - Automatically generates QR code for easy mobile access
- 👛 **Web3 Wallet Integration** - Connect MetaMask or other Web3 wallets to automatically fetch addresses
- ⌨️ **Manual Entry** - Option to manually enter Ethereum addresses
- 📱 **Mobile-Friendly** - Fully responsive design optimized for mobile devices
- 📊 **Admin Dashboard** - View, search, and manage collected addresses
- 📥 **CSV Export** - Export collected addresses to CSV format
- 🔗 **Etherscan Integration** - Direct links to view addresses on Etherscan
- 💾 **SQLite Database** - Lightweight and portable data storage

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### For Collectors (Organizers)

1. Open the landing page at `http://localhost:3000`
2. Display the QR code for participants to scan
3. Share the collection URL or let people scan the QR code
4. Access the admin dashboard at `http://localhost:3000/admin` to view collected addresses

### For Participants (Address Submitters)

1. Scan the QR code or visit the collection URL
2. Choose your preferred method:
   - **Connect Wallet**: Connect your Web3 wallet (MetaMask) to automatically fetch your addresses
   - **Manual Entry**: Type in your Ethereum address manually
3. Select the address you want to submit (if using wallet connection)
4. Add optional notes (e.g., "Trading wallet", "Cold storage")
5. Submit your address

## Project Structure

```
AddressCollector/
├── server.js           # Express backend server
├── package.json        # Node.js dependencies
├── addresses.db        # SQLite database (created automatically)
├── public/
│   ├── index.html      # Landing page with QR code
│   ├── collect.html    # Address collection form
│   ├── admin.html      # Admin dashboard
│   └── styles.css      # CSS styles
└── README.md
```

## API Endpoints

### POST `/api/submit-address`
Submit a new Ethereum address
```json
{
  "address": "0x...",
  "notes": "Optional notes"
}
```

### GET `/api/addresses`
Get all collected addresses (admin)

### GET `/api/count`
Get total count of collected addresses

### DELETE `/api/addresses/:id`
Delete a specific address (admin)

## Security Considerations

⚠️ **Important**: This is a basic implementation. For production use, consider adding:

- Authentication/authorization for admin dashboard
- Rate limiting to prevent spam
- HTTPS/SSL encryption
- Input sanitization and validation
- CAPTCHA or other anti-bot measures
- Database encryption
- Access logging and monitoring

## Configuration

You can modify the server port by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## Database

The application uses SQLite with the following schema:

```sql
CREATE TABLE addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT NOT NULL UNIQUE,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  notes TEXT
)
```

The database file (`addresses.db`) is created automatically in the project root.

## Browser Compatibility

- Modern browsers with Web3 wallet support (Chrome, Firefox, Brave)
- Mobile browsers (iOS Safari, Chrome Mobile)
- MetaMask browser extension or mobile app

## Troubleshooting

### Web3 wallet not connecting
- Make sure you have MetaMask or another Web3 wallet installed
- Check that you're on a supported browser
- Try refreshing the page and reconnecting

### QR code not displaying
- Check browser console for errors
- Ensure the QR code library is loading correctly
- Try clearing browser cache

### Addresses not saving
- Check server console for errors
- Verify SQLite database is created and writable
- Ensure the address format is valid (0x + 40 hex characters)

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!
