const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting comprehensive database seeding for CapConn...");

  const defaultPassword = process.env.DEFAULT_SEED_PASSWORD || "admin1234";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 1. Seed Core Accounts
  console.log("Seeding Core Accounts (Admins, Trainers, Trainees)...");

  // Admin Account
  const admin = await prisma.user.upsert({
    where: { email: "admin@capconn.in" },
    update: { name: "Central Admin", passwordHash, role: "ADMIN", status: "APPROVED" },
    create: { email: "admin@capconn.in", name: "Central Admin", passwordHash, role: "ADMIN", status: "APPROVED" },
  });

  // Trainers (3 Trainers)
  const trainersData = [
    { email: "trainer@capconn.in", name: "Dr. Rajesh Sharma", bio: "Principal Cloud Architect and Lead Technical Instructor with 12+ years experience." },
    { email: "trainer2@capconn.in", name: "Prof. Ananya Sen", bio: "AI & Machine Learning Research Chair, specialization in LLMs & Neural Networks." },
    { email: "trainer3@capconn.in", name: "Vikramaditya Roy", bio: "DevSecOps Lead & Zero-Trust Infrastructure Consultant." }
  ];

  const trainers = [];
  for (const t of trainersData) {
    const u = await prisma.user.upsert({
      where: { email: t.email },
      update: { name: t.name, passwordHash, role: "TRAINER", status: "APPROVED" },
      create: { email: t.email, name: t.name, passwordHash, role: "TRAINER", status: "APPROVED" },
    });
    trainers.push(u);

    const profile = await prisma.trainerProfile.upsert({
      where: { userId: u.id },
      update: { fullName: t.name, bio: t.bio, phone: "+91 98765 43210" },
      create: { userId: u.id, fullName: t.name, bio: t.bio, phone: "+91 98765 43210" },
    });

    await prisma.qualification.deleteMany({ where: { trainerProfileId: profile.id } });
    await prisma.qualification.createMany({
      data: [
        { trainerProfileId: profile.id, degree: "Ph.D. in Computer Science", institution: "IISc Bangalore", year: 2016 },
        { trainerProfileId: profile.id, degree: "M.Tech in Software Engineering", institution: "IIT Bombay", year: 2012 }
      ]
    });
  }

  // Trainees (15 Trainees)
  const traineesData = [
    { email: "trainee@capconn.in", name: "Aarav Patel" },
    { email: "trainee2@capconn.in", name: "Priya Sharma" },
    { email: "trainee3@capconn.in", name: "Rohan Gupta" },
    { email: "trainee4@capconn.in", name: "Sneha Reddy" },
    { email: "trainee5@capconn.in", name: "Kabir Verma" },
    { email: "trainee6@capconn.in", name: "Ananya Iyer" },
    { email: "trainee7@capconn.in", name: "Aditya Joshi" },
    { email: "trainee8@capconn.in", name: "Meera Nair" },
    { email: "trainee9@capconn.in", name: "Devansh Mehta" },
    { email: "trainee10@capconn.in", name: "Ishita Bhatia" },
    { email: "trainee11@capconn.in", name: "Siddharth Rao" },
    { email: "trainee12@capconn.in", name: "Kavya Deshmukh" },
    { email: "trainee13@capconn.in", name: "Arjun Saxena" },
    { email: "trainee14@capconn.in", name: "Tanvi Kulkarni" },
    { email: "trainee15@capconn.in", name: "Varun Malhotra" },
  ];

  const trainees = [];
  for (const tr of traineesData) {
    const u = await prisma.user.upsert({
      where: { email: tr.email },
      update: { name: tr.name, passwordHash, role: "TRAINEE", status: "APPROVED" },
      create: { email: tr.email, name: tr.name, passwordHash, role: "TRAINEE", status: "APPROVED" },
    });
    trainees.push(u);

    const profile = await prisma.traineeProfile.upsert({
      where: { userId: u.id },
      update: { fullName: tr.name, bio: "Enthusiastic learner specializing in modern software development and cloud systems.", phone: "+91 91234 56789" },
      create: { userId: u.id, fullName: tr.name, bio: "Enthusiastic learner specializing in modern software development and cloud systems.", phone: "+91 91234 56789" },
    });

    await prisma.skill.deleteMany({ where: { traineeProfileId: profile.id } });
    await prisma.skill.createMany({
      data: [
        { traineeProfileId: profile.id, name: "JavaScript / TypeScript" },
        { traineeProfileId: profile.id, name: "React & Next.js" },
        { traineeProfileId: profile.id, name: "Node.js & Express" },
        { traineeProfileId: profile.id, name: "PostgreSQL & Prisma" }
      ]
    });
  }

  // Also keep backward compatible trainee@trainee.in
  const legacyTrainee = await prisma.user.upsert({
    where: { email: "trainee@trainee.in" },
    update: { name: "Aarav Patel (Legacy)", passwordHash, role: "TRAINEE", status: "APPROVED" },
    create: { email: "trainee@trainee.in", name: "Aarav Patel (Legacy)", passwordHash, role: "TRAINEE", status: "APPROVED" },
  });
  trainees.push(legacyTrainee);

  // 2. Subjects & Competencies
  console.log("Seeding Subjects & Competencies...");
  const subjectsData = [
    { name: "Cloud Computing & Architecture", description: "Multi-cloud systems, Kubernetes orchestration, and event-driven patterns." },
    { name: "AI & Machine Learning Systems", description: "Generative AI, Large Language Models (LLMs), RAG architectures, and MLOps." },
    { name: "Modern Full-Stack Development", description: "Next.js App Router, React 19, REST/GraphQL APIs, and database performance." },
    { name: "Cybersecurity & DevSecOps", description: "Zero-trust IAM, automated CI/CD pipeline auditing, and threat modeling." }
  ];

  const createdSubjects = [];
  for (const s of subjectsData) {
    const sub = await prisma.subject.upsert({
      where: { name: s.name },
      update: { description: s.description },
      create: { name: s.name, description: s.description },
    });
    createdSubjects.push(sub);
  }

  // 3. Courses
  console.log("Seeding Courses...");
  const coursesData = [
    {
      title: "Mastering Cloud-Native Architectures & Microservices",
      description: "Deep-dive into distributed systems, 12-factor microservices, Kubernetes orchestration, event-driven streaming, and fault-tolerant cloud design.",
      trainerId: trainers[0].id,
      subjectId: createdSubjects[0].id,
      status: "PUBLISHED"
    },
    {
      title: "Applied Generative AI & MLOps in Production",
      description: "Build and deploy production-grade LLM applications with retrieval-augmented generation (RAG), vector databases, prompt pipelines, and automated monitoring.",
      trainerId: trainers[1].id,
      subjectId: createdSubjects[1].id,
      status: "PUBLISHED"
    },
    {
      title: "Enterprise DevSecOps & Zero Trust Implementation",
      description: "Master security automation in CI/CD pipelines, container runtime defenses, secret management, and zero-trust identity architectures.",
      trainerId: trainers[2].id,
      subjectId: createdSubjects[3].id,
      status: "PUBLISHED"
    },
    {
      title: "Advanced Full-Stack Engineering with Next.js & Node",
      description: "Production web applications with Next.js 15, server components, database indexing, and micro-frontend design.",
      trainerId: trainers[0].id,
      subjectId: createdSubjects[2].id,
      status: "PUBLISHED"
    }
  ];

  const createdCourses = [];
  for (const c of coursesData) {
    let course = await prisma.course.findFirst({ where: { title: c.title } });
    if (!course) {
      course = await prisma.course.create({ data: c });
    } else {
      course = await prisma.course.update({ where: { id: course.id }, data: c });
    }
    createdCourses.push(course);
  }

  // 4. Learning Resources (Google Drive / Docs / Slides Embeds)
  console.log("Seeding Course Learning Resources...");
  await prisma.learningResource.deleteMany({
    where: { courseId: { in: createdCourses.map(c => c.id) } }
  });

  await prisma.learningResource.createMany({
    data: [
      {
        courseId: createdCourses[0].id,
        title: "Cloud Architecture Masterclass - Module 1 Presentation",
        type: "PRESENTATION",
        storageKey: "https://docs.google.com/presentation/d/1msy4wHoVZg1dqxoThGjwSYprHk8GiDBt/edit?usp=drive_link",
        mimeType: "application/vnd.google-apps.presentation",
        sizeBytes: 3145728,
      },
      {
        courseId: createdCourses[0].id,
        title: "Distributed Systems & Scalability Blueprint",
        type: "DOCUMENT",
        storageKey: "https://docs.google.com/presentation/d/1LRJTHssWRVWFmmEXfgiXablDelhDFnhv/edit?usp=drive_link",
        mimeType: "application/vnd.google-apps.presentation",
        sizeBytes: 4194304,
      },
      {
        courseId: createdCourses[1].id,
        title: "GenAI & LLM Deployment Architecture Deck",
        type: "PRESENTATION",
        storageKey: "https://docs.google.com/presentation/d/1wRgt_p6WqlLEgWTKmP0Wzkb72XAyxLXy/edit?usp=drive_link",
        mimeType: "application/vnd.google-apps.presentation",
        sizeBytes: 5242880,
      },
      {
        courseId: createdCourses[2].id,
        title: "DevSecOps Pipeline Security Guidelines",
        type: "DOCUMENT",
        storageKey: "https://docs.google.com/presentation/d/1msy4wHoVZg1dqxoThGjwSYprHk8GiDBt/edit?usp=drive_link",
        mimeType: "application/vnd.google-apps.presentation",
        sizeBytes: 2621440,
      },
    ]
  });

  // 5. Enrollments across trainees
  console.log("Enrolling trainees into courses...");
  for (const tr of trainees) {
    for (const c of createdCourses) {
      await prisma.enrollment.upsert({
        where: { courseId_traineeId: { courseId: c.id, traineeId: tr.id } },
        update: { status: "ACTIVE" },
        create: { courseId: c.id, traineeId: tr.id, status: "ACTIVE" }
      });
    }
  }

  // 6. Assessments & Quizzes
  console.log("Seeding Assessments & Quizzes...");
  for (const c of createdCourses) {
    let quiz = await prisma.assessment.findFirst({ where: { courseId: c.id, title: `${c.title} Quiz 1` } });
    if (!quiz) {
      quiz = await prisma.assessment.create({
        data: {
          courseId: c.id,
          trainerId: c.trainerId,
          title: `${c.title} Quiz 1`,
          description: "Comprehensive mid-term quiz evaluating fundamental concepts and practical knowledge.",
          type: "MCQ",
          status: "PUBLISHED",
          totalMarks: 30,
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          questions: {
            create: [
              {
                text: "What is the primary factor for cloud-native state management?",
                marks: 10,
                order: 1,
                options: {
                  create: [
                    { text: "Stateless backing services", isCorrect: true },
                    { text: "Local memory cache only", isCorrect: false },
                    { text: "Hardcoded connection strings", isCorrect: false },
                    { text: "Monolithic single database instance", isCorrect: false }
                  ]
                }
              },
              {
                text: "Which component handles horizontal scaling in container clusters?",
                marks: 10,
                order: 2,
                options: {
                  create: [
                    { text: "Horizontal Pod Autoscaler (HPA)", isCorrect: true },
                    { text: "Static Cron Job", isCorrect: false },
                    { text: "ConfigMap Handler", isCorrect: false },
                    { text: "Ingress Router", isCorrect: false }
                  ]
                }
              }
            ]
          }
        }
      });
    }

    // Seed student submissions
    for (let i = 0; i < 5; i++) {
      const student = trainees[i];
      await prisma.submission.create({
        data: {
          assessmentId: quiz.id,
          traineeId: student.id,
          status: "GRADED",
          score: 20 + (i * 2),
          submittedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        }
      });
    }
  }

  // 7. Certifications
  console.log("Seeding Certifications...");
  await prisma.certification.deleteMany({});
  for (const tr of trainees.slice(0, 5)) {
    await prisma.certification.create({
      data: {
        userId: tr.id,
        name: "AWS Certified Solutions Architect",
        issuer: "Amazon Web Services (AWS)",
        issueDate: new Date("2024-01-15"),
        credentialUrl: "https://drive.google.com/file/d/1R42J0RNHVdnc_sAewGF0FhLr8vtZzoUb/view?usp=drive_link"
      }
    });
  }

  // 8. Notifications & Announcements
  console.log("Seeding Notifications & Announcements...");
  await prisma.announcement.deleteMany({});
  await prisma.announcement.createMany({
    data: [
      {
        title: "Welcome to CapConn Learning Platform",
        body: "We are thrilled to launch the 2026 cohort across all technical tracks. Explore your course workspace and resource directory.",
        authorId: admin.id,
        status: "PUBLISHED",
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        title: "Upcoming Masterclass & Architecture Review",
        body: "Join us this Friday at 4:00 PM IST for a live interactive architecture review. Presentation slides are available in the course directory.",
        authorId: trainers[0].id,
        status: "PUBLISHED",
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ]
  });

  await prisma.notification.deleteMany({});
  for (const tr of trainees) {
    await prisma.notification.createMany({
      data: [
        {
          userId: tr.id,
          type: "COURSE",
          title: "New Course Material Available",
          body: "Slides and video resources have been uploaded to your course workspace.",
          isRead: false
        },
        {
          userId: tr.id,
          type: "ASSESSMENT",
          title: "Quiz Announcement",
          body: "Mid-Term Quiz is now live. Check deadlines in your Navigation drawer.",
          isRead: true
        }
      ]
    });
  }

  console.log("=========================================");
  console.log("SEEDING COMPLETED SUCCESSFULLY!");
  console.log(`Default Password for all accounts: ${defaultPassword}`);
  console.log("Accounts created:");
  console.log(" - Admin:   admin@capconn.in");
  console.log(" - Trainers: trainer@capconn.in, trainer2@capconn.in, trainer3@capconn.in");
  console.log(" - Trainees: trainee@capconn.in (to trainee15@capconn.in), trainee@trainee.in");
  console.log("=========================================");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
