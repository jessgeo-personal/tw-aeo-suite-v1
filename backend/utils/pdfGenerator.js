const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Brand Colors
const COLORS = {
  primary: '#00D9FF',
  dark: '#1A1D29',
  charcoal: '#2C2C2C',
  lightGray: '#6B7280',
  mediumGray: '#9CA3AF',
  white: '#FFFFFF',
  background: '#F9FAFB',
  border: '#E5E7EB',
  
  // Score colors
  excellentGreen: '#10B981',
  goodCyan: '#00D9FF',
  needsOrange: '#F59E0B',
  criticalRed: '#DC2626',
  
  // Priority badges
  criticalBg: '#FEE2E2',
  criticalText: '#991B1B',
  highBg: '#FED7AA',
  highText: '#9A3412',
  mediumBg: '#DBEAFE',
  mediumText: '#1E40AF',
  lowBg: '#E5E7EB',
  lowText: '#374151'
};

/**
 * Safe nested property access
 */
function safeGet(obj, path, defaultValue = null) {
  try {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj) ?? defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

/**
 * Get color based on score
 */
function getScoreColor(score) {
  if (score >= 80) return COLORS.excellentGreen;
  if (score >= 60) return COLORS.goodCyan;
  if (score >= 40) return COLORS.needsOrange;
  return COLORS.criticalRed;
}

/**
 * Get grade letter
 */
function getGradeLetter(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Get status text
 */
function getStatusText(score) {
  if (score >= 80) return 'EXCELLENT';
  if (score >= 60) return 'GOOD';
  if (score >= 40) return 'NEEDS IMPROVEMENT';
  return 'CRITICAL';
}

/**
 * Get priority badge colors
 */
function getPriorityColors(priority) {
  const p = (priority || 'medium').toLowerCase();
  switch (p) {
    case 'critical': return { bg: COLORS.criticalBg, text: COLORS.criticalText };
    case 'high': return { bg: COLORS.highBg, text: COLORS.highText };
    case 'medium': return { bg: COLORS.mediumBg, text: COLORS.mediumText };
    case 'low': return { bg: COLORS.lowBg, text: COLORS.lowText };
    default: return { bg: COLORS.mediumBg, text: COLORS.mediumText };
  }
}

/**
 * Add page header with logo and page number
 */
function addPageHeader(doc, pageNumber, totalPages, isFirstPage = false) {
  const logoPaths = [
    path.join(__dirname, '../public/thatworkx-logo.jpg'),
    path.join(__dirname, '../public/aeo-thatworkx-logo-jpg.jpg'),
    path.join(__dirname, '../../frontend/public/thatworkx-logo.jpg'),
    path.join(process.cwd(), 'public/thatworkx-logo.jpg')
  ];
  
  let logoPath = null;
  for (const p of logoPaths) {
    if (fs.existsSync(p)) {
      logoPath = p;
      break;
    }
  }
  
  // Logo on first page only
  if (logoPath && isFirstPage) {
    try {
      doc.image(logoPath, 50, 30, { height: 35 });
    } catch (e) {
      console.log('Logo load error:', e.message);
    }
  }
  
  // Page number in footer (not on copyright page)
  if (pageNumber < totalPages) {
    doc.fontSize(8)
       .fillColor(COLORS.mediumGray)
       .text(
         `Page ${pageNumber} of ${totalPages}`,
         50,
         doc.page.height - 30,
         { align: 'right', width: 495 }
       );
  }
}

/**
 * Add title page
 */
function addTitlePage(doc, title, analysisData) {
  const logoPaths = [
    path.join(__dirname, '../public/thatworkx-logo.jpg'),
    path.join(__dirname, '../public/aeo-thatworkx-logo-jpg.jpg'),
    path.join(__dirname, '../../frontend/public/thatworkx-logo.jpg'),
    path.join(process.cwd(), 'public/thatworkx-logo.jpg')
  ];
  
  let logoPath = null;
  for (const p of logoPaths) {
    if (fs.existsSync(p)) {
      logoPath = p;
      break;
    }
  }
  
  // Center logo
  if (logoPath) {
    try {
      doc.image(logoPath, 200, 100, { width: 200 });
    } catch (e) {
      console.log('Logo load error:', e.message);
    }
  }
  
  doc.moveDown(10);
  
  // Title
  doc.fontSize(26)
     .fillColor(COLORS.charcoal)
     .text(title, { align: 'center' });
  
  doc.moveDown(0.5);
  
  // Subtitle
  doc.fontSize(11)
     .fillColor(COLORS.charcoal)
     .text('by thatworkx.', { align: 'center' });
  
  doc.moveDown(3);
  
  // Info card
  const cardY = doc.y;
  const cardWidth = 450;
  const cardX = (612 - cardWidth) / 2;
  
  doc.roundedRect(cardX, cardY, cardWidth, 240, 6)
     .fillAndStroke(COLORS.dark, COLORS.dark);
  
  let yPos = cardY + 25;
  
  // URL
  doc.fontSize(9)
     .fillColor(COLORS.white)
     .text('Analysed URL:', cardX + 20, yPos);
  
  doc.fontSize(10)
     .fillColor(COLORS.white)
     .text(
       safeGet(analysisData, 'url', 'N/A'),
       cardX + 20,
       yPos + 18,
       { width: cardWidth - 40, ellipsis: true }
     );
  
  yPos += 50;
  
  // Two columns
  const col1X = cardX + 20;
  const col2X = cardX + 235;
  
  // Report Created
  doc.fontSize(9)
     .fillColor(COLORS.white)
     .text('Report Created:', col1X, yPos);
  
  doc.fontSize(10)
     .fillColor(COLORS.white)
     .text(
       new Date().toLocaleDateString('en-US', {
         year: 'numeric',
         month: 'short',
         day: 'numeric'
       }),
       col1X,
       yPos + 18
     );
  
  // Analysis ID
  doc.fontSize(9)
     .fillColor(COLORS.white)
     .text('Analysis ID:', col2X, yPos);
  
  const analysisId = safeGet(analysisData, '_id', 'N/A');
  doc.fontSize(10)
     .fillColor(COLORS.white)
     .text(
       analysisId.toString().substring(0, 20),
       col2X,
       yPos + 18
     );
  
  yPos += 55;
  
  // Analysis DateTime
  doc.fontSize(9)
     .fillColor(COLORS.white)
     .text('Analysis DateTime:', col1X, yPos);
  
  const createdAt = safeGet(analysisData, 'createdAt', new Date());
  doc.fontSize(10)
     .fillColor(COLORS.white)
     .text(
       new Date(createdAt).toLocaleString('en-US', {
         year: 'numeric',
         month: 'short',
         day: 'numeric',
         hour: '2-digit',
         minute: '2-digit'
       }),
       col1X,
       yPos + 18
     );
  
  // Overall Score
  doc.fontSize(9)
     .fillColor(COLORS.white)
     .text('Overall Score:', col2X, yPos);
  
  const overallScore = safeGet(analysisData, 'overallScore', 0);
  doc.fontSize(18)
     .fillColor(getScoreColor(overallScore))
     .text(
       `${overallScore}/100`,
       col2X,
       yPos + 15
     );
}

/**
 * Add overall score page
 */
function addOverallScorePage(doc, analysisData) {
  doc.addPage();
  
  doc.fontSize(24)
     .fillColor(COLORS.charcoal)
     .text('Overall AEO Score', { align: 'center' });
  
  doc.moveDown(1);
  
  // Score box
  const overallScore = safeGet(analysisData, 'overallScore', 0);
  const scoreColor = getScoreColor(overallScore);
  const boxY = doc.y;
  
  doc.roundedRect(150, boxY, 312, 120, 8)
     .fillAndStroke(scoreColor, scoreColor);
  
  // Large score
  doc.fontSize(64)
     .fillColor(COLORS.white)
     .text(
       overallScore.toString(),
       0,
       boxY + 20,
       { align: 'center', width: 612 }
     );
  
  // Grade and status
  const grade = getGradeLetter(overallScore);
  const status = getStatusText(overallScore);
  
  doc.fontSize(20)
     .fillColor(COLORS.white)
     .text(
       `Grade: ${grade}`,
       0,
       boxY + 85,
       { align: 'center', width: 612 }
     );
  
  doc.moveDown(2);
  
  doc.fontSize(12)
     .fillColor(COLORS.dark)
     .text(status, { align: 'center' });
  
  doc.moveDown(3);
  
  // Analyzer scores table
  addAnalyzerScoresTable(doc, analysisData);
}

/**
 * Add analyzer scores breakdown table
 */
function addAnalyzerScoresTable(doc, analysisData) {
  doc.fontSize(18)
    .fillColor(COLORS.charcoal)
    .text('Analyzer Scores Breakdown', 50);  // Add x position
  
  doc.moveDown(1.5);
  
  const analyzers = [
    { name: 'Technical Foundation', key: 'technicalFoundation', weight: 25 },
    { name: 'Content Structure', key: 'contentStructure', weight: 25 },
    { name: 'Page-Level E-E-A-T', key: 'pageLevelEEAT', weight: 20 },
    { name: 'Site-Level E-E-A-T', key: 'siteLevelEEAT', weight: 20 },
    { name: 'Query Match Analysis', key: 'queryMatch', weight: 15 },
    { name: 'AI Visibility Assessment', key: 'aiVisibility', weight: 15 }
  ];
  
  const tableX = 50;
  const tableWidth = 512;
  const rowHeight = 40;
  let yPos = doc.y;
  
  // Header row
  doc.rect(tableX, yPos, tableWidth, rowHeight)
     .fillAndStroke(COLORS.dark, COLORS.dark);
  
  doc.fontSize(11)
     .fillColor(COLORS.white)
     .text('Analyzer', tableX + 15, yPos + 14, { width: 260 })
     .text('Weight', tableX + 280, yPos + 14, { width: 70 })
     .text('Score', tableX + 360, yPos + 14, { width: 70 })
     .text('Grade', tableX + 440, yPos + 14, { width: 60 });
  
  yPos += rowHeight;
  
  // Data rows
  analyzers.forEach((analyzer, index) => {
    const data = analysisData[analyzer.key];
    const score = safeGet(data, 'score', null);
    const grade = safeGet(data, 'grade', 'N/A');
    const bgColor = index % 2 === 0 ? COLORS.background : COLORS.white;
    
    doc.rect(tableX, yPos, tableWidth, rowHeight)
       .fillAndStroke(bgColor, COLORS.border);
    
    doc.fontSize(10)
       .fillColor(COLORS.charcoal)
       .text(analyzer.name, tableX + 15, yPos + 14, { width: 260 });
    
    doc.fillColor(COLORS.mediumGray)
       .text(`${analyzer.weight}%`, tableX + 280, yPos + 14, { width: 70 });
    
    // Handle N/A scores
    if (score === null || score === 0 && grade === 'N/A') {
      doc.fillColor(COLORS.mediumGray)
         .text('0/100', tableX + 360, yPos + 14, { width: 70 });
    } else {
      doc.fillColor(getScoreColor(score))
         .text(`${score}/100`, tableX + 360, yPos + 14, { width: 70 });
    }
    
    doc.fillColor(COLORS.charcoal)
       .text(grade, tableX + 440, yPos + 14, { width: 60 });
    
    yPos += rowHeight;
  });
  
  doc.y = yPos + 10;
}

/**
 * Add analyzer detail page
 */
function addAnalyzerDetailPage(doc, analyzerName, analyzerKey, data, weight) {
  doc.addPage();
  
  // Header
  doc.fontSize(22)
     .fillColor(COLORS.charcoal)
     .text(analyzerName);
  
  doc.moveDown(1);
  
  // Score info box
  const score = safeGet(data, 'score', 0);
  const grade = safeGet(data, 'grade', 'N/A');
  
  const infoBoxY = doc.y;
  doc.roundedRect(50, infoBoxY, 512, 60, 6)
     .fillAndStroke(COLORS.background, COLORS.border);
  
  // Three columns
  doc.fontSize(9)
     .fillColor(COLORS.lightGray)
     .text('Weight:', 70, infoBoxY + 15);
  
  doc.fontSize(12)
     .fillColor(COLORS.charcoal)
     .text(`${weight}%`, 70, infoBoxY + 32);
  
  doc.fontSize(9)
     .fillColor(COLORS.lightGray)
     .text('Score:', 220, infoBoxY + 15);
  
  doc.fontSize(12)
     .fillColor(getScoreColor(score))
     .text(`${score}/100`, 220, infoBoxY + 32);
  
  doc.fontSize(9)
     .fillColor(COLORS.lightGray)
     .text('Grade:', 380, infoBoxY + 15);
  
  doc.fontSize(12)
     .fillColor(COLORS.charcoal)
     .text(grade, 380, infoBoxY + 32);
  
  doc.y = infoBoxY + 95;
  
  // Score breakdown
  const details = safeGet(data, 'details', {});
  if (details && Object.keys(details).length > 0 && typeof details === 'object') {
    addScoreBreakdownSection(doc, details);
  }
  
  // Key findings - Display technical details
  const findingsObj = safeGet(data, 'findings', {});

  if (findingsObj && typeof findingsObj === 'object' && Object.keys(findingsObj).length > 0) {
    // Draw rounded box around entire Key Findings section
    const boxStartY = doc.y;
    const boxX = 50;
    const boxWidth = 512;
    
    doc.fontSize(14)
      .fillColor(COLORS.charcoal)
      .text('Key Findings', 60, boxStartY + 15);
    
    doc.moveDown(1.5);

    const contentStartY = doc.y;
    
    // Process each category
    Object.entries(findingsObj).forEach(([category, categoryData]) => {
      if (!categoryData || !categoryData.details) return;
      
      const details = categoryData.details;
      
      // Skip if no details
      if (Object.keys(details).length === 0) return;
      
      // Category label
      const categoryLabel = category
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
      
      // Category header
      const headerY = doc.y;
      
      // Small orange circle bullet
      doc.circle(58, headerY + 6, 4)
        .fillAndStroke('#F97316', '#F97316');
      
      // Category name in bold
      doc.fontSize(11)
        .fillColor(COLORS.charcoal)
        .font('Helvetica-Bold')
        .text(categoryLabel, 80, headerY);
      
      doc.font('Helvetica'); // Reset to normal
      doc.moveDown(0.6);
      
      // Display each detail as key-value pair
      Object.entries(details).forEach(([key, value]) => {
        // Skip empty or useless values
        if (value === null || value === undefined || value === '') {
          return; // Skip this detail entirely
        }
        
        const detailY = doc.y;
        
        // Format label (camelCase to Title Case)
        const label = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim() + ':';
        
        // Format value with proper encoding
        const displayValue = formatDetailValueWithEncoding(value);
        
        // Don't show if value is "None" or empty
        if (displayValue === 'None' || displayValue === '') {
          return;
        }
        
        // Label on left (gray)
        doc.fontSize(9)
          .fillColor(COLORS.mediumGray)
          .text(label, 80, detailY, { width: 200 });
        
        // Value on right (darker, aligned right)
        doc.fontSize(9)
          .fillColor(COLORS.charcoal)
          .text(displayValue, 290, detailY, { width: 260, align: 'right' });
        
        doc.moveDown(0.5);
      });
      
      doc.moveDown(0.8);
      
      // Page break check
      if (doc.y > 650) {
        // Draw box for current content before page break
        const boxHeight = doc.y - boxStartY + 15;
        doc.roundedRect(boxX, boxStartY, boxWidth, boxHeight, 8)
           .stroke(COLORS.border);
        
        doc.addPage();
        doc.fontSize(18)
          .fillColor(COLORS.charcoal)
          .text(`${analyzerName} (continued)`, 50);
        doc.moveDown(1);
      }
    });
    
    // Draw the rounded box around all Key Findings content
    const boxHeight = doc.y - boxStartY + 15;
    doc.roundedRect(boxX, boxStartY, boxWidth, boxHeight, 8)
       .stroke(COLORS.border);
    
    doc.y = boxStartY + boxHeight + 20;
  }

/**
   * Helper function to format detail values with proper character encoding
   */
  function formatDetailValueWithEncoding(value) {
    // Handle booleans (including string/number representations)
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';  // ✓ and ✗ using Unicode
    }
    if (value === 'true' || value === 1 || value === '1') {
      return 'Yes';  // ✓
    }
    if (value === 'false' || value === 0 || value === '0' || value === '') {
      return 'No';  // ✗
    }
    
    // Handle null/undefined
    if (value === null || value === undefined || value === '') {
      return 'None';
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return 'None';
      if (value.length === 1) return String(value[0]);
      return value.join(', ');
    }
    
    // Handle objects
    if (typeof value === 'object' && value !== null) {
      // Special case: Headings object
      if (value.h1 !== undefined || value.h2 !== undefined || value.h3 !== undefined) {
        const parts = [];
        if (value.h1) parts.push(`H1: ${value.h1}`);
        if (value.h2) parts.push(`H2: ${value.h2}`);
        if (value.h3) parts.push(`H3: ${value.h3}`);
        if (value.h4) parts.push(`H4: ${value.h4}`);
        if (value.h5) parts.push(`H5: ${value.h5}`);
        if (value.h6) parts.push(`H6: ${value.h6}`);
        return parts.length > 0 ? parts.join(', ') : 'None';
      }
      
      // Generic object: count keys
      const keys = Object.keys(value);
      if (keys.length === 0) return 'None';
      return `${keys.length} items`;
    }
    
    // Handle strings and numbers
    const str = String(value);
    
    // Truncate long URLs
    if (str.startsWith('http') && str.length > 50) {
      return str.substring(0, 47) + '...';
    }
    
    // Truncate other long strings
    if (str.length > 60) {
      return str.substring(0, 57) + '...';
    }
    
    return str;
  }

  /**
   * Helper function to format detail values
   */
  function formatDetailValue(value) {
    // Handle booleans - USE UNICODE
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value === 'true' || value === 1 || value === '1') {
      return 'Yes';
    }
    if (value === 'false' || value === 0 || value === '0' || value === '') {
      return 'No';
    }
    
    // Handle null/undefined
    if (value === null || value === undefined || value === '') {
      return 'None';
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return 'None';
      if (value.length === 1) return String(value[0]);
      return value.join(', ');
    }
    
    // Handle objects
    if (typeof value === 'object' && value !== null) {
      // Special case: Headings object
      if (value.h1 !== undefined || value.h2 !== undefined || value.h3 !== undefined) {
        const parts = [];
        if (value.h1) parts.push(`H1: ${value.h1}`);
        if (value.h2) parts.push(`H2: ${value.h2}`);
        if (value.h3) parts.push(`H3: ${value.h3}`);
        if (value.h4) parts.push(`H4: ${value.h4}`);
        if (value.h5) parts.push(`H5: ${value.h5}`);
        if (value.h6) parts.push(`H6: ${value.h6}`);
        return parts.length > 0 ? parts.join(', ') : 'None';
      }
      
      // Generic object: count keys
      const keys = Object.keys(value);
      if (keys.length === 0) return 'None';
      return `${keys.length} items`;
    }
    
    // Handle strings and numbers
    const str = String(value);
    
    // Truncate long URLs
    if (str.startsWith('http') && str.length > 50) {
      return str.substring(0, 47) + '...';
    }
    
    // Truncate other long strings
    if (str.length > 60) {
      return str.substring(0, 57) + '...';
    }
    
    return str;
  }
  
  // Recommendations
  addRecommendationsSection(doc, analyzerName, data);
}

