# weather-analysis

## Configuration
- Set the path to the weather database in the `DB_PATH` environment variable. See `.env.example` for an example.

## Run app
```
uvicorn app:app --reload --port 8000
```

## Run tests with coverage
```
pytest --cov=. --cov-report=term-missing
```

## Import data from .xlsx files
- Place .xlsx files in the `monthly_xlsx_files` folder.
- Run the `import_data.py` script to import data into the database: `python import_data.py`. This will read all .xlsx files in the folder and insert the data into the database.