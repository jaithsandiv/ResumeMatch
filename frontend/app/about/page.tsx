import Link from 'next/link';
import {
  Target,
  Eye,
  ShieldCheck,
  GraduationCap,
  Network,
  Heart,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Explainability',
    body: 'Every score comes with matched skills, missing skills, and a plain-language explanation. No black boxes.',
  },
  {
    icon: GraduationCap,
    title: 'Candidate-First',
    body: 'Built entirely around helping candidates improve. Every feature — from skill extraction to counterfactuals — serves the job seeker.',
  },
  {
    icon: Network,
    title: 'Graph Intelligence',
    body: 'Our Graph-RAG engine uses semantic similarity and bipartite graphs to match skills fairly, resisting keyword stuffing.',
  },
  {
    icon: Heart,
    title: 'Honest Feedback',
    body: 'Counterfactual reasoning tells candidates exactly which skills to add and by how much their score would improve — no vague rejections.',
  },
];

const TIMELINE = [
  {
    period: '2025 Q3',
    title: 'The Idea',
    body: 'Final-year undergraduate project conceived: build a resume matcher that explains its reasoning instead of hiding behind a score.',
    side: 'left' as const,
  },
  {
    period: '2025 Q4',
    title: 'First Build',
    body: 'Backend MVP launched with FastAPI, MongoDB Atlas, Backblaze B2, and the first version of the Graph-RAG matching engine.',
    side: 'right' as const,
  },
  {
    period: '2026 Q1',
    title: 'AI Integration',
    body: 'OpenAI skill extraction added with keyword fallback. Counterfactual reasoning engine built. 50-resume evaluation corpus constructed.',
    side: 'left' as const,
  },
  {
    period: '2026 Q2',
    title: 'Production Ready',
    body: 'Frontend completed in Next.js 16 with full insights dashboard. Pair-ranking accuracy reached 94.42% on adversarial evaluation corpus.',
    side: 'right' as const,
  },
];

const TECH_TAGS = ['React', 'Next.js', 'FastAPI', 'MongoDB', 'Tailwind CSS', 'REST API', 'AI / OpenAI'];

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-accent-green/30 bg-accent-green/5 text-accent-green font-mono text-xs px-3 py-1 rounded-full mb-6">
      <Sparkles size={11} />
      {children}
    </span>
  );
}

