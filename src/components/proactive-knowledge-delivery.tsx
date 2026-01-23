/**
 * Proactive Knowledge Delivery System
 * Context-aware articles appearing automatically
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Lightbulb,
  Book,
  Clock,
  ChevronRight,
  X,
  BookOpen,
  AlertTriangle,
} from 'lucide-react';

interface KnowledgeArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  readTime: number;
  relevanceScore: number;
  trigger: string;
  keywords: string[];
  content: string;
  icon: string;
}

interface MicroLearning {
  id: string;
  type: 'tip' | 'definition' | 'warning' | 'best-practice';
  title: string;
  content: string;
  icon: string;
}

export function ProactiveKnowledgeDelivery({
  waterParams,
  phaseDay,
}: {
  waterParams?: Record<string, number>;
  phaseDay?: number;
}) {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [microLearnings, setMicroLearnings] = useState<MicroLearning[]>([]);
  const [dismissedArticles, setDismissedArticles] = useState<string[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContextualKnowledge();
  }, [waterParams, phaseDay]);

  const loadContextualKnowledge = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/contextual-knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waterParams, phaseDay }),
      });

      if (!response.ok) throw new Error('Failed to load knowledge');

      const data = await response.json();
      setArticles(data.articles || []);
      setMicroLearnings(data.microLearnings || []);
    } catch (error) {
      console.error('Error loading contextual knowledge:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissArticle = (articleId: string) => {
    setDismissedArticles([...dismissedArticles, articleId]);
    setArticles(articles.filter((a) => a.id !== articleId));
  };

  const visibleArticles = articles.filter((a) => !dismissedArticles.includes(a.id)).slice(0, 3);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Loading knowledge articles...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Context-Aware Articles */}
      {visibleArticles.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Book className="h-5 w-5" />
            Recommended for Your Situation
          </h3>
          {visibleArticles.map((article) => (
            <Card key={article.id} className="hover:border-blue-300 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">{article.icon}</span>
                    <div className="flex-1">
                      <CardTitle className="text-base">{article.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{article.summary}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissArticle(article.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    {article.category}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {article.readTime} min
                  </Badge>
                  <Badge
                    variant={article.relevanceScore > 0.8 ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {Math.round(article.relevanceScore * 100)}% relevant
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  <Lightbulb className="h-3 w-3 inline mr-1" />
                  {article.trigger}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setSelectedArticle(article)}
                >
                  Read Article <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Micro-Learning Snippets */}
      {microLearnings.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Quick Tips
          </h3>
          <div className="grid gap-2">
            {microLearnings.map((snippet) => {
              const getBgColor = () => {
                switch (snippet.type) {
                  case 'warning':
                    return 'bg-red-50 border-red-200';
                  case 'best-practice':
                    return 'bg-green-50 border-green-200';
                  case 'definition':
                    return 'bg-blue-50 border-blue-200';
                  default:
                    return 'bg-amber-50 border-amber-200';
                }
              };

              const getIcon = () => {
                switch (snippet.type) {
                  case 'warning':
                    return <AlertTriangle className="h-4 w-4 text-red-600" />;
                  case 'best-practice':
                    return <BookOpen className="h-4 w-4 text-green-600" />;
                  default:
                    return <Lightbulb className="h-4 w-4 text-amber-600" />;
                }
              };

              return (
                <div
                  key={snippet.id}
                  className={`p-3 rounded-lg border ${getBgColor()}`}
                >
                  <div className="flex items-start gap-2">
                    {getIcon()}
                    <div>
                      <p className="text-sm font-medium">{snippet.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{snippet.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Article Detail Modal */}
      {selectedArticle && (
        <Card className="bg-gradient-to-b from-blue-50 to-white">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{selectedArticle.icon}</span>
                <div>
                  <CardTitle>{selectedArticle.title}</CardTitle>
                  <Badge className="mt-2">{selectedArticle.category}</Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedArticle(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-sm">{selectedArticle.content}</p>
            </div>

            <Alert>
              <BookOpen className="h-4 w-4" />
              <AlertDescription>
                This article was recommended because: {selectedArticle.trigger}
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button className="flex-1">Learn More</Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedArticle(null)}
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {articles.length === 0 && microLearnings.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No articles recommended for your current situation</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
