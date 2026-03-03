/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, Copy, ExternalLink, Check, Trash2, ArrowRight, BarChart2 } from 'lucide-react';

interface ShortLink {
  id: number;
  shortCode: string;
  originalUrl: string;
  createdAt: string;
  clicks: number;
}

export default function App() {
  const [url, setUrl] = useState('');
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/links');
      if (response.ok) {
        const data = await response.json();
        setLinks(data);
      }
    } catch (err) {
      console.error('Failed to fetch links:', err);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    try {
      new URL(url);
    } catch (err) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to shorten URL');
      }

      setUrl('');
      fetchLinks(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (shortCode: string) => {
    const fullUrl = `${window.location.origin}/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedCode(shortCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-red-500/30 selection:text-red-200">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 bg-red-500/10 rounded-2xl mb-4">
            <Link className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-100 sm:text-5xl mb-4">
            Shorten Your Links
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Create clean, memorable short links in seconds. Track clicks and manage your URLs all in one place.
          </p>
        </motion.div>

        {/* Main Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900 rounded-3xl shadow-2xl shadow-black/50 p-6 sm:p-8 mb-12 border border-zinc-800"
        >
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Link className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste your long URL here... (https://...)"
                  className="block w-full pl-11 pr-4 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-2xl text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Shorten <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </button>
            </div>
            {error && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 text-sm text-red-400 flex items-center"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2" />
                {error}
              </motion.p>
            )}
          </form>
        </motion.div>

        {/* Links List */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-zinc-100 flex items-center">
              <BarChart2 className="w-5 h-5 mr-2 text-zinc-500" />
              Recent Links
            </h2>
            <span className="text-sm font-medium text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">
              {links.length} total
            </span>
          </div>

          {links.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900 rounded-3xl border border-zinc-800 border-dashed">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-950 mb-4">
                <Link className="w-8 h-8 text-zinc-700" />
              </div>
              <h3 className="text-lg font-medium text-zinc-100 mb-1">No links yet</h3>
              <p className="text-zinc-500">Shorten your first URL above to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {links.map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 shadow-sm hover:shadow-md hover:border-zinc-700 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    <div className="flex-grow min-w-0 pr-4">
                      <div className="flex items-center gap-3 mb-1">
                        <a 
                          href={`/${link.shortCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lg font-semibold text-red-400 hover:text-red-300 hover:underline truncate flex items-center"
                        >
                          {window.location.host}/{link.shortCode}
                          <ExternalLink className="w-4 h-4 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </div>
                      <p className="text-sm text-zinc-500 truncate" title={link.originalUrl}>
                        {link.originalUrl}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 border-zinc-800">
                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-bold text-zinc-100 leading-none mb-1">
                          {link.clicks}
                        </span>
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Clicks
                        </span>
                      </div>
                      
                      <div className="w-px h-10 bg-zinc-800 hidden sm:block" />

                      <button
                        onClick={() => copyToClipboard(link.shortCode)}
                        className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
                          copiedCode === link.shortCode 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                        }`}
                        title="Copy short link"
                      >
                        {copiedCode === link.shortCode ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
