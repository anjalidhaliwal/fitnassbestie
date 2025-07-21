import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src/data/workouts.json');

// Helper function to read workouts
function readWorkouts() {
  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify({ workouts: [] }));
  }
  const data = fs.readFileSync(dataFilePath, 'utf-8');
  return JSON.parse(data);
}

// Helper function to write workouts
function writeWorkouts(workouts: any) {
  fs.writeFileSync(dataFilePath, JSON.stringify(workouts, null, 2));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    
    const data = readWorkouts();
    if (name) {
      const userWorkouts = data.workouts.filter((w: any) => w.name.toLowerCase() === name.toLowerCase());
      
      // Group workouts by type
      const groupedWorkouts = userWorkouts.reduce((acc: any, workout: any) => {
        const type = workout.workout.toLowerCase();
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(workout);
        return acc;
      }, {});

      // Calculate statistics
      const stats = {
        totalCalories: userWorkouts.reduce((sum: number, w: any) => sum + w.calories, 0),
        averageCalories: Math.round(
          userWorkouts.reduce((sum: number, w: any) => sum + w.calories, 0) / 
          (userWorkouts.length || 1)
        ),
        totalWorkouts: userWorkouts.length,
        workoutsByType: Object.fromEntries(
          Object.entries(groupedWorkouts).map(([type, workouts]: [string, any]) => [
            type,
            {
              count: workouts.length,
              totalCalories: workouts.reduce((sum: number, w: any) => sum + w.calories, 0),
              averageCalories: Math.round(
                workouts.reduce((sum: number, w: any) => sum + w.calories, 0) / workouts.length
              )
            }
          ])
        )
      };

      return NextResponse.json({ 
        workouts: userWorkouts,
        groupedWorkouts,
        stats
      });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading workouts:', error);
    return NextResponse.json({ error: 'Failed to read workouts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const workout = await request.json();
    const data = readWorkouts();
    
    // Add timestamp and unique ID to the workout
    const workoutWithMetadata = {
      ...workout,
      id: Date.now().toString(), // Simple unique ID
      timestamp: new Date().toISOString()
    };
    
    data.workouts.push(workoutWithMetadata);
    writeWorkouts(data);
    
    return NextResponse.json(workoutWithMetadata);
  } catch (error) {
    console.error('Error saving workout:', error);
    return NextResponse.json({ error: 'Failed to save workout' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workoutId = searchParams.get('id');
    
    if (!workoutId) {
      return NextResponse.json({ error: 'Workout ID is required' }, { status: 400 });
    }

    const data = readWorkouts();
    data.workouts = data.workouts.filter((w: any) => w.id !== workoutId);
    writeWorkouts(data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workout:', error);
    return NextResponse.json({ error: 'Failed to delete workout' }, { status: 500 });
  }
} 