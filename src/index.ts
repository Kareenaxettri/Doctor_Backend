import app, { PORT } from "./app";
import { connectToMongoDB } from "./database/mongodb";

connectToMongoDB();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server local: http://localhost:${PORT}`);
  console.log(`Server mobile: http://192.168.101.9:${PORT}`);
});