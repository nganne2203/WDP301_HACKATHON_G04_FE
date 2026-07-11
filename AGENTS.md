# Guideline for AI Agents: Frontend Architecture Rules (Feature-Sliced Design)

This project strictly adheres to **Feature-Sliced Design (FSD)** architecture. All AI coding assistants MUST follow these rules when introducing new UI views or components.

---

## 🏗️ FSD Directory Structure (Slices)

Inside `src/widgets/` (and other slices like `features/`, `entities/`):
```text
widget-name/
  ├── model/
  │   └── use[WidgetName]View.ts      # Business logic, state, queries, and mutations (React Query hooks)
  └── ui/
      ├── [WidgetName]View.tsx        # Thin UI representation (strictly JSX layout)
      └── components/                 # Sub-components exclusive to this widget (optional)
```

---

## 📏 Mandatory Rules for Slices

### 1. Separation of Concerns (Logic vs Layout)
* **❌ Do NOT** place data-fetching `useQuery`/`useMutation` hooks, local filters, or heavy state management directly inside the `ui/` files.
* **✅ DO** extract all queries, states, memoized derivations, and callbacks into a custom hook inside `model/` (e.g., `useMentorTeamsView.ts`). The UI component should only call `const view = use[WidgetName]View()` and render the JSX layout.

### 2. Slices Layer Roles
* **`pages`**: Must stay extremely thin and route-only.
* **`widgets`**: Own screen composition (putting features and entities together into a section of a screen).
* **`features`**: Own user actions, forms, flow logic, and mutation hooks.
* **`entities`**: Represent business models, stores, and simple API requests.
* **`shared`**: Reusable components, hooks, assets, and design system primitives.

### 3. Interactive UI Consistency
* When rendering summary/dashboard cards (like teams, participants, events), **ensure cards are interactive** if detail views exist.
* Wrap cards inside a `<Sheet>` or `<Dialog>` (from `@/shared/ui/sheet` or `@/shared/ui/dialog`) with `cursor-pointer hover:shadow-md transition-shadow` styling. Do not implement static, unclickable cards when the user needs to inspect details.
