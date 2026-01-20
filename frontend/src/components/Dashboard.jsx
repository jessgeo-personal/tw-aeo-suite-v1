import React, { useState } from 'react';
import { 
  Search, Code, FileText, Target, Eye, ExternalLink, 
  AlertTriangle, XCircle, Loader2, X, Home, Menu, Plus,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { EnhancedResultsDisplay } from './EnhancedResultsDisplay';

// ===========================================
// TOOL CONFIGURATION
// ===========================================
const TOOLS = [
  { 
    id: 'technical', 
    name: 'Technical Audit', 
    icon: Code, 
    description: 'Schema, crawlability, structure',
    subtitle: 'Analyze whether AI engines can properly access and parse your website',
    color: '#ef4444',
    shortName: 'Technical'
  },
  { 
    id: 'content', 
    name: 'Content Quality', 
    icon: FileText, 
    description: 'Readability, Q&A, citations',
    subtitle: 'Analyze whether your content is optimized for AI extraction and citation',
    color: '#f97316',
    shortName: 'Content'
  },
  { 
    id: 'query', 
    name: 'Query Match', 
    icon: Target, 
    description: 'Match content to prompts',
    subtitle: 'See how well your content matches specific queries users might ask AI engines',
    color: '#f59e0b',
    shortName: 'Query'
  },
  { 
    id: 'visibility', 
    name: 'AI Visibility', 
    icon: Eye, 
    description: 'Overall citation potential',
    subtitle: 'Overall likelihood of being cited by AI engines',
    color: '#ec4899',
    shortName: 'AI'
  },
];

// ===========================================
// TOOL TIPS DATA
// ===========================================
const TOOL_TIPS = {
  technical: {
    title: "Technical SEO Tips",
    items: [
      "Add schema markup (FAQ, Article, Organization) to help AI engines understand your content structure",
      "Ensure your site is crawlable with proper robots.txt and XML sitemaps",
      "Use semantic HTML with clear heading hierarchy (H1, H2, H3)",
      "Implement canonical URLs to avoid duplicate content issues",
      "Make sure your site loads quickly and is mobile-friendly"
    ]
  },
  content: {
    title: "Content Optimization Tips",
    items: [
      "Write in clear, concise language at a 8th-10th grade reading level",
      "Structure content with question-style headers that match user queries",
      "Include factual, data-driven statements that AI can cite",
      "Add author credentials and publication dates for authority",
      "Break up long paragraphs and use bullet points for scannability"
    ]
  },
  query: {
    title: "Query Matching Tips",
    items: [
      "Research actual questions users ask about your topic",
      "Include natural language questions in your H2/H3 headers",
      "Provide direct, concise answers to questions in the first paragraph",
      "Use related keywords and synonyms naturally throughout",
      "Consider user intent: informational, navigational, or transactional"
    ]
  },
  visibility: {
    title: "AI Visibility Tips",
    items: [
      "Build topical authority by covering subjects comprehensively",
      "Earn quality backlinks from reputable sources in your industry",
      "Keep content fresh with regular updates and new information",
      "Include multimedia (images, videos) with descriptive alt text",
      "Demonstrate expertise with detailed, well-researched content"
    ]
  }
};

// ===========================================
// URL TAB COMPONENT
// ===========================================
const URLTab = ({ url, toolId, isActive, onClose, onClick }) => {
  // Get tool name from tool ID
  const toolNames = {
    technical: 'Technical',
    content: 'Content',
    query: 'Query',
    visibility: 'Visibility'
  };
  const toolName = toolNames[toolId] || 'Audit';
  
  // Format: "Tool - domain.com"
  const domain = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const displayText = `${toolName} - ${domain}`;
  const truncatedText = displayText.length > 35 ? displayText.substring(0, 35) + '...' : displayText;
  
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer transition-colors max-w-xs ${
        isActive 
          ? 'bg-white text-gray-900 shadow-sm' 
          : 'bg-gray-300 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <span className="text-sm truncate">{truncatedText}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="p-0.5 hover:bg-gray-200 rounded flex-shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

// ===========================================
// MOBILE TOOL SELECTOR
// ===========================================
const MobileToolSelector = ({ activeTool, setActiveTool }) => {
  return (
    <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 px-1 -mx-1">
      {TOOLS.map(tool => {
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
              isActive 
                ? 'text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            style={isActive ? { backgroundColor: tool.color } : {}}
          >
            <tool.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{tool.shortName}</span>
          </button>
        );
      })}
    </div>
  );
};

// ===========================================
// USAGE LIMITS COMPONENT (Collapsible)
// ===========================================
const UsageLimitsCard = ({ limits, onUpgradeClick, onProfessionalClick }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="mt-4 pt-4 border-t border-gray-700">
      {/* Header - Always visible */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between mb-3 text-left"
      >
        <h3 className="text-white font-semibold text-sm">Today's Usage</h3>
        {isCollapsed ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        )}
      </button>
      
      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="space-y-2">
          {TOOLS.map(tool => {
            const limit = limits?.[tool.id];
            const used = limit ? limit.limit - limit.remaining : 0;
            const total = limit ? limit.limit : 3;
            
            return (
              <div 
                key={tool.id}
                className="rounded-lg p-2 text-center"
                style={{ backgroundColor: tool.color }}
              >
                <div className="text-white font-medium text-xs mb-0.5">{tool.name.split(' ')[0]}</div>
                <div className="text-white text-sm font-bold">
                  {used} / {total}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ===========================================
// MAIN DASHBOARD COMPONENT
// ===========================================
const Dashboard = ({
  session,
  onLogout,
  onLogin,
  onGoHome,
  activeTool,
  setActiveTool,
  url,
  setUrl,
  queries,
  setQueries,
  loading,
  error,
  results,
  onAnalyze,
  urlTabs,
  activeTabIndex,
  onTabClick,
  onTabClose,
  onNewTab,
  limits,
  onUpgradeClick,
  onProfessionalClick,
  onContactClick
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentTool = TOOLS.find(t => t.id === activeTool) || TOOLS[0];
  const currentTips = TOOL_TIPS[activeTool] || TOOL_TIPS.technical;

  // Handle tool change (also close sidebar on mobile)
  const handleToolChange = (toolId) => {
    setActiveTool(toolId);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* LEFT SIDEBAR */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white transition-transform duration-300 flex flex-col`}>
        {/* Home Button */}
        <div className="p-4">
          <button 
            onClick={onGoHome}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Back to Home"
          >
            <Home className="w-6 h-6" />
          </button>
        </div>

        {/* Logo */}
        <div className="px-4 mb-6">
          <h1 className="text-xl font-bold">
            <img src="" alt="" className="h-10 w-auto" />
          </h1>
        </div>

        {/* Section Header */}
        <div className="px-4 mb-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AEO Audit Tools</h2>
        </div>

        {/* Tool Navigation */}
        <nav className="px-2">
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => handleToolChange(tool.id)}
              className={`w-full flex items-start gap-3 px-3 py-3 mb-1 rounded-lg transition-colors text-left ${
                activeTool === tool.id
                  ? 'bg-cyan-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <tool.icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm">{tool.name}</div>
                <div className="text-xs opacity-70">{tool.description}</div>
              </div>
            </button>
          ))}
        </nav>

        {/* Upgrade Links */}
        <div className="px-4 mt-4 space-y-2 text-xs">
          <button
            onClick={onUpgradeClick}
            className="text-cyan-400 hover:text-cyan-300 underline block text-left"
          >
            Upgrade for unlimited audits
          </button>
          <button
            onClick={onProfessionalClick}
            className="text-cyan-400 hover:text-cyan-300 underline block text-left"
          >
            Professional AEO services →
          </button>
        </div>

        {/* Usage Limits - MOVED HERE */}
        <div className="px-4 flex-1">
          {session && (
            <UsageLimitsCard 
              limits={limits} 
              onUpgradeClick={onUpgradeClick}
              onProfessionalClick={onProfessionalClick}
            />
          )}
        </div>

        {/* Spacer to push content up if needed */}
        <div className="flex-shrink-0 h-4"></div>
      </div>

      {/* MAIN CONTENT AREA - Now takes full width (no right sidebar) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP HEADER BAR */}
        <header className="bg-gray-900 text-white px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="hidden lg:block">
            <h1 className="text-lg font-bold">
              <img src="/AEO-thatworkx-logo.svg" alt="AEO @ Thatworkx logo" className="h-24 w-auto" />
            </h1>
          </div>
          
          <div className="flex-1 max-w-xl mx-4 lg:mx-8 text-center">
            <span className="text-base lg:text-lg font-medium">
            </span>
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <>
                <span className="text-xs lg:text-sm text-white hidden sm:block">{session.email}</span>
                <button
                  onClick={onLogout}
                  className="text-xs lg:text-sm text-cyan-400 hover:text-cyan-300 underline"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={onLogin}
                className="text-sm text-cyan-400 hover:text-cyan-300 underline"
              >
                Login
              </button>
            )}
          </div>
        </header>

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          {/* MOBILE TOOL SELECTOR - Shows at top on mobile */}
          <MobileToolSelector 
            activeTool={activeTool} 
            setActiveTool={handleToolChange} 
          />

          {/* URL Tabs */}
          {urlTabs.length > 0 && (
            <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1 mt-3 lg:mt-0">
              {urlTabs.map((tab, idx) => (
                <URLTab
                  key={idx}
                  url={tab.url}
                  toolId={tab.tool}
                  isActive={idx === activeTabIndex}
                  onClick={() => onTabClick(idx)}
                  onClose={() => onTabClose(idx)}
                />
              ))}
              <button
                onClick={onNewTab}
                className="p-2 bg-gray-200 hover:bg-gray-300 rounded-t-lg flex-shrink-0 transition-colors"
                title="New analysis"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}

          {/* WHITE CONTENT CARD */}
          <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-200">
            {/* Tool Title */}
            <div className="mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                {currentTool.name}
              </h2>
              <p className="text-sm text-gray-600">
                {currentTool.subtitle}
              </p>
            </div>

            {/* URL Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Website URL
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  placeholder="https://example.com/page"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && url.trim() && onAnalyze()}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                  disabled={loading}
                />
                <button
                  onClick={onAnalyze}
                  disabled={loading || !url.trim()}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      <span>Analyze</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Enter a specific page URL for accurate analysis
              </p>
            </div>

            {/* Query Match Inputs */}
            {activeTool === 'query' && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Target Queries
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  What questions do you want your page to rank for?
                </p>
                <div className="space-y-2">
                  {queries.map((q, idx) => (
                    <input
                      key={idx}
                      type="text"
                      placeholder={`e.g., "What is ${idx === 0 ? 'your product' : 'query ' + (idx + 1)}?"`}
                      value={q}
                      onChange={(e) => {
                        const newQueries = [...queries];
                        newQueries[idx] = e.target.value;
                        setQueries(newQueries);
                      }}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                    />
                  ))}   
                  <button
                    onClick={() => setQueries([...queries, ''])}
                    className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                  >
                    + Add another query
                  </button>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Results Display - Pass tips to show in score section */}
            <EnhancedResultsDisplay 
              results={results} 
              toolId={activeTool} 
              tips={currentTips}
            />
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
