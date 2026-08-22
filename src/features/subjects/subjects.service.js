const { ApiError } = require("../../utils/ApiError");
const subjectsRepo = require("./subjects.repository");

const listSubjects = async () => {
  return subjectsRepo.findAll();
};

const createSubject = async (data) => {
  try {
    return await subjectsRepo.create(data);
  } catch (err) {
    if (err.code === "P2002") {
      throw new ApiError(409, "Subject name already exists", "CONFLICT");
    }
    throw err;
  }
};

module.exports = { listSubjects, createSubject };