/**
 * Add score breakdown section
 */
function addScoreBreakdownSection(doc, details) {
  doc.fontSize(14)
     .fillColor(COLORS.charcoal)
     .text('Score Breakdown',50);
  
  doc.moveDown(0.8);
  
  // Check if details has message (for special cases like Query Match)
  if (details.message) {
    doc.fontSize(10)
       .fillColor(COLORS.mediumGray)
       .text(`• Max Score: 100`, 60);
    doc.fontSize(10)
       .fillColor(COLORS.mediumGray)
       .text(`• Message: ${details.message}`, 60);
    doc.moveDown(1);
    return;
  }
  
  // Handle nested breakdown structure
  const breakdownData = details.breakdown || details;
  
  // Parse breakdown details
  const breakdownEntries = [];
  for (const [key, value] of Object.entries(breakdownData)) {
    if (value && typeof value === 'object' && 'score' in value && 'max' in value) {
      // Convert camelCase to Title Case
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
      
      breakdownEntries.push({
        label,
        score: value.score,
        max: value.max,
        percentage: value.max > 0 ? Math.round((value.score / value.max) * 100) : 0
      });
    }
  }
  
  if (breakdownEntries.length > 0) {
    breakdownEntries.forEach(entry => {
      const barY = doc.y;
      
      // Label and score
      doc.fontSize(10)
         .fillColor(COLORS.charcoal)
         .text(entry.label, 60, barY);
      
      doc.fillColor(COLORS.mediumGray)
         .text(`${entry.score}/${entry.max}`, 450, barY, { width: 100, align: 'right' });
      
      // Progress bar
      const barWidth = 400;
      const barHeight = 8;
      const barX = 60;
      const progressBarY = barY + 18;
      
      // Background
      doc.roundedRect(barX, progressBarY, barWidth, barHeight, 4)
         .fillAndStroke(COLORS.border, COLORS.border);
      
      // Progress
      const progressWidth = (barWidth * entry.percentage) / 100;
      if (progressWidth > 0) {
        doc.roundedRect(barX, progressBarY, progressWidth, barHeight, 4)
           .fillAndStroke(getScoreColor(entry.percentage), getScoreColor(entry.percentage));
      }
      
      doc.moveDown(2);
    });
  } else {
    doc.fontSize(10)
       .fillColor(COLORS.mediumGray)
       .text('• Max Score: 100', 60);
    doc.moveDown(0.5);
  }
  
  doc.moveDown(1);
}

