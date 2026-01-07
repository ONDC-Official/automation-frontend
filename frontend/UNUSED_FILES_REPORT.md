# Unused Files Report - Frontend Directory

Generated on: 2024-12-19

## Summary

This report identifies potentially unused files in the `frontend/src` directory. Files were analyzed by checking import statements across the codebase.

**Total files analyzed:** 229  
**Potentially unused files:** 16

---

## Verified Unused Files

### Components

#### FlowShared Components

- `components/FlowShared/schema-guide.tsx` - SchemaGuide component not imported anywhere

#### Registry Components

- `components/registry-components/EditableListSection.tsx` - EditableListSection component not imported
- `components/registry-components/uri-section.tsx` - UriSection component not imported

#### UI Forms

- `components/ui/forms/antd-form-input.tsx` - AntdFormInput component not imported
- `components/ui/forms/form-checkbox.tsx` - FormCheckbox component not imported (note: there's a different `checkbox.tsx` that IS used)
- `components/ui/forms/multi-select.tsx` - MultiSelect component not imported (string "multiselect" appears but not the component)

#### UI Components

- `components/ui/grid-bg.tsx` - GridBg component not imported
- `components/ui/side-bar-header.tsx` - SidebarHeader component not imported

#### UI Mini Components

- `components/ui/mini-components/flow-details.tsx` - FlowDetails component not imported
- `components/ui/mini-components/spinner.tsx` - Spinner component not imported (CSS class "spinner" exists but not this component)
- `components/ui/mini-components/watermark.tsx` - Watermark component not imported

### Constants

- `constants/grocery.tsx` - Grocery constants file not imported (grocery categories are hardcoded in `categories.tsx` instead)

### Pages

#### Flow Shared Pages

- `pages/flow-shared/render-flows.tsx` - Duplicate of `components/FlowShared/render-flows.tsx` (the component version is used)
- `pages/flow-shared/report.tsx` - ReportPage component not imported (report functionality exists in render-flows.tsx)

### Services

- `services/index.ts` - Service index file not used (services are imported directly from individual files)

### Styles

- `styles/base-tailwinds.tsx` - Base tailwinds file not imported

---

## Files That Appear Unused But Are Actually Used

The following files were flagged by the analysis script but are actually used:

- `components/Layout/index.tsx` - **USED** (imported in `App.tsx`)

---

## Recommendations

1. **Review before deletion:** Some files might be:
   - Planned for future use
   - Used in ways not detected by static analysis (e.g., dynamic imports, string-based references)
   - Part of a feature that's temporarily disabled

2. **Check for duplicates:**
   - `pages/flow-shared/render-flows.tsx` appears to be a duplicate of `components/FlowShared/render-flows.tsx`
   - Consider consolidating if both are not needed

3. **Verify component usage:**
   - Some components like `FormCheckbox`, `MultiSelect` might be used via string references or dynamic imports
   - Check if these are part of form configuration systems

4. **Constants consolidation:**
   - `constants/grocery.tsx` might be replaced by hardcoded values in `categories.tsx`
   - Consider if grocery constants should be imported instead

---

## How to Verify

Before deleting any file, verify:

1. Search for the component/function name across the codebase
2. Check for dynamic imports: `import()`, `require()`
3. Check configuration files that might reference these components
4. Check if files are used in tests (if test files exist)
5. Check git history to see if files were recently added for a feature

---

## Script Used

The analysis was performed using a custom Node.js script that:

- Scans all `.ts` and `.tsx` files in `src/`
- Extracts import statements (including path aliases)
- Traces transitive imports through index files
- Identifies files that are never imported
