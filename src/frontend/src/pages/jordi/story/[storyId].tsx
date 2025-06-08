import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface Story {
  id: string;
  title: string;
  content: string;
  year: number;
  documentaryPotential: number;
  narrativeScore: number;
  themes: string[];
  analysis: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const StoryChat: React.FC = () => {
  const router = useRouter();
  const { storyId } = router.query;
  
  const [story, setStory] = useState<Story | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [storyLoading, setStoryLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load story details when component mounts or storyId changes
  useEffect(() => {
    if (storyId && typeof storyId === 'string') {
      loadStoryDetails(storyId);
    }
  }, [storyId]);

  const loadStoryDetails = async (id: string) => {
    setStoryLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/narrative/explore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storyId: id }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStory(data.data);
        
        // Add initial welcome message
        const welcomeMessage: Message = {
          role: 'assistant',
          content: `Welcome! I'm Jordi, your documentary development assistant. I'm here to help you explore the story "${data.data.title}" from ${data.data.year}. This story has a ${data.data.documentaryPotential}% documentary potential rating. What would you like to know about developing this into a documentary?`,
          timestamp: new Date().toISOString()
        };
        setMessages([welcomeMessage]);
      } else {
        setError('Story not found');
      }
    } catch (error) {
      console.error('Error loading story:', error);
      setError('Failed to load story details');
    } finally {
      setStoryLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !story || loading) return;
    
    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/narrative/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId: story.id,
          message: userMessage.content,
          conversationHistory: messages.slice(-10) // Send last 10 messages for context
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.data.response,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: 'I apologize, but I encountered an error processing your question. Please try rephrasing your question about this story.',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I\'m having trouble connecting right now. Please try your question again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getDocumentaryColor = (potential: number): string => {
    if (potential >= 80) return 'text-green-600';
    if (potential >= 60) return 'text-yellow-600';
    if (potential >= 40) return 'text-orange-600';
    return 'text-gray-600';
  };

  if (storyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading story details...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Story Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested story could not be loaded.'}</p>
          <button
            onClick={() => router.push('/jordi')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Story Discovery
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{story.title} - Jordi Story Chat | StoryMine</title>
        <meta name="description" content={`Explore the documentary potential of "${story.title}" from ${story.year}`} />
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/jordi')}
                  className="text-gray-600 hover:text-gray-900 flex items-center"
                >
                  ← Back to Discovery
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 flex items-center">
                    🎬 Jordi
                    <span className="ml-2 text-sm font-normal text-gray-500">Story Chat</span>
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Story Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {story.year}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDocumentaryColor(story.documentaryPotential)} bg-gray-100`}>
                    {story.documentaryPotential}% Documentary Potential
                  </span>
                  {story.narrativeScore && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {story.narrativeScore}% Narrative Score
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">{story.title}</h2>
                {story.analysis && (
                  <p className="text-gray-600 mb-4">{story.analysis}</p>
                )}
                {story.themes && story.themes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {story.themes.map((theme, index) => (
                      <span
                        key={index}
                        className="inline-block bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          {/* Messages */}
          <div className="flex-1 py-6 space-y-4 overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 shadow-sm border'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'assistant' && (
                      <span className="text-sm">🎬</span>
                    )}
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <div
                        className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 shadow-sm border max-w-2xl px-4 py-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">🎬</span>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="py-4 border-t bg-white sticky bottom-0">
            <div className="flex space-x-4">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about the documentary potential, historical context, or development strategies for this story..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg flex items-center space-x-2 self-start"
              >
                <span>Send</span>
                <span>→</span>
              </button>
            </div>
            
            {/* Suggested Questions */}
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "What makes this story compelling for documentary?",
                  "Who would be good interview subjects?",
                  "What archival materials might exist?",
                  "How does this fit into the broader historical context?"
                ].map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(question)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full"
                    disabled={loading}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StoryChat; 