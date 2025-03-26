import app from "./app";
import Database from "./config/db";

Database.connect();

const PORT = process.env.NODE_PORT || 5000;


app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});