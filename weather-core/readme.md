# weather-core

## Configuration
- Set the path to the weather database in the `DB_PATH` environment variable.
- Set username and password for email account used for sending alerts in `EMAIL_USER` and `EMAIL_PASS` environment variables.
- See `.env.example` for an example.

## Run app
```
tsx src/main.ts
```
OR
```
npm run dev
```

## Run tests with coverage
```
npm run test:coverage
```