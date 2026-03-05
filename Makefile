.PHONY: backend frontend

backend:
	cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000

frontend:
	cd frontend && npm run dev
