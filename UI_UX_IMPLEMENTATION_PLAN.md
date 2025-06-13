# UI/UX Implementation Plan: Free vs Paid User Experience

## Project Structure

### Phase 1: Foundation (High Priority)

1. **Persistent Upgrade Banner**

   - Component: `components/upgrade-banner.tsx`
   - Hooks: `hooks/use-upgrade-banner.ts`
   - Styles: Tailwind with smooth animations

2. **Premium Visual Identity**

   - Update: `components/layout/sidebar.tsx`
   - Update: `components/layout/header.tsx`
   - New: `components/premium-badge.tsx`
   - Theme adjustments for premium feel

3. **Enhanced Model Selector**

   - Update: `components/chat/model-selector.tsx`
   - New: `components/model-tooltip.tsx`
   - Add usage statistics and comparisons

4. **Battery Widget in Chat**
   - New: `components/chat/chat-battery-widget.tsx`
   - Update: `app/c/[id]/page.tsx`
   - Real-time usage tracking

### Phase 2: Conversion & Retention (Medium Priority)

5. **Smart Conversion Triggers**

   - New: `lib/conversion-triggers.ts`
   - New: `hooks/use-conversion-tracking.ts`
   - Database tracking for trigger events

6. **Premium Dashboard**

   - New: `app/dashboard/page.tsx`
   - New: `components/dashboard/usage-analytics.tsx`
   - New: `components/dashboard/model-performance.tsx`

7. **Conversation Templates**
   - New: `components/templates/template-selector.tsx`
   - New: `lib/conversation-templates.ts`
   - Database schema updates

### Phase 3: Advanced Features (Low Priority)

8. **Advanced Search**

   - New: `components/search/advanced-search.tsx`
   - Update search API endpoints

9. **Export Functionality**
   - New: `components/export/export-dialog.tsx`
   - New: `lib/export-formats.ts`

## Implementation Guidelines

### Design Principles

1. **Subtlety**: Upgrade prompts should be helpful, not annoying
2. **Value**: Always show what users gain, not what they lack
3. **Consistency**: Maintain design language throughout
4. **Performance**: No negative impact on app speed
5. **Accessibility**: All features must be keyboard accessible

### Color Scheme

- **Free Users**: Current colors with subtle upgrade hints
- **Paid Users**:
  - Primary: Premium purple gradient (#8B5CF6 to #7C3AED)
  - Accent: Gold highlights (#F59E0B)
  - Borders: Subtle gradient borders
  - Backgrounds: Slightly darker for premium feel

### Testing Requirements

After each implementation:

1. Run `npm run typecheck`
2. Run `npm run lint`
3. Test responsive design (mobile, tablet, desktop)
4. Test both free and paid user flows
5. Verify no console errors
6. Check accessibility with keyboard navigation

### Git Workflow

1. Implement feature
2. Test thoroughly
3. Run type checker and linter
4. Fix any issues
5. Commit with descriptive message
6. Move to next feature

## Success Criteria

- [ ] All components render without errors
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Responsive on all screen sizes
- [ ] Smooth animations and transitions
- [ ] Clear visual hierarchy
- [ ] Improved conversion metrics
