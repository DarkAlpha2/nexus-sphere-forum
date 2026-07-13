import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.API_URL || 'https://nexus-sphere-backend.onrender.com';
const CATEGORIES = ['🚀 Startups', '💰 Finance', '📈 Marketing', '🤖 Tech & AI', '☕ Lounge'];

function App() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState(''); 
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [postCategory, setPostCategory] = useState('🚀 Startups');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedThreads, setExpandedThreads] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Administrative Clearance Control States
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Dynamic hover tracking for side navigation items
  const [hoveredNav, setHoveredNav] = useState(null);

  // Auth States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [authMode, setAuthMode] = useState('login'); 
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('nexus_token');
    const savedUser = localStorage.getItem('nexus_user');
    if (savedToken && savedUser) {
      setIsLoggedIn(true);
      setCurrentUser(savedUser);
    }
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/posts`);
      setPosts(response.data.map(p => ({ ...p, comments: p.comments || [] })));
    } catch (error) {
      console.error(error);
    }
  };

  const handleVote = async (postId, direction) => {
    try {
      await axios.patch(`${BACKEND_URL}/api/posts/${postId}/vote`, { direction });
      fetchPosts();
    } catch (error) {
      console.error("Voting failed", error);
    }
  };

  // ADDING THREADS (Normal or Official Admin Announcements)
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) return alert("Please fill out title and content fields.");
    
    // If Admin Mode is active, prepend an official badge label to the broadcast headline
    const finalTitle = isAdminMode ? `🚨 [OFFICIAL ANNOUNCEMENT] ${title}` : title;

    try {
      await axios.post(`${BACKEND_URL}/api/posts`, { 
        username: isAdminMode ? `${currentUser} (Admin)` : currentUser, 
        title: finalTitle, 
        content, 
        category: postCategory, 
        imageUrl 
      });
      setTitle(''); setContent(''); setImageUrl(''); setShowCreateForm(false);
      fetchPosts();
    } catch (error) {
      console.error(error);
    }
  };

  // REMOVING THREADS (Administrative Wipe Function)
  const handleRemovePost = async (postId) => {
    if (!window.confirm("CRITICAL WARNING: Are you certain you want to purge this entire thread node and its comments?")) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/posts/${postId}`);
      fetchPosts(); // Instant live refresh
    } catch (error) {
      console.error("Purging action failed", error);
      alert("Failed to delete post node.");
    }
  };

  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    const txt = commentInputs[postId];
    if (!txt) return;
    try {
      await axios.post(`${BACKEND_URL}/api/posts/${postId}/comments`, { username: currentUser, content: txt });
      setCommentInputs(p => ({ ...p, [postId]: '' }));
      fetchPosts();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      if (authMode === 'register') {
        const res = await axios.post(`${BACKEND_URL}/api/register`, { username: authUsername, password: authPassword });
        alert(res.data.message); setAuthMode('login');
      } else {
        const res = await axios.post(`${BACKEND_URL}/api/login`, { username: authUsername, password: authPassword });
        localStorage.setItem('nexus_token', res.data.token);
        localStorage.setItem('nexus_user', res.data.username);
        setCurrentUser(res.data.username); setIsLoggedIn(true);
      }
    } catch (err) { 
      console.error("Auth error details:", err);
      alert(err.response?.data?.error || "Authentication failed"); 
    }
  };

  const filteredPosts = selectedFilter === 'All' ? posts : posts.filter(p => p.category === selectedFilter);

  const getNavStyle = (id, isActive) => {
    const base = {
      padding: '10px 14px',
      borderRadius: '10px',
      cursor: 'pointer',
      fontSize: '0.92rem',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      border: '1px solid transparent'
    };

    if (isActive) {
      return {
        ...base,
        color: '#ffffff',
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.15)',
        fontWeight: '600'
      };
    }

    if (hoveredNav === id) {
      return {
        ...base,
        color: '#f8fafc',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(8px)',
        transform: 'translateX(4px)',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
      };
    }

    return { ...base, color: '#94a3b8' };
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.glassAuthCard}>
          <h2 style={{ letterSpacing: '-0.03em', margin: '0 0 6px 0', color: '#fff' }}>NexusSphere</h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '24px' }}>Secure Network Entry</p>
          <form onSubmit={handleAuthSubmit} style={styles.form}>
            <input type="text" placeholder="Username Identity" value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} style={styles.input} required />
            <input type="password" placeholder="Security Passphrase" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={styles.input} required />
            <button type="submit" style={styles.btnPrimary}>
              {authMode === 'login' ? 'Establish Interface Connection' : 'Register Profile Credentials'}
            </button>
          </form>
          <p onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={styles.toggleLink}>
            {authMode === 'login' ? "Register profile credentials" : "Return to account login"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      {/* NAVBAR WITH ADMIN MODE OVERLAY PANEL */}
      <nav style={styles.navbar}>
        <div style={styles.navContainerInner}>
          <div style={styles.navLogo}>Nexus<span style={{color:'#3b82f6'}}>Sphere</span></div>
          <div style={styles.searchBarWrapper}>
            <input type="text" placeholder="Search threads, discussions, or topics..." style={styles.searchBar} />
          </div>
          <div style={styles.navActions}>
            <button 
              onClick={() => setIsAdminMode(!isAdminMode)} 
              style={isAdminMode ? styles.adminBadgeActive : styles.adminBadgeDisabled}
            >
              {isAdminMode ? '🛡️ Admin Mode: ON' : '⚙️ Toggle Admin Mode'}
            </button>

            <button onClick={() => setShowCreateForm(true)} style={isAdminMode ? styles.btnCreateAdmin : styles.btnCreate}>
              {isAdminMode ? '📢 + Create Announcement' : '+ Create Post'}
            </button>
            <span style={styles.userTag}>u/{currentUser}</span>
            <button onClick={() => { localStorage.clear(); setIsLoggedIn(false); }} style={styles.btnExit}>Logout</button>
          </div>
        </div>
      </nav>

      {/* LINKEDIN-STYLE BLURRED MODAL OVERLAY */}
      {showCreateForm && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateForm(false)}>
          <div 
            style={isAdminMode ? styles.glassFormCardAdmin : styles.glassFormCard} 
            onClick={(e) => e.stopPropagation()} 
          >
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={styles.avatarCircle}>{currentUser[0]?.toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.95rem' }}>{currentUser}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Post to anyone</div>
                </div>
              </div>
              <button style={styles.closeModalBtn} onClick={() => setShowCreateForm(false)}>✕</button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handlePostSubmit} style={styles.form}>
              <h3 style={{ margin: '4px 0 8px 0', fontSize: '1.2rem', color: '#fff', fontWeight: '700', letterSpacing: '-0.02em' }}>
                {isAdminMode ? '🛡️ Broadcast System Announcement' : 'What is on your mind?'}
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '12px' }}>
                <input type="text" placeholder="Give your thread a headline title..." value={title} onChange={(e) => setTitle(e.target.value)} style={styles.modalInput} required />
                <select value={postCategory} onChange={(e) => setPostCategory(e.target.value)} style={styles.modalSelect}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <input type="text" placeholder="Add an asset image link (Optional HTTPS URL)..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={styles.modalInput} />
              <textarea placeholder="Share your insights, documentation, or thoughts..." value={content} onChange={(e) => setContent(e.target.value)} rows="5" style={styles.modalTextarea} required />
              
              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setShowCreateForm(false)} style={styles.btnCancel}>Cancel</button>
                <button type="submit" style={isAdminMode ? styles.btnPrimaryAdmin : styles.btnPrimary}>
                  {isAdminMode ? 'Deploy Announcement' : 'Post Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={styles.layoutGrid}>
        {/* COLUMN 1: LEFT NAVIGATION */}
        <aside style={styles.leftSidebar}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div onMouseEnter={() => setHoveredNav('home')} onMouseLeave={() => setHoveredNav(null)} style={getNavStyle('home', false)}>🏠 Home Feed</div>
            <div onMouseEnter={() => setHoveredNav('popular')} onMouseLeave={() => setHoveredNav(null)} style={getNavStyle('popular', false)}>🔥 Popular</div>
            <div onMouseEnter={() => setHoveredNav('explore')} onMouseLeave={() => setHoveredNav(null)} style={getNavStyle('explore', false)}>🌐 Explore Network</div>
          </div>

          <hr style={styles.divider} />
          <div style={styles.sidebarHeading}>COMMUNITY DISK CHANNELS</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div onClick={() => setSelectedFilter('All')} onMouseEnter={() => setHoveredNav('chan-all')} onMouseLeave={() => setHoveredNav(null)} style={getNavStyle('chan-all', selectedFilter === 'All')}>🌐 Global Matrix</div>
            {CATEGORIES.map(cat => (
              <div key={cat} onClick={() => setSelectedFilter(cat)} onMouseEnter={() => setHoveredNav(`chan-${cat}`)} onMouseLeave={() => setHoveredNav(null)} style={getNavStyle(`chan-${cat}`, selectedFilter === cat)}>
                {cat}
              </div>
            ))}
          </div>
        </aside>

        {/* COLUMN 2: TIMELINE STREAM PANEL */}
        <main style={styles.centerFeed}>
          <div style={styles.feedHeaderRow}>
            <h2 style={{ fontSize: '1.15rem', margin: 0, fontWeight: '700', color: '#f8fafc' }}>
              Viewing Channel: <span style={{ color: '#38bdf8' }}>{selectedFilter === 'All' ? 'Global Core' : selectedFilter}</span>
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>{filteredPosts.length} nodes indexed</span>
          </div>

          {filteredPosts.map(post => {
            const isExpanded = !!expandedThreads[post.id];
            return (
              <div key={post.id} style={styles.redditCard}>
                
                {/* INTERACTIVE INTEGRATED VOTE COLUMN */}
                <div style={styles.voteColumn}>
                  <button onClick={() => handleVote(post.id, 'up')} style={styles.voteBtn}>▲</button>
                  <span style={styles.voteScore}>{post.score}</span>
                  <button onClick={() => handleVote(post.id, 'down')} style={styles.voteBtn}>▼</button>
                </div>

                {/* THREAD CONTENT VIEWPORT SECTION */}
                <div style={styles.cardMainContent}>
                  <div style={styles.cardMetadata}>
                    <span style={styles.categoryPill}>{post.category}</span>
                    <span>Posted by <strong style={{ color: '#cbd5e1' }}>u/{post.username}</strong></span>
                    <span>•</span>
                    <span>{new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  
                  <h2 style={styles.cardTitle}>{post.title}</h2>
                  <p style={styles.cardText}>{post.content}</p>
                  
                  {post.image_url && (
                    <div style={styles.mediaFrame}>
                      <img src={post.image_url} alt="Thread media node structure" style={styles.embeddedImage} />
                    </div>
                  )}

                  {/* THREAD ACTION PANEL WITH MOD PURGE SWITCHES */}
                  <div style={styles.actionBar}>
                    <button onClick={() => setExpandedThreads(p => ({...p, [post.id]: !isExpanded}))} style={styles.actionLink}>
                      💬 {post.comments.length} Comments
                    </button>
                    <button style={styles.actionLink}>🔗 Share</button>

                    {/* DYNAMIC ADMINISTRATIVE WIPE COMMAND ACTIVATOR */}
                    {isAdminMode && (
                      <button 
                        onClick={() => handleRemovePost(post.id)} 
                        style={styles.adminPurgeBtn}
                        title="Purge thread from memory disks"
                      >
                        ⚠️ PURGE THREAD
                      </button>
                    )}
                  </div>

                  {/* DISCUSSION COMMENTS ACCORDION INTERFACE */}
                  {isExpanded && (
                    <div style={styles.commentSection}>
                      <form onSubmit={(e) => handleCommentSubmit(e, post.id)} style={styles.commentForm}>
                        <input type="text" placeholder="Add to the conversation..." style={styles.commentInput} value={commentInputs[post.id] || ''} onChange={(e) => setCommentInputs(p => ({...p, [post.id]: e.target.value}))} />
                        <button type="submit" style={styles.commentSubmitBtn}>Reply</button>
                      </form>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {post.comments.map((c, i) => (
                          <div key={i} style={styles.commentNode}>
                            <div style={styles.commentMeta}>u/{c.username}</div>
                            <div style={styles.commentTextContent}>{c.content}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </main>

        {/* COLUMN 3: SIDEBAR */}
        <aside style={styles.rightSidebar}>
          <div style={styles.glassInfoBox}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', fontWeight: '600', color: '#fff' }}>r/{selectedFilter === 'All' ? 'NexusSphere' : selectedFilter.replace(/[\s🚀💰📈🤖☕]/g, '')}</h4>
            <p style={styles.infoBoxDesc}>Asynchronous workspace network environment. Purpose-built for clean technical engineering discussions and updates.</p>
            <div style={styles.statsRow}>
              <div><strong style={{ color: '#fff' }}>24.9k</strong> <br /><span style={{color:'#64748b'}}>Members</span></div>
              <div><strong style={{ color: '#10b981' }}>1,402</strong> <br /><span style={{color:'#64748b'}}>Online</span></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

const styles = {
  appContainer: { backgroundColor: '#080b11', minHeight: '100vh', color: '#e2e8f0', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif', WebkitFontSmoothing: 'antialiased' },
  authContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#080b11' },
  glassAuthCard: { background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(16px)', padding: '36px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', width: '340px' },
  navbar: { height: '58px', backgroundColor: '#0d131f', borderBottom: '1px solid #1e293b', position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'center' },
  navContainerInner: { width: '100%', maxWidth: '1400px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' },
  navLogo: { fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#fff' },
  searchBarWrapper: { flex: 1, maxWidth: '500px', margin: '0 24px' },
  searchBar: { width: '100%', padding: '8px 16px', borderRadius: '20px', backgroundColor: '#141c2c', border: '1px solid #273549', color: '#fff', outline: 'none', fontSize: '0.88rem' },
  navActions: { display: 'flex', alignItems: 'center', gap: '14px' },
  
  btnCreate: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '20px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)', transition: 'all 0.2s' },
  btnCreateAdmin: { backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '20px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)', transition: 'all 0.2s' },

  adminBadgeDisabled: { backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155', padding: '7px 14px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  adminBadgeActive: { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '7px 14px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', boxShadow: '0 0 15px rgba(239,68,68,0.2)' },
  adminPurgeBtn: { background: 'none', border: 'none', color: '#f43f5e', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', marginLeft: 'auto', letterSpacing: '0.02em' },
  userTag: { fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' },
  btnExit: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' },
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5, 8, 15, 0.75)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease-out' },
  
  glassFormCard: { background: '#111827', border: '1px solid #374151', padding: '24px', borderRadius: '16px', display:'flex', flexDirection:'column', gap:'16px', width: '100%', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', transform: 'translateY(0)', animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' },
  glassFormCardAdmin: { background: '#171216', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '24px', borderRadius: '16px', display:'flex', flexDirection:'column', gap:'16px', width: '100%', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.15)', transform: 'translateY(0)', animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' },
  
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f2937', paddingBottom: '14px' },
  avatarCircle: { width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.95rem' },
  closeModalBtn: { background: 'none', border: 'none', color: '#9ca3af', fontSize: '1.2rem', cursor: 'pointer', transition: 'color 0.2s' },
  
  modalInput: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #374151', backgroundColor: '#1f2937', color: '#fff', outline: 'none', fontSize: '0.92rem', transition: 'border 0.2s' },
  modalSelect: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #374151', backgroundColor: '#1f2937', color: '#fff', outline: 'none', fontSize: '0.92rem' },
  modalTextarea: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #374151', backgroundColor: '#1f2937', color: '#fff', outline: 'none', resize: 'vertical', fontSize: '0.95rem', lineHeight: '1.5' },
  
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #1f2937', paddingTop: '14px', marginTop: '4px' },
  btnCancel: { backgroundColor: 'transparent', color: '#9ca3af', border: '1px solid #4b5563', padding: '10px 20px', borderRadius: '20px', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer' },
  
  layoutGrid: { display: 'grid', gridTemplateColumns: '250px 1fr 310px', gap: '24px', maxWidth: '1400px', margin: '0 auto', padding: '20px 24px' },
  leftSidebar: { position: 'sticky', top: '78px', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '4px' },
  divider: { border: 0, borderTop: '1px solid #1e293b', margin: '16px 0' },
  sidebarHeading: { fontSize: '0.72rem', fontWeight: '700', color: '#475569', paddingLeft: '14px', marginBottom: '8px', letterSpacing: '0.06em' },
  centerFeed: { display: 'flex', flexDirection: 'column', gap: '14px' },
  feedHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #1e293b' },
  
  redditCard: { display: 'grid', gridTemplateColumns: '46px 1fr', backgroundColor: '#0e1420', border: '1px solid #1e293b', borderRadius: '10px', overflow: 'hidden' },
  voteColumn: { backgroundColor: '#0a0e16', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: '6px', borderRight: '1px solid #141c2c' },
  voteBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#475569' },
  voteScore: { fontSize: '0.85rem', fontWeight: '700', color: '#f1f5f9' },
  cardMainContent: { padding: '20px' },
  cardMetadata: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#64748b', marginBottom: '10px' },
  categoryPill: { backgroundColor: '#1c2635', color: '#38bdf8', padding: '3px 8px', borderRadius: '4px', fontWeight: '600', fontSize: '0.7 stamp' },
  cardTitle: { margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: '700', color: '#fff' },
  cardText: { fontSize: '0.96rem', color: '#cbd5e1', lineHeight: '1.55', margin: '0 0 12px 0' },
  mediaFrame: { borderRadius: '8px', overflow: 'hidden', border: '1px solid #222f43', margin: '14px 0', backgroundColor: '#05070c' },
  embeddedImage: { width: '100%', maxHeight: '500px', objectFit: 'contain', display: 'block' },
  
  actionBar: { display: 'flex', gap: '16px', borderTop: '1px solid #1c2635', paddingTop: '12px', marginTop: '4px', alignItems: 'center' },
  actionLink: { background: 'none', border: 'none', color: '#64748b', fontSize: '0.82rem', cursor: 'pointer', fontWeight: '600' },
  
  commentSection: { marginTop: '16px', paddingTop: '14px', borderTop: '1px dashed #1e293b', display: 'flex', flexDirection: 'column', gap: '10px' },
  commentForm: { display: 'flex', gap: '10px' },
  commentInput: { flex: 1, backgroundColor: '#090d16', border: '1px solid #222f43', padding: '8px 14px', borderRadius: '20px', color: '#fff', outline: 'none', fontSize: '0.88rem' },
  commentSubmitBtn: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer' },
  commentNode: { backgroundColor: '#0b101a', padding: '10px 14px', borderRadius: '8px', border: '1px solid #192231' },
  commentMeta: { fontSize: '0.72rem', color: '#475569', fontWeight: '600', marginBottom: '4px' },
  commentTextContent: { fontSize: '0.9rem', color: '#cbd5e1' },
  rightSidebar: { display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '78px', height: 'fit-content' },
  glassInfoBox: { background: '#0e1420', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px' },
  infoBoxDesc: { fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.45', margin: '6px 0 0 0' },
  statsRow: { display: 'flex', gap: '24px', fontSize: '0.8rem', marginTop: '14px', borderTop: '1px solid #1e293b', paddingTop: '14px' },
  
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #222f43', backgroundColor: '#090d16', color: '#fff', outline: 'none', fontSize: '0.9rem' },
  btnPrimary: { padding: '10px 22px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer' },
  btnPrimaryAdmin: { padding: '10px 22px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)' },
  toggleLink: { color: '#38bdf8', fontSize: '0.82rem', cursor: 'pointer', marginTop: '12px', textDecoration: 'underline', textAlign: 'center' }
};

export default App;