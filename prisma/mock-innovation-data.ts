import type { PrismaClient } from "@prisma/client";
import { BANK_BLOCKS } from "../src/lib/constants";

type MockInnovationStatus =
  | "DRAFT"
  | "PENDING_SCREENING"
  | "SCREENED"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "MODIFICATION_REQUESTED"
  | "PUBLISHED"
  | "COMPLETED";

interface MockInnovationSpec {
  code: string;
  title: string;
  executiveSummary: string;
  painPoints: string;
  detailedSolution: string;
  status: MockInnovationStatus;
  score: number | null;
  authorId: string;
  blockCode: string;
  secondaryBlockCodes?: string[];
  isBankWide?: boolean;
  daysAgo: number;
  feedback?: string;
  upvotes?: number;
  comments?: string[];
}

const MOCK_CODES = [
  "MOCK-2026-DRAFT-10",
  "MOCK-2026-PENDING-20",
  "MOCK-2026-SCREENED-35",
  "MOCK-2026-REVIEW-50",
  "MOCK-2026-APPROVED-65",
  "MOCK-2026-REJECTED-18",
  "MOCK-2026-REWORK-30",
  "MOCK-2026-PUBLISHED-75",
  "MOCK-2026-COMPLETED-90",
  "MOCK-2026-PUBLISHED-45",
  "MOCK-2026-COMPLETED-98",
] as const;

