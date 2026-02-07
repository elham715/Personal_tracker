import React, { useState, useMemo } from 'react';
import { ChevronDown, BookOpen, Sparkles, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════════════════════
   ATOMIC HABITS MANUAL — full structured content
   ═══════════════════════════════════════════════════════════════════════ */

interface ManualSection {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  gradient: string;     // card header gradient
  accent: string;       // text accent
  accentBg: string;     // pill / tag bg
  dotColor: string;     // bullet dot
  content: ContentBlock[];
}

type ContentBlock =
  | { type: 'text'; value: string }
  | { type: 'heading'; value: string }
  | { type: 'quote'; value: string; author?: string }
  | { type: 'list'; items: string[] }
  | { type: 'comparison'; left: { title: string; items: string[]; bad?: boolean }; right: { title: string; items: string[]; bad?: boolean } }
  | { type: 'steps'; items: { title: string; desc: string }[] }
  | { type: 'example'; before: string; after: string }
  | { type: 'keypoint'; value: string }
  | { type: 'divider' };

/* ═══════════════════════════════════════════════════════════════════════
   100 ORIGINAL HABIT QUOTES — one shown per day, rotating daily
   ═══════════════════════════════════════════════════════════════════════ */
const HABIT_QUOTES: string[] = [
  'Your future is hidden inside today\'s habits.',
  'Small habits quietly shape big destinies.',
  'Discipline is simply habit repeated daily.',
  'Motivation starts; habits sustain.',
  'Success becomes easy when habits become automatic.',
  'Habits turn effort into identity.',
  'What you repeat, you become.',
  'Good habits compound; bad ones accumulate interest too.',
  'Habits decide your default direction in life.',
  'Consistency beats intensity every time.',
  'Habits are votes for the person you\'re becoming.',
  'You don\'t rise to goals — you fall to habits.',
  'Daily actions whisper louder than big intentions.',
  'A tiny habit today prevents regret tomorrow.',
  'Habit strength grows from repetition, not perfection.',
  'Excellence is just refined habit.',
  'Your routine predicts your results.',
  'Habits make success feel normal.',
  'Change habits, change trajectory.',
  'Automatic good choices create extraordinary lives.',
  'Habits are the architecture of character.',
  'Identity grows where habits repeat.',
  'Strong habits reduce weak moments.',
  'The hardest habits become the easiest with time.',
  'Habit first, confidence later.',
  'Systems create habits; habits create results.',
  'Progress hides inside repetition.',
  'Consistency quietly outperforms talent.',
  'Habits simplify decision-making.',
  'The brain loves what it practices often.',
  'Habit change is identity change in disguise.',
  'Habits are the silent drivers of behavior.',
  'Make habits simple and they\'ll stay.',
  'Environment shapes habits more than willpower.',
  'Good habits reduce stress before stress arrives.',
  'Habit strength comes from ease, not struggle.',
  'Repetition removes resistance.',
  'Habits convert chaos into order.',
  'A habit delayed is often a habit abandoned.',
  'Tiny improvements accumulate into transformation.',
  'Habits build resilience without drama.',
  'Daily structure frees mental energy.',
  'A habit once built becomes self-sustaining.',
  'Small discipline prevents big problems.',
  'Habits are invisible until results appear.',
  'Change the routine, change the outcome.',
  'Habit consistency creates emotional stability.',
  'Routine protects focus.',
  'Habits outlast motivation.',
  'Habit quality determines life quality.',
  'You shape habits, then habits shape you.',
  'Habit repetition builds quiet confidence.',
  'Long-term success loves boring routines.',
  'Habits eliminate unnecessary struggle.',
  'Identity solidifies through repeated action.',
  'Habits reduce the cost of success.',
  'A system of habits beats bursts of effort.',
  'Habit friction predicts failure or success.',
  'Good habits feel small but act huge.',
  'The best habits require minimal willpower.',
  'Habit momentum beats sudden inspiration.',
  'Daily structure protects long-term dreams.',
  'Habits grow stronger when tied to identity.',
  'A clear system makes habits inevitable.',
  'Habit tracking strengthens commitment.',
  'Missing once is human; quitting is habit loss.',
  'Habits thrive in supportive environments.',
  'Consistent effort removes fear of failure.',
  'Habit loops govern most behavior.',
  'Automatic actions free creative thinking.',
  'Habits turn ambition into routine.',
  'Every habit casts a vote for your future.',
  'Repetition builds mastery invisibly.',
  'Habits stabilize performance under stress.',
  'Small habits reduce big regrets.',
  'Strong habits require fewer decisions.',
  'Good routines simplify complex goals.',
  'Habit quality reflects self-respect.',
  'Habits protect you when motivation fades.',
  'Habit discipline grows self-trust.',
  'Consistent action builds silent power.',
  'Habits determine baseline performance.',
  'Improvement hides in ordinary repetition.',
  'Habit alignment creates inner peace.',
  'Long-term consistency beats short-term brilliance.',
  'Habits make progress predictable.',
  'Structure liberates creativity.',
  'Habit refinement leads to mastery.',
  'Good habits reduce emotional volatility.',
  'Habit commitment beats temporary excitement.',
  'Routine builds reliability.',
  'Habits create stability during chaos.',
  'A habit mastered becomes effortless.',
  'Habit direction matters more than speed.',
  'Progress begins where consistency starts.',
  'Habit patience multiplies results.',
  'Repetition rewires potential into ability.',
  'Habit alignment produces clarity.',
  'A disciplined habit life compounds success.',
  'Ultimately, your habits quietly write your story.',
];

const MANUAL_SECTIONS: ManualSection[] = [
  /* ── 1. The Power of Tiny Changes ── */
  {
    id: 'tiny', emoji: '🔬', title: 'The Power of Tiny Changes',
    subtitle: 'Why 1% daily improvement creates extraordinary results',
    gradient: 'from-violet-500 to-purple-600',
    accent: 'text-violet-600', accentBg: 'bg-violet-50', dotColor: 'bg-violet-400',
    content: [
      { type: 'quote', value: 'Habits are the compound interest of self-improvement.', author: 'James Clear' },
      { type: 'text', value: 'Big success doesn\'t come from big changes. It comes from small daily improvements compounding over time. Consistency always beats intensity.' },
      { type: 'keypoint', value: '1% better every day = 37x improvement in one year. 1% worse every day = decline to nearly zero.' },
      { type: 'heading', value: 'The Compounding Effect' },
      { type: 'list', items: [
        'Tiny habits feel insignificant on any single day',
        'Over weeks and months they accumulate into massive results',
        'The trajectory matters more than any single action',
        'Success is the product of daily habits — not once-in-a-lifetime transformations',
      ]},
      { type: 'heading', value: 'Plateau of Latent Potential' },
      { type: 'text', value: 'Results are delayed. You may feel like nothing is happening — but habits compound invisibly first. Like an ice cube sitting in a cold room, nothing visible happens until the temperature crosses 32°F, then everything melts at once.' },
      { type: 'keypoint', value: 'The work is never wasted. It\'s just being stored. Breakthrough moments come after long periods of seemingly invisible progress.' },
    ],
  },

  /* ── 2. Systems vs Goals ── */
  {
    id: 'systems', emoji: '⚙️', title: 'Systems Beat Goals',
    subtitle: 'Why your daily process matters more than the destination',
    gradient: 'from-blue-500 to-indigo-600',
    accent: 'text-blue-600', accentBg: 'bg-blue-50', dotColor: 'bg-blue-400',
    content: [
      { type: 'quote', value: 'You do not rise to the level of your goals. You fall to the level of your systems.' },
      { type: 'comparison',
        left: { title: '🎯 Goal-Based', items: ['Lose 10 kg', 'Write a book', 'Get top GPA', 'Temporary motivation', 'Delays happiness', 'Focuses on outcome'], bad: true },
        right: { title: '⚙️ System-Based', items: ['Exercise daily + healthy eating', 'Write 500 words every day', 'Daily focused study routine', 'Sustainable momentum', 'Enjoy the process', 'Focuses on daily actions'] },
      },
      { type: 'heading', value: 'Why Systems Win' },
      { type: 'steps', items: [
        { title: 'Focus on Control', desc: 'You can control effort, routine, and environment. You can\'t control external results.' },
        { title: 'Reduce Cognitive Load', desc: 'Habits run automatically, eliminating decision fatigue and procrastination.' },
        { title: 'Prevent Burnout', desc: 'Systems emphasize sustainable pace instead of exhausting goal-chasing.' },
        { title: 'Shape Identity', desc: 'Daily studying → "I am a learner." Daily exercise → "I am fit." Systems build who you are.' },
      ]},
      { type: 'keypoint', value: 'Goal = Compass (shows direction). System = Engine (drives progress). Without the engine, the compass is useless.' },
      { type: 'heading', value: 'The Goal Completion Trap' },
      { type: 'list', items: [
        'Everyone has similar goals — results differ because systems differ',
        'After achieving a goal, motivation drops and old habits return',
        'Goal mindset: "I\'ll be happy when X" → chronic dissatisfaction',
        'System mindset: "I enjoy improving daily" → continuous fulfillment',
      ]},
    ],
  },

  /* ── 3. Identity-Based Habits ── */
  {
    id: 'identity', emoji: '🧅', title: 'Identity-Based Habit Change',
    subtitle: 'The Onion Model — change from the inside out',
    gradient: 'from-emerald-500 to-teal-600',
    accent: 'text-emerald-600', accentBg: 'bg-emerald-50', dotColor: 'bg-emerald-400',
    content: [
      { type: 'text', value: 'This is the deepest and most important idea in Atomic Habits. Habit change happens in layers — like peeling an onion. Real transformation starts from identity (core), not from outcomes (surface).' },
      { type: 'heading', value: 'The Three Layers of Change' },
      { type: 'steps', items: [
        { title: '🔴 Outer Layer — Outcomes', desc: 'What you achieve. Lose weight, get good grades, earn money. This is where most people focus first — but it\'s the weakest layer.' },
        { title: '🟡 Middle Layer — Processes', desc: 'What you do daily. Your routines, study habits, exercise schedule. More powerful because it creates consistency and skill.' },
        { title: '🟢 Core Layer — Identity', desc: 'Who you believe you are. "I am a reader." "I am disciplined." "I am an athlete." This is the most powerful driver of lasting change.' },
      ]},
      { type: 'example',
        before: '"I want to exercise" → forced, temporary, willpower-based',
        after: '"I am someone who trains daily" → natural, automatic, identity-driven',
      },
      { type: 'heading', value: 'Direction of Change Matters' },
      { type: 'comparison',
        left: { title: '❌ Outside-In', items: ['Outcome → Process → Identity', 'Weak and unstable', '"I want to read 20 books"', 'Temporary motivation'], bad: true },
        right: { title: '✅ Inside-Out', items: ['Identity → Process → Outcome', 'Strong and lasting', '"I am a reader"', 'Behavior follows naturally'] },
      },
      { type: 'keypoint', value: 'Every habit is a vote for the type of person you wish to become. No single instance will transform your identity, but as the votes build up, so does the evidence of your new identity.' },
      { type: 'heading', value: 'How to Apply' },
      { type: 'steps', items: [
        { title: 'Decide Who You Want to Be', desc: 'Ask: "Who is the type of person who could get the outcome I want?"' },
        { title: 'Prove It With Small Wins', desc: 'Each small action is a vote. One workout = vote for "athlete." One study session = vote for "learner."' },
        { title: 'Let Outcomes Follow', desc: 'When identity is solid, results come automatically. No forcing needed.' },
      ]},
    ],
  },

  /* ── 4. The Habit Loop ── */
  {
    id: 'loop', emoji: '🔄', title: 'How Habits Actually Work',
    subtitle: 'The Cue → Craving → Response → Reward loop',
    gradient: 'from-amber-500 to-orange-600',
    accent: 'text-amber-600', accentBg: 'bg-amber-50', dotColor: 'bg-amber-400',
    content: [
      { type: 'text', value: 'Every habit — good or bad — follows the same neurological loop. Understanding this loop gives you the power to design, modify, or break any habit.' },
      { type: 'steps', items: [
        { title: '1. Cue', desc: 'A trigger that tells your brain to initiate a behavior. It predicts a reward. Example: phone notification sound.' },
        { title: '2. Craving', desc: 'The motivational force. You don\'t crave the habit itself, but the change in state it delivers. Example: curiosity about the notification.' },
        { title: '3. Response', desc: 'The actual habit — the thought or action you perform. It only occurs if you\'re sufficiently motivated. Example: pick up phone and check.' },
        { title: '4. Reward', desc: 'The end goal. Rewards satisfy cravings and teach the brain which actions are worth remembering. Example: social connection / information.' },
      ]},
      { type: 'keypoint', value: 'Without the first three steps, behavior doesn\'t occur. Without the fourth step, behavior won\'t be repeated. Cue triggers craving, craving motivates response, response provides reward, reward satisfies craving and becomes associated with the cue.' },
      { type: 'heading', value: 'The Four Laws (Preview)' },
      { type: 'text', value: 'James Clear maps each stage to a practical law:' },
      { type: 'list', items: [
        'Cue → Make It Obvious',
        'Craving → Make It Attractive',
        'Response → Make It Easy',
        'Reward → Make It Satisfying',
      ]},
    ],
  },

  /* ── 5. First Law: Make It Obvious ── */
  {
    id: 'law1', emoji: '👁️', title: 'First Law — Make It Obvious',
    subtitle: 'Control your cues and environment to trigger good habits',
    gradient: 'from-sky-500 to-blue-600',
    accent: 'text-sky-600', accentBg: 'bg-sky-50', dotColor: 'bg-sky-400',
    content: [
      { type: 'text', value: 'The most common reasons good habits fail is not lack of motivation — it\'s lack of clarity and visibility. If you don\'t see the cue, you won\'t start the habit.' },
      { type: 'heading', value: 'Strategy 1: Implementation Intentions' },
      { type: 'text', value: 'Be specific. Don\'t just say "I\'ll exercise more." Specify when, where, and how.' },
      { type: 'example',
        before: '"I\'ll study more this week"',
        after: '"I will study Machine Learning at 7 PM at my desk for 45 minutes"',
      },
      { type: 'heading', value: 'Strategy 2: Habit Stacking' },
      { type: 'text', value: 'Link a new habit to an existing one. After [CURRENT HABIT], I will [NEW HABIT].' },
      { type: 'list', items: [
        'After I pour my morning coffee → I read 2 pages',
        'After I sit at my desk → I write my to-do list',
        'After I eat lunch → I take a 10-minute walk',
        'After I brush my teeth → I do 1 minute of meditation',
      ]},
      { type: 'heading', value: 'Strategy 3: Environment Design' },
      { type: 'keypoint', value: 'Environment is the invisible hand that shapes human behavior. Every habit is initiated by a cue, and we are more likely to notice cues that stand out.' },
      { type: 'list', items: [
        'Want to read? Keep a book on your pillow',
        'Want to drink water? Fill bottles and place them around the house',
        'Want to practice guitar? Put it in the middle of the room',
        'Make good cues visible. Make bad cues invisible.',
      ]},
    ],
  },

  /* ── 6. Second Law: Make It Attractive ── */
  {
    id: 'law2', emoji: '✨', title: 'Second Law — Make It Attractive',
    subtitle: 'Dopamine-driven strategies to crave good habits',
    gradient: 'from-pink-500 to-rose-600',
    accent: 'text-pink-600', accentBg: 'bg-pink-50', dotColor: 'bg-pink-400',
    content: [
      { type: 'text', value: 'The more attractive an action is, the more habit-forming it becomes. Dopamine drives craving — and craving drives action. It\'s not the reward itself but the anticipation of the reward that gets us to act.' },
      { type: 'heading', value: 'Temptation Bundling' },
      { type: 'text', value: 'Pair something you need to do with something you enjoy doing.' },
      { type: 'list', items: [
        'Only listen to favorite podcasts while at the gym',
        'Only watch your show while ironing or folding clothes',
        'Only eat at your favorite restaurant after a productive work session',
        'Only check social media after completing study blocks',
      ]},
      { type: 'heading', value: 'The Power of Social Influence' },
      { type: 'text', value: 'We adopt habits from three groups:' },
      { type: 'steps', items: [
        { title: 'The Close', desc: 'Family, friends, partner — we imitate those nearest to us. Choose your inner circle wisely.' },
        { title: 'The Many', desc: 'The broader culture and society. We follow the majority to fit in.' },
        { title: 'The Powerful', desc: 'We imitate people we admire — role models, mentors, leaders.' },
      ]},
      { type: 'keypoint', value: 'Join a culture where your desired behavior is the normal behavior. When belonging is tied to the habit, the habit becomes deeply attractive.' },
    ],
  },

  /* ── 7. Third Law: Make It Easy ── */
  {
    id: 'law3', emoji: '⚡', title: 'Third Law — Make It Easy',
    subtitle: 'Reduce friction and master the art of showing up',
    gradient: 'from-lime-500 to-green-600',
    accent: 'text-green-600', accentBg: 'bg-green-50', dotColor: 'bg-green-400',
    content: [
      { type: 'text', value: 'The most effective form of learning is practice, not planning. Focus on taking action, not just being in motion. The key is to reduce friction so the habit becomes the path of least resistance.' },
      { type: 'heading', value: 'The 2-Minute Rule' },
      { type: 'keypoint', value: 'When you start a new habit, it should take less than 2 minutes to do. The point is to master the art of showing up.' },
      { type: 'list', items: [
        '"Read before bed" → Read one page',
        '"Run daily" → Put on your running shoes',
        '"Study" → Open your textbook',
        '"Meditate" → Sit and close your eyes for 60 seconds',
        '"Eat healthy" → Eat one piece of fruit',
      ]},
      { type: 'text', value: 'A habit must be established before it can be improved. Start tiny, then scale.' },
      { type: 'heading', value: 'Reduce Activation Energy' },
      { type: 'list', items: [
        'Prepare your environment the night before',
        'Lay out gym clothes beside your bed',
        'Keep the book on your desk / pillow',
        'Pre-load study materials in browser tabs',
        'Automate with apps, schedules, and default decisions',
      ]},
      { type: 'heading', value: 'Habit Shaping & Scaling' },
      { type: 'text', value: 'Start tiny, then gradually expand. Never jump drastically.' },
      { type: 'steps', items: [
        { title: 'Phase 1: Master showing up', desc: 'Meditate for 1 minute daily' },
        { title: 'Phase 2: Increase gradually', desc: 'Meditate for 5 minutes daily' },
        { title: 'Phase 3: Standard practice', desc: 'Meditate for 10 minutes daily' },
        { title: 'Phase 4: Advanced', desc: 'Meditate for 20 minutes daily' },
      ]},
    ],
  },

  /* ── 8. Fourth Law: Make It Satisfying ── */
  {
    id: 'law4', emoji: '🏆', title: 'Fourth Law — Make It Satisfying',
    subtitle: 'Immediate rewards ensure repetition',
    gradient: 'from-yellow-400 to-amber-500',
    accent: 'text-amber-600', accentBg: 'bg-amber-50', dotColor: 'bg-amber-400',
    content: [
      { type: 'text', value: 'We are more likely to repeat a behavior when the experience is satisfying. The human brain prioritizes immediate rewards over delayed ones. The Cardinal Rule: What is immediately rewarded is repeated. What is immediately punished is avoided.' },
      { type: 'heading', value: 'Habit Tracking' },
      { type: 'keypoint', value: '"What gets measured gets improved." Tracking creates a visual cue, an inherent reward (seeing progress), and keeps you honest about your consistency.' },
      { type: 'list', items: [
        'Check off days on a calendar or in this app',
        'The streak itself becomes the reward',
        'Visual progress is deeply motivating',
        'Don\'t break the chain — but if you do, never miss twice',
      ]},
      { type: 'heading', value: 'The "Never Miss Twice" Rule' },
      { type: 'text', value: 'Missing once is an accident. Missing twice is the start of a new (bad) habit. The first mistake is never the one that ruins you — it\'s the spiral of repeated mistakes that follows. Recovery speed matters more than the streak length.' },
      { type: 'heading', value: 'Reward Strategies' },
      { type: 'list', items: [
        'Give yourself a small reward immediately after completing the habit',
        'Use this app\'s streak counter as your visual scoreboard',
        'Create a "habit savings jar" — transfer ₹50 each time you complete your habit',
        'Celebrate tiny wins — even a mental "nice!" counts',
      ]},
    ],
  },

  /* ── 9. Breaking Bad Habits ── */
  {
    id: 'break', emoji: '🚫', title: 'Breaking Bad Habits',
    subtitle: 'Invert the Four Laws to eliminate unwanted behaviors',
    gradient: 'from-red-500 to-rose-600',
    accent: 'text-red-600', accentBg: 'bg-red-50', dotColor: 'bg-red-400',
    content: [
      { type: 'text', value: 'To break a bad habit, invert every law. Make the cue invisible, the craving unattractive, the action difficult, and the reward unsatisfying.' },
      { type: 'steps', items: [
        { title: 'Make It Invisible', desc: 'Remove cues. Hide junk food. Delete social media apps. Unsubscribe from distracting channels. Out of sight, out of mind.' },
        { title: 'Make It Unattractive', desc: 'Reframe your mindset. Highlight the downsides. Smoking = lung damage, not relaxation. Scrolling = wasted potential, not entertainment.' },
        { title: 'Make It Difficult', desc: 'Increase friction. Use website blockers. Leave your phone in another room. Add a 10-second delay before bad habits.' },
        { title: 'Make It Unsatisfying', desc: 'Add accountability. Tell a friend your commitment. Create a habit contract with penalties. Make the cost of the bad habit immediate and visible.' },
      ]},
      { type: 'keypoint', value: 'Bad habits are autocatalytic — they produce the feelings they try to numb. Stress eating creates more guilt, which creates more stress eating. Break the cycle by making the first step invisible or impossible.' },
    ],
  },

  /* ── 10. Advanced Strategies ── */
  {
    id: 'advanced', emoji: '🧠', title: 'Advanced Strategies for Mastery',
    subtitle: 'Goldilocks rule, boredom tolerance, identity evolution & reflection',
    gradient: 'from-indigo-500 to-violet-600',
    accent: 'text-indigo-600', accentBg: 'bg-indigo-50', dotColor: 'bg-indigo-400',
    content: [
      { type: 'heading', value: 'The Goldilocks Rule' },
      { type: 'text', value: 'Humans experience peak motivation when working on tasks at the edge of their current abilities — not too easy, not too hard. About 4% beyond your current ability is the sweet spot.' },
      { type: 'heading', value: 'Boredom Is the Greatest Threat' },
      { type: 'quote', value: 'The greatest threat to success is not failure but boredom. We get bored with habits because they stop delighting us. The only way to become excellent is to be endlessly fascinated by doing the same thing over and over.' },
      { type: 'heading', value: 'Environment Over Motivation' },
      { type: 'text', value: 'Your surroundings dictate behavior more than willpower. Design spaces specifically for focus, health, and productivity. One space, one use — don\'t mix relaxation zones with work zones.' },
      { type: 'heading', value: 'The Tribe Effect' },
      { type: 'text', value: 'You adopt the habits of your friends, community, and role models. Choose circles intentionally. Join groups where your desired behavior is the default.' },
      { type: 'heading', value: 'Habit Automation' },
      { type: 'list', items: [
        'Use technology and scheduled actions to reduce decisions',
        'Set up default choices that align with your goals',
        'Automate savings, meals, schedules, and routines',
        'Less decision = more consistency',
      ]},
      { type: 'heading', value: 'Reflection & Review' },
      { type: 'text', value: 'Regularly evaluate what works, what fails, and what needs adjustment. James Clear recommends an Annual Review (what went well?) and an Integrity Report (are you living by your values?).' },
      { type: 'heading', value: 'Identity Evolution' },
      { type: 'keypoint', value: 'Your identity is not fixed. It evolves with your habits. Each repetition says: "This is who I am." Protect that identity, but hold it loosely enough to grow beyond it.' },
    ],
  },

  /* ── 11. The Complete Habit-Building Blueprint ── */
  {
    id: 'blueprint', emoji: '🗺️', title: 'Complete Habit-Building Blueprint',
    subtitle: 'Step-by-step roadmap from zero to lasting transformation',
    gradient: 'from-cyan-500 to-blue-600',
    accent: 'text-cyan-600', accentBg: 'bg-cyan-50', dotColor: 'bg-cyan-400',
    content: [
      { type: 'text', value: 'Here\'s the full sequential process to build any habit from scratch and make it permanent:' },
      { type: 'steps', items: [
        { title: 'Step 1 — Choose Your Identity', desc: 'Ask: "Who do I want to become?" Not: "What do I want to achieve?" Write it down.' },
        { title: 'Step 2 — Pick ONE Tiny Habit', desc: 'Start with the smallest version (2-minute rule). One push-up, one page, one minute of meditation.' },
        { title: 'Step 3 — Stack It', desc: 'Attach it to an existing routine. "After [current habit], I will [new habit]."' },
        { title: 'Step 4 — Design Your Environment', desc: 'Make the cue obvious and remove friction. Prepare everything the night before.' },
        { title: 'Step 5 — Make It Attractive', desc: 'Bundle with something enjoyable. Join a community that supports the habit.' },
        { title: 'Step 6 — Track It', desc: 'Use this app! Check off each day. The streak becomes the reward.' },
        { title: 'Step 7 — Never Miss Twice', desc: 'If you miss a day, immediately get back on track. Recovery matters more than perfection.' },
        { title: 'Step 8 — Scale Gradually', desc: 'Once the habit is automatic (usually 2-4 weeks), slowly increase duration or intensity.' },
        { title: 'Step 9 — Reflect Monthly', desc: 'Review what\'s working, what\'s not, and adjust. Are you becoming the person you want to be?' },
        { title: 'Step 10 — Protect Your Identity', desc: 'Each repetition votes for your new identity. Guard it. Let it evolve. This is who you are now.' },
      ]},
      { type: 'divider' },
      { type: 'quote', value: 'Habits are not about having something. They are about becoming someone. Every action is a vote for the type of person you wish to become.', author: 'James Clear' },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

const Habits: React.FC = () => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [showManual, setShowManual] = useState(false);

  const dailyQuote = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const idx = dayOfYear % HABIT_QUOTES.length;
    return { text: HABIT_QUOTES[idx], number: idx + 1 };
  }, []);

  const toggleSection = (id: string) =>
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));

  /* ── render a content block ── */
  const renderBlock = (block: ContentBlock, idx: number, sec: ManualSection) => {
    switch (block.type) {
      case 'text':
        return <p key={idx} className="text-[13px] text-gray-600 leading-relaxed mb-3">{block.value}</p>;

      case 'heading':
        return <h4 key={idx} className={`text-[13px] font-bold ${sec.accent} mt-4 mb-2 flex items-center gap-1.5`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sec.dotColor} inline-block`} />{block.value}
        </h4>;

      case 'quote':
        return (
          <div key={idx} className={`${sec.accentBg} border-l-[3px] ${sec.dotColor.replace('bg-', 'border-')} rounded-r-xl px-4 py-3 my-3`}>
            <p className="text-[13px] italic text-gray-700 leading-relaxed">"{block.value}"</p>
            {block.author && <p className={`text-[11px] font-semibold ${sec.accent} mt-1`}>— {block.author}</p>}
          </div>
        );

      case 'list':
        return (
          <ul key={idx} className="space-y-1.5 mb-3 ml-1">
            {block.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] text-gray-600 leading-relaxed">
                <span className={`w-1.5 h-1.5 rounded-full ${sec.dotColor} mt-[7px] shrink-0`} />
                {item}
              </li>
            ))}
          </ul>
        );

      case 'comparison':
        return (
          <div key={idx} className="grid grid-cols-2 gap-2 my-3">
            {[block.left, block.right].map((side, si) => (
              <div key={si} className={`rounded-xl p-3 ${si === 0 ? 'bg-red-50/60 border border-red-100' : 'bg-emerald-50/60 border border-emerald-100'}`}>
                <p className={`text-[11px] font-bold mb-2 ${si === 0 ? 'text-red-600' : 'text-emerald-600'}`}>{side.title}</p>
                <ul className="space-y-1">
                  {side.items.map((it, ii) => (
                    <li key={ii} className="text-[11px] text-gray-600 flex items-start gap-1">
                      <span className={`text-[10px] mt-0.5 ${si === 0 ? 'text-red-400' : 'text-emerald-400'}`}>{si === 0 ? '✕' : '✓'}</span>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );

      case 'steps':
        return (
          <div key={idx} className="space-y-2 my-3">
            {block.items.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${sec.gradient} flex items-center justify-center shrink-0 mt-0.5`}>
                  <span className="text-[10px] font-bold text-white">{i + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-gray-800">{step.title}</p>
                  <p className="text-[11.5px] text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'example':
        return (
          <div key={idx} className="my-3 space-y-1.5">
            <div className="bg-red-50/60 rounded-lg px-3 py-2 border border-red-100">
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Before</span>
              <p className="text-[12px] text-gray-600 mt-0.5">{block.before}</p>
            </div>
            <div className="bg-emerald-50/60 rounded-lg px-3 py-2 border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">After</span>
              <p className="text-[12px] text-gray-600 mt-0.5">{block.after}</p>
            </div>
          </div>
        );

      case 'keypoint':
        return (
          <div key={idx} className={`${sec.accentBg} rounded-xl p-3 my-3 border ${sec.dotColor.replace('bg-', 'border-')}/30`}>
            <p className="text-[12.5px] font-semibold text-gray-800 leading-relaxed flex items-start gap-2">
              <span className="text-[14px] shrink-0">💡</span>
              {block.value}
            </p>
          </div>
        );

      case 'divider':
        return <hr key={idx} className="my-4 border-gray-100" />;

      default:
        return null;
    }
  };

  return (
    <div className="page-container max-w-lg lg:max-w-4xl mx-auto pb-8">
      <div className="flex items-center justify-between pt-4 mb-4 animate-fade-up">
        <h1 className="text-[22px] font-bold text-gray-900">Habits</h1>
        <Link to="/habit-manager" className="text-[13px] text-indigo-600 font-medium">+ New</Link>
      </div>

      {/* ── Daily Habit Quote ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 rounded-2xl p-6 lg:p-8 shadow-xl shadow-indigo-900/20 animate-fade-up">
        {/* Decorative background elements */}
        <div className="absolute top-4 right-5 text-white/[0.04] text-[100px] lg:text-[140px] font-serif leading-none select-none pointer-events-none">"</div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-20 h-20 bg-pink-500/10 rounded-full blur-2xl" />

        {/* Top label */}
        <div className="flex items-center gap-2.5 mb-5 relative z-10">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] text-indigo-300/70 uppercase tracking-[0.2em] font-bold">Daily Wisdom</p>
            <p className="text-[11px] text-white/40">Quote #{dailyQuote.number} of {HABIT_QUOTES.length}</p>
          </div>
        </div>

        {/* Quote icon */}
        <div className="mb-4 relative z-10">
          <Quote size={22} className="text-indigo-400/40" />
        </div>

        {/* Quote text */}
        <p className="text-[18px] lg:text-[22px] font-semibold text-white/95 leading-relaxed relative z-10 tracking-[-0.01em]">
          {dailyQuote.text}
        </p>

        {/* Bottom accent */}
        <div className="mt-6 flex items-center gap-3 relative z-10">
          <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
          <span className="text-[10px] text-white/30 font-medium flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
            New quote every day
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-white/20 to-transparent" />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
         📘 ATOMIC HABITS MANUAL
         ══════════════════════════════════════════════════════════════ */}
      <div className="mt-6 animate-fade-up" style={{ animationDelay: '120ms' }}>
        {/* Toggle button */}
        <button
          onClick={() => setShowManual(prev => !prev)}
          className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-indigo-200/50 active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <BookOpen size={20} className="text-white" />
          </div>
          <div className="flex-1 text-left">
            <h2 className="text-[15px] font-bold">Atomic Habits — Complete Manual</h2>
            <p className="text-[11px] text-white/70 mt-0.5">
              The science of building habits that last forever
            </p>
          </div>
          <ChevronDown size={18} className={`text-white/60 transition-transform duration-300 ${showManual ? 'rotate-180' : ''}`} />
        </button>

        {showManual && (
          <div className="mt-3 space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            {/* Hero quote */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-center lg:col-span-2">
              <p className="text-[14px] text-white/90 italic leading-relaxed">
                "You do not rise to the level of your goals.<br />You fall to the level of your systems."
              </p>
              <p className="text-[11px] text-white/50 mt-2 font-medium">— James Clear, Atomic Habits</p>
              <div className="flex justify-center gap-3 mt-4">
                {['🔬 Tiny Changes', '⚙️ Systems', '🧅 Identity', '🔄 Habit Loop'].map((tag, i) => (
                  <span key={i} className="text-[9px] bg-white/10 text-white/70 px-2 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            </div>

            {/* Table of contents */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 lg:col-span-2">
              <h3 className="text-[13px] font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                📑 Contents <span className="text-[10px] text-gray-400 font-normal ml-1">({MANUAL_SECTIONS.length} chapters)</span>
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
                {MANUAL_SECTIONS.map((sec, i) => (
                  <button
                    key={sec.id}
                    onClick={() => toggleSection(sec.id)}
                    className="text-left text-[11.5px] text-gray-500 hover:text-gray-800 flex items-center gap-2 py-1 transition-colors"
                  >
                    <span className="text-[10px] text-gray-300 w-4 text-right font-mono">{i + 1}.</span>
                    <span>{sec.emoji}</span>
                    <span className="truncate">{sec.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sections */}
            {MANUAL_SECTIONS.map((sec, secIdx) => {
              const isOpen = openSections[sec.id];
              return (
                <div key={sec.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  {/* Header */}
                  <button
                    onClick={() => toggleSection(sec.id)}
                    className="w-full text-left"
                  >
                    <div className={`bg-gradient-to-r ${sec.gradient} p-4 flex items-center gap-3`}>
                      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-lg backdrop-blur-sm">
                        {sec.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider">
                          Chapter {secIdx + 1}
                        </p>
                        <h3 className="text-[14px] font-bold text-white truncate">{sec.title}</h3>
                        <p className="text-[11px] text-white/70 mt-0.5 truncate">{sec.subtitle}</p>
                      </div>
                      <ChevronDown size={16} className={`text-white/50 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Content */}
                  {isOpen && (
                    <div className="p-4 animate-scale-in">
                      {sec.content.map((block, bIdx) => renderBlock(block, bIdx, sec))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Ultimate Summary */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-5 text-center shadow-lg shadow-purple-200/50 lg:col-span-2">
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-3">Ultimate Takeaway</p>
              <div className="space-y-2.5 text-left max-w-xs mx-auto">
                {[
                  { n: '1', t: 'Small habits compound into extraordinary results' },
                  { n: '2', t: 'Systems beat goals — focus on process' },
                  { n: '3', t: 'Identity drives lasting behavior change' },
                  { n: '4', t: 'Environment shapes habits more than willpower' },
                  { n: '5', t: 'Make habits obvious, attractive, easy, satisfying' },
                  { n: '6', t: 'Consistency always beats motivation' },
                  { n: '7', t: 'Never miss twice — recovery is everything' },
                  { n: '8', t: 'Improvement is gradual but inevitable' },
                ].map(item => (
                  <div key={item.n} className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                      {item.n}
                    </span>
                    <span className="text-[12px] text-white/90 leading-snug">{item.t}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-white/40 mt-4 italic">
                "Every action is a vote for the type of person you wish to become."
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Habits;
