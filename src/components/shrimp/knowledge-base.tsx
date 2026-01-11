"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Wand2, AlertTriangle, BookOpen, Lightbulb, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Article {
  id: string;
  title: string;
  category: string;
  summary: string;
  tags: string[];
  helpfulness: number;
}

export function KnowledgeBase() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const articles: Article[] = [
    {
      id: 'disease-1',
      title: 'White Spot Syndrome Virus (WSSV) - Identification & Management',
      category: 'diseases',
      summary: 'Comprehensive guide to identifying, preventing, and managing WSSV in shrimp farms',
      tags: ['WSSV', 'disease', 'critical', 'prevention'],
      helpfulness: 92,
    },
    {
      id: 'disease-2',
      title: 'Early Mortality Syndrome (EMS) - Treatment Protocol',
      category: 'diseases',
      summary: 'Step-by-step protocol for addressing EMS/Acute Hepatopancreatic Necrosis Disease',
      tags: ['EMS', 'disease', 'treatment', 'warning'],
      helpfulness: 88,
    },
    {
      id: 'water-1',
      title: 'Ammonia Management in Intensive Farms',
      category: 'water-quality',
      summary: 'Managing ammonia spikes, biofloc systems, and maintaining optimal nitrogen cycles',
      tags: ['ammonia', 'nitrogen', 'water-quality', 'maintenance'],
      helpfulness: 85,
    },
    {
      id: 'water-2',
      title: 'Dissolved Oxygen Crisis Response',
      category: 'water-quality',
      summary: 'Emergency protocols for low DO events and aeration system troubleshooting',
      tags: ['oxygen', 'emergency', 'aeration', 'water-quality'],
      helpfulness: 90,
    },
    {
      id: 'feed-1',
      title: 'Optimizing Feed Conversion Ratio (FCR)',
      category: 'feeding',
      summary: 'Advanced techniques to reduce FCR and improve profitability',
      tags: ['FCR', 'feeding', 'efficiency', 'profit'],
      helpfulness: 87,
    },
    {
      id: 'feed-2',
      title: 'Feed Quality Assessment Guide',
      category: 'feeding',
      summary: 'How to evaluate feed quality, check for contamination, and store properly',
      tags: ['feed-quality', 'storage', 'inspection'],
      helpfulness: 81,
    },
    {
      id: 'reg-1',
      title: 'Environmental Compliance Checklist - Southeast Asia',
      category: 'regulations',
      summary: 'Essential compliance requirements for shrimp farms in major producing regions',
      tags: ['compliance', 'regulations', 'environment', 'reporting'],
      helpfulness: 79,
    },
    {
      id: 'reg-2',
      title: 'Antibiotic Use Regulations & Alternatives',
      category: 'regulations',
      summary: 'Guidelines on responsible antibiotic use and approved alternatives',
      tags: ['antibiotics', 'regulations', 'health'],
      helpfulness: 84,
    },
    {
      id: 'best-1',
      title: 'Best Practices: Biosecurity & Disease Prevention',
      category: 'best-practices',
      summary: 'Comprehensive biosecurity protocols to minimize disease risk',
      tags: ['biosecurity', 'prevention', 'protocol', 'best-practice'],
      helpfulness: 93,
    },
    {
      id: 'best-2',
      title: 'Pond Preparation & Water Conditioning',
      category: 'best-practices',
      summary: 'Step-by-step guide to proper pond preparation before stocking',
      tags: ['preparation', 'water-conditioning', 'stocking'],
      helpfulness: 86,
    },
  ];

  const categories = [
    { id: 'all', label: 'All Articles', count: articles.length },
    { id: 'diseases', label: 'Disease Management', count: articles.filter(a => a.category === 'diseases').length },
    { id: 'water-quality', label: 'Water Quality', count: articles.filter(a => a.category === 'water-quality').length },
    { id: 'feeding', label: 'Feeding & Nutrition', count: articles.filter(a => a.category === 'feeding').length },
    { id: 'regulations', label: 'Regulations', count: articles.filter(a => a.category === 'regulations').length },
    { id: 'best-practices', label: 'Best Practices', count: articles.filter(a => a.category === 'best-practices').length },
  ];

  const handleAISearch = async () => {
    setIsSearching(true);
    try {
      const response = await fetch('/api/ai/search-knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          currentWaterParams: {
            ammonia: 0.8, // Example - from user's current pond
            do: 3.5,
            temperature: 32,
          },
        }),
      });

      const data = await response.json();
      toast({
        title: "Search Results",
        description: data.matchCount ? `Found ${data.matchCount} relevant articles` : "No direct matches, but check related articles",
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: "Could not search knowledge base",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const filteredArticles = selectedCategory === 'all'
    ? articles
    : articles.filter(a => a.category === selectedCategory);

  const searchResults = searchQuery
    ? filteredArticles.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : filteredArticles;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search Knowledge Base</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search diseases, water quality, feeding, regulations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleAISearch}
              disabled={isSearching || !searchQuery}
              className="gap-2"
            >
              {isSearching ? 'Searching...' : <>
                <Wand2 className="h-4 w-4" />
                AI Search
              </>}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            💡 Tip: Type symptoms or parameters (e.g., "high ammonia", "white spots") for AI-powered recommendations
          </p>
        </CardContent>
      </Card>

      {!selectedArticle ? (
        <>
          {/* Category Tabs */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex overflow-x-auto gap-2 pb-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.label} ({cat.count})
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Article List */}
          <div className="grid gap-3">
            {searchResults.length > 0 ? (
              searchResults.map(article => (
                <Card
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="cursor-pointer hover:shadow-lg transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-1">{article.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{article.summary}</p>
                        <div className="flex flex-wrap gap-1">
                          {article.tags.map(tag => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-bold text-green-600">{article.helpfulness}%</div>
                        <p className="text-xs text-muted-foreground">helpful</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No articles found. Try a different search or category.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Links */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-purple-600" />
                Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button variant="outline" className="justify-start">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Emergency Protocols
                </Button>
                <Button variant="outline" className="justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Compliance Docs
                </Button>
                <Button variant="outline" className="justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Video Tutorials
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Article Detail View */
        <Card>
          <CardHeader>
            <Button
              variant="ghost"
              onClick={() => setSelectedArticle(null)}
              className="mb-3"
            >
              ← Back to Articles
            </Button>
            <CardTitle>{selectedArticle.title}</CardTitle>
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedArticle.tags.map(tag => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm leading-relaxed space-y-3 text-muted-foreground">
              <p>
                {selectedArticle.summary}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-semibold text-sm mb-2">Key Points:</p>
                <ul className="text-sm space-y-1">
                  <li>• Regular monitoring is essential for early detection</li>
                  <li>• Follow biosecurity protocols to prevent disease spread</li>
                  <li>• Maintain optimal water quality parameters</li>
                  <li>• Consult experts before using treatments</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t flex gap-2">
              <Button className="flex-1" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Download Full Guide
              </Button>
              <Button className="flex-1">
                <Wand2 className="h-4 w-4 mr-2" />
                Get AI Analysis
              </Button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs">
              <p className="font-semibold mb-1">Was this helpful?</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Yes (👍 {selectedArticle.helpfulness}%)</Button>
                <Button size="sm" variant="outline">No</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
