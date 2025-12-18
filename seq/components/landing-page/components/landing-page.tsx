"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  LogoIcon,
  MagicIcon,
  FilmIcon,
  BrainIcon,
  LinkIcon,
  CheckSquareIcon,
  SlidersIcon,
  VideoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "./icons"
import Link from "next/link"
import { Search, Sparkles, Users } from "lucide-react"
import { AppShell } from "@/seq/components/app-shell"
import { MediaListItem } from "@/seq/components/shared"
import { CreditsDisplay } from "@/seq/components/shared"

// Hero slides for carousel
const HERO_SLIDES = [
  {
    title: "Create AI Videos in Minutes",
    description: "Transform your ideas into stunning videos with AI-powered generation, transitions, and effects.",
    tag: "New Release",
    cta: "Start Creating",
    ctaLink: "/storyboard",
    gradient: "from-rose-600 via-pink-600 to-orange-500",
    badgeColor: "bg-rose-500",
    buttonColor: "bg-white hover:bg-white/90",
  },
  {
    title: "AI Storyboard Generator",
    description: "Generate complete storyboards from text prompts. Let AI handle the visuals.",
    tag: "Featured",
    cta: "Try Storyboard",
    ctaLink: "/storyboard",
    gradient: "from-violet-600 via-purple-600 to-fuchsia-500",
    badgeColor: "bg-violet-500",
    buttonColor: "bg-white hover:bg-white/90",
  },
  {
    title: "Image Playground",
    description: "Combine and transform images with AI. Create unique visuals for your projects.",
    tag: "Popular",
    cta: "Explore Images",
    ctaLink: "/image-playground",
    gradient: "from-cyan-600 via-teal-500 to-emerald-500",
    badgeColor: "bg-cyan-500",
    buttonColor: "bg-white hover:bg-white/90",
  },
]

// Featured projects for "For You" section
const FEATURED_PROJECTS = [
  {
    id: 1,
    title: "Cyberpunk Chase Scene",
    description: "A high-octane neon-lit chase through futuristic city streets with intense action sequences",
    style: "sci-fi, neon, action",
    creator: "AIDirector",
    plays: "43K",
    likes: 694,
    duration: "1:42",
    thumbnail: "/cyberpunk-neon-city-chase-scene-thumbnail.jpg",
    badge: "v3.1",
  },
  {
    id: 2,
    title: "Nature Documentary",
    description: "Breathtaking wildlife footage captured with cinematic precision and natural lighting",
    style: "wildlife, cinematic",
    creator: "NatureLens",
    plays: "28K",
    likes: 412,
    duration: "2:15",
    thumbnail: "/nature-documentary-wildlife-thumbnail.jpg",
    badge: null,
  },
  {
    id: 3,
    title: "Abstract Dreams",
    description: "Surreal visual journey through colorful dreamscapes and abstract compositions",
    style: "surreal, artistic",
    creator: "DreamWeaver",
    plays: "15K",
    likes: 256,
    duration: "0:58",
    thumbnail: "/abstract-surreal-colorful-dream-thumbnail.jpg",
    badge: "Featured",
  },
]

// Suggested creators
const SUGGESTED_CREATORS = [
  { id: 1, name: "AIDirector", avatar: "/diverse-group-avatars.png", followers: "22K" },
  { id: 2, name: "NatureLens", avatar: "/diverse-group-avatars.png", followers: "18K" },
  { id: 3, name: "DreamWeaver", avatar: "/diverse-group-avatars.png", followers: "15K" },
]

// Trending items
const TRENDING_ITEMS = [
  {
    id: 1,
    title: "Sunset Transitions",
    description: "Beautiful golden hour transitions perfect for cinematic storytelling",
    style: "Cinematic",
    creator: "FilmMaker Pro",
    plays: "12K",
    likes: 206,
    duration: "1:24",
    badge: "Made with Seq",
    thumbnail: "/sunset-cinematic-transition-thumbnail.jpg",
  },
  {
    id: 2,
    title: "Urban Stories",
    description: "Documentary-style urban exploration through city life and street culture",
    style: "Documentary",
    creator: "CityScape",
    plays: "8.5K",
    likes: 178,
    duration: "2:03",
    badge: null,
    thumbnail: "/urban-documentary-street-thumbnail.jpg",
  },
]