/**
 * Add recommendations section
 */
function addRecommendationsSection(doc, analyzerName, data) {
  const recommendations = safeGet(data, 'recommendations', []);
  
  // Check if we need a new page
  if (doc.y > 650) {
    doc.addPage();
    doc.fontSize(18)
       .fillColor(COLORS.charcoal)
       .text(`${analyzerName} (continued)`);
    doc.moveDown(1);
  }
  
  doc.fontSize(14)
     .fillColor(COLORS.charcoal)
     .text('Recommendations',50);
  
  doc.moveDown(0.8);
  
  if (!recommendations || recommendations.length === 0) {
    doc.fontSize(10)
       .fillColor(COLORS.mediumGray)
       .text('No recommendations available.', 60);
    return;
  }
  
  recommendations.forEach((rec, index) => {
    // Check pagination
    if (doc.y > 680) {
      doc.addPage();
      doc.fontSize(18)
         .fillColor(COLORS.charcoal)
         .text(`${analyzerName} (continued)`);
      doc.moveDown(1);
    }
    
    const recY = doc.y;
    
    // Priority badge
    const priority = safeGet(rec, 'priority', 'medium');
    const colors = getPriorityColors(priority);
    
    doc.roundedRect(60, recY, 85, 20, 3)
       .fillAndStroke(colors.bg, colors.bg);
    
    doc.fontSize(8)
       .fillColor(colors.text)
       .text(priority.toUpperCase(), 65, recY + 6, { width: 75, align: 'center' });
    
    // Recommendation text
    const text = safeGet(rec, 'text', 'No description');
    doc.fontSize(10)
       .fillColor(COLORS.charcoal)
       .text(`${index + 1}. ${text}`, 155, recY, { width: 395 });
    
    doc.moveDown(0.5);
    
    // Why section
    const why = safeGet(rec, 'why', null);
    if (why) {
      doc.fontSize(9)
         .fillColor(COLORS.primary)
         .text('Why: ', 155, doc.y, { continued: true })
         .fillColor(COLORS.mediumGray)
         .text(why, { width: 395 });
      doc.moveDown(0.3);
    }
    
    // How to fix section
    const howToFix = safeGet(rec, 'howToFix', null);
    if (howToFix) {
      doc.fontSize(9)
         .fillColor(COLORS.primary)
         .text('How to Fix: ', 155, doc.y, { continued: true })
         .fillColor(COLORS.mediumGray)
         .text(howToFix, { width: 395 });
      doc.moveDown(0.3);
    }
    
    doc.moveDown(0.8);
  });
}

