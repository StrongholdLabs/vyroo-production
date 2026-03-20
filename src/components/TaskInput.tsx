import { useState } from "react";
import { ArrowUp, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function TaskInput() {
  const [value, setValue] = useState("");
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!value.trim()) return;
    navigate("/dashboard", { state: { task: value } });
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="input-main rounded-2xl overflow-hidden">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Assign a task or ask anything"
          rows={2}
          className="w-full resize-none bg-transparent px-5 pt-4 pb-1 text-foreground placeholder:text-muted-foreground/60 text-[15px] leading-relaxed focus:outline-none font-body"
        />
        <div className="flex items-center justify-between px-3 pb-3">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors duration-150 rounded-lg hover:bg-secondary active:scale-95">
            <Plus size={18} />
          </button>
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="p-2 rounded-xl bg-foreground text-primary-foreground disabled:opacity-30 hover:opacity-90 transition-all duration-150 active:scale-95"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
