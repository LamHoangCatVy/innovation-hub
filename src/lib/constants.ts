export const BANK_BLOCKS = [
  { code: "RB", name: "Khối Ngân hàng Bán lẻ (Retail Banking)", category: "BUSINESS" },
  { code: "CMB", name: "Khối Ngân hàng Doanh nghiệp vừa & nhỏ (SME)", category: "BUSINESS" },
  { code: "CIB", name: "Khối Ngân hàng Doanh nghiệp lớn & Định chế", category: "BUSINESS" },
  { code: "Treasury", name: "Khối Nguồn vốn & Kinh doanh vốn", category: "BUSINESS" },
  { code: "IB", name: "Khối Ngân hàng Đầu tư (Investment Banking)", category: "BUSINESS" },
  { code: "Card", name: "Khối Thẻ & Thanh toán", category: "BUSINESS" },
  { code: "Bancass", name: "Khối Bancassurance (Bảo hiểm)", category: "BUSINESS" },
  { code: "Digital", name: "Khối Ngân hàng Số (Digital Banking)", category: "BUSINESS" },
  { code: "WM", name: "Khối Quản lý Tài sản (Wealth Management)", category: "BUSINESS" },
  { code: "FI", name: "Khối Định chế Tài chính", category: "BUSINESS" },
  { code: "Ops", name: "Khối Vận hành (Operations)", category: "OPERATIONS" },
  { code: "Risk", name: "Khối Quản trị Rủi ro", category: "OPERATIONS" },
  { code: "Legal", name: "Khối Pháp chế & Tuân thủ", category: "OPERATIONS" },
  { code: "Fin", name: "Khối Tài chính Kế toán", category: "OPERATIONS" },
  { code: "HR", name: "Khối Nhân sự", category: "OPERATIONS" },
  { code: "IT", name: "Khối Công nghệ Thông tin", category: "OPERATIONS" },
  { code: "Strategy", name: "Khối Chiến lược & Phát triển", category: "OPERATIONS" },
  { code: "Marketing", name: "Khối Marketing & Truyền thông", category: "OPERATIONS" },
  { code: "Audit", name: "Khối Kiểm toán Nội bộ", category: "OPERATIONS" },
  { code: "Admin", name: "Khối Hành chính & Quản trị", category: "OPERATIONS" },
] as const;

export const FRAMEWORK_BUSINESS_RICE = {
  name: "FRAMEWORK_BUSINESS_RICE",
  description: `Bộ tiêu chí RICE dành cho sáng kiến thuộc Khối Kinh doanh.
Công thức: Score = (Reach × Impact × Confidence) / Effort`,
  formula: "(Reach * Impact * Confidence) / Effort",
  applicableBlocks: ["RB", "CMB", "CIB", "Treasury", "IB", "Card", "Bancass", "Digital", "WM", "FI"],
  criteria: [
    { name: "Reach", description: "Quy mô lượng khách hàng/nhân sự thụ hưởng (1-5)", weight: 1 },
    { name: "Impact", description: "Khả năng sinh lời, thúc đẩy chỉ số tài chính (NIM, CASA) (1-5)", weight: 1 },
    { name: "Confidence", description: "Mức độ tin cậy của dữ liệu chứng minh (50%-100%)", weight: 1 },
    { name: "Effort", description: "Mức độ nỗ lực, thời gian, tài nguyên hệ thống cần can thiệp (1-5)", weight: 1 },
  ],
};

export const FRAMEWORK_OPERATIONAL_RISK = {
  name: "FRAMEWORK_OPERATIONAL_RISK",
  description: `Bộ tiêu chí đánh giá rủi ro & vận hành dành cho Khối Vận hành & Quản trị.
Công thức: Score = (Giá trị Vận hành × 60%) + (Kiểm soát Rủi ro × 40%)`,
  formula: "(OperationalValue * 0.6) + (RiskControl * 0.4)",
  applicableBlocks: ["Ops", "Risk", "Legal", "Fin", "HR", "IT", "Strategy", "Marketing", "Audit", "Admin"],
  criteria: [
    { name: "Time Saving", description: "Khả năng cắt giảm thời gian xử lý quy trình (SLA/TAT) (1-5)", weight: 2 },
    { name: "Cost Reduction", description: "Khả năng cắt giảm chi phí, định biên nhân sự (FTE) (1-5)", weight: 2 },
    { name: "Employee Experience", description: "Mức độ giảm tải tác vụ lặp lại thủ công cho staff (1-5)", weight: 2 },
    { name: "OpRisk Mitigation", description: "Loại bỏ lỗi con người (Human error) và rủi ro gian lận (1-5)", weight: 3 },
    { name: "Compliance", description: "Mức độ đáp ứng thông tư, chế tài của NHNN (1-5)", weight: 3 },
  ],
};

export const INNOVATION_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["DRAFT", "PENDING_SCREENING"],
  PENDING_SCREENING: ["SCREENED", "DRAFT"],
  SCREENED: ["IN_REVIEW", "DRAFT"],
  IN_REVIEW: ["APPROVED", "REJECTED", "MODIFICATION_REQUESTED"],
  MODIFICATION_REQUESTED: ["DRAFT", "IN_REVIEW"],
  APPROVED: ["PUBLISHED"],
  REJECTED: ["DRAFT"],
  PUBLISHED: ["COMPLETED"],
  COMPLETED: [],
};