/**
 * Add top recommendations page (for summary report)
 */
function addTopRecommendationsPage(doc, analysisData) {
  doc.addPage();
  
  doc.fontSize(22)
     .fillColor(COLORS.charcoal)
     .text('Top Priority Recommendations', 50);
  
  doc.moveDown(1.5);
  
  // Collect all recommendations
  const allRecommendations = [];
  const analyzers = [
    { name: 'Technical Foundation', key: 'technicalFoundation' },
    { name: 'Content Structure', key: 'contentStructure' },
    { name: 'Page-Level E-E-A-T', key: 'pageLevelEEAT' },
    { name: 'Query Match Analysis', key: 'queryMatch' },
    { name: 'AI Visibility Assessment', key: 'aiVisibility' }
  ];
  
  analyzers.forEach(analyzer => {
    const data = analysisData[analyzer.key];
    const recommendations = safeGet(data, 'recommendations', []);
    
    recommendations.forEach(rec => {
      allRecommendations.push({
        text: safeGet(rec, 'text', 'No description'),
        priority: safeGet(rec, 'priority', 'medium'),
        analyzer: analyzer.name
      });
    });
  });
  
  // Sort by priority
  const priorityOrder = { critical: 1, high: 2, medium: 3, low: 4 };
  allRecommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  // Display top 15
  const topRecs = allRecommendations.slice(0, 15);
  
  topRecs.forEach((rec, index) => {
    // Check pagination
    if (doc.y > 700) {
      doc.addPage();
      doc.fontSize(18)
         .fillColor(COLORS.charcoal)
         .text('Top Priority Recommendations (continued)');
      doc.moveDown(1);
    }
    
    const recY = doc.y;
    
    // Priority badge
    const colors = getPriorityColors(rec.priority);
    
    doc.roundedRect(60, recY, 85, 20, 3)
       .fillAndStroke(colors.bg, colors.bg);
    
    doc.fontSize(8)
       .fillColor(colors.text)
       .text(rec.priority.toUpperCase(), 65, recY + 6, { width: 75, align: 'center' });
    
    // Recommendation text
    doc.fontSize(10)
       .fillColor(COLORS.charcoal)
       .text(`${index + 1}. ${rec.text}`, 155, recY, { width: 395 });
    
    // Analyzer source
    doc.fontSize(8)
       .fillColor(COLORS.lightGray)
       .text(`[${rec.analyzer}]`, 155, doc.y);
    
    doc.moveDown(0.8);
  });
}

