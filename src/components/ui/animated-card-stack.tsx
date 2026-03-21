"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Bot, Zap, Globe, Code, BarChart3, Workflow, ArrowRight } from "lucide-react"

interface Card {
  id: number
  contentType: 1 | 2 | 3 | 4 | 5 | 6
}

const cardData: Record<number, {
  title: string
  description: string
  image: string
  cta: string
  icon: typeof Bot
  gradient: string
}> = {
  1: {
    title: "AI Agents",
    description: "Deploy autonomous agents that research, code, and analyze — while you focus on what matters.",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop",
    cta: "Explore",
    icon: Bot,
    gradient: "from-purple-500/20 to-blue-500/20",
  },
  2: {
    title: "Multi-Model Chat",
    description: "Claude, GPT-4o, Gemini, Llama — one interface, best model auto-selected for each task.",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&h=400&fit=crop",
    cta: "Try it",
    icon: Zap,
    gradient: "from-amber-500/20 to-orange-500/20",
  },
  3: {
    title: "Web Research",
    description: "Real-time search, source citation, and research timelines — built into every conversation.",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop",
    cta: "Search",
    icon: Globe,
    gradient: "from-cyan-500/20 to-teal-500/20",
  },
  4: {
    title: "Code Generation",
    description: "Write, review, and ship code with syntax highlighting, diffs, and a built-in terminal.",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop",
    cta: "Build",
    icon: Code,
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  5: {
    title: "Data Analysis",
    description: "Upload CSVs, generate interactive charts, and get AI-powered insights instantly.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
    cta: "Analyze",
    icon: BarChart3,
    gradient: "from-pink-500/20 to-rose-500/20",
  },
  6: {
    title: "Visual Workflows",
    description: "Chain agents together with a drag-and-drop editor. Automate anything.",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop",
    cta: "Automate",
    icon: Workflow,
    gradient: "from-indigo-500/20 to-violet-500/20",
  },
}

const totalTypes = 6

const initialCards: Card[] = [
  { id: 1, contentType: 1 },
  { id: 2, contentType: 2 },
  { id: 3, contentType: 3 },
]

const positionStyles = [
  { scale: 1, y: 12 },
  { scale: 0.95, y: -16 },
  { scale: 0.9, y: -44 },
]

const exitAnimation = {
  y: 340,
  scale: 1,
  zIndex: 10,
}

const enterAnimation = {
  y: -16,
  scale: 0.9,
}

function CardContent({ contentType }: { contentType: number }) {
  const data = cardData[contentType]
  if (!data) return null
  const Icon = data.icon

  return (
    <div className="flex h-full w-full flex-col gap-3">
      <div className={`relative flex h-[180px] w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${data.gradient}`}>
        <img
          src={data.image}
          alt={data.title}
          className="h-full w-full select-none object-cover opacity-80 mix-blend-luminosity"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl bg-background/80 p-4 backdrop-blur-sm">
            <Icon size={32} className="text-foreground" />
          </div>
        </div>
      </div>
      <div className="flex w-full items-center justify-between gap-2 px-3 pb-4">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold text-foreground">{data.title}</span>
          <span className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">{data.description}</span>
        </div>
        <button className="flex h-9 shrink-0 cursor-pointer select-none items-center gap-0.5 rounded-full bg-foreground pl-3.5 pr-2.5 text-xs font-medium text-background transition-opacity hover:opacity-90">
          {data.cta}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}

function AnimatedCard({
  card,
  index,
  isAnimating,
}: {
  card: Card
  index: number
  isAnimating: boolean
}) {
  const { scale, y } = positionStyles[index] ?? positionStyles[2]
  const zIndex = index === 0 && isAnimating ? 10 : 3 - index
  const exitAnim = index === 0 ? exitAnimation : undefined
  const initialAnim = index === 2 ? enterAnimation : undefined

  return (
    <motion.div
      key={card.id}
      initial={initialAnim}
      animate={{ y, scale }}
      exit={exitAnim}
      transition={{
        type: "spring",
        duration: 1,
        bounce: 0,
      }}
      style={{
        zIndex,
        left: "50%",
        x: "-50%",
        bottom: 0,
      }}
      className="absolute flex h-[260px] w-[320px] items-center justify-center overflow-hidden rounded-t-xl border-x border-t border-border bg-card p-1 shadow-lg will-change-transform sm:w-[480px]"
    >
      <CardContent contentType={card.contentType} />
    </motion.div>
  )
}

export default function AnimatedCardStack() {
  const [cards, setCards] = useState(initialCards)
  const [isAnimating, setIsAnimating] = useState(false)
  const [nextId, setNextId] = useState(4)

  const handleAnimate = () => {
    if (isAnimating) return
    setIsAnimating(true)
    const nextContentType = ((cards[2].contentType % totalTypes) + 1) as Card["contentType"]
    setCards([...cards.slice(1), { id: nextId, contentType: nextContentType }])
    setNextId((prev) => prev + 1)
    setTimeout(() => setIsAnimating(false), 300)
  }

  // Auto-rotate every 4 seconds
  useEffect(() => {
    const interval = setInterval(handleAnimate, 4000)
    return () => clearInterval(interval)
  })

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="relative h-[340px] w-full overflow-hidden sm:w-[580px]">
        <AnimatePresence initial={false}>
          {cards.slice(0, 3).map((card, index) => (
            <AnimatedCard key={card.id} card={card} index={index} isAnimating={isAnimating} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
