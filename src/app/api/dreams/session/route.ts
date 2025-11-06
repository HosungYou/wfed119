import { NextRequest, NextResponse } from 'next/server';

// In-memory storage (replace with database in production)
let dreamsStore: any[] = [];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ dreams: dreamsStore });
  } catch (error) {
    console.error('Error fetching dreams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dreams' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dream } = body;

    if (!dream || !dream.id) {
      return NextResponse.json(
        { error: 'Invalid dream data' },
        { status: 400 }
      );
    }

    // Check if dream exists (update) or create new
    const existingIndex = dreamsStore.findIndex(d => d.id === dream.id);

    if (existingIndex >= 0) {
      // Update existing dream
      dreamsStore[existingIndex] = dream;
    } else {
      // Add new dream
      dreamsStore.push(dream);
    }

    return NextResponse.json({ success: true, dream });
  } catch (error) {
    console.error('Error saving dream:', error);
    return NextResponse.json(
      { error: 'Failed to save dream' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Dream ID required' },
        { status: 400 }
      );
    }

    dreamsStore = dreamsStore.filter(d => d.id !== id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dream:', error);
    return NextResponse.json(
      { error: 'Failed to delete dream' },
      { status: 500 }
    );
  }
}