/**
 * Add copyright page
 */
function addCopyrightPage(doc) {
  doc.addPage();
  
  const logoPaths = [
    path.join(__dirname, '../public/thatworkx-logo.jpg'),
    path.join(__dirname, '../public/aeo-thatworkx-logo-jpg.jpg'),
    path.join(__dirname, '../../frontend/public/thatworkx-logo.jpg'),
    path.join(process.cwd(), 'public/thatworkx-logo.jpg')
  ];
  
  let logoPath = null;
  for (const p of logoPaths) {
    if (fs.existsSync(p)) {
      logoPath = p;
      break;
    }
  }
  
  const logoY = doc.page.height / 2 - 80;
  
  if (logoPath) {
    try {
      doc.image(logoPath, 200, logoY, { width: 200 });
    } catch (e) {
      console.log('Logo load error:', e.message);
    }
  }
  
  doc.moveDown(15);
  
  doc.fontSize(12)
     .fillColor(COLORS.charcoal)
     .text('All Rights Reserved', { align: 'center' });
  
  doc.moveDown(0.5);
  
  doc.fontSize(10)
     .fillColor(COLORS.lightGray)
     .text(`© ${new Date().getFullYear()} Thatworkx Solutions`, { align: 'center' });
  
  doc.moveDown(2);
  
  doc.fontSize(10)
     .fillColor(COLORS.primary)
     .text('https://aeo.thatworkx.com', { align: 'center', link: 'https://aeo.thatworkx.com' });
  
  doc.moveDown(1);
  
  doc.fontSize(9)
     .fillColor(COLORS.lightGray)
     .text(
       'This report is confidential and intended solely for the use of the recipient.',
       50,
       doc.y,
       { align: 'center', width: 512 }
     );
}

