'use client';

import { useState, useRef, useEffect } from 'react';
import { SendIcon, ChevronLeft, ChevronRight, Database, History, FileText, Grid, Sparkles, Laptop, RefreshCw } from 'lucide-react';
import { sendChatMessage, getSuggestedStories, clearConversationHistory } from '@/utils/chat-api';
import { ChatMessage, StorySuggestion } from '@/types/chat';
import StoryMapStatus from './StoryMapStatus';
import Logo from './Logo';

// Sample initial messages to display on first load - using string ISO date to avoid hydration mismatches
const initialMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Hello! I\'m Jordi, your archival assistant. I can help you discover fascinating historical stories from news archives spanning hundreds of years. What would you like to explore today?',
    timestamp: new Date('2023-01-01T00:00:00Z'), // Fixed timestamp to avoid hydration issues
  },
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [featuredStories, setFeaturedStories] = useState<StorySuggestion[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'suggestions' | 'history'>('suggestions');
  const [conversationId, setConversationId] = useState<string>('default');
  const [tokenUsage, setTokenUsage] = useState<{ input: number; output: number }>({ input: 0, output: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch featured stories on component mount
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const { stories, error } = await getSuggestedStories();
        if (!error && stories.length > 0) {
          setFeaturedStories(stories);
        } else {
          // Fallback to default featured stories if API fails
          setFeaturedStories([
            {
              id: '1',
              title: 'Awaiting StoryMap Intelligence Data Import',
              source: 'Data Integration in Progress',
              description: 'Historical intelligence data is being imported from the StoryMap Intelligence system',
            },
            {
              id: '2',
              title: 'Documentary Story Discovery',
              source: 'AI-Powered Analysis',
              description: 'Advanced narrative analysis will identify compelling stories with documentary potential',
            },
            {
              id: '3',
              title: 'Entity Relationship Networks',
              source: 'Historical Intelligence',
              description: 'Comprehensive mapping of relationships between historical figures, organizations, and events',
            },
            {
              id: '4',
              title: 'Temporal Narrative Threading',
              source: 'Cross-Reference Analysis',
              description: 'Multi-article story threads spanning years or decades of historical development',
            },
            {
              id: '5',
              title: 'Archival Research Assistant',
              source: 'Claude AI Integration',
              description: 'Intelligent assistance for discovering lost stories and historical patterns',
            },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch suggested stories:', error);
        // Use fallback data
      }
    };

    fetchStories();
  }, []);

  // Scroll to bottom of messages when new ones are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, [inputValue]);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send message to API with conversation ID
      const { response, sources, entities, timeline, conversation_id, token_usage, error } = 
        await sendChatMessage(inputValue, conversationId);

      if (error) {
        throw new Error(error);
      }

      // Update conversation ID if provided
      if (conversation_id) {
        setConversationId(conversation_id);
      }

      // Update token usage if provided
      if (token_usage) {
        setTokenUsage(prevUsage => ({
          input: prevUsage.input + token_usage.input,
          output: prevUsage.output + token_usage.output
        }));
      }

      // Add response to chat
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        sources: sources,
        entities: entities,
        timeline: timeline
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error while searching the archives. Please try again.',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  // Handle submitting with Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format timestamp to human-readable time
  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(timestamp);
  };

  // Handle clearing the conversation
  const handleClearConversation = async () => {
    if (!conversationId) return;
    
    try {
      await clearConversationHistory(conversationId);
      
      // Reset to initial state
      setMessages(initialMessages);
      setConversationId('default');
      setTokenUsage({ input: 0, output: 0 });
      
    } catch (error) {
      console.error('Error clearing conversation:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen dark:bg-dark-900">
      {/* Chat header */}
      <div className="bg-white dark:bg-dark-800 border-b border-dark-200 dark:border-dark-700 shadow-sm z-10">
        <div className="container-base py-3">
          <div className="flex justify-between items-center">
            <Logo withText size="sm" />
            <div className="flex items-center space-x-4">
              <div className="text-xs text-dark-500 dark:text-dark-400">
                <span className="font-medium">Tokens:</span> {tokenUsage.input + tokenUsage.output} 
                <span className="ml-1 text-dark-400 dark:text-dark-500">
                  (In: {tokenUsage.input} | Out: {tokenUsage.output})
                </span>
              </div>
              <button
                onClick={handleClearConversation}
                className="p-1.5 rounded-full text-dark-500 hover:text-dark-700 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
                title="Clear conversation"
              >
                <RefreshCw size={16} />
              </button>
              <div className="w-64">
                <StoryMapStatus />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area with sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar with suggested topics and chat history */}
        <div 
          className={`border-r border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-800 transition-all duration-300 ${
            showSidebar ? 'w-80' : 'w-0'
          } relative flex flex-col`}
        >
          {/* Toggle sidebar button */}
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className="absolute -right-4 top-4 w-8 h-8 bg-white dark:bg-dark-700 border border-dark-200 dark:border-dark-600 rounded-full flex items-center justify-center shadow-sm z-10"
            aria-label={showSidebar ? "Hide sidebar" : "Show sidebar"}
          >
            {showSidebar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {/* Sidebar tabs */}
          <div className="flex border-b border-dark-200 dark:border-dark-700">
            <button 
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${
                activeSidebarTab === 'suggestions' 
                  ? 'text-accent-800 dark:text-accent-400 border-b-2 border-accent-600' 
                  : 'text-dark-600 dark:text-dark-400'
              }`}
              onClick={() => setActiveSidebarTab('suggestions')}
            >
              <Sparkles size={16} />
              <span>Suggested Topics</span>
            </button>
            <button 
              className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${
                activeSidebarTab === 'history' 
                  ? 'text-accent-800 dark:text-accent-400 border-b-2 border-accent-600' 
                  : 'text-dark-600 dark:text-dark-400'
              }`}
              onClick={() => setActiveSidebarTab('history')}
            >
              <History size={16} />
              <span>Chat History</span>
            </button>
          </div>
          
          {/* Sidebar content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeSidebarTab === 'suggestions' && (
              <div className="space-y-3">
                <div className="text-xs uppercase tracking-wider text-dark-500 dark:text-dark-400 font-semibold mb-2">
                  Featured Historical Topics
                </div>
                {featuredStories.map((story) => (
                  <div 
                    key={story.id.toString()} 
                    className="group p-3 rounded-md bg-white dark:bg-dark-700/50 border border-dark-200 dark:border-dark-600 hover:border-accent-500 dark:hover:border-accent-700 cursor-pointer transition-all hover:shadow-sm"
                    onClick={() => {
                      setInputValue(`Tell me about "${story.title}"`);
                      inputRef.current?.focus();
                    }}
                  >
                    <h3 className="font-medium text-dark-900 dark:text-white group-hover:text-accent-700 dark:group-hover:text-accent-500 transition-colors text-sm">
                      {story.title}
                    </h3>
                    <p className="text-xs text-dark-600 dark:text-dark-400 mt-1">
                      {story.source}
                    </p>
                    <p className="text-xs text-dark-500 dark:text-dark-300 mt-2">
                      {story.description}
                    </p>
                  </div>
                ))}
                
                {/* Research queries suggestions */}
                <div className="text-xs uppercase tracking-wider text-dark-500 dark:text-dark-400 font-semibold mt-6 mb-2">
                  Research Queries
                </div>
                {[
                  "Show me connections between labor movements and political change",
                  "What technological innovations emerged during wartime?",
                  "Find patterns in economic reporting during the Great Depression",
                  "How did newspapers cover women's suffrage movements?",
                  "Analyze media bias in Cold War reporting"
                ].map((query, i) => (
                  <div 
                    key={i} 
                    className="p-2 rounded-md bg-dark-100/50 dark:bg-dark-800/80 cursor-pointer hover:bg-accent-100 dark:hover:bg-dark-700 flex items-center text-sm text-dark-700 dark:text-dark-300"
                    onClick={() => {
                      setInputValue(query);
                      inputRef.current?.focus();
                    }}
                  >
                    <Database size={14} className="mr-2 text-dark-400 dark:text-dark-500" />
                    {query}
                  </div>
                ))}
              </div>
            )}
            
            {activeSidebarTab === 'history' && (
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-dark-500 dark:text-dark-400 font-semibold mb-3">
                  Previous Research Sessions
                </div>
                {messages.length <= 1 ? (
                  <div className="text-sm text-dark-500 dark:text-dark-400 italic">
                    No previous chat history
                  </div>
                ) : (
                  <div className="bg-white dark:bg-dark-700/50 border border-dark-200 dark:border-dark-600 rounded-md p-3">
                    <div className="text-sm font-medium text-dark-800 dark:text-dark-200 mb-1">
                      Current Session
                    </div>
                    <div className="text-xs text-dark-500 dark:text-dark-400">
                      Started at {new Date().toLocaleTimeString()}
                    </div>
                    <div className="mt-2 text-xs text-dark-600 dark:text-dark-300">
                      {messages.filter(m => m.role === 'user').length} messages
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Sidebar footer with genomic search info */}
          <div className="p-3 bg-dark-100/50 dark:bg-dark-800/50 border-t border-dark-200 dark:border-dark-700">
            <div className="flex items-center text-xs text-dark-600 dark:text-dark-400">
              <Grid size={14} className="mr-2" />
              <span>Genomic Search Active</span>
              <div className="ml-auto flex space-x-1">
                <span className="h-2 w-2 rounded-full bg-accent-600 animate-pulse"></span>
                <span className="h-2 w-2 rounded-full bg-accent-600 animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                <span className="h-2 w-2 rounded-full bg-accent-600 animate-pulse" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-dark-50 dark:bg-dark-900 overflow-hidden">
          {/* DNA helix decoration in the background */}
          <div className="absolute right-0 top-0 h-full w-60 pointer-events-none opacity-[0.02] dark:opacity-[0.04] overflow-hidden">
            <svg width="100%" height="100%" viewBox="0 0 100 800" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M30,0 Q60,50 30,100 Q0,150 30,200 Q60,250 30,300 Q0,350 30,400 Q60,450 30,500 Q0,550 30,600 Q60,650 30,700 Q0,750 30,800" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M70,0 Q40,50 70,100 Q100,150 70,200 Q40,250 70,300 Q100,350 70,400 Q40,450 70,500 Q100,550 70,600 Q40,650 70,700 Q100,750 70,800" stroke="currentColor" strokeWidth="2" fill="none" />
              
              {/* DNA "rungs" - more sparse for background effect */}
              {[0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750].map((y) => (
                <line key={y} x1="30" y1={y} x2="70" y2={y} stroke="currentColor" strokeWidth="1.5" />
              ))}
            </svg>
          </div>
        
          {/* Messages container */}
          <div className="flex-1 overflow-y-auto p-4 relative">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} message-appear`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl shadow-sm border ${
                      message.role === 'user'
                        ? 'bg-accent-700 text-white border-accent-600 dark:border-accent-800'
                        : 'bg-white dark:bg-dark-800 border-dark-200 dark:border-dark-700 text-dark-800 dark:text-dark-100'
                    }`}
                  >
                    <div className="p-4">
                      {message.role === 'assistant' && (
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 rounded-full bg-accent-100 dark:bg-dark-700 flex items-center justify-center mr-2 text-accent-800 dark:text-accent-400 font-medium">
                            J
                          </div>
                          <div>
                            <div className="font-medium text-sm">Jordi</div>
                            <div className="text-xs text-dark-500 dark:text-dark-400">Archive Assistant</div>
                          </div>
                        </div>
                      )}
                      
                      <div className={`${message.role === 'user' ? '' : 'text-dark-800 dark:text-dark-200'} whitespace-pre-line`}>
                        {message.content}
                      </div>
                      
                      {/* Display sources if available */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-dark-200/30 dark:border-dark-600/30">
                          <div className="flex items-center mb-2">
                            <FileText size={14} className="mr-2 text-dark-500 dark:text-dark-400" />
                            <p className="text-xs font-medium text-dark-700 dark:text-dark-300">Primary Sources</p>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {message.sources.map((source, idx) => (
                              <div key={idx} className="text-xs p-2 rounded bg-dark-100/50 dark:bg-dark-700/50">
                                <div className="font-medium text-dark-800 dark:text-dark-200">{source.title}</div>
                                <div className="flex justify-between mt-1">
                                  <span className="text-dark-600 dark:text-dark-400">{source.publication}</span>
                                  <span className="text-dark-500 dark:text-dark-500">{source.date}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Display timeline if available */}
                      {message.timeline && message.timeline.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-dark-200/30 dark:border-dark-600/30">
                          <div className="flex items-center mb-2">
                            <History size={14} className="mr-2 text-dark-500 dark:text-dark-400" />
                            <p className="text-xs font-medium text-dark-700 dark:text-dark-300">Timeline</p>
                          </div>
                          <div className="relative ml-2 pl-4 border-l-2 border-accent-500/20 dark:border-accent-700/20">
                            {message.timeline.map((entry, idx) => (
                              <div key={idx} className="mb-3 relative">
                                {/* Timeline dot */}
                                <div className="absolute -left-6 w-3 h-3 rounded-full bg-accent-500 dark:bg-accent-700 shadow-sm"></div>
                                {/* Timeline entry */}
                                <div className="text-xs p-3 rounded bg-dark-100/50 dark:bg-dark-700/50 hover:bg-dark-200/50 dark:hover:bg-dark-600/50 transition-colors">
                                  <div className="text-sm font-medium text-dark-800 dark:text-dark-200">{entry.title}</div>
                                  <div className="flex justify-between mt-1 mb-1">
                                    <span className="text-dark-600 dark:text-dark-400">{entry.publication}</span>
                                    <span className="text-accent-600 dark:text-accent-500 font-medium">{new Date(entry.date).toLocaleDateString()}</span>
                                  </div>
                                  {entry.snippet && (
                                    <div className="text-dark-600 dark:text-dark-300 mt-1 line-clamp-2">{entry.snippet}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Message footer with timestamp */}
                    <div className={`px-4 py-1.5 text-xs rounded-b-2xl ${
                      message.role === 'user' 
                        ? 'text-white/70 bg-accent-800/30' 
                        : 'text-dark-500 dark:text-dark-500 bg-dark-100/50 dark:bg-dark-700/30'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start message-appear">
                  <div className="max-w-[85%] p-4 rounded-2xl bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 shadow-sm">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-accent-100 dark:bg-dark-700 flex items-center justify-center mr-2 text-accent-800 dark:text-accent-400 font-medium">
                        J
                      </div>
                      <div>
                        <div className="font-medium text-sm">Jordi</div>
                        <div className="text-xs text-dark-500 dark:text-dark-400">Searching archives...</div>
                      </div>
                    </div>
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Input area */}
          <div className="p-4 border-t border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about historical events, people, or patterns..."
                  className="flex-1 p-3 pr-12 rounded-lg border border-dark-300 dark:border-dark-600 focus:border-accent-600 dark:focus:border-accent-700 focus:ring-2 focus:ring-accent-600/20 dark:focus:ring-accent-700/20 bg-white dark:bg-dark-700 outline-none resize-none text-dark-800 dark:text-white text-sm placeholder:text-dark-400 dark:placeholder:text-dark-500"
                  rows={1}
                  disabled={isLoading}
                ></textarea>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className={`absolute right-3 bottom-3 p-2 rounded-md ${
                    inputValue.trim() && !isLoading
                      ? 'bg-accent-600 hover:bg-accent-700 text-white'
                      : 'bg-dark-200 dark:bg-dark-600 text-dark-500 dark:text-dark-400 cursor-not-allowed'
                  } transition-colors`}
                  aria-label="Send message"
                >
                  <SendIcon size={18} />
                </button>
              </div>
              
              {/* Academic, genomic context note */}
              <div className="mt-2 flex items-center text-xs text-dark-500 dark:text-dark-400">
                <Laptop size={12} className="mr-1" />
                <span>Genome pattern matching active • </span>
                <span className="ml-1">Academic citations enabled • </span>
                <span className="ml-1">Historical context analysis: high precision</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 