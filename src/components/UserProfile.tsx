import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Edit3, 
  Camera, 
  Save, 
  History, 
  Layout, 
  UserCircle, 
  Sparkles,
  RefreshCcw,
  LogOut
} from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { updateProfile, signOut } from 'firebase/auth';

interface ProfileData {
  displayName: string;
  bio: string;
  photoURL: string;
  email: string;
}

const UserProfile = () => {
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [profile, setProfile] = useState<ProfileData>({
    displayName: '',
    bio: '',
    photoURL: '',
    email: ''
  });

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      if (user) {
        fetchProfile(user.uid);
      } else {
        setIsLoading(false);
      }
    });
    return unsub;
  }, []);

  const fetchProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({
          displayName: data.displayName || auth.currentUser?.displayName || '',
          bio: data.bio || '',
          photoURL: data.photoURL || auth.currentUser?.photoURL || '',
          email: data.email || auth.currentUser?.email || ''
        });
      } else {
        // Initial state from Auth
        setProfile({
          displayName: auth.currentUser?.displayName || '',
          bio: '',
          photoURL: auth.currentUser?.photoURL || '',
          email: auth.currentUser?.email || ''
        });
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      // Sync with Firebase Auth
      await updateProfile(currentUser, {
        displayName: profile.displayName,
        photoURL: profile.photoURL
      });

      // Sync with Firestore
      await setDoc(doc(db, 'users', currentUser.uid), {
        ...profile,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setIsEditing(false);
    } catch (e) {
      console.error("Error saving profile:", e);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <RefreshCcw className="animate-spin text-zinc-500" size={32} />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-zinc-900 border border-zinc-800 text-center space-y-4">
        <UserCircle size={48} className="mx-auto text-zinc-700" />
        <h2 className="font-display text-2xl text-white italic">Authentication Required</h2>
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Please sign in to view your profile and saved projects.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-zinc-900/50 border border-zinc-800 p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
            <button 
                onClick={() => signOut(auth)}
                className="flex items-center gap-2 p-2 text-zinc-500 hover:text-red-500 transition-all font-mono text-[10px] uppercase tracking-widest"
            >
                <LogOut size={14} />
                Sign Out
            </button>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-950 flex items-center justify-center">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={48} className="text-zinc-800" />
              )}
            </div>
            {isEditing && (
              <button className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <Camera size={20} className="text-white" />
              </button>
            )}
          </div>

          <div className="flex-1 space-y-4 text-center md:text-left">
            {isEditing ? (
              <div className="space-y-4">
                <input 
                  type="text"
                  value={profile.displayName}
                  onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  placeholder="Display Name"
                  className="bg-black/50 border border-zinc-800 p-2 text-white font-display text-2xl italic focus:border-white focus:outline-none w-full max-w-sm"
                />
                <textarea 
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell your story..."
                  className="bg-black/50 border border-zinc-800 p-3 text-zinc-400 font-mono text-xs italic focus:border-white focus:outline-none w-full min-h-[80px] resize-none"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <h1 className="font-display text-4xl text-white italic tracking-tight flex items-center justify-center md:justify-start gap-3">
                  {profile.displayName || 'Anonymous Pilot'}
                  <Sparkles size={16} className="text-[#c87941]" />
                </h1>
                <p className="text-zinc-500 font-mono text-xs italic max-w-md">
                  {profile.bio || 'This pilot has not shared their journey yet.'}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              <div className="flex items-center gap-2 text-zinc-600 font-mono text-[10px] uppercase tracking-widest">
                <Mail size={12} />
                {profile.email}
              </div>
              <div className="flex items-center gap-2 text-zinc-600 font-mono text-[10px] uppercase tracking-widest">
                <Calendar size={12} />
                Registered April 2026
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {isEditing ? (
              <>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-black font-mono text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl"
                >
                  {isSaving ? <RefreshCcw size={12} className="animate-spin" /> : <Save size={12} />}
                  Save DNA
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 border border-zinc-800 text-zinc-500 font-mono text-[10px] uppercase tracking-widest hover:border-zinc-600 hover:text-white transition-all"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-6 py-3 border border-zinc-800 text-zinc-500 font-mono text-[10px] uppercase tracking-widest hover:border-zinc-600 hover:text-white transition-all"
              >
                <Edit3 size={12} />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Ambient Decorative Background */}
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#c87941]/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Profile Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-zinc-900/30 border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Layout size={12} />
              Studio Assets
            </h3>
          </div>
          <div className="space-y-3">
             <div className="p-3 bg-zinc-950 border border-zinc-900 flex justify-between items-center">
                <span className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest">Storyboards</span>
                <span className="font-display italic text-white text-lg">08</span>
             </div>
             <div className="p-3 bg-zinc-950 border border-zinc-900 flex justify-between items-center">
                <span className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest">Characters</span>
                <span className="font-display italic text-white text-lg">04</span>
             </div>
          </div>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <History size={12} />
              Narrative Log
            </h3>
          </div>
          <div className="space-y-3">
             <div className="p-3 bg-zinc-950 border border-zinc-900 flex justify-between items-center">
                <span className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest">Chronicles</span>
                <span className="font-display italic text-white text-lg">12</span>
             </div>
             <div className="p-3 bg-zinc-950 border border-zinc-900 flex justify-between items-center">
                <span className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest">Achievements</span>
                <span className="font-display italic text-white text-lg">02</span>
             </div>
          </div>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={12} />
              Collab Power
            </h3>
          </div>
          <p className="text-[10px] text-zinc-600 leading-relaxed font-mono italic">
            "Your influence grows within the collective. Sharing drafts increases your contribution tier."
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
