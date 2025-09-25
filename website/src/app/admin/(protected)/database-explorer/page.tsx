"use client";

import React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, FileDown, Download, Settings, RefreshCw, HardDrive, FileText, FolderOpen, Music, FileImage, Eye, Database, TrendingUp, PlayCircle, PauseCircle, Save, Globe, Search, Star, BookOpen, Code, BarChart3, Play, RotateCcw } from 'lucide-react';

interface TableInfo {
  table_name: string;
  table_type: string;
  schema_name: string;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  column_default: string | null;
}

interface QueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
  executionTime: number;
}

interface StorageBucket {
  id: string;
  name: string;
  public: boolean;
  file_size_limit: number | null;
  allowed_mime_types: string[] | null;
  created_at: string;
  updated_at: string;
}

interface StorageFile {
  name: string;
  id: string | null;
  updated_at: string | null;
  created_at: string | null;
  last_accessed_at: string | null;
  metadata: any;
  bucket: string;
  path: string;
  size: number;
  mimetype: string;
  cache_control: string;
  is_folder: boolean;
  public_url: string | null;
}

interface DatabaseStatistics {
  database: {
    total_tables: number;
    estimated_total_rows: number;
  };
  tables: Array<{
    name: string;
    row_count: number;
    column_count: number;
    columns: string[];
    has_data: boolean;
    error?: string;
  }>;
  storage: {
    bucket_count: number;
    buckets: Array<{
      name: string;
      file_count: number;
      total_size: number;
      public: boolean;
      error?: string;
    }>;
  };
  performance: {
    timestamp: string;
    response_time_ms: number;
    status: string;
  };
}

