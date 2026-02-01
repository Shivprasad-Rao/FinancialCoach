export const KEYWORD_MAP: Record<string, string[]> = {
    'Food & Dining': ['restaurant', 'cafe', 'coffee', 'burger', 'pizza', 'starbucks', 'mcdonalds', 'sushi', 'taco', 'eat', 'dinner', 'lunch', 'breakfast'],
    'Housing': ['rent', 'mortgage', 'utilities', 'electric', 'water', 'gas', 'pg&e', 'internet', 'comcast', 'at&t'],
    'Transportation': ['uber', 'lyft', 'gas', 'shell', 'chevron', 'parking', 'train', 'bus', 'clipper', 'bart', 'mta', 'fuel'],
    'Shopping': ['amazon', 'target', 'walmart', 'clothing', 'shoes', 'electronics', 'best buy', 'nike', 'zara'],
    'Entertainment': ['netflix', 'spotify', 'hulu', 'disney', 'cinema', 'movie', 'ticket', 'game', 'steam', 'playstation', 'nintendo'],
    'Health & Fitness': ['gym', 'pharmacy', 'doctor', 'dentist', 'fitness', 'cvs', 'walgreens', 'hospital'],
    'Income': ['payroll', 'salary', 'deposit', 'transfer', 'refund', 'venmo cashed out'],
};

export function categorizeTransaction(description: string): string {
    const lowerDesc = description.toLowerCase();

    for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
        if (keywords.some(keyword => lowerDesc.includes(keyword))) {
            return category;
        }
    }

    return 'Other';
}
