// Fuzzy Match: Every char of the query must be in the string sequencially
export function isFuzzyMatch(str: string, query: string) {
    if (!query) return true;
    let strIdx = 0, queryIdx = 0;
    while (strIdx < str.length && queryIdx < query.length) {
        if (str[strIdx] === query[queryIdx]) queryIdx++;
        strIdx++;
    }
    return queryIdx === query.length;
}

// Highlight the chars in text that match chars in query
export function highlightMatch(text: string, query: string) {
    if (!query) return text;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    const idx = lowerText.indexOf(lowerQuery);
    if (idx !== -1) {
        const before = text.substring(0, idx);
        const match = text.substring(idx, idx + query.length);
        const after = text.substring(idx + query.length);
        return `${before}<span style="color: #4ade80; font-weight: 600;">${match}</span>${after}`;
    }

    let result = '';
    let qIdx = 0;
    for (let i = 0; i < text.length; i++) {
        if (qIdx < lowerQuery.length && text[i].toLowerCase() === lowerQuery[qIdx]) {
            result += `<span style="color: #4ade80; font-weight: 600;">${text[i]}</span>`;
            qIdx++;
        } else {
            result += text[i];
        }
    }
    return result;
}
