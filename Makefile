.PHONY: backend frontend

backend:
	cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8001

frontend:
	cd frontend && npm run dev
