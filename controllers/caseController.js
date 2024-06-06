const uuid = require("uuid");
const path = require("path");
const sharp = require("sharp");
const { Case, CaseSection } = require("../models/models");
const ApiError = require("../error/ApiError");

class CaseController {
  async create(req, res, next) {
    try {
      const {
        caseLink,
        siteLink,
        titleDesktop,
        titleMobile,
        sphere,
        sphere_color,
        what,
        problem,
        aim,
      } = req.body;

      const sections = [];

      for (const key in req.body) {
        if (key.startsWith("sections")) {
          const index = key.match(/\d+/)[0];
          if (!sections[index]) {
            sections[index] = {};
          }
          const field = key.includes("title") ? "title" : "text";
          sections[index][field] = req.body[key];
        }
      }

      for (const key in req.files) {
        if (key.startsWith("sections")) {
          const index = key.match(/\d+/)[0];
          if (sections[index] && req.files[key]) {
            sections[index].img = req.files[key];
          }
        }
      }

      const { caseImg, siteImg, siteImgMobile } = req.files;

      let caseImgName = uuid.v4() + path.extname(caseImg.name);
      let siteImgName = uuid.v4() + path.extname(siteImg.name);
      let siteImgMobileName = uuid.v4() + path.extname(siteImgMobile.name);

      // Использование sharp для обработки изображений
      await sharp(caseImg.data)
        // Установите нужный размер
        .jpeg({ quality: 100 }) // Установите нужное качество
        .toFile(path.resolve(__dirname, "..", "static", caseImgName));

      await sharp(siteImg.data)
        .jpeg({ quality: 100 })
        .toFile(path.resolve(__dirname, "..", "static", siteImgName));

      await sharp(siteImgMobile.data)
        .jpeg({ quality: 100 })
        .toFile(path.resolve(__dirname, "..", "static", siteImgMobileName));

      const siteCase = await Case.create({
        caseImg: caseImgName,
        caseLink,
        siteLink,
        titleDesktop,
        titleMobile,
        sphere,
        sphere_color,
        siteImg: siteImgName,
        siteImgMobile: siteImgMobileName,
        what,
        problem,
        aim,
      });

      if (sections && sections.length) {
        const caseSections = sections.map((section) => ({
          caseId: siteCase.id,
          title: section.title,
          text: section.text,
          img: section.img,
        }));

        for (const section of caseSections) {
          if (section.img) {
            const sectionImgName = uuid.v4() + path.extname(section.img.name);
            await sharp(section.img.data)
              .jpeg({ quality: 100 })
              .toFile(path.resolve(__dirname, "..", "static", sectionImgName));
            section.img = sectionImgName;
          }
        }

        await CaseSection.bulkCreate(caseSections);
      }

      return res.json(siteCase);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async getAll(req, res) {
    let siteCases = await Case.findAndCountAll({
      include: [{ model: CaseSection, as: "sections" }],
    });
    return res.json(siteCases);
  }

  async getOne(req, res) {
    const { id } = req.params;
    const siteCase = await Case.findOne({
      where: { id },
      include: [{ model: CaseSection, as: "sections" }],
    });
    return res.json(siteCase);
  }

  async getByLink(req, res, next) {
    try {
      const { caseLink } = req.params;
      const siteCase = await Case.findOne({
        where: { caseLink },
        include: [{ model: CaseSection, as: "sections" }],
      });

      if (siteCase) {
        return res.json(siteCase);
      } else {
        return next(ApiError.notFound("Case not found"));
      }
    } catch (e) {
      next(ApiError.internal(e.message));
    }
  }

  async deleteOne(req, res, next) {
    try {
      const { id } = req.params;
      const result = await Case.destroy({
        where: { id },
      });

      if (result) {
        return res.json({ message: "Case deleted successfully" });
      } else {
        return next(ApiError.badRequest("Case not found"));
      }
    } catch (e) {
      next(ApiError.internal(e.message));
    }
  }

  async updateOne(req, res, next) {
    try {
      const { id } = req.params;
      const {
        caseLink,
        siteLink,
        titleDesktop,
        titleMobile,
        sphere,
        sphere_color,
        what,
        problem,
        aim,
      } = req.body;

      const caseData = {
        caseLink,
        siteLink,
        titleDesktop,
        titleMobile,
        sphere,
        sphere_color,
        what,
        problem,
        aim,
      };

      if (req.files) {
        if (req.files.caseImg) {
          const caseImg = req.files.caseImg;
          const caseImgName = uuid.v4() + path.extname(caseImg.name);
          await caseImg.mv(
            path.resolve(__dirname, "..", "static", caseImgName)
          );
          caseData.caseImg = caseImgName;
        }

        if (req.files.siteImg) {
          const siteImg = req.files.siteImg;
          const siteImgName = uuid.v4() + path.extname(siteImg.name);
          await siteImg.mv(
            path.resolve(__dirname, "..", "static", siteImgName)
          );
          caseData.siteImg = siteImgName;
        }

        if (req.files.siteImgMobile) {
          const siteImgMobile = req.files.siteImgMobile;
          const siteImgMobileName =
            uuid.v4() + path.extname(siteImgMobile.name);
          await siteImgMobile.mv(
            path.resolve(__dirname, "..", "static", siteImgMobileName)
          );
          caseData.siteImgMobile = siteImgMobileName;
        }
      }

      await Case.update(caseData, { where: { id } });

      const sections = JSON.parse(req.body.sections);

      if (sections && sections.length) {
        await CaseSection.destroy({ where: { caseId: id } });

        const caseSections = sections.map((section) => {
          const sectionData = {
            caseId: id,
            title: section.title,
            text: section.text,
          };

          if (section.img) {
            const sectionImg = req.files[`sections[${section.index}][img]`];
            const sectionImgName = uuid.v4() + path.extname(sectionImg.name);
            sectionImg.mv(
              path.resolve(__dirname, "..", "static", sectionImgName)
            );
            sectionData.img = sectionImgName;
          }

          return sectionData;
        });

        await CaseSection.bulkCreate(caseSections);
      }

      const updatedCase = await Case.findOne({
        where: { id },
        include: [{ model: CaseSection, as: "sections" }],
      });

      if (updatedCase) {
        return res.json(updatedCase);
      } else {
        return next(ApiError.badRequest("Case not found"));
      }
    } catch (e) {
      next(ApiError.internal(e.message));
    }
  }
}

module.exports = new CaseController();
