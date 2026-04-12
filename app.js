import express from "express";
import { sendError, sendSuccess } from "./src/common/response.js";
import { authRouter as adminAuthRouter } from "./src/modules/admin/auth/index.js";
import { userRouter as adminUserRouter } from "./src/modules/admin/user/index.js";

const app = express();

app.use(express.json());
app.use("/", (req, res) => {
  res.json({
    message: "hello",
  });
});
app.use("/admin/users", adminUserRouter);
app.use("/admin/auth", adminAuthRouter);

app.use((error, req, res, next) => {
  return sendError(res, error);
});

export default app;