const MOCK_INNOVATIONS: MockInnovationSpec[] = [
  {
    code: "MOCK-2026-DRAFT-10",
    title: "Nháp OCR hồ sơ vay cá nhân tại quầy",
    executiveSummary: "Dùng OCR để đọc nhanh hồ sơ vay cá nhân, giảm nhập liệu thủ công trước khi chuyển bước thẩm định.",
    painPoints: "Giao dịch viên đang nhập lại nhiều trường thông tin từ giấy tờ, dễ sai sót và mất thời gian vào giờ cao điểm.",
    detailedSolution: "Tạo luồng OCR tại quầy cho CCCD, sao kê và giấy đề nghị vay. Dữ liệu được kiểm tra lại bởi giao dịch viên trước khi đồng bộ vào LOS.",
    status: "DRAFT",
    score: null,
    authorId: "staff-vylhc",
    blockCode: "RB",
    secondaryBlockCodes: ["Ops", "IT"],
    daysAgo: 1,
  },
  {
    code: "MOCK-2026-PENDING-20",
    title: "Tự động phân loại yêu cầu hỗ trợ RM CMB",
    executiveSummary: "Phân loại ticket hỗ trợ từ RM bằng AI để chuyển đúng nhóm xử lý ngay từ đầu.",
    painPoints: "Ticket hỗ trợ thường bị chuyển qua nhiều nhóm trước khi đúng người xử lý, kéo dài SLA và tạo trải nghiệm không nhất quán.",
    detailedSolution: "Huấn luyện bộ phân loại từ lịch sử ticket, gợi ý nhóm phụ trách và mức ưu tiên trước khi ticket được ghi nhận chính thức.",
    status: "PENDING_SCREENING",
    score: null,
    authorId: "staff-trungnh4",
    blockCode: "CMB",
    secondaryBlockCodes: ["IT", "Ops"],
    daysAgo: 2,
  },
  {
    code: "MOCK-2026-SCREENED-35",
    title: "Dashboard cảnh báo sớm hồ sơ thiếu chứng từ",
    executiveSummary: "Tạo dashboard cảnh báo hồ sơ thiếu chứng từ theo từng chi nhánh để giảm hồ sơ trả lại.",
    painPoints: "Nhiều hồ sơ bị trả lại muộn do thiếu chứng từ cơ bản, gây chậm phê duyệt và giảm trải nghiệm khách hàng.",
    detailedSolution: "Đối chiếu checklist theo sản phẩm với hồ sơ đã tải lên, hiển thị cảnh báo cho RM và quản lý chi nhánh trước thời điểm nộp.",
    status: "SCREENED",
    score: 35,
    authorId: "staff-ducldc",
    blockCode: "CIB",
    secondaryBlockCodes: ["Risk"],
    daysAgo: 4,
  },
  {
    code: "MOCK-2026-REVIEW-50",
    title: "AI gợi ý hạn mức thấu chi cho SME",
    executiveSummary: "Gợi ý hạn mức thấu chi sơ bộ cho khách hàng SME dựa trên dòng tiền và lịch sử giao dịch.",
    painPoints: "RM cần tổng hợp thủ công nhiều nguồn dữ liệu trước khi tư vấn hạn mức, làm giảm tốc độ phản hồi khách hàng.",
    detailedSolution: "Kết hợp dữ liệu CASA, dòng tiền vào ra và lịch sử tín dụng để gợi ý khoảng hạn mức, kèm giải thích cho RM kiểm tra.",
    status: "IN_REVIEW",
    score: 50,
    authorId: "staff-trungnh4",
    blockCode: "CMB",
    secondaryBlockCodes: ["Risk", "Digital"],
    daysAgo: 5,
  },
  {
    code: "MOCK-2026-APPROVED-65",
    title: "Tối ưu định tuyến cuộc gọi khách hàng ưu tiên",
    executiveSummary: "Định tuyến cuộc gọi của khách hàng ưu tiên đến đúng chuyên viên theo lịch sử nhu cầu và năng lực phục vụ.",
    painPoints: "Khách hàng ưu tiên phải lặp lại thông tin khi được chuyển tuyến, trong khi chuyên viên phù hợp chưa được gợi ý tự động.",
    detailedSolution: "Sử dụng hồ sơ khách hàng, chủ đề cuộc gọi gần nhất và trạng thái chuyên viên để gợi ý tuyến tiếp nhận phù hợp.",
    status: "APPROVED",
    score: 65,
    authorId: "staff-vylhc",
    blockCode: "RB",
    secondaryBlockCodes: ["Digital"],
    daysAgo: 7,
  },
  {
    code: "MOCK-2026-REJECTED-18",
    title: "Tự động hóa báo cáo thủ công chưa có nguồn dữ liệu chuẩn",
    executiveSummary: "Đề xuất gom nhiều báo cáo thủ công vào một file tổng hợp, nhưng chưa xác định rõ nguồn dữ liệu gốc.",
    painPoints: "Các phòng ban đang gửi nhiều file Excel khác nhau, dẫn tới tổng hợp chậm và khó kiểm soát phiên bản.",
    detailedSolution: "Tạm thời gom file vào thư mục chung và chạy macro tổng hợp. Chưa có phương án kiểm soát dữ liệu đầu vào hoặc quyền truy cập.",
    status: "REJECTED",
    score: 18,
    authorId: "staff-thanhnv",
    blockCode: "Fin",
    secondaryBlockCodes: ["IT"],
    daysAgo: 9,
    feedback: "Chưa đủ căn cứ về nguồn dữ liệu chuẩn và kiểm soát truy cập. Cần thiết kế lại trước khi xem xét.",
  },
  {
    code: "MOCK-2026-REWORK-30",
    title: "Chatbot tra cứu chính sách nhân sự nội bộ",
    executiveSummary: "Chatbot giúp nhân viên tra cứu nhanh chính sách nghỉ phép, phúc lợi và quy trình nội bộ.",
    painPoints: "HR nhận nhiều câu hỏi lặp lại về chính sách, trong khi tài liệu hiện nằm rải rác ở nhiều thư mục khác nhau.",
    detailedSolution: "Kết nối chatbot với kho tài liệu HR đã chuẩn hóa, ghi nhận câu hỏi chưa trả lời được để cập nhật knowledge base hằng tuần.",
    status: "MODIFICATION_REQUESTED",
    score: 30,
    authorId: "staff-quanlm",
    blockCode: "HR",
    secondaryBlockCodes: ["IT", "Legal"],
    daysAgo: 10,
    feedback: "Cần bổ sung kế hoạch kiểm duyệt nội dung chính sách và cách xử lý câu trả lời nhạy cảm.",
  },
  {
    code: "MOCK-2026-PUBLISHED-75",
    title: "Kho tri thức số cho RM bán chéo sản phẩm",
    executiveSummary: "Xây dựng kho tri thức số gợi ý kịch bản bán chéo theo phân khúc và hành vi khách hàng.",
    painPoints: "RM phải tìm tài liệu sản phẩm thủ công, dẫn tới tư vấn chưa nhất quán và bỏ lỡ cơ hội bán chéo.",
    detailedSolution: "Gắn tagging sản phẩm, phân khúc khách hàng và tình huống tư vấn để đề xuất nội dung phù hợp ngay trong CRM.",
    status: "PUBLISHED",
    score: 75,
    authorId: "staff-anhtd",
    blockCode: "Digital",
    secondaryBlockCodes: ["RB", "CMB"],
    daysAgo: 14,
    upvotes: 5,
    comments: ["Có thể bổ sung thêm kịch bản cho khách hàng ưu tiên.", "Nên đo conversion theo từng phân khúc."],
  },
  {
    code: "MOCK-2026-COMPLETED-90",
    title: "Robot đối soát giao dịch lỗi cuối ngày",
    executiveSummary: "Robot tự động đối soát giao dịch lỗi cuối ngày và tạo danh sách ngoại lệ cho đội vận hành xử lý.",
    painPoints: "Đội Ops mất nhiều giờ rà soát giao dịch lỗi cuối ngày, một số ngoại lệ bị phát hiện muộn sau cutoff.",
    detailedSolution: "Kết nối dữ liệu giao dịch, core banking và file đối tác để phát hiện sai lệch, phân nhóm nguyên nhân và tạo worklist tự động.",
    status: "COMPLETED",
    score: 90,
    authorId: "staff-nganht",
    blockCode: "Ops",
    secondaryBlockCodes: ["IT", "Risk"],
    daysAgo: 21,
    upvotes: 8,
    comments: ["Pilot ở Ops cho kết quả rất rõ.", "Nên mở rộng sang đối soát thẻ."],
  },
  {
    code: "MOCK-2026-PUBLISHED-45",
    title: "Checklist pháp lý thông minh cho hợp đồng mẫu",
    executiveSummary: "Checklist thông minh giúp nhân viên rà soát điều khoản bắt buộc trước khi gửi hợp đồng mẫu sang Legal.",
    painPoints: "Legal thường nhận hợp đồng thiếu điều khoản cơ bản, khiến vòng phản hồi kéo dài và tốn thời gian cho cả hai bên.",
    detailedSolution: "Tạo checklist theo loại hợp đồng, cảnh báo điều khoản thiếu và lưu lịch sử phiên bản trước khi chuyển Legal phê duyệt.",
    status: "PUBLISHED",
    score: 45,
    authorId: "staff-minhbt",
    blockCode: "Legal",
    secondaryBlockCodes: ["CIB", "CMB"],
    daysAgo: 18,
    upvotes: 3,
    comments: ["Có thể thêm điều khoản tuân thủ dữ liệu cá nhân."],
  },
  {
    code: "MOCK-2026-COMPLETED-98",
    title: "Mô hình cảnh báo rủi ro gian lận giao dịch số",
    executiveSummary: "Mô hình cảnh báo gian lận theo thời gian gần thực cho giao dịch số có dấu hiệu bất thường.",
    painPoints: "Một số mẫu gian lận thay đổi nhanh, rule tĩnh không đủ linh hoạt và tạo nhiều cảnh báo giả cho đội rủi ro.",
    detailedSolution: "Kết hợp rule hiện hữu với mô hình anomaly detection, ưu tiên cảnh báo theo mức rủi ro và phản hồi kết quả xử lý để học lại.",
    status: "COMPLETED",
    score: 98,
    authorId: "staff-huyennt",
    blockCode: "Risk",
    secondaryBlockCodes: ["Digital", "IT"],
    daysAgo: 30,
    upvotes: 10,
    comments: ["Đây là case tốt để chia sẻ ở Innovation Academy.", "Nên chuẩn hóa playbook xử lý cảnh báo."],
  },
];

