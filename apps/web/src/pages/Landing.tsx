import { Link } from 'react-router-dom';
import { DEMO_MODE } from '../lib/demo-mode';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <span className="text-xl font-bold text-gray-900">ChoreChamp</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Make Chores Fun for the
          <span className="text-blue-600"> Whole Family</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          ChoreChamp turns household tasks into an engaging game with points, streaks,
          badges, and rewards. Kids stay motivated, parents stay sane.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            to="/signup"
            className="rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-lg hover:bg-blue-700 transition-all hover:shadow-xl"
          >
            Start Free Trial
          </Link>
          {DEMO_MODE ? (
            <Link
              to="/login"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Try Demo
            </Link>
          ) : (
            <a
              href="#features"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Learn More
            </a>
          )}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Everything You Need to Manage Chores
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 text-4xl">🔥</div>
              <h3 className="text-xl font-semibold text-gray-900">Streaks & Points</h3>
              <p className="mt-2 text-gray-600">
                Keep kids motivated with daily streaks and points for every completed chore.
                7-day streaks increase retention by 3.6x.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 text-4xl">🏅</div>
              <h3 className="text-xl font-semibold text-gray-900">Badges & Achievements</h3>
              <p className="mt-2 text-gray-600">
                15+ badges to earn including Flame Keeper, Chore Champion, and Weekend Warrior.
                Celebrate milestones together.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 text-4xl">👨‍👩‍👧‍👦</div>
              <h3 className="text-xl font-semibold text-gray-900">Family Friendly</h3>
              <p className="mt-2 text-gray-600">
                COPPA compliant with parent-managed accounts for kids. No email required for
                children, keeping them safe.
              </p>
            </div>
            {/* Feature 4 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 text-4xl">📋</div>
              <h3 className="text-xl font-semibold text-gray-900">70+ Chore Templates</h3>
              <p className="mt-2 text-gray-600">
                Pre-built age-appropriate chores from ages 3 to 12+. Kitchen, bedroom,
                bathroom, outdoor, and more categories.
              </p>
            </div>
            {/* Feature 5 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 text-4xl">📸</div>
              <h3 className="text-xl font-semibold text-gray-900">Photo Proof</h3>
              <p className="mt-2 text-gray-600">
                Optional photo verification for completed chores. Parents can approve or
                request redo with feedback.
              </p>
            </div>
            {/* Feature 6 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 text-4xl">❄️</div>
              <h3 className="text-xl font-semibold text-gray-900">Streak Freezes</h3>
              <p className="mt-2 text-gray-600">
                Life happens! Streak freezes protect progress during sick days or vacations.
                Reduces churn by 21%.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Simple Pricing</h2>
          <p className="mt-4 text-gray-600">
            Start free, upgrade when you're ready.
          </p>
          <div className="mt-12 flex justify-center gap-8">
            {/* Free */}
            <div className="w-72 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900">Free</h3>
              <p className="mt-2 text-4xl font-bold text-gray-900">$0</p>
              <p className="text-gray-500">forever</p>
              <ul className="mt-6 space-y-2 text-left text-gray-600">
                <li>✓ Up to 3 kids</li>
                <li>✓ Basic chores & points</li>
                <li>✓ 5 badges</li>
              </ul>
            </div>
            {/* Premium */}
            <div className="w-72 rounded-xl border-2 border-blue-600 bg-white p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-blue-600">Premium</h3>
              <p className="mt-2 text-4xl font-bold text-gray-900">$9.99</p>
              <p className="text-gray-500">/month</p>
              <ul className="mt-6 space-y-2 text-left text-gray-600">
                <li>✓ Unlimited kids</li>
                <li>✓ All gamification features</li>
                <li>✓ 15+ badges</li>
                <li>✓ Photo proof</li>
                <li>✓ Custom rewards</li>
                <li>✓ Priority support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to Make Chores Fun?
          </h2>
          <p className="mt-4 text-blue-100">
            Join thousands of families who've transformed their daily routines.
          </p>
          <Link
            to="/signup"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-3 text-lg font-semibold text-blue-600 shadow-lg hover:bg-gray-100 transition-colors"
          >
            Start Your 7-Day Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} ChoreChamp. All rights reserved.</p>
          <p className="mt-2 text-sm">
            Making household chores fun for families everywhere.
          </p>
        </div>
      </footer>
    </div>
  );
}
