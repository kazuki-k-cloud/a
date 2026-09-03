import { PrismaClient, Role, ProjectStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "管理者 太郎",
      role: Role.ADMIN,
      department: "経営企画部",
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {},
    create: {
      email: "manager@example.com",
      name: "課長 花子",
      role: Role.MANAGER,
      department: "開発部",
    },
  });

  const member1 = await prisma.user.upsert({
    where: { email: "member1@example.com" },
    update: {},
    create: {
      email: "member1@example.com",
      name: "社員 一郎",
      role: Role.MEMBER,
      department: "開発部",
    },
  });

  const member2 = await prisma.user.upsert({
    where: { email: "member2@example.com" },
    update: {},
    create: {
      email: "member2@example.com",
      name: "社員 二郎",
      role: Role.MEMBER,
      department: "開発部",
    },
  });

  const projectA = await prisma.project.upsert({
    where: { id: "seed-project-a" },
    update: {},
    create: {
      id: "seed-project-a",
      name: "ECサイトリニューアル",
      clientName: "株式会社サンプル",
      status: ProjectStatus.ACTIVE,
      startDate: new Date("2026-04-01"),
    },
  });

  const projectB = await prisma.project.upsert({
    where: { id: "seed-project-b" },
    update: {},
    create: {
      id: "seed-project-b",
      name: "社内基幹システム保守",
      clientName: "自社",
      status: ProjectStatus.ACTIVE,
      startDate: new Date("2026-01-01"),
    },
  });

  const projectC = await prisma.project.upsert({
    where: { id: "seed-project-c" },
    update: {},
    create: {
      id: "seed-project-c",
      name: "旧管理画面(完了案件)",
      clientName: "株式会社レガシー",
      status: ProjectStatus.COMPLETED,
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
    },
  });

  for (const [userId, projectId] of [
    [manager.id, projectA.id],
    [manager.id, projectB.id],
    [member1.id, projectA.id],
    [member1.id, projectB.id],
    [member2.id, projectA.id],
  ]) {
    await prisma.projectAssignment.upsert({
      where: { userId_projectId: { userId, projectId } },
      update: {},
      create: { userId, projectId },
    });
  }

  console.log("Seed data created:", {
    admin: admin.email,
    manager: manager.email,
    member1: member1.email,
    member2: member2.email,
    projects: [projectA.name, projectB.name, projectC.name],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
