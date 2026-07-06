.PHONY: backend frontend seed-virtual-user seed-virtual-user-ai seed-virtual-user-month-ai

backend:
	cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8001

frontend:
	cd frontend && npm run dev

seed-virtual-user:
	bash scripts/seed_virtual_user.sh

seed-virtual-user-ai:
	RUN_AI=true bash scripts/seed_virtual_user.sh

seed-virtual-user-month-ai:
	bash scripts/seed_virtual_user_month_ai.sh
