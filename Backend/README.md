# Backend (Flask + Supabase Postgres)

- Copy `.env.example` to `.env` and set `DATABASE_URL`, `JWT_SECRET`, `PREDICT_CSV_PATH`.
- Install: `python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
- Run: `FLASK_APP=app/app.py flask run` or `python -m app.app`
- DB schema aligns with `Frontend` ER via Supabase migrations. Patients use same UUID as the related user with role `user`.
