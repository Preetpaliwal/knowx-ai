# StudyMET Brutalist Terminal Redesign - Implementation Plan

## ✅ Completed So Far

1. **`frontend/app/globals.css`** - Complete brutalist design system
2. **`frontend/components/Sidebar.tsx`** - Terminal-style sidebar with tick counter

## 🎨 Design System Reference


### Core Visual Language
- **Background**: Pure black (#0a0a0a) with grid pattern
- **Cards**: Dark gray (#111111) with 2px hard borders
- **Typography**: Monospace font (Courier New)
- **Colors**: 
  - Terminal Green: #00ff41
  - Cyan: #00d9ff
  - Yellow: #ffdd00
  - Red: #ff0055
- **Shadows**: Hard offset shadows (4px 4px) with no blur
- **Borders**: 2px solid, no rounded corners
- **Text**: Uppercase labels, tracking-widest
- **Animations**: Minimal, pulse effects only

### Component Patterns
```css
/* Card Example */
background: #111111;
border: 2px solid #222222;
box-shadow: 4px 4px 0 rgba(0,255,65,0.1);

/* Button Example */
border: 2px solid #00ff41;
color: #00ff41;
text-transform: uppercase;
letter-spacing: 0.1em;
box-shadow: 3px 3px 0 rgba(0,255,65,0.3);

/* Terminal Text */
font-family: 'Courier New', monospace;
font-size: 11-13px;
letter-spacing: 0.05em;
```

## 📋 Remaining Files to Redesign

### Priority 1 - Core Layout Components

#### 1. `frontend/components/Header.tsx`
**Current**: Clean white header with search
**Target**: Terminal-style header with status indicators

```tsx
// Redesign to:
- Black background with green border
- Status badges (ONLINE, SYSTEM_OK)
- Tick counter display
- Monospace font
- Hard-edged mobile menu button
```

### Priority 2 - All Page Components

#### 2. `frontend/app/page.tsx` (Home/Dashboard)
**Changes Needed**:
- Replace ambient-glow with grid pattern
- Convert saas-cards to terminal-cards
- Change StatCard backgrounds to dark with green accents
- Add terminal window chrome to sections
- Monospace all text
- Green glow on metrics numbers
- Section headers with `// SECTION:` prefix

#### 3. `frontend/app/notes/page.tsx`
**Changes Needed**:
- Dark cards with 2px borders
- Upload button styled as terminal-btn
- Note cards with hard shadows
- File type badges with terminal style
- Grid layout with consistent spacing
- Status indicators (PDF, DOCX, TXT)

#### 4. `frontend/app/chat/page.tsx`
**Changes Needed**:
- Terminal window style for chat interface
- Message bubbles as terminal blocks
- Input field with terminal-input class
- Send button as terminal-btn
- Chat history with monospace font
- Timestamp with terminal formatting

#### 5. `frontend/app/quiz/page.tsx`
**Changes Needed**:
- Quiz builder in terminal window
- Options as terminal buttons
- Progress bar with terminal-progress
- Results screen with metric displays
- Question cards with hard borders
- Answer review in terminal style

#### 6. `frontend/app/revision/page.tsx`
**Changes Needed**:
- Task cards with status badges
- Calendar with terminal grid
- Timer display with metric-display class
- Priority indicators (HIGH, MED, LOW)
- Session tracker with hard borders

#### 7. `frontend/app/settings/page.tsx`
**Changes Needed**:
- Settings sections with section-header
- Toggle switches styled as terminal UI
- Input fields with terminal-input
- Save button as terminal-btn
- Dark form controls

#### 8. `frontend/app/profile/page.tsx`
**Changes Needed**:
- Profile card with terminal window chrome
- Stats display with metric-display
- Avatar as terminal block
- Activity feed in terminal style

#### 9. `frontend/app/competition/page.tsx`
**Changes Needed**:
- Competition hub with terminal windows
- Join code input as terminal-input
- Participant list with status badges
- Live updates ticker style
- Leaderboard with hard borders

### Priority 3 - Modal and Utility Components

#### 10. `frontend/components/ChatWindow.tsx`
**Terminal window component**

#### 11. `frontend/components/UploadNotesModal.tsx`
**Terminal-styled modal**

#### 12. `frontend/components/CreateLiveQuizModal.tsx`
**Terminal-styled quiz creation**

#### 13. `frontend/components/NoteCard.tsx`
**Hard-edged note display**

#### 14. `frontend/components/StatCard.tsx`
**Metrics display with green glow**

#### 15. `frontend/components/MessageBubble.tsx`
**Terminal chat messages**

## 🔧 Implementation Steps

### Step 1: Update Utility Classes (DONE ✅)
- globals.css with terminal design system
- Brutalist card, button, input styles
- Grid pattern background
- Terminal window chrome

### Step 2: Redesign Sidebar (DONE ✅)
- Terminal header with tick counter
- Navigation with border-left indicators
- Status bar with system stats
- Profile dropdown terminal style

### Step 3: Update Header Component
```tsx
// Add to Header.tsx
<header className="border-b-2 border-[#1a1a1a] bg-[#0a0a0a] p-4">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <span className="text-[10px] font-bold text-[#00ff41] tracking-widest">
        // STUDYMATE_AI_SYSTEM
      </span>
      <div className="status-badge">
        ONLINE
      </div>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-[#666666] font-mono">
        LATENCY: 4.2ms
      </span>
    </div>
  </div>
</header>
```

### Step 4: Update All Page Layouts
**Template for each page:**

```tsx
<div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-mono">
  <div className="max-w-[1400px] mx-auto p-6 space-y-6">
    {/* Section Header */}
    <div className="section-header">
      {pageName}
    </div>

    {/* Content Cards */}
    <div className="terminal-card p-6">
      {/* Content */}
    </div>
  </div>
</div>
```

### Step 5: Update Button Patterns
**Replace all instances:**

Old:
```tsx
className="pill-btn-emerald"
className="pill-btn-outline"
```

New:
```tsx
className="terminal-btn"
className="terminal-btn-secondary"
```

### Step 6: Update Card Patterns
**Replace all instances:**

Old:
```tsx
className="saas-card"
className="study-card"
```

New:
```tsx
className="terminal-card"
```

### Step 7: Update Input Patterns
**Replace all instances:**

Old:
```tsx
className="rounded-xl border border-slate-200 px-4 py-3"
```

New:
```tsx
className="terminal-input"
```

### Step 8: Add Status Indicators
**Throughout app:**

```tsx
<div className="status-badge">
  ACTIVE
</div>
```

### Step 9: Update Typography
**Headers:**
```tsx
className="text-[10px] font-bold tracking-widest uppercase text-[#00ff41]"
```

**Body:**
```tsx
className="text-[13px] font-mono text-[#e0e0e0]"
```

**Metrics:**
```tsx
className="metric-display"
```

### Step 10: Add Terminal Window Chrome
**For major sections:**

```tsx
<div className="terminal-window">
  <div className="terminal-window-title">
    MODULE_NAME.SYS
  </div>
  <div className="p-6">
    {/* Content */}
  </div>
</div>
```

## 🎯 Quick Reference: Class Mappings

| Old Class | New Class | Purpose |
|-----------|-----------|---------|
| `saas-card` | `terminal-card` | Cards |
| `pill-btn-emerald` | `terminal-btn` | Primary buttons |
| `pill-btn-outline` | `terminal-btn-secondary` | Secondary buttons |
| `rounded-xl` | Remove (use `border-radius: 0`) | No rounded corners |
| `text-emerald-600` | `text-[#00ff41]` | Accent color |
| `bg-white` | `bg-[#111111]` | Card backgrounds |
| `text-slate-900` | `text-[#e0e0e0]` | Primary text |
| `text-slate-500` | `text-[#666666]` | Muted text |
| `shadow-lg` | `shadow-[4px_4px_0_rgba(0,255,65,0.1)]` | Hard shadows |

## 📱 Responsive Behavior

The brutalist design maintains consistency across breakpoints:

```tsx
// Mobile: Same hard edges, smaller spacing
className="p-3 md:p-6"

// Typography scales minimally
className="text-[11px] md:text-[13px]"

// Grid patterns remain visible
// Borders stay 2px solid
// Shadows reduce to 3px on mobile
```

## ⚡ Performance Notes

- **Grid pattern**: CSS-only, no performance impact
- **Monospace fonts**: System fonts, fast load
- **Hard shadows**: More performant than blur
- **No animations**: Except pulse (low cost)

## 🧪 Testing Checklist

After implementing each page:

- [ ] Background is pure black
- [ ] All cards have 2px borders
- [ ] Text is monospace
- [ ] Buttons have hard shadows
- [ ] No rounded corners anywhere
- [ ] Green accent (#00ff41) used consistently
- [ ] Section headers have `//` prefix
- [ ] Status badges show correctly
- [ ] Grid pattern visible
- [ ] Responsive on mobile

## 🚀 Deployment

No configuration changes needed:
- CSS is self-contained
- No new dependencies
- Works with existing Tailwind
- Backend unchanged

## 📝 Notes

- This redesign preserves ALL functionality
- Only visual changes, no logic modifications
- Database and API untouched
- Existing features maintained
- Responsive design preserved
- Accessibility maintained (high contrast)

## 🎨 Color Palette Reference

```css
/* Backgrounds */
--bg-primary: #0a0a0a;
--bg-secondary: #111111;
--bg-elevated: #1a1a1a;

/* Borders */
--border-primary: #222222;
--border-accent: #00ff41;

/* Text */
--text-primary: #e0e0e0;
--text-secondary: #999999;
--text-muted: #666666;

/* Accents */
--accent-green: #00ff41;
--accent-cyan: #00d9ff;
--accent-yellow: #ffdd00;
--accent-red: #ff0055;
```

## ✨ Design Principles

1. **No blur effects** - All shadows are hard-edged
2. **No gradients** - Except for background grid
3. **No animations** - Except pulse on status indicators
4. **Uppercase labels** - Technical/terminal aesthetic
5. **Monospace everywhere** - Courier New primary font
6. **High contrast** - Accessibility-first
7. **Grid-based** - Consistent spacing (8px base)
8. **Terminal chrome** - Window-style containers
9. **Status indicators** - Real-time system feel
10. **Hard edges** - Zero border-radius

---

**Status**: Redesign in progress
**Completed**: 2/15 core files (globals.css, Sidebar.tsx)
**Remaining**: 13 major components + pages
**Est. Time**: 2-3 hours for complete redesign
