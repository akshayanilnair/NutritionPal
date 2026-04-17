import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveUserProfile } from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export const Onboarding = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    age: '',
    gender: 'male',
    height: '',
    weight: '',
    activityLevel: 'sedentary',
    dietaryPreference: 'veg',
    cuisinePreferences: [] as string[],
    dislikes: '',
    targetWeight: ''
  });

  const cuisines = ['North Indian', 'South Indian', 'East Indian', 'West Indian', 'Continental'];

  const calculateBMI = (weight: number, height: number) => {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  const calculateCalories = (weight: number, height: number, age: number, gender: string, activity: string) => {
    // Mifflin-St Jeor Equation
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr += gender === 'male' ? 5 : -161;

    const multipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    return Math.round(bmr * multipliers[activity]);
  };

  const handleSubmit = async () => {
    if (!user) return;

    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    const age = parseInt(formData.age);
    const targetWeight = parseFloat(formData.targetWeight);

    const bmi = calculateBMI(weight, height);
    let dailyCalorieTarget = calculateCalories(weight, height, age, formData.gender, formData.activityLevel);

    // Adjust calories based on target weight
    if (targetWeight < weight) {
      dailyCalorieTarget -= 500; // Deficit for weight loss
    } else if (targetWeight > weight) {
      dailyCalorieTarget += 500; // Surplus for weight gain
    }

    const profileData = {
      name: user.displayName || 'User',
      email: user.email || '',
      age,
      gender: formData.gender,
      height,
      weight,
      activityLevel: formData.activityLevel,
      dietaryPreference: formData.dietaryPreference,
      cuisinePreferences: formData.cuisinePreferences,
      dislikes: formData.dislikes,
      targetWeight,
      dailyCalorieTarget,
      bmi: parseFloat(bmi.toFixed(1))
    };

    await saveUserProfile(user.uid, profileData);
    await refreshProfile();
    navigate('/');
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background/40 backdrop-blur-sm p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full bg-card/80 backdrop-blur-md lovable-gradient-card rounded-3xl shadow-xl overflow-hidden p-8"
      >
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-serif font-bold text-foreground font-bold">Let's personalize your plan</h2>
            <span className="text-sm font-medium text-primary">Step {step} of 3</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground font-semibold">Basic Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Age</label>
                <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full p-3 bg-background/40 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-ring outline-none" placeholder="e.g. 25" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Gender</label>
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full p-3 bg-background/40 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-ring outline-none">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Height (cm)</label>
                <input type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full p-3 bg-background/40 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-ring outline-none" placeholder="e.g. 175" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Weight (kg)</label>
                <input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full p-3 bg-background/40 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-ring outline-none" placeholder="e.g. 70" />
              </div>
            </div>
            <button onClick={nextStep} disabled={!formData.age || !formData.height || !formData.weight} className="w-full mt-6 bg-[image:var(--gradient-spice)] hover:opacity-90 shadow-spice text-white py-3 rounded-xl font-medium hover:scale-[1.02] transition-transform text-white disabled:opacity-50 transition-colors">
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground font-semibold">Dietary Preferences</h3>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Diet Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['veg', 'non_veg', 'vegan', 'jain', 'halal'].map(diet => (
                  <button
                    key={diet}
                    onClick={() => setFormData({...formData, dietaryPreference: diet})}
                    className={`p-3 rounded-xl border text-sm font-medium capitalize ${formData.dietaryPreference === diet ? 'bg-primary/10 border-primary text-primary' : 'bg-card/80 backdrop-blur-md lovable-gradient-card border-border text-muted-foreground hover:bg-background/40 backdrop-blur-sm'}`}
                  >
                    {diet.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Preferred Cuisines</label>
              <div className="flex flex-wrap gap-2">
                {cuisines.map(cuisine => (
                  <button
                    key={cuisine}
                    onClick={() => {
                      const prefs = formData.cuisinePreferences;
                      setFormData({
                        ...formData,
                        cuisinePreferences: prefs.includes(cuisine) ? prefs.filter(c => c !== cuisine) : [...prefs, cuisine]
                      });
                    }}
                    className={`px-4 py-2 rounded-full border text-sm font-medium ${formData.cuisinePreferences.includes(cuisine) ? 'bg-primary/10 border-primary text-primary' : 'bg-card/80 backdrop-blur-md lovable-gradient-card border-border text-muted-foreground hover:bg-background/40 backdrop-blur-sm'}`}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={prevStep} className="w-1/3 bg-muted text-foreground py-3 rounded-xl font-medium hover:bg-muted-foreground/20 transition-colors">Back</button>
              <button onClick={nextStep} className="w-2/3 bg-[image:var(--gradient-spice)] hover:opacity-90 shadow-spice text-white py-3 rounded-xl font-medium hover:scale-[1.02] transition-transform text-white transition-colors">Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground font-semibold">Goals & Restrictions</h3>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Target Weight (kg)</label>
              <input type="number" value={formData.targetWeight} onChange={e => setFormData({...formData, targetWeight: e.target.value})} className="w-full p-3 bg-background/40 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-ring outline-none" placeholder="e.g. 65" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Activity Level</label>
              <select value={formData.activityLevel} onChange={e => setFormData({...formData, activityLevel: e.target.value})} className="w-full p-3 bg-background/40 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-ring outline-none">
                <option value="sedentary">Sedentary (Little or no exercise)</option>
                <option value="light">Light (Exercise 1-3 days/week)</option>
                <option value="moderate">Moderate (Exercise 3-5 days/week)</option>
                <option value="active">Active (Exercise 6-7 days/week)</option>
                <option value="very_active">Very Active (Hard exercise daily)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Foods to Avoid (Allergies/Dislikes)</label>
              <input type="text" value={formData.dislikes} onChange={e => setFormData({...formData, dislikes: e.target.value})} className="w-full p-3 bg-background/40 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-ring outline-none" placeholder="e.g. Peanuts, Mushrooms" />
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={prevStep} className="w-1/3 bg-muted text-foreground py-3 rounded-xl font-medium hover:bg-muted-foreground/20 transition-colors">Back</button>
              <button onClick={handleSubmit} disabled={!formData.targetWeight} className="w-2/3 bg-[image:var(--gradient-spice)] hover:opacity-90 shadow-spice text-white py-3 rounded-xl font-medium hover:scale-[1.02] transition-transform text-white disabled:opacity-50 transition-colors">Complete Setup</button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
