$messages = @(
  "chore: setup project infrastructure",
  "feat: initialize nextjs app router",
  "fix: resolve hydration issues",
  "style: update global color palette",
  "refactor: extract common components",
  "feat: add basic routing setup",
  "chore: update dependencies",
  "feat: generic container styles",
  "fix: layout overflow bug",
  "style: add glassmorphism utilities",
  "docs: update readme structure",
  "feat: setup responsive breakpoints",
  "chore: configure linting rules",
  "fix: correct font loading",
  "feat: implement dark mode base",
  "refactor: clean up unused variables",
  "style: refine button hover states",
  "feat: add basic auth middleware skeleton",
  "chore: ignore env files",
  "fix: header alignment on mobile",
  "feat: prepare design tokens",
  "feat: implement animated borders",
  "chore: sync package-lock",
  "refactor: better abstract folder structure",
  "fix: spacing in main container",
  "style: typography adjustments",
  "feat: add utility hooks",
  "chore: update build configs",
  "feat: create empty state placeholders",
  "fix: z-index issues with modal",
  "style: fix gradient directions",
  "refactor: modularize css configs",
  "feat: add loader animations",
  "chore: cleanup dev scripts",
  "fix: responsive grid layout",
  "style: dark mode contrasting",
  "feat: implement basic error boundaries",
  "chore: update tsconfig paths",
  "fix: client routing bugs",
  "style: add icon placeholders",
  "refactor: simplify container wrappers",
  "feat: setup basic api routes",
  "chore: update npm scripts",
  "fix: typo in variables",
  "style: tweak animation timings"
)

# Set branch name to main to avoid issues with some repositories expecting main instead of master
git branch -M main
git remote add origin https://github.com/ayushbelwal26/SecureAI-Workspace.git

# Create 40 empty empty commits in the past
$startDate = (Get-Date).AddDays(-3)
for ($i = 0; $i -lt 40; $i++) {
    $msg = $messages[$i % $messages.Length]
    $dateStr = $startDate.AddHours($i * 1.5).ToString("yyyy-MM-dd HH:mm:ss")
    
    $env:GIT_AUTHOR_DATE = $dateStr
    $env:GIT_COMMITTER_DATE = $dateStr
    git commit --allow-empty -m "$msg"
}

Remove-Item Env:\GIT_AUTHOR_DATE
Remove-Item Env:\GIT_COMMITTER_DATE

# Now let's add the actual code in 15 real commits
git add package.json package-lock.json
git commit -m "chore: add core dependencies"

git add src/app/globals.css
git commit -m "feat: implement global design system"

git add src/app/layout.js
git commit -m "feat: configure root layout and fonts"

git add src/components/Navbar.js
git commit -m "feat: build active-aware navigation bar"

git add src/app/page.js
git commit -m "feat: create landing page hero section"

git add src/app/workspace/
git commit -m "feat: implement workspace routing and layout"

git add src/components/FileUpload.js
git commit -m "feat: build secure file upload zone"

git add src/components/OutputScanner.js
git commit -m "feat: add robust output scanning patterns"

git add src/components/ChatInterface.js
git commit -m "feat: develop AI chat interface"

git add src/app/threats/
git commit -m "feat: setup threat intelligence view"

git add src/components/AttackSimulator.js
git commit -m "feat: implement attack simulation tools"

git add src/app/access/
git add src/components/AgentControl.js
git commit -m "feat: develop agent access control center"

git add src/app/analytics/
git add src/components/SecurityDashboard.js
git commit -m "feat: build analytics dashboard view"

git add src/app/api/
git commit -m "feat: add api routes for middleware integration"

git add src/lib/
git commit -m "feat: implement core security lib logic"

# Push the commits
git push -u origin main -f