/**
 * Generate Summary PDF
 */
function generateSummaryPDF(analysisData, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      console.log('[PDF] Starting summary PDF generation');
      console.log('[PDF] Analysis data keys:', Object.keys(analysisData));
      
      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 50,
        bufferPages: true
      });
      
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      
      // Page 1: Title
      addTitlePage(doc, 'AEO Analysis Report', analysisData);
      
      // Page 2: Overall Score
      addOverallScorePage(doc, analysisData);
      
      // Page 3+: Top Recommendations
      addTopRecommendationsPage(doc, analysisData);
      
      // Copyright page
      addCopyrightPage(doc);
      
      // Add headers/footers
      //const range = doc.bufferedPageRange();
      //for (let i = 0; i < range.count; i++) {
      //  doc.switchToPage(i);
      //  addPageHeader(doc, i + 1, range.count, i === 0);
      //}
      
      doc.end();
      
      stream.on('finish', () => {
        console.log('[PDF] Summary PDF generated successfully');
        resolve(outputPath);
      });
      
      stream.on('error', (err) => {
        console.error('[PDF] Stream error:', err);
        reject(err);
      });
      
    } catch (error) {
      console.error('[PDF] Generation error:', error);
      reject(error);
    }
  });
}

/**
 * Generate Detailed PDF
 */
