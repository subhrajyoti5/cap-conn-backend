const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting comprehensive database seeding...");

  const defaultPassword = process.env.DEFAULT_SEED_PASSWORD || "Password@123";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 1. Seed Users: Admin, Trainer, Trainee
  console.log("Seeding core users...");

  const admin = await prisma.user.upsert({
    where: { email: "admin@capconn.in" },
    update: {
      name: "Central Admin",
      passwordHash,
      role: "ADMIN",
      status: "APPROVED",
    },
    create: {
      email: "admin@capconn.in",
      name: "Central Admin",
      passwordHash,
      role: "ADMIN",
      status: "APPROVED",
    },
  });

  const trainer = await prisma.user.upsert({
    where: { email: "trainer@capconn.in" },
    update: {
      name: "Dr. Rajesh Sharma",
      passwordHash,
      role: "TRAINER",
      status: "APPROVED",
    },
    create: {
      email: "trainer@capconn.in",
      name: "Dr. Rajesh Sharma",
      passwordHash,
      role: "TRAINER",
      status: "APPROVED",
    },
  });

  const trainee = await prisma.user.upsert({
    where: { email: "trainee@trainee.in" },
    update: {
      name: "Aarav Patel",
      passwordHash,
      role: "TRAINEE",
      status: "APPROVED",
    },
    create: {
      email: "trainee@trainee.in",
      name: "Aarav Patel",
      passwordHash,
      role: "TRAINEE",
      status: "APPROVED",
    },
  });

  console.log("Core users created/updated successfully:", {
    admin: admin.email,
    trainer: trainer.email,
    trainee: trainee.email,
  });

  // 2. Trainer Profile & Details
  console.log("Seeding trainer profile and credentials...");
  const trainerProfile = await prisma.trainerProfile.upsert({
    where: { userId: trainer.id },
    update: {
      fullName: "Dr. Rajesh Sharma",
      phone: "+91 98765 43210",
      bio: "Principal Cloud Architect and Lead Technical Instructor with 12+ years of experience in distributed systems, AI/ML deployment pipelines, and enterprise cloud infrastructure.",
    },
    create: {
      userId: trainer.id,
      fullName: "Dr. Rajesh Sharma",
      phone: "+91 98765 43210",
      bio: "Principal Cloud Architect and Lead Technical Instructor with 12+ years of experience in distributed systems, AI/ML deployment pipelines, and enterprise cloud infrastructure.",
    },
  });

  // Clean old sub-entities for fresh seed
  await prisma.qualification.deleteMany({ where: { trainerProfileId: trainerProfile.id } });
  await prisma.workExperience.deleteMany({ where: { trainerProfileId: trainerProfile.id } });
  await prisma.skill.deleteMany({ where: { trainerProfileId: trainerProfile.id } });

  await prisma.qualification.createMany({
    data: [
      {
        trainerProfileId: trainerProfile.id,
        degree: "Ph.D. in Distributed Systems & Cloud Architecture",
        institution: "Indian Institute of Science (IISc), Bangalore",
        year: 2017,
      },
      {
        trainerProfileId: trainerProfile.id,
        degree: "M.Tech in Computer Science & Engineering",
        institution: "Indian Institute of Technology (IIT), Bombay",
        year: 2012,
      },
    ],
  });

  await prisma.workExperience.createMany({
    data: [
      {
        trainerProfileId: trainerProfile.id,
        organization: "CloudScale Enterprise Solutions",
        role: "Principal Cloud Architect & Master Trainer",
        startDate: new Date("2020-01-01"),
      },
      {
        trainerProfileId: trainerProfile.id,
        organization: "InfraCore Technologies",
        role: "Senior Systems & Infrastructure Engineer",
        startDate: new Date("2014-06-01"),
        endDate: new Date("2019-12-31"),
      },
    ],
  });

  await prisma.skill.createMany({
    data: [
      { trainerProfileId: trainerProfile.id, name: "Cloud Architecture" },
      { trainerProfileId: trainerProfile.id, name: "Kubernetes & Containers" },
      { trainerProfileId: trainerProfile.id, name: "Distributed Systems" },
      { trainerProfileId: trainerProfile.id, name: "AI/ML Ops Pipelines" },
      { trainerProfileId: trainerProfile.id, name: "System Design" },
      { trainerProfileId: trainerProfile.id, name: "Cybersecurity & Zero Trust" },
    ],
  });

  // 3. Trainee Profile & Details
  console.log("Seeding trainee profile and credentials...");
  const traineeProfile = await prisma.traineeProfile.upsert({
    where: { userId: trainee.id },
    update: {
      fullName: "Aarav Patel",
      phone: "+91 91234 56789",
      bio: "Aspiring Cloud and Full-Stack Software Engineer focused on high-performance microservices, containerization, and generative AI integrations.",
    },
    create: {
      userId: trainee.id,
      fullName: "Aarav Patel",
      phone: "+91 91234 56789",
      bio: "Aspiring Cloud and Full-Stack Software Engineer focused on high-performance microservices, containerization, and generative AI integrations.",
    },
  });

  await prisma.qualification.deleteMany({ where: { traineeProfileId: traineeProfile.id } });
  await prisma.workExperience.deleteMany({ where: { traineeProfileId: traineeProfile.id } });
  await prisma.skill.deleteMany({ where: { traineeProfileId: traineeProfile.id } });
  await prisma.interest.deleteMany({ where: { traineeProfileId: traineeProfile.id } });

  await prisma.qualification.createMany({
    data: [
      {
        traineeProfileId: traineeProfile.id,
        degree: "B.Tech in Information Technology",
        institution: "National Institute of Technology (NIT), Karnataka",
        year: 2024,
      },
    ],
  });

  await prisma.workExperience.createMany({
    data: [
      {
        traineeProfileId: traineeProfile.id,
        organization: "Apex Software Labs",
        role: "Software Engineering Intern",
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-06-30"),
      },
    ],
  });

  await prisma.skill.createMany({
    data: [
      { traineeProfileId: traineeProfile.id, name: "JavaScript / TypeScript" },
      { traineeProfileId: traineeProfile.id, name: "React & Next.js" },
      { traineeProfileId: traineeProfile.id, name: "Node.js & Express" },
      { traineeProfileId: traineeProfile.id, name: "PostgreSQL & Prisma" },
      { traineeProfileId: traineeProfile.id, name: "Docker & Linux" },
    ],
  });

  await prisma.interest.createMany({
    data: [
      { traineeProfileId: traineeProfile.id, name: "Cloud-Native Microservices" },
      { traineeProfileId: traineeProfile.id, name: "Generative AI Systems" },
      { traineeProfileId: traineeProfile.id, name: "DevOps & CI/CD Automation" },
    ],
  });

  // 4. Seed Certifications with Google Drive Links distributed among Trainer, Trainee, Admin
  console.log("Seeding certifications with Google Drive links...");
  await prisma.certification.deleteMany({
    where: {
      userId: { in: [admin.id, trainer.id, trainee.id] },
    },
  });

  const certificateDocs = [
    {
      userId: trainer.id,
      name: "AWS Certified Solutions Architect - Professional",
      issuer: "Amazon Web Services (AWS)",
      issueDate: new Date("2023-04-15"),
      expiryDate: new Date("2026-04-15"),
      credentialUrl: "https://drive.google.com/file/d/1R42J0RNHVdnc_sAewGF0FhLr8vtZzoUb/view?usp=drive_link",
    },
    {
      userId: trainer.id,
      name: "Google Cloud Certified Professional Cloud Architect",
      issuer: "Google Cloud",
      issueDate: new Date("2023-09-10"),
      expiryDate: new Date("2026-09-10"),
      credentialUrl: "https://drive.google.com/file/d/1c9ITVM1Kpdixnj1WvZsVGsRQOfIBYrCA/view?usp=drive_link",
    },
    {
      userId: trainee.id,
      name: "Certified Kubernetes Application Developer (CKAD)",
      issuer: "Cloud Native Computing Foundation (CNCF)",
      issueDate: new Date("2024-02-20"),
      expiryDate: new Date("2027-02-20"),
      credentialUrl: "https://drive.google.com/file/d/1bb554gwKd-ASKNPns2Cv3N2ep3rPkHwo/view?usp=drive_link",
    },
    {
      userId: admin.id,
      name: "Executive Leadership & Program Governance Master Certification",
      issuer: "Capacity Connect National Accreditation Board",
      issueDate: new Date("2022-11-05"),
      expiryDate: new Date("2027-11-05"),
      credentialUrl: "https://drive.google.com/file/d/1R42J0RNHVdnc_sAewGF0FhLr8vtZzoUb/view?usp=drive_link",
    },
  ];

  for (const cert of certificateDocs) {
    await prisma.certification.create({ data: cert });
  }

  // 5. Seed Subjects and Competencies
  console.log("Seeding subjects and competencies...");
  const subjectsData = [
    {
      name: "Cloud Computing & Architecture",
      description: "Enterprise multi-cloud architecture, distributed systems, microservices, and serverless patterns.",
      competencies: [
        "Distributed Systems Design",
        "Kubernetes & Container Orchestration",
        "Cloud Security & Multi-Region Resiliency",
      ],
    },
    {
      name: "AI & Machine Learning Systems",
      description: "Generative AI, Large Language Models (LLMs), RAG architectures, and production MLOps.",
      competencies: [
        "LLM Fine-Tuning & Prompt Engineering",
        "Vector Databases & Semantic Retrieval",
        "Production MLOps & Model Monitoring",
      ],
    },
    {
      name: "Modern Full-Stack Development",
      description: "Scalable web engineering, React/Next.js architectures, REST/GraphQL APIs, and database optimization.",
      competencies: [
        "Next.js App Router & Server Components",
        "Relational & Document Database Optimization",
        "High-Concurrency API Design",
      ],
    },
    {
      name: "Cybersecurity & DevSecOps",
      description: "Zero trust architecture, automated CI/CD security pipelines, vulnerability scanning, and compliance.",
      competencies: [
        "Zero Trust Identity & Access Management",
        "Automated CI/CD Pipeline Security",
        "Threat Modeling & Compliance Audits",
      ],
    },
  ];

  const createdSubjects = [];
  const createdCompetencies = [];

  for (const s of subjectsData) {
    const subject = await prisma.subject.upsert({
      where: { name: s.name },
      update: { description: s.description },
      create: { name: s.name, description: s.description },
    });
    createdSubjects.push(subject);

    for (const compName of s.competencies) {
      const comp = await prisma.competency.upsert({
        where: { name: compName },
        update: { subjectId: subject.id },
        create: { name: compName, subjectId: subject.id },
      });
      createdCompetencies.push(comp);
    }
  }

  // Link Trainer Competencies
  for (const comp of createdCompetencies.slice(0, 5)) {
    await prisma.trainerCompetency.upsert({
      where: {
        trainerProfileId_competencyId: {
          trainerProfileId: trainerProfile.id,
          competencyId: comp.id,
        },
      },
      update: {},
      create: {
        trainerProfileId: trainerProfile.id,
        competencyId: comp.id,
      },
    });
  }

  // 6. Seed Courses, Learning Resources (Google Presentation & Document links), Assessments
  console.log("Seeding courses, presentation documents, and assessments...");

  // Course 1
  let course1 = await prisma.course.findFirst({
    where: {
      title: "Mastering Cloud-Native Architectures & Microservices",
      trainerId: trainer.id,
    },
  });

  if (!course1) {
    course1 = await prisma.course.create({
      data: {
        title: "Mastering Cloud-Native Architectures & Microservices",
        description:
          "Comprehensive deep-dive into distributed systems, 12-factor microservices, Kubernetes orchestration, event-driven streaming, and fault-tolerant cloud design.",
        trainerId: trainer.id,
        subjectId: createdSubjects[0].id,
        status: "PUBLISHED",
      },
    });
  } else {
    course1 = await prisma.course.update({
      where: { id: course1.id },
      data: {
        description:
          "Comprehensive deep-dive into distributed systems, 12-factor microservices, Kubernetes orchestration, event-driven streaming, and fault-tolerant cloud design.",
        status: "PUBLISHED",
      },
    });
  }

  // Course 2
  let course2 = await prisma.course.findFirst({
    where: {
      title: "Applied Generative AI & MLOps in Production",
      trainerId: trainer.id,
    },
  });

  if (!course2) {
    course2 = await prisma.course.create({
      data: {
        title: "Applied Generative AI & MLOps in Production",
        description:
          "Build and deploy production-grade LLM applications with retrieval-augmented generation (RAG), vector databases, prompt pipelines, and automated monitoring.",
        trainerId: trainer.id,
        subjectId: createdSubjects[1].id,
        status: "PUBLISHED",
      },
    });
  } else {
    course2 = await prisma.course.update({
      where: { id: course2.id },
      data: {
        description:
          "Build and deploy production-grade LLM applications with retrieval-augmented generation (RAG), vector databases, prompt pipelines, and automated monitoring.",
        status: "PUBLISHED",
      },
    });
  }

  // Course 3
  let course3 = await prisma.course.findFirst({
    where: {
      title: "Enterprise DevSecOps & Zero Trust Implementation",
      trainerId: trainer.id,
    },
  });

  if (!course3) {
    course3 = await prisma.course.create({
      data: {
        title: "Enterprise DevSecOps & Zero Trust Implementation",
        description:
          "Master security automation in CI/CD pipelines, container runtime defenses, secret management, and zero-trust identity architectures for cloud environments.",
        trainerId: trainer.id,
        subjectId: createdSubjects[3].id,
        status: "PUBLISHED",
      },
    });
  }

  // Delete existing resources on these courses for fresh seed
  await prisma.learningResource.deleteMany({
    where: { courseId: { in: [course1.id, course2.id, course3.id] } },
  });

  // Seed Google Presentation & Document links into Learning Resources
  await prisma.learningResource.createMany({
    data: [
      {
        courseId: course1.id,
        title: "Cloud Architecture Masterclass - Module 1 Presentation",
        type: "PRESENTATION",
        storageKey: "https://docs.google.com/presentation/d/1msy4wHoVZg1dqxoThGjwSYprHk8GiDBt/edit?usp=drive_link&ouid=102276000718187364562&rtpof=true&sd=true",
        mimeType: "application/vnd.google-apps.presentation",
        sizeBytes: 3145728,
      },
      {
        courseId: course1.id,
        title: "Distributed Systems & Scalability Blueprint",
        type: "DOCUMENT",
        storageKey: "https://docs.google.com/presentation/d/1LRJTHssWRVWFmmEXfgiXablDelhDFnhv/edit?usp=drive_link&ouid=102276000718187364562&rtpof=true&sd=true",
        mimeType: "application/vnd.google-apps.presentation",
        sizeBytes: 4194304,
      },
      {
        courseId: course2.id,
        title: "GenAI & LLM Deployment Architecture Deck",
        type: "PRESENTATION",
        storageKey: "https://docs.google.com/presentation/d/1wRgt_p6WqlLEgWTKmP0Wzkb72XAyxLXy/edit?usp=drive_link&ouid=102276000718187364562&rtpof=true&sd=true",
        mimeType: "application/vnd.google-apps.presentation",
        sizeBytes: 5242880,
      },
      {
        courseId: course3.id,
        title: "DevSecOps Pipeline Security Guidelines",
        type: "DOCUMENT",
        storageKey: "https://docs.google.com/presentation/d/1msy4wHoVZg1dqxoThGjwSYprHk8GiDBt/edit?usp=drive_link&ouid=102276000718187364562&rtpof=true&sd=true",
        mimeType: "application/vnd.google-apps.presentation",
        sizeBytes: 2621440,
      },
    ],
  });

  // 7. Seed Enrollments
  console.log("Seeding enrollments...");
  await prisma.enrollment.upsert({
    where: {
      courseId_traineeId: {
        courseId: course1.id,
        traineeId: trainee.id,
      },
    },
    update: { status: "ACTIVE" },
    create: {
      courseId: course1.id,
      traineeId: trainee.id,
      status: "ACTIVE",
    },
  });

  await prisma.enrollment.upsert({
    where: {
      courseId_traineeId: {
        courseId: course2.id,
        traineeId: trainee.id,
      },
    },
    update: { status: "ACTIVE" },
    create: {
      courseId: course2.id,
      traineeId: trainee.id,
      status: "ACTIVE",
    },
  });

  await prisma.enrollment.upsert({
    where: {
      courseId_traineeId: {
        courseId: course3.id,
        traineeId: trainee.id,
      },
    },
    update: { status: "ACTIVE" },
    create: {
      courseId: course3.id,
      traineeId: trainee.id,
      status: "ACTIVE",
    },
  });

  // 8. Seed Assessments, Questions, Options, Submissions
  console.log("Seeding assessments and test submissions...");

  let assessment1 = await prisma.assessment.findFirst({
    where: { courseId: course1.id, title: "Cloud-Native Architecture & Design Principles Quiz" },
  });

  if (!assessment1) {
    assessment1 = await prisma.assessment.create({
      data: {
        courseId: course1.id,
        trainerId: trainer.id,
        title: "Cloud-Native Architecture & Design Principles Quiz",
        description: "Comprehensive assessment evaluating 12-factor principles, container orchestration, and multi-region resilience.",
        status: "PUBLISHED",
        totalMarks: 30,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    const q1 = await prisma.question.create({
      data: {
        assessmentId: assessment1.id,
        text: "Which of the following is a primary characteristic of a 12-factor cloud-native application?",
        marks: 10,
        order: 1,
        options: {
          create: [
            { text: "Storing state in local filesystem memory", isCorrect: false },
            { text: "Strict separation of config from code via environment variables", isCorrect: true },
            { text: "Direct hardcoding of connection strings", isCorrect: false },
            { text: "Tight coupling between services", isCorrect: false },
          ],
        },
      },
    });

    const q2 = await prisma.question.create({
      data: {
        assessmentId: assessment1.id,
        text: "In Kubernetes, which controller ensures a specified number of pod replicas are running across worker nodes at any given time?",
        marks: 10,
        order: 2,
        options: {
          create: [
            { text: "Deployment / ReplicaSet", isCorrect: true },
            { text: "DaemonSet only", isCorrect: false },
            { text: "ConfigMap Controller", isCorrect: false },
            { text: "Ingress Controller", isCorrect: false },
          ],
        },
      },
    });

    const q3 = await prisma.question.create({
      data: {
        assessmentId: assessment1.id,
        text: "What architectural pattern prevents cascading failures across distributed microservices by halting calls to an unresponsive upstream service?",
        marks: 10,
        order: 3,
        options: {
          create: [
            { text: "Circuit Breaker Pattern", isCorrect: true },
            { text: "Singleton Pattern", isCorrect: false },
            { text: "Observer Pattern", isCorrect: false },
            { text: "Active-Active Polling", isCorrect: false },
          ],
        },
      },
    });

    // Create graded submission for trainee
    await prisma.submission.create({
      data: {
        assessmentId: assessment1.id,
        traineeId: trainee.id,
        status: "GRADED",
        score: 30,
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Assessment 2 (In Progress for trainee)
  let assessment2 = await prisma.assessment.findFirst({
    where: { courseId: course2.id, title: "LLMOps & Vector DB Mid-Term Evaluation" },
  });

  if (!assessment2) {
    assessment2 = await prisma.assessment.create({
      data: {
        courseId: course2.id,
        trainerId: trainer.id,
        title: "LLMOps & Vector DB Mid-Term Evaluation",
        description: "Evaluation on retrieval-augmented generation (RAG) pipelines, embedding indexing, and prompt evaluation.",
        status: "PUBLISHED",
        totalMarks: 25,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.question.create({
      data: {
        assessmentId: assessment2.id,
        text: "What metric is most commonly used to measure semantic similarity between high-dimensional vector embeddings?",
        marks: 10,
        order: 1,
        options: {
          create: [
            { text: "Cosine Similarity", isCorrect: true },
            { text: "Euclidean Distance only", isCorrect: false },
            { text: "Manhattan Distance", isCorrect: false },
            { text: "Hamming Distance", isCorrect: false },
          ],
        },
      },
    });

    // Trainee submission in progress
    await prisma.submission.create({
      data: {
        assessmentId: assessment2.id,
        traineeId: trainee.id,
        status: "IN_PROGRESS",
        startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
    });
  }

  // 9. Course Feedback
  console.log("Seeding course feedback...");
  await prisma.feedback.upsert({
    where: {
      courseId_userId: {
        courseId: course1.id,
        userId: trainee.id,
      },
    },
    update: {
      rating: 5,
      comment: "Exceptional course! The architecture presentations and distributed systems blueprints were crystal clear and directly applicable to production systems.",
    },
    create: {
      courseId: course1.id,
      userId: trainee.id,
      rating: 5,
      comment: "Exceptional course! The architecture presentations and distributed systems blueprints were crystal clear and directly applicable to production systems.",
    },
  });

  // 10. Announcements
  console.log("Seeding announcements...");
  await prisma.announcement.deleteMany({
    where: { authorId: { in: [admin.id, trainer.id] } },
  });

  await prisma.announcement.createMany({
    data: [
      {
        title: "Welcome to Capacity Connect - New Cohort Onboarding",
        body: "We are thrilled to welcome all trainees and trainers to the Capacity Connect learning platform. Check out your assigned courses and resource materials in your dashboard.",
        authorId: admin.id,
        status: "PUBLISHED",
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Live Cloud Architecture Hands-on Session this Friday",
        body: "Join us this Friday at 4:00 PM IST for an interactive architecture review and Kubernetes deployment workshop. Please review the Module 1 presentation deck beforehand.",
        authorId: trainer.id,
        status: "PUBLISHED",
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // 11. Achievements
  console.log("Seeding achievements...");
  await prisma.achievement.deleteMany({
    where: { authorId: admin.id },
  });

  await prisma.achievement.createMany({
    data: [
      {
        title: "Cloud Native Pioneer Award",
        description: "Awarded for exceptional score and hands-on mastery in Cloud-Native Architecture and Kubernetes orchestration.",
        authorId: admin.id,
      },
      {
        title: "Distinguished Technical Educator 2026",
        description: "Recognizing outstanding pedagogical excellence and course resource delivery.",
        authorId: admin.id,
      },
    ],
  });

  // 12. Notifications
  console.log("Seeding notifications...");
  await prisma.notification.deleteMany({
    where: { userId: { in: [admin.id, trainer.id, trainee.id] } },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: trainee.id,
        type: "COURSE",
        title: "New Learning Resources Available",
        body: "New presentation slide decks have been added to 'Mastering Cloud-Native Architectures & Microservices'.",
        isRead: false,
      },
      {
        userId: trainee.id,
        type: "ASSESSMENT",
        title: "Assessment Graded: Cloud-Native Architecture Quiz",
        body: "Your submission for 'Cloud-Native Architecture & Design Principles Quiz' has been graded: 30/30 (100%).",
        isRead: true,
      },
      {
        userId: trainer.id,
        type: "COURSE",
        title: "New Enrollment in Cloud Architecture Course",
        body: "Aarav Patel (trainee@trainee.in) enrolled in your course.",
        isRead: false,
      },
      {
        userId: admin.id,
        type: "APPROVAL",
        title: "Platform Status Overview",
        body: "All trainers and trainees in the 2026 cohort are active and approved.",
        isRead: false,
      },
    ],
  });

  // 13. Audit Logs
  console.log("Seeding audit logs...");
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: admin.id,
        action: "USER_APPROVED",
        targetType: "USER",
        targetId: trainer.id,
        metadata: { role: "TRAINER", email: trainer.email },
      },
      {
        actorId: admin.id,
        action: "USER_APPROVED",
        targetType: "USER",
        targetId: trainee.id,
        metadata: { role: "TRAINEE", email: trainee.email },
      },
      {
        actorId: trainer.id,
        action: "COURSE_PUBLISHED",
        targetType: "COURSE",
        targetId: course1.id,
        metadata: { title: course1.title },
      },
      {
        actorId: trainer.id,
        action: "RESOURCE_UPLOADED",
        targetType: "LEARNING_RESOURCE",
        targetId: course1.id,
        metadata: { title: "Cloud Architecture Masterclass - Module 1 Presentation" },
      },
    ],
  });

  console.log("=========================================");
  console.log("DATABASE SEEDING COMPLETED SUCCESSFULLY!");
  console.log("Accounts Available (Default Password: " + defaultPassword + "):");
  console.log(" - Admin:   admin@capconn.in");
  console.log(" - Trainer: trainer@capconn.in");
  console.log(" - Trainee: trainee@trainee.in");
  console.log("Documents & Certificates linked directly from Google Drive.");
  console.log("=========================================");
}

main()
  .catch((error) => {
    console.error("Seeding failed with error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
