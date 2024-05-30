const sequelize = require("../database/database");
const { DataTypes } = require("sequelize");

const User = sequelize.define("user", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, unique: true },
  password: { type: DataTypes.STRING },
});

const Case = sequelize.define("case", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  caseImg: { type: DataTypes.STRING, allowNull: false },
  caseLink: { type: DataTypes.STRING, allowNull: false },
  siteLink: { type: DataTypes.STRING, allowNull: false },
  titleDesktop: { type: DataTypes.STRING, allowNull: false },
  titleMobile: { type: DataTypes.STRING, allowNull: false },
  sphere: { type: DataTypes.STRING, allowNull: false },
  sphere_color: { type: DataTypes.STRING, allowNull: false },
  siteImg: { type: DataTypes.STRING, allowNull: false },
  what: { type: DataTypes.TEXT, allowNull: false },
  problem: { type: DataTypes.TEXT, allowNull: false },
  aim: { type: DataTypes.TEXT, allowNull: false },
});

const CaseSection = sequelize.define("case_section", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  caseId: {
    type: DataTypes.INTEGER,
    references: {
      model: Case,
      key: "id",
    },
    allowNull: false,
  },
  title: { type: DataTypes.STRING },
  text: { type: DataTypes.TEXT },
  img: { type: DataTypes.STRING },
});

User.hasMany(Case);
Case.belongsTo(User);

Case.hasMany(CaseSection, { foreignKey: "caseId", as: "sections" });
CaseSection.belongsTo(Case, { foreignKey: "caseId" });

module.exports = {
  User,
  Case,
  CaseSection,
};
