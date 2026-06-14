interface PoetBranchSelectorProps {
  branches: string[];
  activeBranchId: string | null;
  onSelect: (branchId: string) => void;
}

export function PoetBranchSelector({ branches, activeBranchId, onSelect }: PoetBranchSelectorProps) {
  if (branches.length <= 1) return null;
  return (
    <div className="flex gap-1 overflow-x-auto border-t border-cs-hairline px-3 py-1">
      {branches.map((branchId, index) => (
        <button
          key={branchId}
          type="button"
          onClick={() => onSelect(branchId)}
          className={`shrink-0 rounded-sm px-2 py-0.5 text-[10px] ${
            activeBranchId === branchId ? "bg-cs-modal text-cs-primary" : "text-cs-secondary"
          }`}
        >
          Branch {String.fromCharCode(65 + index)}
        </button>
      ))}
    </div>
  );
}
