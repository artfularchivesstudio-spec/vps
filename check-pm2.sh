#!/bin/bash

# 🔍 Check PM2 Status - Quick PM2 Process Inspector
#
# "Sometimes the digital spirits work in mysterious ways, 
#  and PM2 processes dance in the shadows unseen..."
#
# - The Spellbinding Museum Director of Process Management

echo "=== 🎭 PM2 PROCESS INSPECTOR ==="
echo "Current working directory: $(pwd)"
echo "User: $(whoami)"
echo "Date: $(date)"
echo

echo "=== PM2 Status ==="
pm2 list

echo
echo "=== Port 1337 Usage ==="
if lsof -i :1337 2>/dev/null; then
    echo "⚠️  Port 1337 is in use!"
    echo
    echo "=== Process Details ==="
    lsof -i :1337
    echo
    echo "💡 To stop PM2 processes: pm2 stop all && pm2 delete all"
    echo "💡 To kill specific PID: kill [PID_NUMBER]"
else
    echo "✅ Port 1337 is free"
fi

echo
echo "=== Quick Actions ==="
echo "1. Stop all PM2 processes: pm2 stop all"
echo "2. Delete all PM2 processes: pm2 delete all"  
echo "3. Restart PM2 daemon: pm2 kill && pm2 resurrect"
echo "4. Check this script: ./check-pm2.sh"
