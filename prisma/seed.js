const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting comprehensive database seeding for CapConn...");

  const defaultPassword = process.env.DEFAULT_SEED_PASSWORD || "admin1234";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const firstNames = ["Aarav", "Aanya", "Advait", "Aisha", "Akhil", "Ananya", "Arjun", "Avni", "Ayush", "Bhavya", "Chaitanya", "Deepak", "Dhruv", "Diya", "Eshan", "Gaurav", "Harsh", "Isha", "Ishaan", "Jatin", "Kavya", "Krish", "Kritika", "Lakshya", "Manish", "Meera", "Mohit", "Neha", "Nikhil", "Nisha", "Om", "Pooja", "Pranav", "Prisha", "Rahul", "Riya", "Rohan", "Roshni", "Sahil", "Sanya", "Sarthak", "Shreya", "Siddharth", "Sneha", "Tanya", "Tarun", "Utkarsh", "Vaishnavi", "Varun", "Vidhi", "Vivaan", "Yash", "Zoya", "Aditi", "Akash", "Amrita", "Anand", "Anushka", "Aryan", "Bhumika", "Chetan", "Darshan", "Divya", "Gautam", "Geeta", "Hitesh", "Ira", "Jai", "Kajal", "Karan", "Kirti", "Kunal", "Lata", "Madhav", "Mahima", "Nakul", "Namrata", "Naveen", "Nidhi", "Nitin", "Pallavi", "Pankaj", "Payal", "Prakash", "Preeti", "Raghav", "Rajat", "Ritu", "Sameer", "Sanjay", "Sanjana", "Saurabh", "Shivani", "Shruti", "Suman", "Suraj", "Swati", "Tejas", "Tushar", "Urvashi", "Vaibhav", "Vandana", "Vikas", "Vinay", "Yamini", "Yogesh"];
  const lastNames = ["Sharma", "Patel", "Singh", "Kumar", "Gupta", "Deshmukh", "Joshi", "Reddy", "Iyer", "Nair", "Mehta", "Bhatia", "Rao", "Saxena", "Kulkarni", "Malhotra", "Verma", "Chauhan", "Tiwari", "Yadav", "Rajput", "Pandey", "Mishra", "Chatterjee", "Bose", "Das", "Sengupta", "Banerjee", "Kapoor", "Ahuja", "Chopra", "Khanna", "Mehra", "Garg", "Agarwal", "Bansal", "Jain", "Shah", "Desai", "Parekh", "Patil", "Kadam", "Shinde", "Jadhav", "Pawar", "Menon", "Pillai", "Nambiar", "Krishnan", "Venkatesh"];

  // 1. Seed Core Accounts
  console.log("Seeding Core Accounts (Admins, Trainers, Trainees)...");

  // Admin Account
  const admin = await prisma.user.upsert({
    where: { email: "admin@admin.in" },
    update: { name: "Central Admin", passwordHash, role: "ADMIN", status: "APPROVED" },
    create: { email: "admin@admin.in", name: "Central Admin", passwordHash, role: "ADMIN", status: "APPROVED" },
  });

  // Trainers (20 Trainers)
  const trainersData = [];
  const trainerBios = [
    "Principal Cloud Architect and Lead Technical Instructor with 12+ years experience.",
    "AI & Machine Learning Research Chair, specialization in LLMs & Neural Networks.",
    "DevSecOps Lead & Zero-Trust Infrastructure Consultant.",
    "Senior Full-Stack Developer with deep expertise in React and Node.js ecosystems.",
    "Data Engineering Specialist focusing on scalable pipelines and distributed databases."
  ];
  const trainerDegrees = [
    ["Ph.D. in Computer Science", "IISc Bangalore", 2016],
    ["M.Tech in Software Engineering", "IIT Bombay", 2012],
    ["M.S. in Data Science", "Stanford University", 2018],
    ["B.Tech in Information Technology", "NIT Trichy", 2010],
    ["MBA in IT Management", "IIM Ahmedabad", 2015]
  ];
  
  for (let i = 0; i < 20; i++) {
    const fn = firstNames[(i + 50) % firstNames.length];
    const ln = lastNames[(i + 20) % lastNames.length];
    const emailPrefix = i === 0 ? "trainer" : `trainer${i}`;
    
    trainersData.push({
      email: `${emailPrefix}@trainer.in`,
      name: `Prof. ${fn} ${ln}`,
      bio: trainerBios[i % trainerBios.length],
      degree: trainerDegrees[i % trainerDegrees.length]
    });
  }

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
        { trainerProfileId: profile.id, degree: t.degree[0], institution: t.degree[1], year: t.degree[2] }
      ]
    });
  }

  // Trainees (106 Trainees)
  const traineesData = [];
  const professionalBios = [
    "Dedicated software engineer with a focus on cloud-native applications and scalable microservices.",
    "Data-driven professional passionate about machine learning, AI architectures, and predictive modeling.",
    "Full-stack developer specializing in modern JavaScript frameworks, React, and RESTful API design.",
    "Security-focused engineer with expertise in DevSecOps, zero-trust architectures, and compliance.",
    "Technical enthusiast building high-performance web applications with a strong emphasis on user experience.",
    "Cloud infrastructure specialist with a background in Kubernetes orchestration and automated CI/CD pipelines."
  ];
  const allSkills = [
    ["JavaScript / TypeScript", "React & Next.js", "Node.js & Express", "PostgreSQL"],
    ["Python", "Machine Learning", "TensorFlow", "Data Analytics"],
    ["AWS Cloud", "Docker", "Kubernetes", "CI/CD Pipelines"],
    ["Cybersecurity", "Network Architecture", "Penetration Testing", "DevSecOps"],
    ["Go (Golang)", "Microservices", "gRPC", "Redis Caching"],
    ["Java", "Spring Boot", "Enterprise Architecture", "Kafka"]
  ];

  for (let i = 0; i <= 105; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[i % lastNames.length];
    const bio = professionalBios[i % professionalBios.length];
    const skillsList = allSkills[i % allSkills.length];
    
    const emailPrefix = i === 0 ? "trainee" : `trainee${i}`;
    
    traineesData.push({
      email: `${emailPrefix}@trainee.in`,
      name: `${fn} ${ln}`,
      bio: bio,
      phone: `+91 98${String(12345000 + i)}`,
      skills: skillsList
    });
  }

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
      update: { fullName: tr.name, bio: tr.bio, phone: tr.phone },
      create: { userId: u.id, fullName: tr.name, bio: tr.bio, phone: tr.phone },
    });

    await prisma.skill.deleteMany({ where: { traineeProfileId: profile.id } });
    await prisma.skill.createMany({
      data: tr.skills.map(skillName => ({
        traineeProfileId: profile.id,
        name: skillName
      }))
    });
  }

  // Removed backward compatible block since it's now covered

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
      await prisma.submission.upsert({
        where: { assessmentId_traineeId: { assessmentId: quiz.id, traineeId: student.id } },
        update: { score: 20 + (i * 2) },
        create: {
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
  console.log(" - Admin:   admin@admin.in");
  console.log(" - Trainers: trainer@trainer.in (to trainer19@trainer.in)");
  console.log(" - Trainees: trainee@trainee.in (to trainee105@trainee.in)");
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