const STAFF_USER_IDS = [
  "staff-vylhc",
  "staff-trungnh4",
  "staff-ducldc",
  "staff-phuchh",
  "staff-linhht31",
  "staff-nganht",
  "staff-huyennt",
  "staff-quanlm",
  "staff-thanhnv",
  "staff-anhtd",
  "staff-minhbt",
  "staff-trangpt",
];

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function clampScore(score: number) {
  return Math.min(5, Math.max(1, Math.round(score * 10) / 10));
}

function criterionScore(normalisedScore: number, index: number) {
  const offsets = [0, 0.25, -0.15, 0.1, -0.25];
  return clampScore(normalisedScore / 20 + (offsets[index] ?? 0));
}

function reviewDecisionFor(status: MockInnovationStatus) {
  if (status === "IN_REVIEW") return "PENDING";
  if (status === "APPROVED" || status === "PUBLISHED" || status === "COMPLETED") return "APPROVED";
  if (status === "REJECTED") return "REJECTED";
  if (status === "MODIFICATION_REQUESTED") return "MODIFICATION_REQUESTED";
  return null;
}

function logActionsFor(spec: MockInnovationSpec) {
  if (spec.status === "DRAFT") return ["DRAFT_CREATED"];
  if (spec.status === "PENDING_SCREENING") return ["SUBMITTED"];
  if (spec.status === "MODIFICATION_REQUESTED") return ["SUBMITTED", "SCREENING_COMPLETED", "FEEDBACK_AUTO", "MODIFICATION_REQUESTED"];
  if (spec.status === "REJECTED") return ["SUBMITTED", "SCREENING_COMPLETED", "REJECTED_BY_PIC"];
  if (spec.status === "APPROVED") return ["SUBMITTED", "SCREENING_COMPLETED", "APPROVED_BY_PIC"];
  if (spec.status === "PUBLISHED") return ["SUBMITTED", "SCREENING_COMPLETED", "APPROVED_BY_PIC", "PUBLISHED"];
  if (spec.status === "COMPLETED") return ["SUBMITTED", "SCREENING_COMPLETED", "APPROVED_BY_PIC", "PUBLISHED", "COMPLETED"];
  return ["SUBMITTED", "SCREENING_COMPLETED"];
}

