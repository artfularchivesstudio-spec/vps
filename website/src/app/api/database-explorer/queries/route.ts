// 📚 **Query Management Endpoint** - The cosmic librarian preserving your SQL wisdom
// Where your queries become eternal knowledge in the digital archives

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface SavedQuery {
  id: string;
  name: string;
  query: string;
  description?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  execution_count: number;
  last_executed?: string;
  favorite: boolean;
}

// 🎭 In-memory storage for saved queries (in production, you'd use a database table)
let savedQueries: SavedQuery[] = [
  {
    id: 'sample-1',
    name: 'Recent Posts',
    query: 'SELECT * FROM blog_posts ORDER BY created_at DESC LIMIT 10',
    description: 'Get the 10 most recent blog posts',
    tags: ['blog', 'recent', 'posts'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    execution_count: 0,
    favorite: true
  },
  {
    id: 'sample-2',
    name: 'Active Audio Jobs',
    query: 'SELECT * FROM audio_jobs WHERE status = \'processing\' ORDER BY created_at DESC',
    description: 'View currently processing audio generation jobs',
    tags: ['audio', 'jobs', 'processing'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    execution_count: 0,
    favorite: false
  },
  {
    id: 'sample-3',
    name: 'Storage Usage',
    query: 'SELECT table_name, pg_size_pretty(pg_total_relation_size(table_name::text)) as size FROM information_schema.tables WHERE table_schema = \'public\' ORDER BY pg_total_relation_size(table_name::text) DESC',
    description: 'Check table sizes and storage usage',
    tags: ['storage', 'size', 'admin'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    execution_count: 0,
    favorite: true
  }
];

// 📚 GET - Retrieve saved queries
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const tag = searchParams.get('tag');
    const favorite = searchParams.get('favorite');

    let filteredQueries = [...savedQueries];

    if (id) {
      filteredQueries = filteredQueries.filter(q => q.id === id);
    }

    if (tag) {
      filteredQueries = filteredQueries.filter(q => q.tags.includes(tag));
    }

    if (favorite === 'true') {
      filteredQueries = filteredQueries.filter(q => q.favorite);
    }

    // Sort by favorite first, then by last executed, then by creation date
    filteredQueries.sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      if (a.last_executed && b.last_executed) {
        return new Date(b.last_executed).getTime() - new Date(a.last_executed).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json({
      success: true,
      queries: filteredQueries,
      count: filteredQueries.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Query management GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve queries',
      details: error.message
    }, { status: 500 });
  }
}

// 💾 POST - Save a new query
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, query, description, tags = [] } = body;

    if (!name || !query) {
      return NextResponse.json({
        success: false,
        error: 'Name and query are required'
      }, { status: 400 });
    }

    const newQuery: SavedQuery = {
      id: `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      query,
      description,
      tags: Array.isArray(tags) ? tags : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      execution_count: 0,
      favorite: false
    };

    savedQueries.push(newQuery);

    return NextResponse.json({
      success: true,
      query: newQuery,
      message: 'Query saved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Query management POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save query',
      details: error.message
    }, { status: 500 });
  }
}

// 🔄 PUT - Update an existing query
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, query, description, tags, favorite } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Query ID is required'
      }, { status: 400 });
    }

    const queryIndex = savedQueries.findIndex(q => q.id === id);
    if (queryIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Query not found'
      }, { status: 404 });
    }

    // Update the query
    if (name !== undefined) savedQueries[queryIndex].name = name;
    if (query !== undefined) savedQueries[queryIndex].query = query;
    if (description !== undefined) savedQueries[queryIndex].description = description;
    if (tags !== undefined) savedQueries[queryIndex].tags = Array.isArray(tags) ? tags : [];
    if (favorite !== undefined) savedQueries[queryIndex].favorite = favorite;

    savedQueries[queryIndex].updated_at = new Date().toISOString();

    return NextResponse.json({
      success: true,
      query: savedQueries[queryIndex],
      message: 'Query updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Query management PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update query',
      details: error.message
    }, { status: 500 });
  }
}

// 🗑️ DELETE - Remove a query
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Query ID is required'
      }, { status: 400 });
    }

    const queryIndex = savedQueries.findIndex(q => q.id === id);
    if (queryIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Query not found'
      }, { status: 404 });
    }

    const deletedQuery = savedQueries.splice(queryIndex, 1)[0];

    return NextResponse.json({
      success: true,
      query: deletedQuery,
      message: 'Query deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Query management DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete query',
      details: error.message
    }, { status: 500 });
  }
}