function generateDetailedPDF(analysisData, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      console.log('[PDF] Starting detailed PDF generation');
      console.log('[PDF] Analysis data keys:', Object.keys(analysisData));
      
      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 50,
        bufferPages: true
      });
      
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      
      // Page 1: Title
      addTitlePage(doc, 'AEO Detailed Analysis Report', analysisData);
      
      // Page 2: Overall Score
      addOverallScorePage(doc, analysisData);
      
      // Analyzer detail pages
      const analyzers = [
        { name: 'Technical Foundation', key: 'technicalFoundation', weight: 25 },
        { name: 'Content Structure', key: 'contentStructure', weight: 25 },
        { name: 'Page-Level E-E-A-T', key: 'pageLevelEEAT', weight: 20 },
        { name: 'Site-Level E-E-A-T', key: 'siteLevelEEAT', weight: 20 },
        { name: 'AI Visibility Assessment', key: 'aiVisibility', weight: 15 },
        { name: 'Query Match Analysis', key: 'queryMatch', weight: 15 }

      ];
      
      analyzers.forEach(analyzer => {
        const data = analysisData[analyzer.key];
        if (data) {
          addAnalyzerDetailPage(doc, analyzer.name, analyzer.key, data, analyzer.weight);
        } else {
          console.log(`[PDF] Warning: No data for ${analyzer.key}`);
        }
      });
      
      // Copyright page
      addCopyrightPage(doc);
      
      // Add headers/footers
      //const range = doc.bufferedPageRange();
      //for (let i = 0; i < range.count; i++) {
      //  doc.switchToPage(i);
      //  addPageHeader(doc, i + 1, range.count, i === 0);
      //}
      
      doc.end();
      
      stream.on('finish', () => {
        console.log('[PDF] Detailed PDF generated successfully');
        resolve(outputPath);
      });
      
      stream.on('error', (err) => {
        console.error('[PDF] Stream error:', err);
        reject(err);
      });
      
    } catch (error) {
      console.error('[PDF] Generation error:', error);
      reject(error);
    }
  });
}

module.exports = {
  generateSummaryPDF,
  generateDetailedPDF
};