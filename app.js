import express from "express";
import { sendError } from "./src/common/response.js";
import { authRouter as adminAuthRouter } from "./src/modules/admin/auth/index.js";
import { userRouter as adminUserRouter } from "./src/modules/admin/user/index.js";
import { authRouter as clientAuthRouter } from "./src/modules/client/auth/index.js";

const app = express();

app.use(express.json());
app.use("/api/admin/users", adminUserRouter);
app.use("/api/admin/auth", adminAuthRouter);
app.use("/api/client/auth", clientAuthRouter);
app.use("/", (req, res) => {
  res.json({
    message: "hello",
  });
});

app.use((error, req, res, next) => {
  return sendError(res, error);
});

export default app;