export const LandingPage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [trendingFilter, setTrendingFilter] = useState<"global" | "now">("global")

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)

  return (
    <AppShell>
      <div className="min-h-screen bg-[var(--surface-0)] text-white overflow-x-hidden selection:bg-[var(--accent-muted)]">
        {/* Top Bar - Search/Create */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-6 py-3 bg-[var(--surface-0)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)]">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Create your own video sequence"
              className="w-full h-10 pl-10 pr-4 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-full text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-primary)] transition-colors"
            />
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            <CreditsDisplay credits="unlimited" />
            <Link
              href="/storyboard"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-gradient text-accent-text-white font-medium text-sm hover:opacity-90 transition-all shadow-lg shadow-[var(--accent-shadow)]"
            >
              Create
              <Sparkles className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Hero Carousel */}
        <section className="relative px-6 pt-6 pb-8">
          <div className="relative max-w-6xl mx-auto">
            {/* Current Tab Indicator */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/40 backdrop-blur-sm">
              <span className="text-sm font-medium text-white">Home</span>
            </div>

            {/* Carousel Container */}
            <div className="relative aspect-[21/9] rounded-2xl overflow-hidden bg-[var(--surface-3)]">
              {/* Slides */}
              {HERO_SLIDES.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                >
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} opacity-30`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Large Number/Visual Element */}
                  <div className="absolute right-0 top-0 bottom-0 w-1/2 flex items-center justify-center opacity-20">
                    <span className="text-[300px] font-bold text-white/20">{index + 1}</span>
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
                    <div className="max-w-xl">
                      <span
                        className={`inline-block px-2.5 py-1 rounded ${slide.badgeColor} text-white text-xs font-semibold mb-4`}
                      >
                        {slide.tag}
                      </span>
                      <h2 className="text-3xl md:text-5xl font-bold mb-3 leading-tight text-balance">{slide.title}</h2>
                      <p className="text-neutral-300 text-sm md:text-base mb-6 max-w-md">{slide.description}</p>
                      <Link
                        href={slide.ctaLink}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full ${slide.buttonColor} text-black font-semibold text-sm transition-all`}
                      >
                        {slide.cta}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Carousel Progress Bar */}
            <div className="flex justify-center gap-1 mt-4">
              {HERO_SLIDES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className="h-1 rounded-full transition-all overflow-hidden bg-white/20"
                  style={{ width: index === currentSlide ? "64px" : "32px" }}
                >
                  {index === currentSlide && (
                    <div
                      className="h-full bg-white rounded-full animate-progress"
                      style={{
                        animation: "progress 6s linear forwards",
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Content Sections */}
        <section className="px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* For You Section */}
              <div className="lg:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold text-white">For You</h3>
                  <ChevronRightIcon className="w-4 h-4 text-neutral-500" />
                </div>
                <div className="space-y-1">
                  {FEATURED_PROJECTS.map((project) => (
                    <MediaListItem
                      key={project.id}
                      thumbnail={project.thumbnail}
                      title={project.title}
                      description={project.description}
                      duration={project.duration}
                      tags={
                        project.badge
                          ? [{ label: project.badge, color: "bg-[var(--accent-bg-subtle)] text-[var(--accent-text)]" }]
                          : []
                      }
                      metadata={[
                        { label: "", value: project.creator },
                        { label: "▶", value: project.plays },
                        { label: "♡", value: project.likes },
                      ]}
                      onPlay={() => console.log("Play", project.id)}
                      onClick={() => console.log("Click", project.id)}
                      className="mx-0 px-2"
                    />
                  ))}
                </div>
              </div>

              {/* Suggested Creators */}
              <div className="lg:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold text-white">Suggested Creators</h3>
                </div>
                <div className="space-y-2">
                  {SUGGESTED_CREATORS.map((creator) => (
                    <div
                      key={creator.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--hover-overlay)] transition-colors cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--surface-2)] flex-shrink-0">
                        <img
                          src={creator.avatar || "/placeholder.svg"}
                          alt={creator.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-white">{creator.name}</h4>
                        <p className="text-xs text-neutral-500">{creator.followers} followers</p>
                      </div>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--hover-overlay)] border border-[var(--border-emphasis)] text-xs font-medium text-white hover:bg-[var(--active-overlay)] transition-colors opacity-0 group-hover:opacity-100">
                        <Users className="w-3 h-3" />
                        Follow
                      </button>
                    </div>
                  ))}
                </div>

                {/* Quick Actions - moved here */}
                <div className="mt-6 pt-6 border-t border-[var(--border-default)]">
                  <h4 className="text-sm font-medium text-neutral-400 mb-3">Quick Actions</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <Link
                      href="/storyboard"
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[var(--hover-overlay)] border border-[var(--border-default)] hover:border-violet-500/30 hover:bg-[var(--active-overlay)] transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                        <BrainIcon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium text-neutral-300">Storyboard</span>
                    </Link>
                    <Link
                      href="/image-playground"
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[var(--hover-overlay)] border border-[var(--border-default)] hover:border-cyan-500/30 hover:bg-[var(--active-overlay)] transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                        <MagicIcon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium text-neutral-300">Images</span>
                    </Link>
                    <Link
                      href="/timeline"
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[var(--hover-overlay)] border border-[var(--border-default)] hover:border-emerald-500/30 hover:bg-[var(--active-overlay)] transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                        <FilmIcon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium text-neutral-300">Studio</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Trending Section */}
              <div className="lg:col-span-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">Trending</h3>
                    <ChevronRightIcon className="w-4 h-4 text-neutral-500" />
                  </div>
                  <div className="flex items-center p-0.5 rounded-lg bg-[var(--surface-2)]">
                    <button
                      onClick={() => setTrendingFilter("global")}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        trendingFilter === "global"
                          ? "bg-[var(--active-overlay)] text-white"
                          : "text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      Global
                    </button>
                    <button
                      onClick={() => setTrendingFilter("now")}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        trendingFilter === "now"
                          ? "bg-[var(--active-overlay)] text-white"
                          : "text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      Now
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  {TRENDING_ITEMS.map((item) => (
                    <MediaListItem
                      key={item.id}
                      thumbnail={item.thumbnail}
                      title={item.title}
                      description={item.description}
                      duration={item.duration}
                      tags={
                        item.badge
                          ? [{ label: item.badge, color: "bg-[var(--accent-bg-subtle)] text-[var(--accent-text)]" }]
                          : []
                      }
                      metadata={[
                        { label: "", value: item.creator },
                        { label: "▶", value: item.plays },
                        { label: "♡", value: item.likes },
                      ]}
                      onPlay={() => console.log("Play", item.id)}
                      onClick={() => console.log("Click", item.id)}
                      className="mx-0 px-2"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pipeline Section - Improved with design tokens */}
        <section className="py-16 bg-[var(--surface-0)] border-y border-[var(--border-subtle)]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-bg-subtle)] border border-[var(--accent-border)] text-xs font-medium text-[var(--accent-text)] mb-4">
                <BrainIcon className="w-3 h-3" />
                AI Pipeline
              </span>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">From Text to Timeline in 5 Steps</h2>
              <p className="text-neutral-400 text-sm max-w-lg mx-auto">
                Our automated pipeline handles the heavy lifting. You focus on the story.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                {
                  icon: BrainIcon,
                  label: "Generate",
                  bgColor: "bg-violet-500/20",
                  textColor: "text-violet-400",
                },
                {
                  icon: LinkIcon,
                  label: "Transitions",
                  bgColor: "bg-purple-500/20",
                  textColor: "text-purple-400",
                },
                { icon: CheckSquareIcon, label: "Select", bgColor: "bg-emerald-500/20", textColor: "text-emerald-400" },
                {
                  icon: SlidersIcon,
                  label: "Process",
                  bgColor: "bg-amber-500/20",
                  textColor: "text-amber-400",
                },
                {
                  icon: VideoIcon,
                  label: "Produce",
                  bgColor: "bg-rose-500/20",
                  textColor: "text-rose-400",
                },
              ].map((step, i) => (
                <div
                  key={i}
                  className="relative p-4 rounded-xl bg-[var(--hover-overlay)] border border-[var(--border-default)] group hover:border-[var(--border-strong)] transition-all"
                >
                  <div className="absolute top-2 right-2 text-[10px] font-mono text-neutral-600">0{i + 1}</div>
                  <div
                    className={`w-8 h-8 rounded-lg ${step.bgColor} flex items-center justify-center ${step.textColor} mb-3 group-hover:scale-110 transition-transform`}
                  >
                    <step.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-white">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-6 border-t border-[var(--border-subtle)]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <LogoIcon className="w-5 h-5 text-[var(--accent-primary)]" />
              <span className="font-semibold text-white">Seq</span>
            </div>
            <div className="text-xs text-neutral-500">© 2025 Seq. All rights reserved.</div>
            <div className="flex gap-4">
              <a href="#" className="text-xs text-neutral-400 hover:text-white transition-colors">
                Twitter
              </a>
              <a href="#" className="text-xs text-neutral-400 hover:text-white transition-colors">
                GitHub
              </a>
              <a href="#" className="text-xs text-neutral-400 hover:text-white transition-colors">
                Discord
              </a>
            </div>
          </div>
        </footer>

        {/* CSS for progress animation */}
        <style jsx>{`
          @keyframes progress {
            from {
              width: 0%;
            }
            to {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </AppShell>
  )
}
