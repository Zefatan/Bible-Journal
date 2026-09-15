import { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToAuth } from '../utils/auth';
import { syncFromCloud }   from '../utils/cloudSync';
import { loadProfile, loadProfileLocal } from '../utils/profile';
import { getLocalOwner, setLocalOwner, clearAllLocalData } from '../utils/storage';
import { applyTheme, applyBackground, DEFAULT_THEME } from '../utils/theme';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(undefined); // undefined=checking, null=out, obj=in
  const [syncing, setSyncing] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const unsub = subscribeToAuth(async (firebaseUser) => {
      if (firebaseUser) {
        // Guard against a shared-device handoff: if the local cache belongs
        // to a DIFFERENT account (e.g. someone closed the tab instead of
        // signing out, then someone else signed in), wipe it before doing
        // anything else. Otherwise their leftover entries would get pushed
        // to this account, and this account could even inherit their profile
        // as a fallback below.
        const owner = getLocalOwner();
        if (owner && owner !== firebaseUser.uid) {
          clearAllLocalData();
          // Also reset the visuals right away, so the "Syncing…" screen
          // doesn't flash the previous account's colour/photo while this
          // account's own profile is still loading.
          applyTheme(DEFAULT_THEME);
          applyBackground('none', null);
        }
        setLocalOwner(firebaseUser.uid);

        setSyncing(true);
        try {
          // Sync journal entries from cloud
          await syncFromCloud(firebaseUser.uid);
          // Load profile (cloud wins)
          const p = await loadProfile(firebaseUser.uid);
          setProfile(p);
        } catch (err) {
          console.warn('[AuthContext] sync error:', err.message);
          // Fall back to local profile
          setProfile(loadProfileLocal());
        } finally {
          setSyncing(false);
        }
      } else {
        setProfile(null);
      }
      setUser(firebaseUser ?? null);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ user, syncing, profile, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
