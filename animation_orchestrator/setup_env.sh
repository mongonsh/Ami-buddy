#!/bin/bash
set -e

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate and install
echo "Activating virtual environment and installing requirements..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "Setup complete! To run the orchestrator, use:"
echo "source venv/bin/activate"
echo "python3 orchestrator.py ..."
