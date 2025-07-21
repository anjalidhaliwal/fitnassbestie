import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

interface WorkoutRequest {
  workout: string;
  duration: string;
}

interface CalorieResponse {
  calories: number;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Fallback calorie estimation function
function estimateCalories(workout: string, duration: number): number {
  const baseRates: { [key: string]: number } = {
    running: 11.5,    // ~690 calories per hour
    walking: 5,       // ~300 calories per hour
    swimming: 8.3,    // ~500 calories per hour
    cycling: 7.5,     // ~450 calories per hour
    yoga: 4,         // ~240 calories per hour
    weightlifting: 5, // ~300 calories per hour
    hiit: 12.5,      // ~750 calories per hour
    dancing: 6.7,    // ~400 calories per hour
    default: 6,      // ~360 calories per hour
  };

  const workoutLower = workout.toLowerCase();
  const ratePerMinute = baseRates[workoutLower] || baseRates.default;
  return Math.round(ratePerMinute * duration);
}

export async function POST(request: Request) {
  try {
    const { workout, duration } = await request.json() as WorkoutRequest;
    const durationNum = parseInt(duration);

    if (!process.env.OPENAI_API_KEY) {
      // If no API key, use fallback calculation
      const calories = estimateCalories(workout, durationNum);
      return NextResponse.json<CalorieResponse>({ calories });
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a fitness expert that calculates calories burned during workouts. Provide only the number, no explanation."
          },
          {
            role: "user",
            content: `Calculate how many calories would be burned during ${duration} minutes of ${workout}. Return only the number.`
          }
        ],
        temperature: 0.7,
      });

      const calories = parseInt(completion.choices[0].message.content || "0");
      return NextResponse.json<CalorieResponse>({ 
        calories: calories || estimateCalories(workout, durationNum) 
      });
    } catch (openaiError) {
      // If OpenAI fails, use fallback calculation
      console.error('OpenAI Error:', openaiError);
      const calories = estimateCalories(workout, durationNum);
      return NextResponse.json<CalorieResponse>({ calories });
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate calories' },
      { status: 500 }
    );
  }
} 