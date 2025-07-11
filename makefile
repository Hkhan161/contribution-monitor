# Location of frontend and backend
FRONT_DIR=frontend
BACK_DIR=backend
PYTHON=python3
PIP=pip

.PHONY: install-backend install-frontend dev clean

install-backend:
	cd $(BACK_DIR) && \
	$(PIP) install -r requirements.txt

install-frontend:
	cd $(FRONT_DIR) && \
	npm install

dev:
	cd $(BACK_DIR) && \
	$(PYTHON) -m uvicorn main:app --reload & \
	cd $(FRONT_DIR) && \
	npm run dev

clean:
	-pkill -f uvicorn || true
	cd $(FRONT_DIR) && rm -rf node_modules
	cd $(BACK_DIR) && find . -type d -name "__pycache__" -exec rm -r {} +
