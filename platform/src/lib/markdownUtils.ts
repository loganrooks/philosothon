/**
 * Parses the theme descriptions markdown file to extract philosopher lists for a specific theme.
 * @param markdownContent The full content of the markdown file.
 * @param themeTitle The title of the theme to extract lists for.
 * @returns An object containing arrays of philosopher names for analytic and continental traditions.
 */
export function parseThemeMarkdown(markdownContent: string, themeTitle: string): { analytic: string[], continental: string[] } {
  const analytic: string[] = [];
  const continental: string[] = [];

  // Escape theme title for regex and find the theme section
  const escapedTitle = themeTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const themeRegex = new RegExp(`^## ${escapedTitle}\\s*$`, 'm');
  const themeMatch = markdownContent.match(themeRegex);

  if (!themeMatch || typeof themeMatch.index === 'undefined') {
    console.warn(`Markdown parser: Theme section not found for title: "${themeTitle}"`);
    return { analytic, continental };
  }

  // Find the start of the next theme section or end of file
  const nextThemeRegex = /^## /m;
  let endOfSectionIndex = markdownContent.length;
  const nextThemeMatch = markdownContent.substring(themeMatch.index + themeMatch[0].length).match(nextThemeRegex);
  if (nextThemeMatch &amp;&amp; typeof nextThemeMatch.index !== 'undefined') {
    endOfSectionIndex = themeMatch.index + themeMatch[0].length + nextThemeMatch.index;
  }

  const themeSectionContent = markdownContent.substring(themeMatch.index, endOfSectionIndex);

  // Function to extract list items between two markers
  const extractListItems = (content: string, startMarker: string, endMarker?: string): string[] => {
    const list: string[] = [];
    const startRegex = new RegExp(`^\\*\\*${startMarker}:\\*\\*\\s*$`, 'm');
    const startMatch = content.match(startRegex);

    if (!startMatch || typeof startMatch.index === 'undefined') {
      console.warn(`Markdown parser: Start marker "${startMarker}" not found for theme: "${themeTitle}"`);
      return list;
    }

    let listStartIndex = startMatch.index + startMatch[0].length;

    // Find the end of the list (next bold marker or end of section)
    let listEndIndex = content.length;
    const nextBoldMarkerRegex = /^\*\*.+:\*\*\s*$/m;
    const nextBoldMatch = content.substring(listStartIndex).match(nextBoldMarkerRegex);
    if (nextBoldMatch &amp;&amp; typeof nextBoldMatch.index !== 'undefined') {
       // Check if an explicit endMarker was provided and if this match is it
       if (endMarker) {
         const endRegex = new RegExp(`^\\*\\*${endMarker}:\\*\\*\\s*$`, 'm');
         if (content.substring(listStartIndex + nextBoldMatch.index).match(endRegex)) {
            listEndIndex = listStartIndex + nextBoldMatch.index;
         }
         // If not the end marker, search for the next bold marker *after* this one
         else {
            const searchAfterCurrent = listStartIndex + nextBoldMatch.index + nextBoldMatch[0].length;
            const subsequentBoldMatch = content.substring(searchAfterCurrent).match(nextBoldMarkerRegex);
            if (subsequentBoldMatch &amp;&amp; typeof subsequentBoldMatch.index !== 'undefined') {
                listEndIndex = searchAfterCurrent + subsequentBoldMatch.index;
            }
         }
       } else {
         // If no end marker specified, the next bold marker ends the list
         listEndIndex = listStartIndex + nextBoldMatch.index;
       }
    }


    const listContent = content.substring(listStartIndex, listEndIndex);

    // Extract bullet points
    const listItemRegex = /^\s*-\s*(.+)\s*$/gm;
    let match;
    while ((match = listItemRegex.exec(listContent)) !== null) {
      // Extract the text, trim whitespace, and potentially remove trailing notes in parentheses
      const rawItem = match[1].trim();
      // Simple removal of trailing parenthesis content for now
      const cleanedItem = rawItem.replace(/\s+\(.+\)$/, '').trim();
      list.push(cleanedItem);
    }

    return list;
  };

  // Extract lists
  const analyticList = extractListItems(themeSectionContent, 'Analytic Tradition', 'Continental Tradition');
  const continentalList = extractListItems(themeSectionContent, 'Continental Tradition');

  return { analytic: analyticList, continental: continentalList };
}