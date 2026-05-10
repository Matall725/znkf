import { createApiServer } from './server.ts';

const port = Number(process.env.PORT ?? 3000);
const app = createApiServer();

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
