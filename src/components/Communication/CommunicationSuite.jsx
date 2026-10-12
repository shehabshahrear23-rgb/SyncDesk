import React, { useState } from 'react';
import { chatChannels, sampleMessages } from '../../data/mockData';
import { 
  MessageSquare, 
  Video, 
  Inbox, 
  Send, 
  Mic, 
  MicOff, 
  VideoOff, 
  Monitor, 
  FileText, 
  Users, 
  Smile, 
  Paperclip, 
  PhoneOff,
  Sparkles,
  Play
} from 'lucide-react';

const CommunicationSuite = () => {
  const [subTab, setSubTab] = useState('chat'); // 'inbox' | 'chat' | 'calls'
  const [selectedChannel, setSelectedChannel] = useState('c-1');
  const [messages, setMessages] = useState(sampleMessages);
  const [newMessage, setNewMessage] = useState('');

  // Call state
  const [inCall, setInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const msg = {
      id: `m-${Date.now()}`,
      author: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: newMessage,
      reactions: ['👍 1']
    };
    setMessages([...messages, msg]);
    setNewMessage('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 110px)' }}>
      
      {/* Communication Suite Top Bar */}
      <div className="card-panel glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setSubTab('chat')}
            style={{
              backgroundColor: subTab === 'chat' ? 'var(--primary-accent)' : 'transparent',
              color: subTab === 'chat' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <MessageSquare size={16} />
            <span>Threaded Chat</span>
          </button>

          <button
            onClick={() => setSubTab('calls')}
            style={{
              backgroundColor: subTab === 'calls' ? 'var(--primary-accent)' : 'transparent',
              color: subTab === 'calls' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Video size={16} />
            <span>Cinematic Video Calls</span>
            <span style={{ fontSize: '10px', backgroundColor: 'var(--neon-green)', color: '#000', padding: '1px 6px', borderRadius: '10px' }}>HD</span>
          </button>

          <button
            onClick={() => setSubTab('inbox')}
            style={{
              backgroundColor: subTab === 'inbox' ? 'var(--primary-accent)' : 'transparent',
              color: subTab === 'inbox' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Inbox size={16} />
            <span>Unified Inbox</span>
          </button>
        </div>

        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Encrypted WebSockets • 14ms Latency
        </span>
      </div>

      {/* Main View Area */}
      {subTab === 'chat' && (
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '16px', flex: 1, overflow: 'hidden' }}>
          
          {/* Channel Sidebar */}
          <div className="card-panel glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600', padding: '4px 8px' }}>
              Channels & Hubs
            </p>
            {chatChannels.map(ch => (
              <button
                key={ch.id}
                onClick={() => setSelectedChannel(ch.id)}
                style={{
                  backgroundColor: selectedChannel === ch.id ? 'rgba(0, 122, 255, 0.15)' : 'transparent',
                  color: selectedChannel === ch.id ? '#fff' : 'var(--text-muted)',
                  border: selectedChannel === ch.id ? '1px solid rgba(0, 122, 255, 0.3)' : '1px solid transparent',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: '600' }}># {ch.name}</span>
                {ch.unread > 0 && (
                  <span style={{ fontSize: '10px', backgroundColor: 'var(--primary-accent)', color: '#fff', padding: '2px 6px', borderRadius: '10px' }}>
                    {ch.unread}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Chat Messages Feed */}
          <div className="card-panel glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}># announcements</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Official company broadcasts and executive updates</p>
              </div>
              <button onClick={() => setSubTab('calls')} className="btn-secondary" style={{ fontSize: '12px' }}>
                <Video size={14} /> Start Cinematic Call
              </button>
            </div>

            {/* Messages Scroll View */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', gap: '12px' }}>
                  <img src={msg.avatar} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{msg.author}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{msg.time}</span>
                    </div>
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '13px', display: 'inline-block', maxWidth: '80%' }}>
                      {msg.content}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      {msg.reactions.map((r, idx) => (
                        <span key={idx} style={{ fontSize: '11px', backgroundColor: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '10px', color: 'var(--text-muted)' }}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Box */}
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <input
                type="text"
                placeholder="Write a reply or announcement..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="input-field"
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn-primary">
                <Send size={14} />
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Cinematic Calls Simulator */}
      {subTab === 'calls' && (
        <div className="card-panel glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px', background: '#0a0b0d' }}>
          
          {/* Top Video Stage Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="pulse-dot pulse-dot-green" />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>SyncDesk Executive Sync Room</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', backgroundColor: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                4K HDR • 60 FPS
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={() => setIsSharingScreen(!isSharingScreen)}
                style={{
                  backgroundColor: isSharingScreen ? 'var(--primary-accent)' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Monitor size={14} />
                <span>{isSharingScreen ? 'Sharing Stage' : 'Share Screen'}</span>
              </button>
            </div>
          </div>

          {/* Main Stage Video Grid */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isSharingScreen ? '2fr 1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px', minHeight: '340px' }}>
            
            {/* Screen Share Stage or Main Speaker */}
            {isSharingScreen ? (
              <div style={{ backgroundColor: '#13151b', border: '1px solid var(--primary-accent)', borderRadius: 'var(--radius)', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 30px var(--primary-glow)' }}>
                <FileText size={48} color="var(--primary-accent)" />
                <h4 style={{ fontSize: '16px', color: '#fff', marginTop: '12px' }}>Live Doc Sharing: System Architecture RFC #402</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Shared by Elena Rostova • Realtime Co-editing Active</p>
              </div>
            ) : (
              <div style={{ position: 'relative', backgroundColor: '#181b22', borderRadius: 'var(--radius)', border: '2px solid var(--neon-green)', overflow: 'hidden' }}>
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: '12px', left: '12px', backgroundColor: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: '4px', color: '#fff', fontSize: '12px', fontWeight: '600' }}>
                  Elena Rostova (Active Speaker)
                </div>
              </div>
            )}

            {/* Participant Tiles */}
            <div style={{ display: 'grid', gridTemplateRows: 'repeat(2, 1fr)', gap: '12px' }}>
              <div style={{ position: 'relative', backgroundColor: '#181b22', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: '8px', left: '8px', backgroundColor: 'rgba(0,0,0,0.7)', padding: '2px 8px', borderRadius: '4px', color: '#fff', fontSize: '11px' }}>
                  Marcus Vance
                </div>
              </div>

              <div style={{ position: 'relative', backgroundColor: '#181b22', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: '8px', left: '8px', backgroundColor: 'rgba(0,0,0,0.7)', padding: '2px 8px', borderRadius: '4px', color: '#fff', fontSize: '11px' }}>
                  Alex Chen
                </div>
              </div>
            </div>

          </div>

          {/* AI Auto-Transcript Bar */}
          <div style={{ backgroundColor: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.2)', padding: '10px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Sparkles size={16} color="var(--neon-cyan)" />
            <div style={{ fontSize: '12px', color: '#fff' }}>
              <span style={{ color: 'var(--neon-cyan)', fontWeight: '700' }}>AI Live Transcript: </span>
              "We have optimized the WebSocket node response time to under 14ms across all global regions..."
            </div>
          </div>

          {/* Bottom Dock Call Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => setIsMuted(!isMuted)}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: isMuted ? 'var(--danger-red)' : 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                cursor: 'pointer'
              }}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <button 
              onClick={() => setIsVideoOn(!isVideoOn)}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: !isVideoOn ? 'var(--danger-red)' : 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                cursor: 'pointer'
              }}
            >
              {!isVideoOn ? <VideoOff size={20} /> : <Video size={20} />}
            </button>

            <button 
              onClick={() => setSubTab('chat')}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'var(--danger-red)',
                border: 'none',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                cursor: 'pointer'
              }}
            >
              <PhoneOff size={20} />
            </button>
          </div>

        </div>
      )}

      {/* Unified Inbox View */}
      {subTab === 'inbox' && (
        <div className="card-panel glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Unified Notifications & System Announcements</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { title: 'Project Hyperion Sprint 14 Updated', source: 'Projects & Ops', time: '10m ago', unread: true },
              { title: 'Cloud Infrastructure spend anomaly flagged by AI', source: 'Finance Analytics', time: '45m ago', unread: true },
              { title: 'Elena Rostova mentioned you in #announcements', source: 'Communication Suite', time: '2h ago', unread: false }
            ].map((item, idx) => (
              <div key={idx} style={{
                backgroundColor: item.unread ? 'rgba(0, 122, 255, 0.1)' : 'rgba(0,0,0,0.2)',
                border: item.unread ? '1px solid var(--border-color-highlight)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between'
              }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>{item.title}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.source}</p>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default CommunicationSuite;
