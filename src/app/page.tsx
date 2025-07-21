'use client';

import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface WorkoutHistory {
  id: string;
  name: string;
  workout: string;
  duration: string;
  calories: number;
  timestamp: string;
}

interface WorkoutStats {
  totalCalories: number;
  averageCalories: number;
  totalWorkouts: number;
  workoutsByType: {
    [key: string]: {
      count: number;
      totalCalories: number;
      averageCalories: number;
    }
  }
}

export default function Home() {
  const [name, setName] = useState('');
  const [workout, setWorkout] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory[]>([]);
  const [groupedWorkouts, setGroupedWorkouts] = useState<{[key: string]: WorkoutHistory[]}>({});
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const fetchWorkoutHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/workouts?name=${encodeURIComponent(name)}`);
      const data = await response.json();
      setWorkoutHistory(data.workouts || []);
      setGroupedWorkouts(data.groupedWorkouts || {});
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error fetching workout history:', error);
    }
  }, [name]);

  useEffect(() => {
    if (name.trim()) {
      fetchWorkoutHistory();
    }
  }, [name, fetchWorkoutHistory]);

  const deleteWorkout = async (id: string) => {
    try {
      await fetch(`/api/workouts?id=${id}`, {
        method: 'DELETE'
      });
      fetchWorkoutHistory(); // Refresh the list
      triggerSparkles();
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  const triggerSparkles = () => {
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      shapes: ['star'],
      colors: ['FFB6C1', 'FFC0CB', 'FF69B4', 'FF1493', 'DB7093']
    };

    function shoot() {
      confetti({
        ...defaults,
        particleCount: 40,
        scalar: 1.2,
        shapes: ['star']
      });

      confetti({
        ...defaults,
        particleCount: 10,
        scalar: 0.75,
        shapes: ['circle']
      });
    }

    setTimeout(shoot, 0);
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter your name first! 💖');
      return;
    }
    setLoading(true);
    
    try {
      const caloriesResponse = await fetch('/api/calculate-calories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workout, duration }),
      });
      
      const caloriesData = await caloriesResponse.json();
      setCalories(caloriesData.calories);

      await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          workout,
          duration,
          calories: caloriesData.calories,
        }),
      });

      fetchWorkoutHistory();
      triggerSparkles();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-100 to-pink-200 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8 transform hover:scale-105 transition-transform duration-300">
        <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
          ✨ Fitness Bestie ✨
        </h1>
        
        <div className="mb-8">
          <label htmlFor="name" className="block text-xl font-medium mb-2 text-pink-600">
            👋 What&apos;s Your Name?
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full p-3 border-2 border-pink-300 rounded-xl focus:border-pink-400 focus:ring focus:ring-pink-200 focus:ring-opacity-50 transition-colors duration-200 text-gray-800 text-lg placeholder-gray-500 font-medium"
            required
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="transform hover:scale-102 transition-transform duration-200">
            <label htmlFor="workout" className="block text-xl font-medium mb-2 text-pink-600">
              💖 What&apos;s Your Workout?
            </label>
            <input
              type="text"
              id="workout"
              value={workout}
              onChange={(e) => setWorkout(e.target.value)}
              placeholder="e.g., Dancing, Yoga, Running"
              className="w-full p-3 border-2 border-pink-300 rounded-xl focus:border-pink-400 focus:ring focus:ring-pink-200 focus:ring-opacity-50 transition-colors duration-200 text-gray-800 text-lg placeholder-gray-500 font-medium"
              required
            />
          </div>
          
          <div className="transform hover:scale-102 transition-transform duration-200">
            <label htmlFor="duration" className="block text-xl font-medium mb-2 text-pink-600">
              ⏰ How Long? (minutes)
            </label>
            <input
              type="number"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="30"
              className="w-full p-3 border-2 border-pink-300 rounded-xl focus:border-pink-400 focus:ring focus:ring-pink-200 focus:ring-opacity-50 transition-colors duration-200 text-gray-800 text-lg placeholder-gray-500 font-medium"
              required
              min="1"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-400 to-pink-600 text-white py-3 px-6 rounded-xl font-bold text-xl hover:from-pink-500 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70"
            disabled={loading}
          >
            {loading ? '✨ Calculating...' : '💪 Calculate Calories'}
          </button>
        </form>
        
        {calories !== null && (
          <div className="mt-8 p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl transform hover:scale-105 transition-transform duration-200">
            <h2 className="text-2xl font-semibold text-center text-pink-600">
              🎉 Calories Burned 🎉
            </h2>
            <p className="text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500 mt-3">
              {calories} calories
            </p>
            <p className="text-center text-pink-500 mt-2 text-lg font-medium">
              Great job! Keep slaying! 💅
            </p>
          </div>
        )}

        {name && stats && (
          <div className="mt-8">
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 mb-6">
              <h3 className="text-2xl font-semibold text-center text-pink-600 mb-4">
                ✨ Your Fitness Stats ✨
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <p className="text-pink-600 font-medium">Total Workouts</p>
                  <p className="text-3xl font-bold text-pink-500">{stats.totalWorkouts}</p>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <p className="text-pink-600 font-medium">Total Calories</p>
                  <p className="text-3xl font-bold text-pink-500">{stats.totalCalories}</p>
                </div>
                <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                  <p className="text-pink-600 font-medium">Avg Calories/Workout</p>
                  <p className="text-3xl font-bold text-pink-500">{stats.averageCalories}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full bg-gradient-to-r from-purple-400 to-purple-600 text-white py-2 px-4 rounded-xl font-bold text-lg hover:from-purple-500 hover:to-purple-700 transition-all duration-200"
            >
              {showHistory ? '✨ Hide History' : '✨ Show My History'}
            </button>

            {showHistory && (
              <div className="mt-4 space-y-4">
                <h3 className="text-xl font-semibold text-pink-600 text-center">
                  💖 Your Workout History 💖
                </h3>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setSelectedType(null)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                      selectedType === null
                        ? 'bg-pink-500 text-white'
                        : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                    }`}
                  >
                    All
                  </button>
                  {Object.entries(stats.workoutsByType).map(([type, data]) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                        selectedType === type
                          ? 'bg-pink-500 text-white'
                          : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                      }`}
                    >
                      {type} ({data.count})
                    </button>
                  ))}
                </div>

                <div className="max-h-96 overflow-y-auto space-y-3">
                  {(selectedType ? groupedWorkouts[selectedType] : workoutHistory).map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-pink-50 rounded-xl p-4 border-2 border-pink-100 relative group"
                    >
                      <button
                        onClick={() => deleteWorkout(entry.id)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-pink-400 hover:text-pink-600"
                      >
                        ✖️
                      </button>
                      <p className="text-lg font-medium text-pink-600">
                        {entry.workout} - {entry.duration} mins
                      </p>
                      <p className="text-gray-600">
                        {entry.calories} calories
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(entry.timestamp)}
                      </p>
                    </div>
                  ))}
                </div>

                {selectedType && stats.workoutsByType[selectedType] && (
                  <div className="mt-6 bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl p-6 border-2 border-pink-200 shadow-sm">
                    <h4 className="text-xl font-bold text-pink-600 mb-4 text-center">
                      ✨ {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Stats ✨
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-pink-500 font-medium text-center">Total Workouts</p>
                        <p className="text-2xl font-bold text-pink-600 text-center mt-1">
                          {stats.workoutsByType[selectedType].count}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-pink-500 font-medium text-center">Total Calories</p>
                        <p className="text-2xl font-bold text-pink-600 text-center mt-1">
                          {stats.workoutsByType[selectedType].totalCalories}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-pink-500 font-medium text-center">Average/Workout</p>
                        <p className="text-2xl font-bold text-pink-600 text-center mt-1">
                          {stats.workoutsByType[selectedType].averageCalories}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-center text-pink-500 text-base font-medium">
          💕 Track your fitness journey with style! 💕
        </div>
      </div>
    </main>
  );
}
