import PptxGenJS from "pptxgenjs";
import type { SlideData } from "@/components/SlidePreviewCard";

// Color palettes for professional slides
const PALETTES = {
  dark: {
    bg: "1a1a2e",
    title: "ffffff",
    body: "e0e0e0",
    accent: "4fc3f7",
    subtle: "333355",
  },
  light: {
    bg: "ffffff",
    title: "1a1a2e",
    body: "333333",
    accent: "2962ff",
    subtle: "f0f0f5",
  },
  corporate: {
    bg: "0d1b2a",
    title: "ffffff",
    body: "c8d6e5",
    accent: "48c9b0",
    subtle: "1b2838",
  },
};

export async function exportPptx(
  slides: SlideData[],
  title: string,
  theme: keyof typeof PALETTES = "dark"
): Promise<void> {
  const pptx = new PptxGenJS();
  const colors = PALETTES[theme];

  pptx.author = "Vyroo AI";
  pptx.company = "Vyroo";
  pptx.title = title;
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 inches

  slides.forEach((slide, idx) => {
    const pptSlide = pptx.addSlide();
    pptSlide.background = { color: slide.bgColor?.replace("#", "") || colors.bg };

    // Slide number badge
    pptSlide.addText(`${idx + 1}`, {
      x: 12.2,
      y: 0.3,
      w: 0.6,
      h: 0.4,
      fontSize: 10,
      color: colors.body,
      align: "center",
      fontFace: "Arial",
    });

    if (idx === 0) {
      // Title slide
      pptSlide.addText(slide.title, {
        x: 1,
        y: 2,
        w: 11,
        h: 1.5,
        fontSize: 36,
        bold: true,
        color: colors.title,
        fontFace: "Arial",
        align: "center",
      });
      if (slide.subtitle) {
        pptSlide.addText(slide.subtitle, {
          x: 2,
          y: 3.8,
          w: 9,
          h: 0.8,
          fontSize: 18,
          color: colors.body,
          fontFace: "Arial",
          align: "center",
        });
      }
      // Accent line
      pptSlide.addShape(pptx.ShapeType.rect, {
        x: 5,
        y: 3.4,
        w: 3,
        h: 0.05,
        fill: { color: colors.accent },
      });
    } else {
      // Content slide — title
      pptSlide.addText(slide.title, {
        x: 0.8,
        y: 0.4,
        w: 11,
        h: 0.8,
        fontSize: 26,
        bold: true,
        color: colors.title,
        fontFace: "Arial",
      });

      // Accent underline
      pptSlide.addShape(pptx.ShapeType.rect, {
        x: 0.8,
        y: 1.15,
        w: 2,
        h: 0.04,
        fill: { color: colors.accent },
      });

      // Subtitle
      if (slide.subtitle) {
        pptSlide.addText(slide.subtitle, {
          x: 0.8,
          y: 1.3,
          w: 11,
          h: 0.6,
          fontSize: 14,
          color: colors.body,
          fontFace: "Arial",
          italic: true,
        });
      }

      // Bullet points
      if (slide.content && slide.content.length > 0) {
        const bulletText = slide.content.map((point) => ({
          text: point,
          options: {
            fontSize: 15,
            color: colors.body,
            fontFace: "Arial" as const,
            bullet: { type: "bullet" as const, color: colors.accent },
            paraSpaceAfter: 8,
          },
        }));

        pptSlide.addText(bulletText, {
          x: 0.8,
          y: slide.subtitle ? 2.0 : 1.5,
          w: 11,
          h: 5,
          valign: "top",
        });
      }

      // Badge
      if (slide.badge) {
        pptSlide.addText(slide.badge, {
          x: 10,
          y: 0.3,
          w: 2.5,
          h: 0.4,
          fontSize: 10,
          color: colors.accent,
          fontFace: "Arial",
          align: "right",
        });
      }
    }

    // Speaker notes
    if (slide.speakerNotes) {
      pptSlide.addNotes(slide.speakerNotes);
    }
  });

  // Download
  const fileName = `${title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_").substring(0, 50)}.pptx`;
  await pptx.writeFile({ fileName });
}
