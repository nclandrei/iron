# Deload Feature Design

## Overview

Implements automatic deload week scheduling based on Lyle McDonald's recommendations for the Generic Bulking Routine (GBR). Deloads help prevent burnout, allow recovery, and enable continued progression.

## Background (Lyle McDonald's Approach)

From bodyrecomposition.com research:
- Training cycles: 4-6 weeks hard training followed by reduced intensity period
- Trainees often burn out within 6-8 weeks when constantly pushing to failure
- "Blasting and cruising" approach: ~6 weeks intense → 2 weeks reduced
- Volume can be cut by 2/3rds while maintaining intensity to preserve adaptations

## Deload Parameters

### Timing
- **Frequency**: Every 5 weeks of training (simplified from 4-6 week range)
- **Duration**: 1 week

### Volume Reduction
- **Sets**: Reduce to 50% of normal volume (e.g., 3 sets → 1-2 sets per exercise)

### Intensity Reduction
- **Weight**: Use ~75% of normal working weight
- **RPE**: Should feel easy; finish workout feeling better than you started

### What Stays the Same
- Exercise selection (same movements)
- Training frequency (same days per week)
- Rep ranges (same target reps)

## Deload Week Behavior

During a deload week:
1. App displays "Deload Week" indicator
2. Suggested weights automatically reduced to 75%
3. Suggested sets automatically reduced to 50%
4. User can override if desired
5. Week counter resets after deload completes

## Implementation Approach

### Tracking
- Count consecutive training weeks since last deload
- Store `lastDeloadEndDate` and `weeksSinceDeload` in user preferences or workout history

### Triggering
- After completing week 5, prompt user that deload week is recommended
- User can accept, postpone 1 week, or skip

### UI Indicators
- Banner/badge on workout page during deload week
- Different styling for deload suggested weights
- Progress summary shows deload in history

## Example Cycle

| Week | Type | Volume | Intensity |
|------|------|--------|-----------|
| 1 | Normal | 100% | 100% |
| 2 | Normal | 100% | 100% |
| 3 | Normal | 100% | 100% |
| 4 | Normal | 100% | 100% |
| 5 | Normal | 100% | 100% |
| 6 | DELOAD | 50% | 75% |
| 7 | Normal | 100% | 100% |
| ... | ... | ... | ... |

## Sources

- Lyle McDonald, "Periodization for Bodybuilders: Part 1" - bodyrecomposition.com
- Lyle McDonald, "Categories of Weight Training: Part 6" - bodyrecomposition.com
- Lyle McDonald, "Active Rest vs Passive Rest" - bodyrecomposition.com
- Lyle McDonald, "Training Frequency for Mass Gains" - bodyrecomposition.com
