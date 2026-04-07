

# Switch TAM/SAM/SOM to Customer Counts & Add Remaining Customers

## Summary
Display TAM, SAM, and SOM as **customer counts** (not dollar values) across both the overview dashboard and segment cards. Add "remaining customers" data everywhere relevant.

## Changes

### 1. Overview Dashboard (`src/pages/MarketModel.tsx`)

**Aggregated stats cards (lines 167-213):**
- **Total TAM**: Show `formatNumber(totalTamCustomers)` instead of `formatCurrency(totalTam)`. Add new `totalTamCustomers` to aggregated reducer (sum of `seg.tam_customers || seg.population || 0`).
- **Total SAM**: Show `formatNumber(totalSamCustomers)` instead of `formatCurrency(totalSam)`. Add `totalSamCustomers` to reducer.
- **Total SOM**: Show `formatNumber(totalSomCustomers)` (already tracked). Remove the dollar-formatted line.
- **Market Penetration**: Already correct (customer-based). Add remaining: `totalSomCustomers - totalCustomers`.
- Change icons from `DollarSign` to `Users` for TAM/SAM/SOM cards.

**Segment Coverage Bar Chart (lines 259-290):**
- Change bar data from `TAM: m.tam_value` / `Revenue` to `TAM: seg.tam_customers` / `Acquired: seg.current_customers` / `Remaining: tam_customers - current_customers`.
- Update Y-axis formatter from `formatCurrency` to `formatNumber`.

**Pie Chart (lines 109-112):**
- Change `value: m.tam_value` to `value: seg.tam_customers || seg.population || 0` so distribution is by customer count.
- Update tooltip formatter from `formatCurrency` to `formatNumber`.

**Revenue Performance card (lines 217-228):**
- Keep this as currency (it's explicitly about revenue). Add remaining customers line: `Remaining: {formatNumber(totalTamCustomers - totalCustomers)} customers to cover`.

### 2. Segment Cards (`src/components/market/SegmentCard.tsx`)

**TAM/SAM/SOM grid (lines 117-133):**
- Show customer counts as the **primary** bold number, move dollar values to secondary.
- TAM: bold `formatNum(seg.tam_customers)`, sub `formatVal(metrics.tam_value)`
- SAM: bold `formatNum(seg.sam_customers)`, sub `formatVal(metrics.sam_value)`
- SOM: bold `formatNum(metrics.som_customers)`, sub `formatVal(metrics.som_value)`

**Remaining Opportunity (lines 155-164):**
- Already shows remaining customers and revenue — keep as-is. Compute remaining based on TAM customers instead of SOM: `remainingCustomers = Math.max(0, (seg.tam_customers || 0) - (seg.current_customers || 0))`.

### 3. Metrics computation (`src/hooks/useMarketSegments.ts`)

- Add `tam_customers` and `sam_customers` to the return of `computeSegmentMetrics` so they're accessible without reaching into the raw segment. This ensures consistent fallback logic.

## Files to Modify

| File | Changes |
|---|---|
| `src/hooks/useMarketSegments.ts` | Return `tam_customers` and `sam_customers` from `computeSegmentMetrics` |
| `src/pages/MarketModel.tsx` | Switch overview cards, pie chart, bar chart to customer counts; add remaining customers |
| `src/components/market/SegmentCard.tsx` | Swap primary/secondary display in TAM/SAM/SOM grid; update remaining calc to TAM-based |

