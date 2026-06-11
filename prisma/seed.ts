import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { BANK_BLOCKS, FRAMEWORK_BUSINESS_RICE, FRAMEWORK_OPERATIONAL_RISK } from "../src/lib/constants";
import { seedMockInnovations } from "./mock-innovation-data";

const prisma = new PrismaClient();

// Shared default password for all seeded accounts (prototype only).
const DEFAULT_PASSWORD = "Innovation@2026";

async function main() {
  console.log("Seeding VPB Innovation Platform...");

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  await prisma.innovationUpvote.deleteMany();
  await prisma.innovationComment.deleteMany();
  await prisma.criterionScore.deleteMany();
  await prisma.innovationScreening.deleteMany();
  await prisma.review.deleteMany();
  await prisma.innovationLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.innovationBlock.deleteMany();
  await prisma.innovationDraft.deleteMany();
  await prisma.innovation.deleteMany();
  await prisma.blockFrameworkMapping.deleteMany();
  await prisma.frameworkCriterion.deleteMany();
  await prisma.framework.deleteMany();
  await prisma.block.deleteMany();
  await prisma.user.deleteMany();

  // Blocks must exist before users so staff can be linked to their block.
  for (const blockData of BANK_BLOCKS) {
    await prisma.block.create({ data: blockData });
  }
  console.log("20 blocks created");

  await prisma.user.create({
    data: {
      id: "admin-001",
      username: "admin",
      email: "admin@bank.vn",
      fullName: "Admin User",
      role: "ADMIN",
      blockId: null,
      passwordHash,
    },
  });

  const staffUsers = [
    { id: "staff-vylhc", username: "vylhc", fullName: "Vũ Yến Ly", blockCode: "RB" },
    { id: "staff-trungnh4", username: "trungnh4", fullName: "Nguyễn Hữu Trung", blockCode: "CMB" },
    { id: "staff-ducldc", username: "ducldc", fullName: "Lê Đức Cường", blockCode: "CIB" },
    { id: "staff-phuchh", username: "phuchh", fullName: "Hoàng Hồng Phúc", blockCode: "Treasury" },
    { id: "staff-linhht31", username: "linhht31", fullName: "Hoàng Thùy Linh", blockCode: "IT" },
    { id: "staff-nganht", username: "nganht", fullName: "Hoàng Thanh Ngân", blockCode: "Ops" },
    { id: "staff-huyennt", username: "huyennt", fullName: "Nguyễn Thu Huyền", blockCode: "Risk" },
    { id: "staff-quanlm", username: "quanlm", fullName: "Lê Minh Quân", blockCode: "HR" },
    { id: "staff-thanhnv", username: "thanhnv", fullName: "Nguyễn Văn Thành", blockCode: "Fin" },
    { id: "staff-anhtd", username: "anhtd", fullName: "Trần Đức Anh", blockCode: "Digital" },
    { id: "staff-minhbt", username: "minhbt", fullName: "Bùi Tuấn Minh", blockCode: "Legal" },
    { id: "staff-trangpt", username: "trangpt", fullName: "Phạm Thu Trang", blockCode: "Strategy" },
  ];

  for (const staff of staffUsers) {
    const block = await prisma.block.findUnique({ where: { code: staff.blockCode } });
    await prisma.user.create({
      data: {
        id: staff.id,
        username: staff.username,
        email: `${staff.username}@bank.vn`,
        fullName: staff.fullName,
        role: "STAFF",
        blockId: block?.id || null,
        passwordHash,
      },
    });
  }

  console.log("13 users created (1 admin + 12 staff)");
  console.log(`Default password for all accounts: ${DEFAULT_PASSWORD}`);

  const frameworkBusiness = await prisma.framework.create({
    data: {
      name: FRAMEWORK_BUSINESS_RICE.name,
      description: FRAMEWORK_BUSINESS_RICE.description,
      formula: FRAMEWORK_BUSINESS_RICE.formula,
      isActive: true,
    },
  });
  for (let i = 0; i < FRAMEWORK_BUSINESS_RICE.criteria.length; i++) {
    const c = FRAMEWORK_BUSINESS_RICE.criteria[i];
    await prisma.frameworkCriterion.create({
      data: {
        frameworkId: frameworkBusiness.id,
        name: c.name,
        description: c.description,
        weight: c.weight,
        orderIndex: i,
      },
    });
  }
  for (const code of FRAMEWORK_BUSINESS_RICE.applicableBlocks) {
    const block = await prisma.block.findUnique({ where: { code } });
    if (block) {
      await prisma.blockFrameworkMapping.create({
        data: { blockId: block.id, frameworkId: frameworkBusiness.id },
      });
    }
  }
  console.log("Framework Business RICE created");

  const frameworkOps = await prisma.framework.create({
    data: {
      name: FRAMEWORK_OPERATIONAL_RISK.name,
      description: FRAMEWORK_OPERATIONAL_RISK.description,
      formula: FRAMEWORK_OPERATIONAL_RISK.formula,
      isActive: true,
    },
  });
  for (let i = 0; i < FRAMEWORK_OPERATIONAL_RISK.criteria.length; i++) {
    const c = FRAMEWORK_OPERATIONAL_RISK.criteria[i];
    await prisma.frameworkCriterion.create({
      data: {
        frameworkId: frameworkOps.id,
        name: c.name,
        description: c.description,
        weight: c.weight,
        orderIndex: i,
      },
    });
  }
  for (const code of FRAMEWORK_OPERATIONAL_RISK.applicableBlocks) {
    const block = await prisma.block.findUnique({ where: { code } });
    if (block) {
      await prisma.blockFrameworkMapping.create({
        data: { blockId: block.id, frameworkId: frameworkOps.id },
      });
    }
  }
  console.log("Framework Operational Risk created");

  const sample = await prisma.innovation.create({
    data: {
      code: "INNO-2026-00045",
      title: "Ứng dụng AI tư vấn tự động chăm sóc khách hàng CMB",
      executiveSummary: "Xây dựng chatbot AI tích hợp vào hệ thống CRM hiện tại để tự động trả lời câu hỏi thường gặp, hỗ trợ RMs xử lý tư vấn nhanh hơn.",
      painPoints: "Hiện tại, RM khối CMB mất trung bình 45 phút/ngày để trả lời các câu hỏi lặp lại từ khách hàng. Điều này làm giảm thời gian dành cho tư vấn giá trị cao.",
      detailedSolution: "Tích hợp LLM (GPT-based) thông qua API, kết nối với knowledge base của ngân hàng. Pha 1 triển khai FAQ automation, Pha 2 mở rộng sang tư vấn sản phẩm.",
      status: "PUBLISHED",
      version: 1,
      authorId: "staff-trungnh4",
      primaryBlockId: (await prisma.block.findUnique({ where: { code: "CMB" } }))?.id || null,
      submittedAt: new Date(),
      approvedAt: new Date(),
      publishedAt: new Date(),
    },
  });

  const cmbBlock = await prisma.block.findUnique({ where: { code: "CMB" } });
  if (cmbBlock) {
    await prisma.innovationBlock.create({
      data: { innovationId: sample.id, blockId: cmbBlock.id, isPrimary: true },
    });
  }

  await prisma.innovationUpvote.create({ data: { innovationId: sample.id, userId: "staff-trungnh4" } });

  await prisma.innovationComment.create({
    data: { innovationId: sample.id, authorId: "staff-trungnh4", content: "Sáng kiến rất hay! Tôi nghĩ chúng ta có thể mở rộng cho cả khối RB." },
  });

  console.log("Sample innovation created:", sample.title);
  await seedMockInnovations(prisma);
  console.log("Seed completed!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
