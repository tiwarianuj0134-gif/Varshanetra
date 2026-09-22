# 🚀 VARSHANETRA - Quick Start Guide

## One-Command Startup

Run **ONE** of these commands to start everything:

### Option 1: Using npm (Recommended)
```bash
npm run dev
```

### Option 2: Using PowerShell Script
```powershell
.\start-varshanetra.ps1
```

### Option 3: Using Batch File
```cmd
start-varshanetra.bat
```

---

## What Runs Automatically?

When you run `npm run dev`, these services start together:

✅ **Frontend (Next.js)** - Port 3000  
✅ **ML Server (Flask)** - Port 5000  
✅ **Database (MongoDB)** - Connection via .env.local  

---

## Access Points

After running `npm run dev`:

🌐 **Website**: http://localhost:3000  
🤖 **ML API**: http://localhost:5000  
🗄️ **Database**: Connected automatically  

---

## Prerequisites

Make sure you have these installed:

1. **Node.js** (v18 or higher)
   - Check: `node --version`
   - Install: https://nodejs.org/

2. **Python** (3.8 or higher)
   - Check: `python --version`
   - Install: https://www.python.org/

3. **MongoDB** (optional - will use Atlas if not local)
   - Check: `mongod --version`
   - Install: https://www.mongodb.com/try/download/community

---

## First Time Setup

If this is your first time:

```bash
# 1. Install Node.js dependencies
npm install

# 2. Install Python dependencies (ML Server)
cd ml_server
pip install -r requirements.txt
cd ..

# 3. Create .env.local file (if not exists)
# Copy from .env.example and fill in your values

# 4. Seed the database (optional)
npm run seed

# 5. Start everything!
npm run dev
```

---

## Console Output

You'll see color-coded logs:

- **[NEXT]** (Cyan) - Frontend messages
- **[ML]** (Magenta) - ML Server messages

---

## Stopping the Server

Press `Ctrl+C` in the terminal to stop all services at once.

---

## Troubleshooting

### Port Already in Use?

**Frontend (3000):**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Kill and restart
npm run dev
```

**ML Server (5000):**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Kill and restart
npm run dev
```

### ML Server Not Starting?

```bash
# Check Python dependencies
cd ml_server
pip install -r requirements.txt
cd ..

# Try again
npm run dev
```

### MongoDB Connection Error?

Check your `.env.local` file has:
```
MONGODB_URI=your_mongodb_connection_string
```

---

## Production Build

For production:

```bash
# Build frontend
npm run build

# Start production server
npm start
```

---

## Need Help?

1. Check the console logs for errors
2. Make sure all prerequisites are installed
3. Verify `.env.local` configuration
4. Check if ports 3000 and 5000 are available

---

## Project Structure

```
varshanetra_SIH/
├── src/                 # Frontend (Next.js)
├── ml_server/           # ML API (Flask)
├── package.json         # npm scripts
├── .env.local          # Environment variables
└── start-varshanetra.*  # Startup scripts
```

---

**Happy Coding! 🎉**
