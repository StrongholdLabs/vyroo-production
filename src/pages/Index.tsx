import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { TaskInput } from "@/components/TaskInput";
import { ActionChips } from "@/components/ActionChips";
import { PromoCarousel } from "@/components/PromoCarousel";

const Index = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-24 pt-14">
        <div
          className={`flex flex-col items-center gap-8 w-full transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <h1
            className="font-display text-4xl md:text-5xl lg:text-[3.5rem] text-foreground leading-[1.1] tracking-tight text-center"
            style={{ textWrap: "balance" as any }}
          >
            What can I do for you?
          </h1>

          <TaskInput />

          <div
            className={`transition-all duration-700 delay-200 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
            style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <ActionChips />
          </div>

          <div
            className={`transition-all duration-700 delay-300 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
            style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <PromoCarousel />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