export default function DatabaseExplorerPage() {
  // 🎭 State variables - the emotional palette of our database exploration canvas
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<QueryResult | null>(null);
  const [tableColumns, setTableColumns] = useState<ColumnInfo[]>([]);
  const [customQuery, setCustomQuery] = useState<string>('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 🌌 Storage exploration state
  const [storageBuckets, setStorageBuckets] = useState<StorageBucket[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string>('');
  const [bucketFiles, setBucketFiles] = useState<StorageFile[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');

  // 📊 Statistics state
  const [statistics, setStatistics] = useState<DatabaseStatistics | null>(null);

  // 🔍 Global search state
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [globalSearchResults, setGlobalSearchResults] = useState<any>(null);
  const [isGlobalSearching, setIsGlobalSearching] = useState<boolean>(false);
  
  // 🎭 Export functionality state - The digital archival system
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [exportHistory, setExportHistory] = useState<Array<{
    id: string;
    timestamp: string;
    format: string;
    size: string;
    status: string;
    downloadUrl?: string;
  }>>([]);

  // 📄 Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [totalRows, setTotalRows] = useState<number>(0);

  // 💾 Query management state
  const [savedQueries, setSavedQueries] = useState<any[]>([]);
  const [showQueryManager, setShowQueryManager] = useState<boolean>(false);
  const [selectedSavedQuery, setSelectedSavedQuery] = useState<any>(null);

  // 🔄 Real-time monitoring state
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(30000); // 30 seconds
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());



  // 💾 The memory keeper - local storage functions
  const saveUserPreferences = useCallback(() => {
    const preferences = {
      pageSize,
      autoRefreshEnabled,
      refreshInterval,
      lastSelectedTable: selectedTable,
      theme: 'light' // Could be expanded
    };
    localStorage.setItem('db-explorer-preferences', JSON.stringify(preferences));
  }, [pageSize, autoRefreshEnabled, refreshInterval, selectedTable]);

  const loadUserPreferences = useCallback(() => {
    try {
      const preferences = localStorage.getItem('db-explorer-preferences');
      if (preferences) {
        const prefs = JSON.parse(preferences);
        setPageSize(prefs.pageSize || 50);
        setAutoRefreshEnabled(prefs.autoRefreshEnabled || false);
        setRefreshInterval(prefs.refreshInterval || 30000);
        if (prefs.lastSelectedTable) {
          setSelectedTable(prefs.lastSelectedTable);
        }
      }
    } catch (error) {
      console.log('Failed to load user preferences:', error);
    }
  }, []);

  // 📚 The query librarian - manage saved queries
  const fetchSavedQueries = useCallback(async () => {
    try {
      const response = await fetch('/api/database-explorer/queries');
      if (!response.ok) throw new Error('Failed to fetch queries');

      const data = await response.json();
      setSavedQueries(data.queries || []);
    } catch (err) {
      console.error('Fetch saved queries error:', err);
    }
  }, []);

  const saveQuery = useCallback(async (name: string, query: string, description?: string, tags: string[] = []) => {
    try {
      const response = await fetch('/api/database-explorer/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, query, description, tags })
      });

      if (!response.ok) throw new Error('Failed to save query');

      await fetchSavedQueries(); // Refresh the list
      return true;
    } catch (err) {
      console.error('Save query error:', err);
      return false;
    }
  }, [fetchSavedQueries]);

  const loadSavedQuery = (query: any) => {
    setCustomQuery(query.query);
    setSelectedSavedQuery(query);
  };



  // 💾 Save preferences when they change
  useEffect(() => {
    saveUserPreferences();
  }, [pageSize, autoRefreshEnabled, refreshInterval, saveUserPreferences]);

  // 📄 Save recent queries when they change
  useEffect(() => {
    if (customQuery.trim()) {
      const recentQueries = JSON.parse(localStorage.getItem('db-explorer-recent-queries') || '[]');
      const updatedQueries = [
        { query: customQuery, timestamp: new Date().toISOString() },
        ...recentQueries.filter((q: any) => q.query !== customQuery)
      ].slice(0, 10); // Keep only last 10

      localStorage.setItem('db-explorer-recent-queries', JSON.stringify(updatedQueries));
    }
  }, [customQuery]);

  // 🎼 The grand curator - fetch all available tables
  const fetchTables = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/database-explorer/tables');
      if (!response.ok) throw new Error('Failed to fetch tables');

      const data = await response.json();
      setTables(data.tables || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tables');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 📚 The story scribe - fetch data from selected table
  const fetchTableData = useCallback(async (tableName: string, limit: number = pageSize, offset: number = 0) => {
    setIsLoading(true);
    setError('');
    setSelectedTable(tableName);

    try {
      const response = await fetch(`/api/database-explorer/table-data?table=${encodeURIComponent(tableName)}&limit=${limit}&offset=${offset}`);
      if (!response.ok) throw new Error('Failed to fetch table data');

      const data = await response.json();
      setTableData(data);
      setTotalRows(data.totalCount || data.rowCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch table data');
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // 🔧 The column healer - fetch column information
  const fetchTableColumns = useCallback(async (tableName: string) => {
    try {
      const response = await fetch(`/api/database-explorer/table-columns?table=${encodeURIComponent(tableName)}`);
      if (!response.ok) throw new Error('Failed to fetch table columns');

      const data = await response.json();
      setTableColumns(data.columns || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch table columns');
    }
  }, []);

  // 🎵 The melody maestro - execute custom SQL query
  const executeQuery = async () => {
    if (!customQuery.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/database-explorer/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: customQuery }),
      });

      if (!response.ok) throw new Error('Failed to execute query');

      const data = await response.json();
      setQueryResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute query');
    } finally {
      setIsLoading(false);
    }
  };

  // 🔮 The data oracle - export query results
  const exportQueryResults = (data: QueryResult, filename: string) => {
    if (!data || data.rows.length === 0) return;

    const csvContent = [
      data.columns.join(','),
      ...data.rows.map(row =>
        data.columns.map(col => JSON.stringify(row[col] || '')).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 🌌 The cosmic vault - fetch all storage buckets
  const fetchStorageBuckets = useCallback(async () => {
    try {
      const response = await fetch('/api/database-explorer/storage/buckets');
      if (!response.ok) throw new Error('Failed to fetch storage buckets');

      const data = await response.json();
      setStorageBuckets(data.buckets || []);
    } catch (err) {
      console.error('Storage buckets error:', err);
    }
  }, []);

  // 🎵 The melody archive - fetch files from storage bucket
  const fetchBucketFiles = async (bucketName: string, path: string = '') => {
    setIsLoading(true);
    setError('');
    setSelectedBucket(bucketName);
    setCurrentPath(path);

    try {
      const response = await fetch(`/api/database-explorer/storage/files?bucket=${encodeURIComponent(bucketName)}&path=${encodeURIComponent(path)}`);
      if (!response.ok) throw new Error('Failed to fetch bucket files');

      const data = await response.json();
      setBucketFiles(data.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bucket files');
    } finally {
      setIsLoading(false);
    }
  };

  // 📊 The cosmic metrics - fetch database statistics
  const fetchStatistics = useCallback(async (tableName?: string) => {
    try {
      const url = tableName
        ? `/api/database-explorer/statistics?table=${encodeURIComponent(tableName)}`
        : '/api/database-explorer/statistics';

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch statistics');

      const data = await response.json();
      setStatistics(data.statistics);
    } catch (err) {
      console.error('Statistics error:', err);
    }
  }, []);

  // 🌊 The cosmic awakening - fetch all database tables on mount
  useEffect(() => {
    fetchTables();
    fetchStorageBuckets();
    fetchStatistics();
    loadUserPreferences();
    fetchSavedQueries();
  }, [fetchTables, fetchStorageBuckets, fetchStatistics, loadUserPreferences, fetchSavedQueries]);

  // 🎭 The digital archival symphony - export database functionality
  const exportDatabase = async (format: 'sql' | 'json' | 'csv', options: {
    includeData: boolean;
    includeSchema: boolean;
    selectedTables?: string[];
  }) => {
    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('Initializing export...');

    try {
      const exportId = `export_${Date.now()}`;
      
      // 🎼 Create the export job
      setExportStatus('Creating export job...');
      setExportProgress(10);
      
      const response = await fetch('/api/database-explorer/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportId,
          format,
          options
        })
      });

      if (!response.ok) throw new Error('Failed to create export');
      
      setExportStatus('Processing database...');
      setExportProgress(30);

      // 🎨 Poll for progress
      const pollProgress = async () => {
        const progressResponse = await fetch(`/api/database-explorer/export/status/${exportId}`);
        const progressData = await progressResponse.json();
        
        setExportProgress(progressData.progress);
        setExportStatus(progressData.status);
        
        if (progressData.completed) {
          // 🎉 Export completed successfully
          const newExport = {
            id: exportId,
            timestamp: new Date().toISOString(),
            format,
            size: progressData.size || 'Unknown',
            status: 'completed',
            downloadUrl: progressData.downloadUrl
          };
          
          setExportHistory(prev => [newExport, ...prev]);
          setExportStatus('Export completed successfully!');
          setExportProgress(100);
          
          // 🎭 Auto-download the file
          if (progressData.downloadUrl) {
            const link = document.createElement('a');
            link.href = progressData.downloadUrl;
            link.download = `database_export_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        } else if (progressData.error) {
          throw new Error(progressData.error);
        } else {
          // 🔄 Continue polling
          setTimeout(pollProgress, 1000);
        }
      };
      
      // 🎯 Start polling
      setTimeout(pollProgress, 1000);
      
    } catch (err) {
      console.error('Export error:', err);
      setExportStatus(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setExportProgress(0);
    } finally {
      setIsExporting(false);
    }
  };

  // 🎪 Quick export functions for different formats
  const exportFullDatabase = () => exportDatabase('sql', { 
    includeData: true, 
    includeSchema: true 
  });
  
  const exportSchemaOnly = () => exportDatabase('sql', { 
    includeData: false, 
    includeSchema: true 
  });
  
  const exportDataAsJSON = () => exportDatabase('json', { 
    includeData: true, 
    includeSchema: true 
  });
  
  const exportTableAsCSV = (tableName: string) => exportDatabase('csv', { 
    includeData: true, 
    includeSchema: false,
    selectedTables: [tableName]
  });

  // 🔍 The cosmic seeker - global search across all tables
  const performGlobalSearch = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setGlobalSearchResults(null);
      return;
    }

    setIsGlobalSearching(true);
    try {
      const response = await fetch(`/api/database-explorer/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setGlobalSearchResults(data.search);
    } catch (err) {
      console.error('Global search error:', err);
      setError('Global search failed');
    } finally {
      setIsGlobalSearching(false);
    }
  };

  // 📄 The page turner - handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (selectedTable) {
      fetchTableData(selectedTable, pageSize, (page - 1) * pageSize);
    }
  };

  // 💾 The data exporter - advanced export functionality
  const exportTableData = async (table: string, format: string = 'csv') => {
    try {
      const response = await fetch('/api/database-explorer/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, format, limit: 50000 })
      });

      if (!response.ok) throw new Error('Export failed');

      const data = await response.json();
      const exportData = data.export;

      // Create download link
      const blob = new Blob([exportData.data], { type: exportData.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportData.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Export error:', err);
      setError('Export failed');
    }
  };

  // 🔄 The refresh conductor - orchestrates data updates
  const refreshCurrentData = useCallback(() => {
    if (selectedTable) {
      fetchTableData(selectedTable);
      fetchTableColumns(selectedTable);
    }
    fetchStatistics();
    fetchStorageBuckets();
    setLastRefresh(new Date());
  }, [selectedTable, fetchTableData, fetchTableColumns, fetchStatistics, fetchStorageBuckets]);

  // 🔄 The time keeper - refresh current data
  const _refreshCurrentData = useCallback(refreshCurrentData, [refreshCurrentData]);

  // 🕰️ Auto-refresh interval setup
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefreshEnabled) {
      interval = setInterval(() => {
        _refreshCurrentData();
        setLastRefresh(new Date());
      }, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefreshEnabled, refreshInterval, _refreshCurrentData]);

  // 🎨 The living canvas - filtered tables based on search
  const filteredTables = tables.filter(table =>
    table.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.schema_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* 🎭 The grand stage header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                PostgreSQL Explorer
              </h1>
              <p className="text-slate-600">
                🌌 Discover your Supabase database structure and execute custom queries with elegance
              </p>
            </div>
          </div>

          {/* 🎛️ Control Panel */}
          <div className="flex items-center gap-4">
            {/* 🔄 Auto-refresh toggle */}
            <div className="flex items-center gap-2">
              {autoRefreshEnabled ? (
                <PauseCircle
                  className="h-5 w-5 text-green-600 cursor-pointer"
                  onClick={() => setAutoRefreshEnabled(false)}
                />
              ) : (
                <PlayCircle
                  className="h-5 w-5 text-slate-400 cursor-pointer hover:text-green-600"
                  onClick={() => setAutoRefreshEnabled(true)}
                />
              )}
              <span className="text-sm text-slate-600">
                Auto-refresh {autoRefreshEnabled ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* 📚 Query Manager */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQueryManager(!showQueryManager)}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Queries
            </Button>

            {/* 🔄 Manual Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshCurrentData}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* 🔍 Global Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Globe className="h-5 w-5 text-slate-400" />
          </div>
          <Input
            type="text"
            placeholder="🔍 Global search across all tables..."
            value={globalSearchQuery}
            onChange={(e) => {
              setGlobalSearchQuery(e.target.value);
              if (e.target.value.length >= 2) {
                performGlobalSearch(e.target.value);
              } else {
                setGlobalSearchResults(null);
              }
            }}
            className="pl-10 pr-4 py-3 text-lg"
          />
          {isGlobalSearching && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <RefreshCw className="h-5 w-5 text-slate-400 animate-spin" />
            </div>
          )}
        </div>

        {/* 📊 Global Search Results */}
        {globalSearchResults && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Global Search Results
                <Badge variant="secondary">{globalSearchResults.totalResults} matches found</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {globalSearchResults.results.map((result: any, index: number) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{result.table}</h4>
                      <Badge variant="secondary">{result.matches} matches</Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      Searched in: {result.columns.join(', ')}
                    </p>
                    <div className="space-y-1">
                      {result.data.slice(0, 2).map((row: any, rowIndex: number) => (
                        <div key={rowIndex} className="text-sm bg-slate-50 p-2 rounded">
                          {result.columns.map((col: string) => (
                            <span key={col} className="mr-4">
                              <strong>{col}:</strong> {String(row[col] || '').substring(0, 50)}
                              {String(row[col] || '').length > 50 && '...'}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTable(result.table);
                        fetchTableData(result.table);
                        fetchTableColumns(result.table);
                      }}
                    >
                      View Full Table
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 📚 Query Manager Panel */}
        {showQueryManager && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                Query Manager
              </CardTitle>
              <CardDescription>
                Save, organize, and reuse your SQL queries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 💾 Saved Queries */}
                <div>
                  <h4 className="font-medium mb-3">Saved Queries</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {savedQueries.map((query) => (
                      <div key={query.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium flex items-center gap-2">
                            {query.favorite && <Star className="h-4 w-4 text-yellow-500" />}
                            {query.name}
                          </h5>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadSavedQuery(query)}
                            >
                              Load
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Toggle favorite
                                fetch('/api/database-explorer/queries', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    id: query.id,
                                    favorite: !query.favorite
                                  })
                                }).then(() => fetchSavedQueries());
                              }}
                            >
                              <Star className={`h-4 w-4 ${query.favorite ? 'text-yellow-500' : 'text-slate-400'}`} />
                            </Button>
                          </div>
                        </div>
                        {query.description && (
                          <p className="text-sm text-slate-600 mb-2">{query.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          {new Date(query.last_executed || query.created_at).toLocaleDateString()}
                          {query.tags.length > 0 && (
                            <div className="flex gap-1">
                              {query.tags.slice(0, 3).map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ➕ Save New Query */}
                <div>
                  <h4 className="font-medium mb-3">Save Current Query</h4>
                  <div className="space-y-3">
                    <Input
                      placeholder="Query name"
                      id="save-query-name"
                    />
                    <Textarea
                      placeholder="Query description (optional)"
                      id="save-query-description"
                      className="min-h-20"
                    />
                    <Input
                      placeholder="Tags (comma separated)"
                      id="save-query-tags"
                    />
                    <Button
                      onClick={async () => {
                        const name = (document.getElementById('save-query-name') as HTMLInputElement).value;
                        const description = (document.getElementById('save-query-description') as HTMLTextAreaElement).value;
                        const tagsInput = (document.getElementById('save-query-tags') as HTMLInputElement).value;

                        if (!name.trim()) {
                          setError('Query name is required');
                          return;
                        }

                        const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
                        const success = await saveQuery(name, customQuery, description, tags);

                        if (success) {
                          // Clear form
                          (document.getElementById('save-query-name') as HTMLInputElement).value = '';
                          (document.getElementById('save-query-description') as HTMLTextAreaElement).value = '';
                          (document.getElementById('save-query-tags') as HTMLInputElement).value = '';
                          setError('');
                        } else {
                          setError('Failed to save query');
                        }
                      }}
                      className="w-full"
                    >
                      Save Query
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 📚 The sacred library - tables sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Database Tables
            </CardTitle>
            <CardDescription>
              Explore your database structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 🔍 The mystical lens - search functionality */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filteredTables.map((table) => (
                  <Button
                    key={`${table.schema_name}.${table.table_name}`}
                    variant={selectedTable === table.table_name ? "default" : "ghost"}
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => {
                      fetchTableData(table.table_name);
                      fetchTableColumns(table.table_name);
                    }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Database className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {table.table_name}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {table.schema_name}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {table.table_type}
                      </Badge>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* 🎨 The main canvas - data explorer */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs defaultValue="data" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Table Data
              </TabsTrigger>
              <TabsTrigger value="columns" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Columns
              </TabsTrigger>
              <TabsTrigger value="query" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                SQL Query
              </TabsTrigger>
              <TabsTrigger value="storage" className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Storage
              </TabsTrigger>
              <TabsTrigger value="statistics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Statistics
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </TabsTrigger>
            </TabsList>

            {/* 📊 The data realm */}
            <TabsContent value="data" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {selectedTable || 'Select a table'}
                      </CardTitle>
                      <CardDescription>
                        {tableData ? `${tableData.rowCount} rows • ${tableData.columns.length} columns` : 'Choose a table to explore'}
                      </CardDescription>
                    </div>
                    {tableData && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchTableData(selectedTable)}
                          disabled={isLoading}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportTableData(selectedTable, 'csv')}
                          >
                            <FileDown className="h-4 w-4 mr-2" />
                            Export CSV
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportTableData(selectedTable, 'json')}
                          >
                            <FileDown className="h-4 w-4 mr-2" />
                            Export JSON
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportTableData(selectedTable, 'xml')}
                          >
                            <FileDown className="h-4 w-4 mr-2" />
                            Export XML
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                      {error}
                    </div>
                  )}

                  {tableData && (
                    <div className="border rounded-lg">
                      {/* 🎛️ Table Controls */}
                      <div className="flex items-center justify-between p-3 bg-slate-50 border-b">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-800">
                            📊 {tableData.columns.length} columns, {tableData.rows.length} rows
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const table = document.querySelector('#data-table');
                              if (table) {
                                table.scrollLeft = 0;
                              }
                            }}
                          >
                            ⬅️ Start
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const table = document.querySelector('#data-table');
                              if (table) {
                                table.scrollLeft = table.scrollWidth;
                              }
                            }}
                          >
                            End ➡️
                          </Button>
                        </div>
                      </div>
                      
                      {/* 📋 Enhanced Table with Better Scrolling */}
                      <div 
                        id="data-table"
                        className="overflow-x-auto overflow-y-auto max-h-96 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
                        style={{ scrollbarWidth: 'thin' }}
                      >
                        <table className="w-full border-collapse min-w-max">
                          <thead className="sticky top-0 bg-white border-b-2 border-slate-200 z-10">
                            <tr>
                              {tableData.columns.map((col, index) => (
                                <th 
                                  key={col} 
                                  className="text-left p-3 font-semibold text-slate-800 bg-slate-50 border-r border-slate-200 whitespace-nowrap min-w-[120px]"
                                  style={{ position: 'sticky', top: 0 }}
                                >
                                  <div className="flex items-center gap-1">
                                    <span className="truncate" title={col}>{col}</span>
                                    <span className="text-xs text-slate-500">#{index + 1}</span>
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {tableData.rows.map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-b hover:bg-slate-50 transition-colors">
                                {tableData.columns.map((col, colIndex) => (
                                  <td 
                                    key={col} 
                                    className="p-3 text-sm border-r border-slate-100 min-w-[120px] max-w-[300px]"
                                  >
                                    <div 
                                      className="truncate cursor-pointer hover:text-blue-600 transition-colors" 
                                      title={String(row[col] || '')}
                                      onClick={() => {
                                        // 🎭 Copy cell content to clipboard on click
                                        navigator.clipboard.writeText(String(row[col] || ''));
                                      }}
                                    >
                                      {row[col] === null ? (
                                        <span className="text-slate-400 italic">null</span>
                                      ) : row[col] === '' ? (
                                        <span className="text-slate-400 italic">empty</span>
                                      ) : (
                                        String(row[col])
                                      )}
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* 📏 Horizontal Scroll Indicator */}
                      <div className="p-2 bg-slate-50 border-t text-xs text-slate-600 text-center">
                        💡 Tip: Scroll horizontally to see all columns • Click cells to copy • Use navigation buttons above
                      </div>
                    </div>
                  )}

                  {/* 📄 Pagination Controls */}
                  {tableData && totalRows > pageSize && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-slate-600">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRows)} of {totalRows} rows
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1 || isLoading}
                        >
                          Previous
                        </Button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, Math.ceil(totalRows / pageSize)) }, (_, i) => {
                            const pageNum = Math.max(1, currentPage - 2) + i;
                            if (pageNum > Math.ceil(totalRows / pageSize)) return null;

                            return (
                              <Button
                                key={pageNum}
                                variant={pageNum === currentPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                disabled={isLoading}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === Math.ceil(totalRows / pageSize) || isLoading}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}

                  {!selectedTable && !error && (
                    <div className="text-center py-12 text-slate-500">
                      <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a table from the sidebar to explore its data</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 🔧 The column cosmos */}
            <TabsContent value="columns" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Column Information
                      </CardTitle>
                      <CardDescription>
                        {tableColumns.length} columns in {selectedTable}
                      </CardDescription>
                    </div>
                    {tableColumns.length > 0 && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchTableColumns(selectedTable)}
                          disabled={isLoading}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportTableData('columns', 'csv')}
                        >
                          <FileDown className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {tableColumns.length > 0 ? (
                    <div className="space-y-4">
                      {/* 📊 Column Statistics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-slate-700">{tableColumns.length}</div>
                          <div className="text-sm text-slate-600">Total Columns</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-slate-700">
                            {tableColumns.filter(col => String(col.is_nullable).toUpperCase() !== 'YES').length}
                          </div>
                          <div className="text-sm text-slate-600">Required</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-slate-700">
                            {new Set(tableColumns.map(col => col.data_type)).size}
                          </div>
                          <div className="text-sm text-slate-600">Data Types</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-slate-700">
                            {tableColumns.filter(col => col.column_default).length}
                          </div>
                          <div className="text-sm text-slate-600">With Defaults</div>
                        </div>
                      </div>

                      {/* 📋 Enhanced Column Table */}
                      <div className="border rounded-lg">
                        {/* 🎛️ Column Controls */}
                        <div className="flex items-center justify-between p-3 bg-slate-50 border-b">
                          <span className="text-sm font-medium text-slate-700">
                            📋 {tableColumns.length} columns in {selectedTable}
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const table = document.querySelector('#columns-table');
                                if (table) {
                                  table.scrollLeft = 0;
                                }
                              }}
                            >
                              ⬅️ Start
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const table = document.querySelector('#columns-table');
                                if (table) {
                                  table.scrollLeft = table.scrollWidth;
                                }
                              }}
                            >
                              End ➡️
                            </Button>
                          </div>
                        </div>
                        
                        <div 
                          id="columns-table"
                          className="overflow-x-auto max-h-96 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
                        >
                          <table className="w-full border-collapse min-w-max">
                            <thead className="sticky top-0 bg-white border-b-2 border-slate-200">
                              <tr>
                                <th className="text-left p-3 font-semibold bg-slate-50 border-r border-slate-200 min-w-[60px]">#</th>
                                <th className="text-left p-3 font-semibold bg-slate-50 border-r border-slate-200 min-w-[150px]">Column Name</th>
                                <th className="text-left p-3 font-semibold bg-slate-50 border-r border-slate-200 min-w-[120px]">Data Type</th>
                                <th className="text-left p-3 font-semibold bg-slate-50 border-r border-slate-200 min-w-[100px]">Nullable</th>
                                <th className="text-left p-3 font-semibold bg-slate-50 border-r border-slate-200 min-w-[150px]">Default</th>
                                <th className="text-left p-3 font-semibold bg-slate-50 min-w-[80px]">Key</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tableColumns.map((col, index) => (
                                <tr key={col.column_name} className="border-b hover:bg-slate-50 transition-colors">
                                  <td className="p-3 text-sm text-slate-500 font-mono border-r border-slate-100 min-w-[60px]">
                                    {index + 1}
                                  </td>
                                  <td className="p-3 text-sm font-medium border-r border-slate-100 min-w-[150px]">
                                    <div className="font-mono text-slate-800" title={col.column_name}>
                                      {col.column_name}
                                    </div>
                                  </td>
                                  <td className="p-3 text-sm border-r border-slate-100 min-w-[120px]">
                                    <Badge variant="outline" className="font-mono text-xs">
                                      {col.data_type}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-sm border-r border-slate-100 min-w-[100px]">
                                    <Badge variant={col.is_nullable ? 'secondary' : 'default'} className="text-xs">
                                      {col.is_nullable ? '✓ Yes' : '✗ No'}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-sm border-r border-slate-100 min-w-[150px]">
                                    {col.column_default ? (
                                      <code 
                                        className="bg-slate-100 px-2 py-1 rounded text-xs font-mono cursor-pointer hover:bg-slate-200 transition-colors"
                                        title={String(col.column_default)}
                                        onClick={() => {
                                          navigator.clipboard.writeText(String(col.column_default));
                                        }}
                                      >
                                        <div className="truncate max-w-[120px]">
                                          {String(col.column_default)}
                                        </div>
                                      </code>
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-sm min-w-[80px]">
                                    {/* Key constraint info would go here if available */}
                                    <span className="text-slate-400">-</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        <div className="p-2 bg-slate-50 border-t text-xs text-slate-600 text-center">
                          💡 Column schema information • Click defaults to copy • Scroll horizontally if needed
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a table to view column information</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 🎘 The query symphony */}
            <TabsContent value="query" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Custom SQL Query
                  </CardTitle>
                  <CardDescription>
                    Execute custom PostgreSQL queries with full power
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="SELECT * FROM posts LIMIT 10;"
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    className="font-mono text-sm min-h-32"
                  />

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={executeQuery}
                      disabled={!customQuery.trim() || isLoading}
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      {isLoading ? 'Executing...' : 'Execute Query'}
                    </Button>

                    {selectedSavedQuery && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadSavedQuery(selectedSavedQuery)}
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reload Saved
                      </Button>
                    )}

                    {queryResult && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportTableData('query_results', 'csv')}
                          className="flex items-center gap-2"
                        >
                          <FileDown className="h-4 w-4" />
                          Export CSV
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportTableData('query_results', 'json')}
                          className="flex items-center gap-2"
                        >
                          <FileDown className="h-4 w-4" />
                          Export JSON
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportTableData('query_results', 'xml')}
                          className="flex items-center gap-2"
                        >
                          <FileDown className="h-4 w-4" />
                          Export XML
                        </Button>
                      </div>
                    )}
                  </div>

                  {queryResult && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span>{queryResult.rowCount} rows</span>
                        <span>{queryResult.executionTime}ms execution time</span>
                      </div>

                      <div className="border rounded-lg">
                        {/* 🎛️ Query Result Controls */}
                        <div className="flex items-center justify-between p-3 bg-slate-50 border-b">
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-slate-700">
                              📊 {queryResult.columns.length} columns, {queryResult.rows.length} rows
                            </span>
                            <span className="text-xs text-slate-500">
                              ⚡ {queryResult.executionTime}ms
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const table = document.querySelector('#query-results-table');
                                if (table) {
                                  table.scrollLeft = 0;
                                }
                              }}
                            >
                              ⬅️ Start
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const table = document.querySelector('#query-results-table');
                                if (table) {
                                  table.scrollLeft = table.scrollWidth;
                                }
                              }}
                            >
                              End ➡️
                            </Button>
                          </div>
                        </div>
                        
                        <div 
                          id="query-results-table"
                          className="overflow-x-auto max-h-96 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
                        >
                          <table className="w-full border-collapse min-w-max">
                            <thead className="sticky top-0 bg-white border-b-2 border-slate-200">
                              <tr>
                                {queryResult.columns.map((col, index) => (
                                  <th 
                                    key={col} 
                                    className="text-left p-3 font-semibold bg-slate-50 border-r border-slate-200 whitespace-nowrap min-w-[120px]"
                                  >
                                    <div className="flex items-center gap-1">
                                      <span className="truncate" title={col}>{col}</span>
                                      <span className="text-xs text-slate-500">#{index + 1}</span>
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {queryResult.rows.map((row, rowIndex) => (
                                <tr key={rowIndex} className="border-b hover:bg-slate-50 transition-colors">
                                  {queryResult.columns.map((col) => (
                                    <td 
                                      key={col} 
                                      className="p-3 text-sm border-r border-slate-100 min-w-[120px] max-w-[300px]"
                                    >
                                      <div 
                                        className="truncate cursor-pointer hover:text-blue-600 transition-colors" 
                                        title={String(row[col] || '')}
                                        onClick={() => {
                                          navigator.clipboard.writeText(String(row[col] || ''));
                                        }}
                                      >
                                        {row[col] === null ? (
                                          <span className="text-slate-400 italic">null</span>
                                        ) : row[col] === '' ? (
                                          <span className="text-slate-400 italic">empty</span>
                                        ) : (
                                          String(row[col])
                                        )}
                                      </div>
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        <div className="p-2 bg-slate-50 border-t text-xs text-slate-600 text-center">
                          💡 Click cells to copy • Use navigation buttons to scroll to start/end • Hover for full content
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 🎵 The storage realm */}
            <TabsContent value="storage" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 🌌 Storage buckets sidebar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5" />
                      Storage Buckets
                    </CardTitle>
                    <CardDescription>
                      Explore your Supabase Storage
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-2">
                        {storageBuckets.map((bucket) => (
                          <Button
                            key={bucket.id}
                            variant={selectedBucket === bucket.name ? "default" : "ghost"}
                            className="w-full justify-start text-left h-auto p-3"
                            onClick={() => fetchBucketFiles(bucket.name)}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <HardDrive className="h-4 w-4 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {bucket.name}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {bucket.public ? 'Public' : 'Private'}
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {bucket.allowed_mime_types?.length || 'All'} types
                              </Badge>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* 🎼 Storage files browser */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {selectedBucket ? `${selectedBucket} Files` : 'Select a bucket'}
                          </CardTitle>
                          <CardDescription>
                            {currentPath && `Path: ${currentPath}`}
                          </CardDescription>
                        </div>
                        {selectedBucket && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchBucketFiles(selectedBucket, currentPath)}
                            disabled={isLoading}
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {selectedBucket ? (
                        <ScrollArea className="h-96">
                          <div className="space-y-2">
                            {bucketFiles.map((file) => (
                              <div key={file.id || file.path} className="border rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {file.is_folder ? (
                                      <FolderOpen className="h-5 w-5 text-blue-500" />
                                    ) : file.mimetype?.startsWith('audio/') ? (
                                      <Music className="h-5 w-5 text-green-500" />
                                    ) : file.mimetype?.startsWith('image/') ? (
                                      <FileImage className="h-5 w-5 text-purple-500" />
                                    ) : (
                                      <FileText className="h-5 w-5 text-gray-500" />
                                    )}
                                    <div>
                                      <div className="font-medium">{file.name}</div>
                                      <div className="text-sm text-slate-500">
                                        {file.is_folder ? 'Folder' : `${file.mimetype} • ${(file.size / 1024).toFixed(1)} KB`}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {file.public_url && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(file.public_url!, '_blank')}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = file.public_url || '#';
                                        link.download = file.name;
                                        link.click();
                                      }}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-12 text-slate-500">
                          <HardDrive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Select a bucket from the sidebar to explore files</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* 📊 The statistics realm */}
            <TabsContent value="statistics" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 🎭 Database overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Database Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {statistics?.database.total_tables || 0}
                        </div>
                        <div className="text-sm text-slate-600">Total Tables</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {statistics?.database.estimated_total_rows || 0}
                        </div>
                        <div className="text-sm text-slate-600">Est. Total Rows</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 🎨 Table-specific stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Table Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedTable && statistics?.tables.length ? (
                      <div className="space-y-3">
                        {statistics.tables.map((table) => (
                          <div key={table.name} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{table.name}</span>
                              <Badge variant={table.has_data ? "default" : "secondary"}>
                                {table.has_data ? 'Has Data' : 'Empty'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                              <div>Rows: {table.row_count.toLocaleString()}</div>
                              <div>Columns: {table.column_count}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Select a table to view statistics</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 🌌 Storage statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HardDrive className="h-5 w-5" />
                      Storage Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {statistics?.storage.bucket_count || 0}
                      </div>
                      <div className="text-sm text-slate-600">Storage Buckets</div>
                    </div>

                    <div className="space-y-2">
                      {statistics?.storage.buckets.map((bucket) => (
                        <div key={bucket.name} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{bucket.name}</span>
                            <Badge variant={bucket.public ? "default" : "secondary"}>
                              {bucket.public ? 'Public' : 'Private'}
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600">
                            Files: {bucket.file_count.toLocaleString()} •
                            Size: {(bucket.total_size / (1024 * 1024)).toFixed(1)} MB
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* ⚡ Performance metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm">Status</span>
                        <Badge variant={statistics?.performance.status === 'operational' ? 'default' : 'destructive'}>
                          {statistics?.performance.status || 'Unknown'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm">Last Updated</span>
                        <span className="text-sm text-slate-600">
                          {statistics?.performance.timestamp
                            ? new Date(statistics.performance.timestamp).toLocaleTimeString()
                            : 'Never'
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 🎭 The export realm - Digital archival system */}
            <TabsContent value="export" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 🎼 Export Options */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Database Export Options
                    </CardTitle>
                    <CardDescription>
                      Create backups and exports of your database in various formats
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 🎯 Quick Export Actions */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-700">Quick Exports</h4>
                      
                      <Button 
                        onClick={exportFullDatabase}
                        disabled={isExporting}
                        className="w-full justify-start"
                        variant="outline"
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Full Database (SQL + Data)
                      </Button>
                      
                      <Button 
                        onClick={exportSchemaOnly}
                        disabled={isExporting}
                        className="w-full justify-start"
                        variant="outline"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Schema Only (Structure)
                      </Button>
                      
                      <Button 
                        onClick={exportDataAsJSON}
                        disabled={isExporting}
                        className="w-full justify-start"
                        variant="outline"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Data as JSON
                      </Button>
                      
                      {selectedTable && (
                        <Button 
                          onClick={() => exportTableAsCSV(selectedTable)}
                          disabled={isExporting}
                          className="w-full justify-start"
                          variant="outline"
                        >
                          <FileDown className="h-4 w-4 mr-2" />
                          {selectedTable} as CSV
                        </Button>
                      )}
                    </div>

                    {/* 🎨 Export Progress */}
                    {isExporting && (
                      <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">Exporting Database...</span>
                        </div>
                        
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${exportProgress}%` }}
                          ></div>
                        </div>
                        
                        <p className="text-xs text-blue-600">{exportStatus}</p>
                      </div>
                    )}

                    {/* 🎪 Export Format Info */}
                    <div className="space-y-2 text-sm text-slate-600">
                      <h5 className="font-medium text-slate-700">Export Formats:</h5>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">SQL</Badge>
                          <span>Complete database backup with schema and data</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">JSON</Badge>
                          <span>Structured data in JSON format</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">CSV</Badge>
                          <span>Table data in comma-separated format</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 🎭 Export History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Export History
                    </CardTitle>
                    <CardDescription>
                      Previous database exports and downloads
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {exportHistory.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <FileDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No exports yet</p>
                        <p className="text-sm">Create your first database export above</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {exportHistory.slice(0, 5).map((exportItem) => (
                          <div key={exportItem.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {exportItem.format}
                                </Badge>
                                <span className="text-sm font-medium">
                                  {new Date(exportItem.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {exportItem.size} • {new Date(exportItem.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                            
                            {exportItem.downloadUrl && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = exportItem.downloadUrl!;
                                  link.download = `database_export_${exportItem.id}.${exportItem.format.toLowerCase()}`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            )}
                          </div>
                        ))}
                        
                        {exportHistory.length > 5 && (
                          <p className="text-xs text-slate-500 text-center">
                            Showing latest 5 exports • {exportHistory.length - 5} more available
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 🎨 Advanced Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Advanced Export Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 🎯 Table Selection */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-700">Select Tables</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {tables.map((table) => (
                          <label key={table.table_name} className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300" 
                              defaultChecked
                            />
                            <span className="text-sm">{table.table_name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 🎼 Export Options */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-700">Options</h4>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                          <span className="text-sm">Include Schema</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                          <span className="text-sm">Include Data</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded border-gray-300" />
                          <span className="text-sm">Compress Output</span>
                        </label>
                      </div>
                    </div>

                    {/* 🎭 Export Actions */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-slate-700">Custom Export</h4>
                      <Button 
                        disabled={isExporting}
                        className="w-full"
                        onClick={() => exportFullDatabase()}
                      >
                        {isExporting ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Exporting...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Create Custom Export
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
