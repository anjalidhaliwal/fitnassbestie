import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Workout {
  id: string;
  name: string;
  workout: string;
  duration: string;
  calories: number;
  timestamp: string;
}

interface WorkoutData {
  workouts: Workout[];
}

interface WorkoutStats {
  count: number;
  totalCalories: number;
  averageCalories: number;
}

interface GroupedWorkouts {
  [key: string]: Workout[];
}

interface WorkoutsByType {
  [key: string]: WorkoutStats;
}

interface WorkoutResponse {
  workouts: Workout[];
  groupedWorkouts: GroupedWorkouts;
  stats: {
    totalCalories: number;
    averageCalories: number;
    totalWorkouts: number;
    workoutsByType: WorkoutsByType;
  };
}

const dataFilePath = path.join(process.cwd(), 'src/data/workouts.json');

function readWorkouts(): WorkoutData {
  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify({ workouts: [] }));
  }
  const data = fs.readFileSync(dataFilePath, 'utf-8');
  return JSON.parse(data) as WorkoutData;
}

function writeWorkouts(workouts: WorkoutData): void {
  fs.writeFileSync(dataFilePath, JSON.stringify(workouts, null, 2));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    
    const data = readWorkouts();
    if (name) {
      const userWorkouts = data.workouts.filter((w) => w.name.toLowerCase() === name.toLowerCase());
      
      const groupedWorkouts = userWorkouts.reduce<GroupedWorkouts>((acc, workout) => {
        const type = workout.workout.toLowerCase();
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(workout);
        return acc;
      }, {});

      const stats = {
        totalCalories: userWorkouts.reduce((sum, w) => sum + w.calories, 0),
        averageCalories: Math.round(
          userWorkouts.reduce((sum, w) => sum + w.calories, 0) / 
          (userWorkouts.length || 1)
        ),
        totalWorkouts: userWorkouts.length,
        workoutsByType: Object.fromEntries(
          Object.entries(groupedWorkouts).map(([type, workouts]) => [
            type,
            {
              count: workouts.length,
              totalCalories: workouts.reduce((sum, w) => sum + w.calories, 0),
              averageCalories: Math.round(
                workouts.reduce((sum, w) => sum + w.calories, 0) / workouts.length
              )
            }
          ])
        ) as WorkoutsByType
      };

      return NextResponse.json<WorkoutResponse>({ 
        workouts: userWorkouts,
        groupedWorkouts,
        stats
      });
    }
    return NextResponse.json<WorkoutData>(data);
  } catch (error) {
    console.error('Error reading workouts:', error);
    return NextResponse.json({ error: 'Failed to read workouts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const workout = await request.json() as Omit<Workout, 'id' | 'timestamp'>;
    const data = readWorkouts();
    
    const workoutWithMetadata: Workout = {
      ...workout,
      id: Date.now().toString(),
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
    data.workouts = data.workouts.filter((w) => w.id !== workoutId);
    writeWorkouts(data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workout:', error);
    return NextResponse.json({ error: 'Failed to delete workout' }, { status: 500 });
  }
} 