import Link from 'next/link';
import { Target, Eye, ShieldCheck, GraduationCap, Network, Heart } from 'lucide-react';

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
    <span className="inline-block border border-border-dim bg-bg-elevated text-text-muted font-mono text-xs px-3 py-1 rounded-full mb-6">
      {children}
    </span>
  );
}

export default function AboutPage() {
  return (
    <div className="bg-bg-base">

      {/* Hero */}
      <section className="bg-bg-surface py-16 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <Pill>Our Story</Pill>
          <h1 className="font-bold text-3xl text-text-primary mb-4">
            About <span className="text-accent-green">ResumeMatch</span>
          </h1>
          <p className="text-text-secondary text-base max-w-2xl mx-auto leading-relaxed">
            We&apos;re on a mission to make intelligent, explainable job matching accessible to every
            candidate — eliminating the guesswork and opacity of black-box recruitment tools.
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-accent-green py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '50+', label: 'Evaluation Resumes' },
              { value: '94%', label: 'Pair-Ranking Accuracy' },
              { value: '200+', label: 'Skill Actions' },
              { value: '4-Layer', label: 'AI Pipeline' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-bold text-2xl text-bg-base font-mono">{stat.value}</p>
                <p className="text-bg-base text-sm font-medium mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-2 gap-6">
          <div className="bg-bg-elevated border border-border-dim rounded-xl p-6">
            <Target size={24} className="text-accent-green mb-4" />
            <h2 className="text-text-primary font-semibold text-xl mb-3">Our Mission</h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              To empower every job seeker with AI-powered skill gap analysis — providing transparent
              matching scores, explainable results, and actionable improvement paths so candidates
              always know exactly where they stand and how to grow.
            </p>
          </div>
          <div className="bg-bg-surface border border-accent-green/30 rounded-xl p-6">
            <Eye size={24} className="text-accent-green mb-4" />
            <h2 className="text-text-primary font-semibold text-xl mb-3">Our Vision</h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              A world where no candidate is unfairly screened out by keyword filters. We envision a
              trusted platform connecting job seekers with opportunities through graph-based
              reasoning, semantic similarity, and honest counterfactual feedback.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-bg-surface">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Pill>What We Stand For</Pill>
          <h2 className="font-bold text-2xl text-text-primary mb-3">Our Core Values</h2>
          <p className="text-text-secondary text-sm mb-10">
            The principles that guide every decision we make at ResumeMatch.
          </p>
          <div className="grid sm:grid-cols-2 gap-5 text-left">
            {VALUES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-bg-elevated border border-border-dim rounded-xl p-5">
                <Icon size={20} className="text-accent-green mb-3" />
                <h3 className="text-text-primary font-semibold mb-2">{title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey / Timeline */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Pill>Our Journey</Pill>
          <h2 className="font-bold text-2xl text-text-primary mb-3">How We Got Here</h2>
          <p className="text-text-secondary text-sm mb-12">
            From a final-year project idea to a production AI recruitment platform.
          </p>

          <div className="relative">
            <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-px bg-border-dim" />
            <div className="space-y-10">
              {TIMELINE.map(({ period, title, body, side }) => (
                <div key={period} className="relative flex items-start">
                  {side === 'left' ? (
                    <>
                      <div className="flex-1 text-right pr-8">
                        <p className="text-accent-green font-mono text-xs mb-1">{period}</p>
                        <h3 className="text-text-primary font-semibold mb-1">{title}</h3>
                        <p className="text-text-secondary text-sm leading-relaxed">{body}</p>
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-accent-green border-2 border-bg-base mt-1.5" />
                      <div className="flex-1 pl-8" />
                    </>
                  ) : (
                    <>
                      <div className="flex-1 pr-8" />
                      <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-accent-green border-2 border-bg-base mt-1.5" />
                      <div className="flex-1 text-left pl-8">
                        <p className="text-accent-green font-mono text-xs mb-1">{period}</p>
                        <h3 className="text-text-primary font-semibold mb-1">{title}</h3>
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
      <section className="bg-bg-surface py-16 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <Pill>The Developer</Pill>
          <h2 className="font-bold text-2xl text-text-primary mb-3">Behind the Project</h2>
          <p className="text-text-secondary text-sm mb-10">
            ResumeMatch is a final-year undergraduate project — designed, built, and deployed
            entirely by one developer.
          </p>

          <div className="max-w-lg mx-auto bg-bg-elevated border border-border-dim rounded-xl p-6">
            <div className="w-16 h-16 rounded-full bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center font-mono font-bold text-accent-blue text-xl mx-auto mb-4">
              JH
            </div>
            <p className="text-text-primary font-semibold mb-1">Jaith Sandiv Hemachandra</p>
            <p className="text-accent-green font-mono text-xs mb-4">
              Full-Stack Developer — Final Year Project
            </p>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              This platform was conceived, designed, and developed solely by me as my final year
              project. I handled every layer — UI/UX design, React frontend, Node.js/Express
              backend, MongoDB database, REST API, AI integration, and deployment — with the goal
              of building something genuinely useful for job seekers in Sri Lanka and beyond.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {TECH_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-xs px-2 py-0.5 rounded border border-border-dim bg-bg-elevated text-text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="font-bold text-2xl text-text-primary mb-3">
            Ready to find your perfect match?
          </h2>
          <p className="text-text-secondary text-sm mb-8">
            Upload your resume and get instant AI-powered skill gap analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="bg-accent-green text-bg-base font-semibold px-6 py-3 rounded-lg hover:brightness-110 transition-all"
            >
              Browse Listings →
            </Link>
            <Link
              href="/contact"
              className="border border-border-bright text-text-secondary px-6 py-3 rounded-lg hover:border-accent-green hover:text-accent-green transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
