"use client";

import { cn } from "@/lib/utils";
import { BANK_BLOCKS } from "@/lib/constants";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

interface ClassificationPanelProps {
  selectedBlockIds: string[];
  primaryBlockId: string;
  isBankWide: boolean;
  onBlocksChange: (blockIds: string[], primaryId: string, isBankWide: boolean) => void;
}

export function ClassificationPanel({
  selectedBlockIds,
  primaryBlockId,
  isBankWide,
  onBlocksChange,
}: ClassificationPanelProps) {
  const businessBlocks = BANK_BLOCKS.filter((b) => b.category === "BUSINESS");
  const operationsBlocks = BANK_BLOCKS.filter((b) => b.category === "OPERATIONS");

  const toggleBlock = (code: string) => {
    if (isBankWide) return;
    const next = selectedBlockIds.includes(code)
      ? selectedBlockIds.filter((id) => id !== code)
      : [...selectedBlockIds, code];
    const nextPrimary = next.includes(primaryBlockId) ? primaryBlockId : next[0] || "";
    onBlocksChange(next, nextPrimary, false);
  };

  const toggleBankWide = () => {
    if (isBankWide) {
      onBlocksChange([], "", false);
    } else {
      const allCodes = BANK_BLOCKS.map((b) => b.code);
      onBlocksChange(allCodes, allCodes[0], true);
    }
  };

  const setPrimary = (code: string) => {
    if (!selectedBlockIds.includes(code)) return;
    onBlocksChange(selectedBlockIds, code, isBankWide);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Bước 3: Phân loại Khối thụ hưởng</h2>
      </div>

      <div>
        <Label>Chọn Khối thụ hưởng</Label>
        <p className="text-xs text-text-muted mb-3">Chọn một hoặc nhiều khối mà sáng kiến hướng tới</p>

        <button
          onClick={toggleBankWide}
          className={cn(
            "w-full p-4 rounded-lg border-2 text-left transition-all duration-200 cursor-pointer mb-4",
            isBankWide
              ? "border-gold bg-gold/10 text-gold"
              : "border-navy-700 hover:border-navy-600 text-text-secondary"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-5 h-5 rounded flex items-center justify-center border-2 transition-colors",
                isBankWide ? "border-gold bg-gold" : "border-navy-600"
              )}
            >
              {isBankWide && <Check size={12} className="text-navy-950" />}
            </div>
            <div>
              <p className="font-medium">Tác động toàn ngân hàng (Bank-wide Impact)</p>
              <p className="text-xs opacity-70 mt-0.5">Tự động chọn toàn bộ 20 khối</p>
            </div>
          </div>
        </button>

        <BlockSection
          title="Khối Kinh doanh"
          blocks={businessBlocks}
          selectedIds={selectedBlockIds}
          primaryId={primaryBlockId}
          disabled={isBankWide}
          onToggle={toggleBlock}
          onSetPrimary={setPrimary}
        />

        <BlockSection
          title="Khối Vận hành & Quản trị"
          blocks={operationsBlocks}
          selectedIds={selectedBlockIds}
          primaryId={primaryBlockId}
          disabled={isBankWide}
          onToggle={toggleBlock}
          onSetPrimary={setPrimary}
        />
      </div>
    </div>
  );
}

function BlockSection({
  title,
  blocks,
  selectedIds,
  primaryId,
  disabled,
  onToggle,
  onSetPrimary,
}: {
  title: string;
  blocks: { readonly code: string; readonly name: string; readonly category: string }[];
  selectedIds: string[];
  primaryId: string;
  disabled: boolean;
  onToggle: (code: string) => void;
  onSetPrimary: (code: string) => void;
}) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">{title}</p>
      <div className="grid grid-cols-2 gap-2">
        {blocks.map((block) => {
          const isSelected = selectedIds.includes(block.code);
          const isPrimary = primaryId === block.code;
          return (
            <button
              key={block.code}
              onClick={() => {
                if (disabled) return;
                if (isSelected && !isPrimary) {
                  onSetPrimary(block.code);
                } else {
                  onToggle(block.code);
                }
              }}
              disabled={disabled && !isSelected}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-200 cursor-pointer",
                isSelected && isPrimary
                  ? "border-primary bg-primary/15 text-primary-light"
                  : isSelected
                    ? "border-navy-600 bg-navy-800/50 text-text-secondary"
                    : "border-navy-800 hover:border-navy-600 text-text-muted",
                disabled && "opacity-60 cursor-not-allowed"
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                  isSelected ? "border-primary bg-primary" : "border-navy-600"
                )}
              >
                {isSelected && <Check size={10} className="text-white" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{block.name}</p>
                <p className="text-[10px] opacity-60">{block.code}</p>
              </div>
              {isPrimary && (
                <span className="ml-auto text-[10px] bg-primary/20 text-primary-light px-1.5 py-0.5 rounded">
                  Chính
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
