import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Users, 
  Send, 
  Plus, 
  X, 
  UserPlus, 
  Trash2,
  Lock,
  Globe,
  MoreVertical,
  Shield,
  RefreshCcw,
  UserCircle,
  User
} from 'lucide-react';
import { auth, db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  getDoc,
  where
} from 'firebase/firestore';
import { cn } from '../lib/utils';

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  text: string;
  createdAt: any;
}

interface ProjectCollaborationProps {
  projectId: string;
  ownerId: string;
  collaborators: string[];
}

const ProjectCollaboration: React.FC<ProjectCollaborationProps> = ({ projectId, ownerId, collaborators = [] }) => {
  const [activeTab, setActiveTab] = useState<'comments' | 'team'>('comments');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [collabProfiles, setCollabProfiles] = useState<Record<string, any>>({});

  const isOwner = auth.currentUser?.uid === ownerId;

  useEffect(() => {
    if (!projectId) return;

    const q = query(
      collection(db, `/storyboards/${projectId}/comments`),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      setComments(docs);
    });

    return unsub;
  }, [projectId]);

  useEffect(() => {
    // Fetch collaborator profiles for easier display
    const fetchProfiles = async () => {
      const profiles: Record<string, any> = {};
      const allUids = [ownerId, ...collaborators];
      for (const uid of allUids) {
        if (!profiles[uid]) {
          const docRef = doc(db, 'users', uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            profiles[uid] = docSnap.data();
          }
        }
      }
      setCollabProfiles(profiles);
    };
    fetchProfiles();
  }, [collaborators, ownerId]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !auth.currentUser) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `/storyboards/${projectId}/comments`), {
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Anonymous',
        authorPhoto: auth.currentUser.photoURL || '',
        text: newComment,
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (e) {
      console.error("Error posting comment:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteCollaborator = async () => {
      // In a real app, you'd probably look up the user by email or send an invite.
      // Here we'll simulate inviting by UID for demonstration (or assume email = UID for the prototype/MVP).
      // Ideally you'd have an /api/lookup-user-by-email function.
      if (!inviteEmail.trim() || !isOwner) return;
      setIsInviting(true);
      try {
        // Mocking: Assume inviteEmail IS the UID for simplicity in this sandbox
        // In reality, you'd use a Firestore query to find the user with this email first.
        
        await updateDoc(doc(db, 'storyboards', projectId), {
          collaborators: arrayUnion(inviteEmail)
        });
        setInviteEmail('');
      } catch (e) {
        console.error("Error inviting:", e);
      } finally {
        setIsInviting(false);
      }
  };

  const handleRemoveCollaborator = async (uid: string) => {
    if (!isOwner) return;
    try {
      await updateDoc(doc(db, 'storyboards', projectId), {
        collaborators: arrayRemove(uid)
      });
    } catch (e) {
      console.error("Error removing:", e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-900 border-b border-r shadow-2xl">
      {/* Tabs Header */}
      <div className="flex border-b border-zinc-900">
        <button 
          onClick={() => setActiveTab('comments')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-4 font-mono text-[10px] uppercase tracking-widest transition-all",
            activeTab === 'comments' ? "text-white bg-zinc-900" : "text-zinc-600 hover:text-zinc-400"
          )}
        >
          <MessageSquare size={14} />
          Briefing ({comments.length})
        </button>
        <button 
          onClick={() => setActiveTab('team')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-4 font-mono text-[10px] uppercase tracking-widest transition-all",
            activeTab === 'team' ? "text-white bg-zinc-900" : "text-zinc-600 hover:text-zinc-400"
          )}
        >
          <Users size={14} />
          Ensemble ({collaborators.length + 1})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        <AnimatePresence mode="wait">
          {activeTab === 'comments' ? (
            <motion.div 
              key="comments"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {comments.length === 0 ? (
                <div className="text-center py-12 space-y-3 opacity-30">
                  <MessageSquare size={32} className="mx-auto" />
                  <p className="font-mono text-[10px] uppercase tracking-widest italic">No comms yet.</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="space-y-2 group">
                    <div className="flex items-center gap-2">
                       {comment.authorPhoto ? (
                          <img src={comment.authorPhoto} className="w-5 h-5 rounded-full border border-zinc-800" alt="" />
                       ) : (
                          <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[8px] text-zinc-600 font-mono">
                             {comment.authorName[0]}
                          </div>
                       )}
                       <span className="font-mono text-[9px] text-[#c87941] uppercase tracking-widest">{comment.authorName}</span>
                       <span className="font-mono text-[8px] text-zinc-700 ml-auto">
                          {comment.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed pl-7 italic border-l border-zinc-900">
                      "{comment.text}"
                    </p>
                  </div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="team"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Owner */}
              <div className="space-y-3">
                <label className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">Director (Owner)</label>
                <div className="p-3 bg-zinc-900/50 border border-zinc-800 flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-950 flex items-center justify-center">
                      <Shield size={14} className="text-[#c87941]" />
                   </div>
                   <div className="flex-1">
                      <p className="font-display italic text-sm text-white">{collabProfiles[ownerId]?.displayName || 'Searching...'}</p>
                      <p className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">Primary Origin</p>
                   </div>
                </div>
              </div>

              {/* Collaborators */}
              <div className="space-y-3">
                <label className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">Crew (Collaborators)</label>
                <div className="space-y-2">
                  {collaborators.map((uid) => (
                    <div key={uid} className="p-3 bg-zinc-950 border border-zinc-900 flex items-center gap-3 group">
                       <User size={14} className="text-zinc-700" />
                       <div className="flex-1">
                          <p className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">
                             {collabProfiles[uid]?.displayName || uid}
                          </p>
                       </div>
                       {isOwner && (
                         <button 
                            onClick={() => handleRemoveCollaborator(uid)}
                            className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/10 rounded transition-all"
                         >
                            <Trash2 size={12} />
                         </button>
                       )}
                    </div>
                  ))}
                  {collaborators.length === 0 && (
                    <p className="text-[10px] text-zinc-700 italic">No secondary pilots assigned.</p>
                  )}
                </div>
              </div>

              {/* Invite */}
              {isOwner && (
                <div className="pt-4 border-t border-zinc-900 space-y-4">
                  <label className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">Invite Pilot (UID/Email)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="UID"
                      className="flex-1 bg-black/50 border border-zinc-900 p-2 text-white font-mono text-[10px] uppercase outline-none focus:border-zinc-700"
                    />
                    <button 
                      onClick={handleInviteCollaborator}
                      disabled={isInviting || !inviteEmail.trim()}
                      className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white transition-all disabled:opacity-30"
                    >
                      <UserPlus size={14} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area (only for comments) */}
      <AnimatePresence>
        {activeTab === 'comments' && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="p-4 border-t border-zinc-900 bg-black/40"
          >
            <div className="flex gap-2">
              <input 
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                placeholder="Log frequency..."
                className="flex-1 bg-zinc-950 border border-zinc-900 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-white outline-none focus:border-zinc-700"
              />
              <button 
                onClick={handlePostComment}
                disabled={isSubmitting || !newComment.trim()}
                className="p-2 bg-[#c87941] text-white hover:bg-[#b06a38] transition-all disabled:opacity-30"
              >
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectCollaboration;
