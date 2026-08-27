const coursesService = require("../src/features/courses/courses.service");

async function main() {
  try {
    const course = await coursesService.getCourse("ed0c2bbd-199e-4fe9-83cb-0f887fa5dee7", { id: "test", role: "ADMIN" });
    console.log("Found Course Title:", course.title);
  } catch (err) {
    console.error("Error fetching course:", err);
  }
}

main();
