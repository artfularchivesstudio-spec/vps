// 🎭 **Export Status API** - The Progress Tracker of Digital Archives ✨
// Where export journeys are monitored and progress becomes poetry

import { deleteExport, getExportStatus } from '@/lib/database-export/export-state';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { exportId: string } }
) {
  try {
    const { exportId } = params;

    // 🎼 Check if export exists
    const exportStatus = getExportStatus(exportId);
    
    if (!exportStatus) {
      return NextResponse.json(
        { error: 'Export not found' },
        { status: 404 }
      );
    }

    // 🎨 Return the current status
    return NextResponse.json({
      exportId,
      ...exportStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Export status API error:', error);
    return NextResponse.json(
      { error: 'Failed to get export status' },
      { status: 500 }
    );
  }
}

// 🎪 Optional: Clean up completed exports after some time
export async function DELETE(
  request: NextRequest,
  { params }: { params: { exportId: string } }
) {
  try {
    const { exportId } = params;
    
    const exportStatus = getExportStatus(exportId);
    if (!exportStatus) {
      return NextResponse.json(
        { error: 'Export not found' },
        { status: 404 }
      );
    }

    // 🎭 Clean up the export data
    deleteExport(exportId);

    return NextResponse.json({
      success: true,
      message: 'Export cleaned up successfully'
    });

  } catch (error) {
    console.error('Export cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to clean up export' },
      { status: 500 }
    );
  }
}
