/**
 * Automatic Evidence Item Numbering
 * Format: {CASE}-{TYPE}-{INCREMENT}
 * Example: 2026-001-MOBILE-01, 2026-001-MOBILE-02
 */

// Map item type names to abbreviations
export const TYPE_ABBREVIATIONS: Record<string, string> = {
  'Mobile Phone': 'MOBILE',
  'Hard Drive': 'HDD',
  'USB Drive': 'USB',
  'Laptop': 'LAPTOP',
  'Document': 'DOC',
  'Firearm': 'FIREARM',
  'Currency': 'CASH',
  'Drug Evidence': 'DRUG',
  'SIM Card': 'SIM',
  'Other': 'OTHER',
  // Add more as needed
}

/**
 * Get the next item number for a case + type combination
 */
export function generateItemNumber(
  caseNumber: string,
  typeName: string,
  existingItems: Array<{ item_number: string }>,
  batchIndex: number = 0
): string {
  const typeAbbrev = TYPE_ABBREVIATIONS[typeName] || 'ITEM'
  const prefix = `${caseNumber}-${typeAbbrev}-`
  
  // Find all items for this case + type
  const matchingItems = existingItems.filter(item => 
    item.item_number.startsWith(prefix)
  )
  
  // Extract the increment numbers
  const increments = matchingItems.map(item => {
    const parts = item.item_number.split('-')
    const lastPart = parts[parts.length - 1]
    return parseInt(lastPart, 10) || 0
  })
  
  // Find highest increment
  const maxIncrement = increments.length > 0 ? Math.max(...increments) : 0
  
  // Generate next number (adding batchIndex for multiple items in same transfer)
  const nextIncrement = maxIncrement + 1 + batchIndex
  const paddedIncrement = String(nextIncrement).padStart(2, '0')
  
  return `${prefix}${paddedIncrement}`
}

/**
 * Generate item numbers for a batch of new items
 */
export function generateBatchItemNumbers(
  items: Array<{ case_number: string; item_type_name: string }>,
  existingItems: Array<{ item_number: string }>
): string[] {
  const itemNumbers: string[] = []
  
  // Track increments we've generated in this batch
  const batchCounters: Record<string, number> = {}
  
  for (const item of items) {
    const key = `${item.case_number}-${item.item_type_name}`
    const batchIndex = batchCounters[key] || 0
    
    const itemNumber = generateItemNumber(
      item.case_number,
      item.item_type_name,
      existingItems,
      batchIndex
    )
    
    itemNumbers.push(itemNumber)
    
    // Increment batch counter for this case + type
    batchCounters[key] = batchIndex + 1
    
    // Add generated item to existingItems for next iteration
    existingItems.push({ item_number: itemNumber })
  }
  
  return itemNumbers
}