export default function AboutPage() {
  return (
    <div className="bg-bg-base">

      {/* Hero */}
      <section className="bg-radial-hero py-20 text-center border-b border-border-dim">
        <div className="max-w-4xl mx-auto px-6">
          <Pill>Our Story</Pill>
          <h1 className="font-bold text-4xl sm:text-5xl text-text-primary mb-5 tracking-tight">
            About <span className="text-gradient-green">ResumeMatch</span>
          </h1>
          <p className="text-text-secondary text-base max-w-2xl mx-auto leading-relaxed">
            We&apos;re on a mission to make intelligent, explainable job matching accessible to every
            candidate — eliminating the guesswork and opacity of black-box recruitment tools.
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-bg-surface py-10 border-b border-border-dim">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            {[
              { value: '50+', label: 'Evaluation Resumes', color: 'text-accent-green' },
              { value: '94%', label: 'Pair-Ranking Accuracy', color: 'text-accent-blue' },
              { value: '200+', label: 'Skill Actions', color: 'text-accent-amber' },
              { value: '4-Layer', label: 'AI Pipeline', color: 'text-accent-purple' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className={`font-bold text-3xl ${stat.color} font-mono`}>{stat.value}</p>
                <p className="text-text-secondary text-sm font-medium mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-5">
          <div className="bg-bg-surface border border-border-dim rounded-2xl p-7 hover:border-border-bright transition-colors">
            <div className="w-11 h-11 rounded-xl bg-accent-green/10 border border-accent-green/30 flex items-center justify-center mb-5">
              <Target size={20} className="text-accent-green" />
            </div>
            <h2 className="text-text-primary font-semibold text-xl mb-3">Our Mission</h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              To empower every job seeker with AI-powered skill gap analysis — providing transparent
              matching scores, explainable results, and actionable improvement paths so candidates
              always know exactly where they stand and how to grow.
            </p>
          </div>
          <div className="bg-bg-surface border border-accent-green/30 rounded-2xl p-7 hover:border-accent-green/50 transition-colors relative overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none opacity-50"
              style={{
                background:
                  'radial-gradient(ellipse 80% 60% at 100% 0%, rgba(0, 229, 160, 0.06), transparent 60%)',
              }}
            />
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-accent-green/10 border border-accent-green/30 flex items-center justify-center mb-5">
                <Eye size={20} className="text-accent-green" />
              </div>
              <h2 className="text-text-primary font-semibold text-xl mb-3">Our Vision</h2>
              <p className="text-text-secondary text-sm leading-relaxed">
                A world where no candidate is unfairly screened out by keyword filters. We envision a
                trusted platform connecting job seekers with opportunities through graph-based
                reasoning, semantic similarity, and honest counterfactual feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-bg-surface border-y border-border-dim">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <Pill>What We Stand For</Pill>
          <h2 className="font-bold text-3xl text-text-primary mb-3 tracking-tight">Our Core Values</h2>
          <p className="text-text-secondary text-sm mb-12 max-w-xl mx-auto">
            The principles that guide every decision we make at ResumeMatch.
          </p>
          <div className="grid sm:grid-cols-2 gap-5 text-left">
            {VALUES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="bg-bg-elevated border border-border-dim rounded-2xl p-6 hover:border-accent-green/30 transition-all card-lift"
              >
                <div className="w-10 h-10 rounded-xl bg-accent-green/10 border border-accent-green/30 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-accent-green" />
                </div>
                <h3 className="text-text-primary font-semibold mb-2 text-base">{title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey / Timeline */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Pill>Our Journey</Pill>
          <h2 className="font-bold text-3xl text-text-primary mb-3 tracking-tight">How We Got Here</h2>
          <p className="text-text-secondary text-sm mb-14 max-w-xl mx-auto">
            From a final-year project idea to a production AI recruitment platform.
          </p>

          <div className="relative">
            <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-px bg-linear-to-b from-transparent via-border-bright to-transparent" />
            <div className="space-y-12">
              {TIMELINE.map(({ period, title, body, side }) => (
                <div key={period} className="relative flex items-start">
                  {side === 'left' ? (
                    <>
                      <div className="flex-1 text-right pr-8">
                        <p className="text-accent-green font-mono text-xs mb-1.5 font-medium">{period}</p>
                        <h3 className="text-text-primary font-semibold mb-1.5 text-base">{title}</h3>
                        <p className="text-text-secondary text-sm leading-relaxed">{body}</p>
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-accent-green border-4 border-bg-base mt-1.5 shadow-glow-green" />
                      <div className="flex-1 pl-8" />
                    </>
                  ) : (
                    <>
                      <div className="flex-1 pr-8" />
                      <div className="absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-accent-green border-4 border-bg-base mt-1.5 shadow-glow-green" />
                      <div className="flex-1 text-left pl-8">
                        <p className="text-accent-green font-mono text-xs mb-1.5 font-medium">{period}</p>
                        <h3 className="text-text-primary font-semibold mb-1.5 text-base">{title}</h3>
                        <p className="text-text-secondary text-sm leading-relaxed">{body}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Behind the Project */}
      <section className="bg-bg-surface py-20 text-center border-y border-border-dim">
        <div className="max-w-4xl mx-auto px-6">
          <Pill>The Developer</Pill>
          <h2 className="font-bold text-3xl text-text-primary mb-3 tracking-tight">Behind the Project</h2>
          <p className="text-text-secondary text-sm mb-12 max-w-xl mx-auto">
            ResumeMatch is a final-year undergraduate project — designed, built, and deployed
            entirely by one developer.
          </p>

          <div className="max-w-lg mx-auto bg-bg-elevated border border-border-dim rounded-2xl p-7 shadow-soft">
            <div className="relative inline-block mb-5">
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-full blur-xl opacity-50"
                style={{
                  background:
                    'radial-gradient(circle, rgba(79, 142, 247, 0.4) 0%, transparent 70%)',
                }}
              />
              <div className="relative w-20 h-20 rounded-full bg-linear-to-br from-accent-blue/30 to-accent-blue/10 border border-accent-blue/30 flex items-center justify-center font-mono font-bold text-accent-blue text-2xl mx-auto">
                JH
              </div>
            </div>
            <p className="text-text-primary font-semibold mb-1 text-lg">Jaith Sandiv Hemachandra</p>
            <p className="text-accent-green font-mono text-xs mb-5">
              Full-Stack Developer — Final Year Project
            </p>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              This platform was conceived, designed, and developed solely by me as my final year
              project. I handled every layer — UI/UX design, Next.js frontend/backend,
              MongoDB database, FASTAPI, AI integration, and deployment — with the goal
              of building something genuinely useful for job seekers in Sri Lanka and beyond.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {TECH_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-xs px-2.5 py-1 rounded-md border border-border-dim bg-bg-surface text-text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(0, 229, 160, 0.05), transparent 60%)',
          }}
        />
        <div className="relative max-w-2xl mx-auto px-6">
          <h2 className="font-bold text-3xl text-text-primary mb-4 tracking-tight">
            Ready to find your <span className="text-gradient-green">perfect match</span>?
          </h2>
          <p className="text-text-secondary text-base mb-8">
            Upload your resume and get instant AI-powered skill gap analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-1.5 bg-accent-green text-bg-base font-semibold px-6 py-3 rounded-lg hover:brightness-110 transition-all shadow-glow-green/0 hover:shadow-glow-green"
            >
              Browse Jobs
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center border border-border-bright text-text-secondary px-6 py-3 rounded-lg hover:border-accent-green/40 hover:text-accent-green transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
