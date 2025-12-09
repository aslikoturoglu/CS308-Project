# CS308-Project

### Local Cloud Run-style smoke test

```bash
docker build -t cs308 .
docker run --rm -p 8081:8080 -e NODE_ENV=production cs308
curl -i http://localhost:8081/api/products
```
