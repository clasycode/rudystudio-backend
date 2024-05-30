const Router = require("express");
const router = new Router();
const caseRouter = require("./caseRouter");
const userRouter = require("./userRouter");

router.use("/user", userRouter);
router.use("/case", caseRouter);

module.exports = router;
