const uuid = require("uuid");
const path = require("path");
const sharp = require("sharp");
const fs = require("fs");
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

      // Найти кейс, чтобы получить имена файлов изображений
      const siteCase = await Case.findOne({
        where: { id },
        include: [{ model: CaseSection, as: "sections" }],
      });
      if (!siteCase) {
        return next(ApiError.badRequest("Case not found"));
      }

      // Удалить изображения
      const deleteFile = (fileName) => {
        const filePath = path.resolve(__dirname, "..", "static", fileName);
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Failed to delete file: ${filePath}`, err);
          } else {
            console.log(`File deleted: ${filePath}`);
          }
        });
      };

      deleteFile(siteCase.caseImg);
      deleteFile(siteCase.siteImg);
      deleteFile(siteCase.siteImgMobile);

      siteCase.sections.forEach((section) => {
        if (section.img) {
          deleteFile(section.img);
        }
      });

      // Удалить кейс из базы данных
      await Case.destroy({ where: { id } });

      return res.json({ message: "Case deleted successfully" });
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

      // Найти текущий кейс для получения старых данных
      const currentCase = await Case.findOne({
        where: { id },
        include: [{ model: CaseSection, as: "sections" }],
      });
      if (!currentCase) {
        return next(ApiError.badRequest("Case not found"));
      }

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

      const deleteFile = (fileName) => {
        const filePath = path.resolve(__dirname, "..", "static", fileName);
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Failed to delete file: ${filePath}`, err);
          } else {
            console.log(`File deleted: ${filePath}`);
          }
        });
      };

      if (req.files) {
        if (req.files.caseImg) {
          const caseImg = req.files.caseImg;
          const caseImgName = uuid.v4() + path.extname(caseImg.name);
          await sharp(caseImg.data)
            .resize({ width: 800 })
            .jpeg({ quality: 90 })
            .toFile(path.resolve(__dirname, "..", "static", caseImgName));
          deleteFile(currentCase.caseImg);
          caseData.caseImg = caseImgName;
        } else {
          caseData.caseImg = currentCase.caseImg;
        }

        if (req.files.siteImg) {
          const siteImg = req.files.siteImg;
          const siteImgName = uuid.v4() + path.extname(siteImg.name);
          await sharp(siteImg.data)
            .resize({ width: 800 })
            .jpeg({ quality: 90 })
            .toFile(path.resolve(__dirname, "..", "static", siteImgName));
          deleteFile(currentCase.siteImg);
          caseData.siteImg = siteImgName;
        } else {
          caseData.siteImg = currentCase.siteImg;
        }

        if (req.files.siteImgMobile) {
          const siteImgMobile = req.files.siteImgMobile;
          const siteImgMobileName =
            uuid.v4() + path.extname(siteImgMobile.name);
          await sharp(siteImgMobile.data)
            .resize({ width: 800 })
            .jpeg({ quality: 90 })
            .toFile(path.resolve(__dirname, "..", "static", siteImgMobileName));
          deleteFile(currentCase.siteImgMobile);
          caseData.siteImgMobile = siteImgMobileName;
        } else {
          caseData.siteImgMobile = currentCase.siteImgMobile;
        }
      } else {
        caseData.caseImg = currentCase.caseImg;
        caseData.siteImg = currentCase.siteImg;
        caseData.siteImgMobile = currentCase.siteImgMobile;
      }

      await Case.update(caseData, { where: { id } });

      const sections = JSON.parse(req.body.sections);

      if (sections && sections.length) {
        await CaseSection.destroy({ where: { caseId: id } });

        const caseSections = [];

        for (const section of sections) {
          const sectionData = {
            caseId: id,
            title: section.title,
            text: section.text,
          };

          if (req.files && req.files[`sections[${section.index}][img]`]) {
            const sectionImg = req.files[`sections[${section.index}][img]`];
            const sectionImgName = uuid.v4() + path.extname(sectionImg.name);
            await sharp(sectionImg.data)
              .resize({ width: 800 })
              .jpeg({ quality: 90 })
              .toFile(path.resolve(__dirname, "..", "static", sectionImgName));
            sectionData.img = sectionImgName;
          } else {
            sectionData.img = section.img; // Используем старое изображение
          }

          caseSections.push(sectionData);
        }

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
