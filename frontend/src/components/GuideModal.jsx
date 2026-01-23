import React, { useState, useEffect } from 'react';
import { X, Search, Copy, Check, Book, Code, ChevronDown, ChevronRight } from 'lucide-react';
import businessGuide from '../data/businessGuide.json';
import technicalGuide from '../data/technicalGuide.json';

export default function GuideModal({ isOpen, onClose, defaultTab = 'business' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const [copiedSection, setCopiedSection] = useState(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setSearchQuery('');
      setExpandedSections({});
    }
  }, [isOpen, defaultTab]);

  const currentGuide = activeTab === 'business' ? businessGuide : technicalGuide;

  // Toggle section expansion
  const toggleSection = (sectionIndex, subsectionIndex = null) => {
    const key = subsectionIndex !== null 
      ? `${sectionIndex}-${subsectionIndex}` 
      : `${sectionIndex}`;
    
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Copy section content to clipboard
  const copySection = async (content, sectionId) => {
    const text = extractTextFromContent(content);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(sectionId);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Extract plain text from content structure
  const extractTextFromContent = (content) => {
    return content.map(item => {
      if (item.type === 'text' || item.type === 'heading') {
        return item.text;
      } else if (item.type === 'list') {
        return item.items.map(i => `• ${i}`).join('\n');
      }
      return '';
    }).join('\n\n');
  };

  // Filter sections based on search query
  const filterSections = (sections) => {
    if (!searchQuery) return sections;
    
    const query = searchQuery.toLowerCase();
    return sections.filter(section => {
      // Check section title
      if (section.title.toLowerCase().includes(query)) return true;
      
      // Check subsection titles
      if (section.subsections?.some(sub => 
        sub.title.toLowerCase().includes(query)
      )) return true;
      
      // Check content text
      const contentText = JSON.stringify(section.content).toLowerCase();
      if (contentText.includes(query)) return true;
      
      // Check subsection content
      const subsectionText = JSON.stringify(section.subsections).toLowerCase();
      return subsectionText.includes(query);
    });
  };

  // Render content items
  const renderContent = (content, parentId) => {
    return content.map((item, idx) => {
      if (item.type === 'heading') {
        return (
          <h4 key={idx} className="font-semibold text-gray-900 mt-4 mb-2">
            {item.text}
          </h4>
        );
      } else if (item.type === 'text') {
        return (
          <p key={idx} className="text-gray-700 mb-3 leading-relaxed">
            {item.text}
          </p>
        );
      } else if (item.type === 'list') {
        return (
          <ul key={idx} className="list-disc list-inside space-y-1 mb-3 text-gray-700">
            {item.items.map((listItem, listIdx) => (
              <li key={listIdx} className="leading-relaxed">
                {listItem.replace(/^[•\-]\s*/, '')}
              </li>
            ))}
          </ul>
        );
      }
      return null;
    });
  };

  if (!isOpen) return null;

  const filteredSections = filterSections(currentGuide.sections);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AEO Suite Documentation</h2>
            <p className="text-sm text-gray-600 mt-1">
              {currentGuide.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close guide"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('business')}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'business'
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Book className="w-4 h-4" />
            Business Guide
          </button>
          <button
            onClick={() => setActiveTab('technical')}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'technical'
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Code className="w-4 h-4" />
            Technical Guide
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2">
              Found {filteredSections.length} section{filteredSections.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {filteredSections.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No results found for "{searchQuery}"</p>
              </div>
            ) : (
              filteredSections.map((section, sectionIdx) => (
                <div key={sectionIdx} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Main Section Header */}
                  <button
                    onClick={() => toggleSection(sectionIdx)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                      {expandedSections[sectionIdx] ? (
                        <ChevronDown className="w-5 h-5 text-cyan-600" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      {section.title}
                    </h3>
                    {expandedSections[sectionIdx] && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copySection(
                            [...section.content, ...section.subsections.flatMap(s => s.content)],
                            `section-${sectionIdx}`
                          );
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-cyan-600 hover:bg-cyan-50 rounded transition-colors"
                      >
                        {copiedSection === `section-${sectionIdx}` ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                    )}
                  </button>

                  {/* Section Content */}
                  {expandedSections[sectionIdx] && (
                    <div className="p-4 bg-white">
                      {/* Main section content */}
                      {section.content.length > 0 && (
                        <div className="mb-4">
                          {renderContent(section.content, `section-${sectionIdx}`)}
                        </div>
                      )}

                      {/* Subsections */}
                      {section.subsections.length > 0 && (
                        <div className="space-y-3">
                          {section.subsections.map((subsection, subIdx) => (
                            <div
                              key={subIdx}
                              className="border-l-4 border-cyan-200 pl-4"
                            >
                              <button
                                onClick={() => toggleSection(sectionIdx, subIdx)}
                                className="w-full flex items-center justify-between mb-2 text-left"
                              >
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                  {expandedSections[`${sectionIdx}-${subIdx}`] ? (
                                    <ChevronDown className="w-4 h-4 text-cyan-600" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  )}
                                  {subsection.title}
                                </h4>
                                {expandedSections[`${sectionIdx}-${subIdx}`] && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copySection(subsection.content, `subsection-${sectionIdx}-${subIdx}`);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-cyan-600 hover:bg-cyan-50 rounded transition-colors"
                                  >
                                    {copiedSection === `subsection-${sectionIdx}-${subIdx}` ? (
                                      <>
                                        <Check className="w-3 h-3" />
                                        Copied
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        Copy
                                      </>
                                    )}
                                  </button>
                                )}
                              </button>

                              {expandedSections[`${sectionIdx}-${subIdx}`] && (
                                <div>
                                  {renderContent(subsection.content, `subsection-${sectionIdx}-${subIdx}`)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            {currentGuide.audience}
          </p>
        </div>
      </div>

      {/* Add FAQPage Schema for AI Engines */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": currentGuide.sections.flatMap(section => 
            section.subsections.map(sub => ({
              "@type": "Question",
              "name": sub.title,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": extractTextFromContent(sub.content)
              }
            }))
          )
        })}
      </script>
    </div>
  );
}