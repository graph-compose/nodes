import "dotenv/config";
import "source-map-support/register";
import app from "./nodes";

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