async function deleteExistingMocks(prisma: PrismaClient) {
  const existing = await prisma.innovation.findMany({
    where: { code: { in: [...MOCK_CODES] } },
    select: { id: true },
  });
  const ids = existing.map((item) => item.id);
  if (ids.length === 0) return;

  await prisma.notification.deleteMany({ where: { innovationId: { in: ids } } });
  await prisma.innovationUpvote.deleteMany({ where: { innovationId: { in: ids } } });
  await prisma.innovationComment.deleteMany({ where: { innovationId: { in: ids } } });
  await prisma.criterionScore.deleteMany({ where: { screening: { innovationId: { in: ids } } } });
  await prisma.innovationScreening.deleteMany({ where: { innovationId: { in: ids } } });
  await prisma.review.deleteMany({ where: { innovationId: { in: ids } } });
  await prisma.innovationLog.deleteMany({ where: { innovationId: { in: ids } } });
  await prisma.attachment.deleteMany({ where: { innovationId: { in: ids } } });
  await prisma.innovationBlock.deleteMany({ where: { innovationId: { in: ids } } });
  await prisma.innovation.deleteMany({ where: { id: { in: ids } } });
}

export async function seedMockInnovations(prisma: PrismaClient) {
  await deleteExistingMocks(prisma);

  const blocks = await prisma.block.findMany();
  const blockByCode = new Map(blocks.map((block) => [block.code, block]));
  const users = await prisma.user.findMany({ select: { id: true, block: { select: { code: true } } } });
  const userIds = new Set(users.map((user) => user.id));

  const missingUsers = [...new Set(MOCK_INNOVATIONS.map((item) => item.authorId))].filter((id) => !userIds.has(id));
  if (missingUsers.length > 0 || blocks.length === 0) {
    throw new Error(`Missing seed prerequisites. Run npm run db:seed first. Missing users: ${missingUsers.join(", ") || "none"}`);
  }

  const reviewerByBlock = new Map(
    users
      .filter((user) => user.block?.code)
      .map((user) => [user.block!.code, user.id])
  );

  for (const spec of MOCK_INNOVATIONS) {
    const primaryBlock = blockByCode.get(spec.blockCode);
    if (!primaryBlock) throw new Error(`Missing block ${spec.blockCode}`);

    const mapping = await prisma.blockFrameworkMapping.findFirst({
      where: { blockId: primaryBlock.id },
      include: { framework: { include: { criteria: { orderBy: { orderIndex: "asc" } } } } },
    });
    if (spec.score != null && !mapping) {
      throw new Error(`Missing framework mapping for block ${spec.blockCode}`);
    }

    const createdAt = daysAgo(spec.daysAgo);
    const submittedAt = spec.status === "DRAFT" ? null : daysAgo(Math.max(spec.daysAgo - 1, 0));
    const approvedAt = ["APPROVED", "PUBLISHED", "COMPLETED"].includes(spec.status)
      ? daysAgo(Math.max(spec.daysAgo - 2, 0))
      : null;
    const publishedAt = ["PUBLISHED", "COMPLETED"].includes(spec.status)
      ? daysAgo(Math.max(spec.daysAgo - 3, 0))
      : null;
    const completedAt = spec.status === "COMPLETED" ? daysAgo(Math.max(spec.daysAgo - 4, 0)) : null;

    const innovation = await prisma.innovation.create({
      data: {
        code: spec.code,
        title: spec.title,
        executiveSummary: spec.executiveSummary,
        painPoints: spec.painPoints,
        detailedSolution: spec.detailedSolution,
        status: spec.status,
        version: spec.status === "MODIFICATION_REQUESTED" ? 2 : 1,
        isBankWide: spec.isBankWide ?? false,
        authorId: spec.authorId,
        primaryBlockId: primaryBlock.id,
        submittedAt,
        approvedAt,
        publishedAt,
        completedAt,
        createdAt,
      },
    });

    const classificationCodes = new Set([
      spec.blockCode,
      ...(spec.isBankWide ? BANK_BLOCKS.map((block) => block.code) : spec.secondaryBlockCodes ?? []),
    ]);
    for (const code of classificationCodes) {
      const block = blockByCode.get(code);
      if (!block) continue;
      await prisma.innovationBlock.create({
        data: {
          innovationId: innovation.id,
          blockId: block.id,
          isPrimary: code === spec.blockCode,
        },
      });
    }

    if (spec.score != null && mapping) {
      const rawScores = mapping.framework.criteria.map((criterion, index) => ({
        criterion: criterion.name,
        score: criterionScore(spec.score!, index),
        reasoning: `Mock score band ${spec.score}/100 for ${criterion.name}.`,
      }));

      await prisma.innovationScreening.create({
        data: {
          innovationId: innovation.id,
          frameworkId: mapping.framework.id,
          normalisedScore: spec.score,
          promptTokens: 900 + Math.round(spec.score * 4),
          completionTokens: 240,
          rawResponse: JSON.stringify({
            applied_framework: mapping.framework.name,
            final_normalised_score: spec.score,
            criteria_scores: rawScores,
          }),
          screenedAt: daysAgo(Math.max(spec.daysAgo - 1, 0)),
          createdAt: daysAgo(Math.max(spec.daysAgo - 1, 0)),
          scores: {
            create: mapping.framework.criteria.map((criterion, index) => ({
              criterionId: criterion.id,
              score: criterionScore(spec.score!, index),
              reasoning: `Mock ${spec.score}/100 scenario for ${criterion.name}.`,
            })),
          },
        },
      });
    }

    const decision = reviewDecisionFor(spec.status);
    if (decision) {
      await prisma.review.create({
        data: {
          innovationId: innovation.id,
          blockId: primaryBlock.id,
          reviewerId: reviewerByBlock.get(spec.blockCode) ?? "admin-001",
          decision,
          feedbackNotes: spec.feedback ?? null,
          internalNotes: decision === "PENDING" ? "Mock item waiting for PIC review." : "Mock PIC decision for demo data.",
          reviewedAt: decision === "PENDING" ? null : daysAgo(Math.max(spec.daysAgo - 2, 0)),
          createdAt: daysAgo(Math.max(spec.daysAgo - 2, 0)),
        },
      });
    }

    for (const action of logActionsFor(spec)) {
      await prisma.innovationLog.create({
        data: {
          innovationId: innovation.id,
          action,
          performedBy: action.includes("AUTO") || action === "SCREENING_COMPLETED" ? "system" : spec.authorId,
          payload: action === "FEEDBACK_AUTO"
            ? JSON.stringify({
                completeness: { complete: false, missing: [spec.feedback ?? "Cần bổ sung dữ liệu định lượng."] },
                failReasons: [spec.feedback ?? "Cần bổ sung dữ liệu định lượng."],
              })
            : action === "SCREENING_COMPLETED" && spec.score != null
              ? JSON.stringify({ finalScore: spec.score, complete: spec.score >= 40 })
              : null,
          createdAt: daysAgo(Math.max(spec.daysAgo - 1, 0)),
        },
      });
    }

    const upvoteCount = spec.upvotes ?? 0;
    for (const userId of STAFF_USER_IDS.filter((id) => id !== spec.authorId).slice(0, upvoteCount)) {
      await prisma.innovationUpvote.create({ data: { innovationId: innovation.id, userId } });
    }

    for (let i = 0; i < (spec.comments ?? []).length; i++) {
      const userId = STAFF_USER_IDS[(i + 2) % STAFF_USER_IDS.length];
      await prisma.innovationComment.create({
        data: {
          innovationId: innovation.id,
          authorId: userId,
          content: spec.comments![i],
          createdAt: daysAgo(Math.max(spec.daysAgo - i - 1, 0)),
        },
      });
    }
  }

  console.log(`Mock innovation data created: ${MOCK_INNOVATIONS.length} ideas across every status and score bands.`);
}
