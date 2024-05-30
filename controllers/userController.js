const { User } = require("../models/models");
const ApiError = require("../error/ApiError");
const bcrypt = require("bcrypt");

class UserController {
  async registration(req, res, next) {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return next(ApiError.badRequest("Неккоректные email или пароль"));
    }

    const candidate = await User.findOne({ where: { email } });
    if (candidate) {
      return next(
        ApiError.badRequest("Пользователь с таким email уже существует")
      );
    }

    const hashPassword = await bcrypt.hash(password, 8);
    const user = await User.create({ email, role, password: hashPassword });
    return res.sendStatus(201);
  }

  async login(req, res, next) {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(ApiError.badRequest("Пользователь с таким email не найден"));
    }

    const comparePassword = await bcrypt.compare(password, user.password);
    if (!comparePassword) {
      return next(ApiError.badRequest("Указан неверный пароль"));
    }

    return res.sendStatus(200);
  }

  async check(req, res) {
    return res.sendStatus(200);
  }
}

module.exports = new UserController();
